"""Benchmark all 50 voice clips: ASR + extract vs reference transcript.

Run:
  cd fitness_app/fa-calorie-api
  .venv\\Scripts\\python.exe test/benchmark_50.py
  .venv\\Scripts\\python.exe test/benchmark_50.py --json report.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.asr import NutritionASR  # noqa: E402
from app.extract import extract  # noqa: E402
from app.foods_db import FoodDB  # noqa: E402
from app.text import correct_asr_text, normalize_fa  # noqa: E402

TEST_DIR = Path(__file__).resolve().parent
AUDIO_DIR = TEST_DIR / "audio"
TRANSCRIPTS = TEST_DIR / "transcripts.json"

# Negation / correction markers in reference text (hard cases).
_NEGATION_RE = re.compile(
    r"(نخوردم|نخورد|نخورده|نخوردیم|نداشتم|ندارم|نه\s+[^،.]+|بدون\s+\S+|فقط\s+)"
)


def _norm(s: str) -> str:
    return normalize_fa(unicodedata.normalize("NFKC", s or "").strip())


def _food_keys(items: list[dict]) -> set[str]:
    out: set[str] = set()
    for row in items:
        name = _norm(row.get("food") or "")
        if name:
            out.add(name)
    return out


def _strip_negated_phrases(text: str) -> str:
    """Rough gold: drop clauses before نخوردم/بدون for expected foods."""
    parts = re.split(r"[،.]", text)
    kept: list[str] = []
    for part in parts:
        p = part.strip()
        if not p:
            continue
        if re.search(r"نخوردم|نخورد|نخورده|نداشتم|ندارم", p):
            # keep only after «فقط» if present
            if "فقط" in p:
                kept.append(p.split("فقط", 1)[-1])
            continue
        if "اشتباه بود" in p or "منظورم" in p:
            continue
        if p.startswith("اول گفتم") or p.startswith("اول خواستم"):
            continue
        kept.append(p)
    return "، ".join(kept) if kept else text


def expected_from_reference(text: str, db: FoodDB) -> dict:
    cleaned = _strip_negated_phrases(text)
    result = extract(cleaned, db)
    return {
        "foods": sorted(_food_keys(result["items"])),
        "candidates": sorted(_food_keys(result["candidates"])),
        "unmatched": result.get("unmatched") or [],
    }


def match_food(expected: str, predicted_names: set[str]) -> bool:
    exp = _norm(expected)
    if not exp:
        return False
    for got in predicted_names:
        g = _norm(got)
        if exp == g or exp in g or g in exp:
            return True
        # shared stem for Persian compounds (e.g. «مرغ» in «سینه مرغ گریل شده»)
        exp_tokens = set(exp.split())
        got_tokens = set(g.split())
        if exp_tokens & got_tokens:
            return True
    return False


def food_recall_precision(expected: list[str], predicted: list[str]) -> tuple[float, float, list[str], list[str]]:
    pred_set = set(predicted)
    if not expected:
        return (1.0 if not pred_set else 0.0, 1.0 if not pred_set else 0.0, [], list(pred_set))
    hits = [e for e in expected if match_food(e, pred_set)]
    extras = [p for p in predicted if not any(match_food(p, {e}) for e in expected)]
    recall = len(hits) / len(expected) if expected else 1.0
    precision = len(hits) / len(predicted) if predicted else (1.0 if not expected else 0.0)
    misses = [e for e in expected if e not in hits]
    return recall, precision, misses, extras


def asr_keyword_recall(reference: str, hypothesis: str) -> float:
    ref_tokens = set(tokenize_foodish(reference))
    hyp_tokens = set(tokenize_foodish(hypothesis))
    if not ref_tokens:
        return 1.0
    return len(ref_tokens & hyp_tokens) / len(ref_tokens)


def tokenize_foodish(text: str) -> list[str]:
    t = _norm(correct_asr_text(text))
    # keep tokens length >= 2, drop common fillers
    fillers = {
        "برای", "امروز", "خوردم", "داشتم", "بود", "یک", "یه", "دو", "سه", "چهار",
        "پنج", "ده", "صد", "دویست", "سیصد", "گرم", "لیوان", "قاشق", "عدد", "تا",
        "با", "هم", "و", "که", "این", "اون", "ولی", "فقط", "حدود", "معمولی",
    }
    return [w for w in t.split() if len(w) >= 2 and w not in fillers]


def run_one(
    case: dict,
    asr: NutritionASR,
    db: FoodDB,
) -> dict:
    wav = AUDIO_DIR / case["file"]
    if not wav.exists():
        raise FileNotFoundError(wav)

    gold = expected_from_reference(case["text"], db)

    t0 = time.perf_counter()
    asr_result = asr.transcribe_bytes(wav.read_bytes(), suffix=".wav", filename=wav.name)
    asr_ms = (time.perf_counter() - t0) * 1000

    t1 = time.perf_counter()
    extracted = extract(asr_result["text"], db)
    extract_ms = (time.perf_counter() - t1) * 1000
    total_ms = (time.perf_counter() - t0) * 1000

    pred_foods = sorted(_food_keys(extracted["items"]))
    recall, precision, misses, extras = food_recall_precision(gold["foods"], pred_foods)
    f1 = (2 * recall * precision / (recall + precision)) if (recall + precision) > 0 else 0.0
    passed = recall >= 1.0 and len(extras) == 0

    return {
        "id": case["id"],
        "file": case["file"],
        "category": case["category"],
        "reference_text": case["text"],
        "asr_text": asr_result["text"],
        "low_confidence": asr_result["low_confidence"],
        "expected_foods": gold["foods"],
        "predicted_foods": pred_foods,
        "candidates": sorted(_food_keys(extracted["candidates"])),
        "unmatched": extracted.get("unmatched") or [],
        "total_kcal": extracted.get("total_kcal"),
        "food_recall": round(recall, 3),
        "food_precision": round(precision, 3),
        "food_f1": round(f1, 3),
        "food_pass": passed,
        "missed_foods": misses,
        "extra_foods": extras,
        "asr_keyword_recall": round(asr_keyword_recall(case["text"], asr_result["text"]), 3),
        "asr_ms": round(asr_ms, 1),
        "extract_ms": round(extract_ms, 1),
        "total_ms": round(total_ms, 1),
        "audio_sec": round(len(samples) / 16000, 2),
    }


def summarize(rows: list[dict]) -> dict:
    n = len(rows)
    by_cat: dict[str, list[dict]] = {}
    for r in rows:
        by_cat.setdefault(r["category"], []).append(r)

    def avg(key: str) -> float:
        return round(sum(r[key] for r in rows) / n, 1) if n else 0.0

    def mean(key: str) -> float:
        return round(sum(r[key] for r in rows) / n, 3) if n else 0.0

    return {
        "count": n,
        "food_pass_count": sum(1 for r in rows if r["food_pass"]),
        "food_pass_rate": round(100 * sum(1 for r in rows if r["food_pass"]) / n, 1) if n else 0,
        "food_recall_avg": mean("food_recall"),
        "food_precision_avg": mean("food_precision"),
        "food_f1_avg": mean("food_f1"),
        "asr_keyword_recall_avg": mean("asr_keyword_recall"),
        "avg_total_ms": avg("total_ms"),
        "avg_asr_ms": avg("asr_ms"),
        "avg_extract_ms": avg("extract_ms"),
        "low_confidence_count": sum(1 for r in rows if r["low_confidence"]),
        "by_category": {
            cat: {
                "count": len(items),
                "food_pass_rate": round(100 * sum(1 for r in items if r["food_pass"]) / len(items), 1),
                "food_f1_avg": round(sum(r["food_f1"] for r in items) / len(items), 3),
                "avg_total_ms": round(sum(r["total_ms"] for r in items) / len(items), 1),
            }
            for cat, items in sorted(by_cat.items())
        },
    }


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    parser = argparse.ArgumentParser()
    parser.add_argument("--json", help="write full report JSON")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    cases = json.loads(TRANSCRIPTS.read_text(encoding="utf-8"))
    if args.limit:
        cases = cases[: args.limit]

    print(f"Loading Whisper + FoodDB ({len(cases)} clips)...", flush=True)
    t_load = time.perf_counter()
    asr = NutritionASR()
    if not asr.configured:
        print("OPENAI_API_KEY not set — cannot run GapGPT ASR benchmark", file=sys.stderr)
        return 1
    db = FoodDB()
    print(f"Model ready in {time.perf_counter() - t_load:.1f}s\n", flush=True)

    rows: list[dict] = []
    for i, case in enumerate(cases, 1):
        print(f"[{i}/{len(cases)}] {case['file']} ({case['category']})...", flush=True)
        row = run_one(case, asr, db)
        rows.append(row)
        status = "PASS" if row["food_pass"] else "FAIL"
        print(
            f"  {status}  foods={row['predicted_foods']}  "
            f"F1={row['food_f1']}  {row['total_ms']:.0f}ms  "
            f"ASR: {row['asr_text'][:80]}...",
            flush=True,
        )

    summary = summarize(rows)
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Food pass (exact):     {summary['food_pass_count']}/{summary['count']} ({summary['food_pass_rate']}%)")
    print(f"Food recall (avg):     {summary['food_recall_avg']}")
    print(f"Food precision (avg):  {summary['food_precision_avg']}")
    print(f"Food F1 (avg):         {summary['food_f1_avg']}")
    print(f"ASR keyword recall:    {summary['asr_keyword_recall_avg']}")
    print(f"Avg response time:     {summary['avg_total_ms']} ms")
    print(f"  ASR:                 {summary['avg_asr_ms']} ms")
    print(f"  Extract:             {summary['avg_extract_ms']} ms")
    print(f"Low-confidence ASR:    {summary['low_confidence_count']}/{summary['count']}")
    print("\nBy category:")
    for cat, stats in summary["by_category"].items():
        print(f"  {cat}: pass={stats['food_pass_rate']}% F1={stats['food_f1_avg']} avg={stats['avg_total_ms']}ms")

    fails = [r for r in rows if not r["food_pass"]]
    if fails:
        print(f"\nFailed cases ({len(fails)}):")
        for r in fails:
            print(f"  #{r['id']:02d} missed={r['missed_foods']} extra={r['extra_foods']}")
            print(f"       expected={r['expected_foods']}")
            print(f"       got     ={r['predicted_foods']}")

    if args.json:
        out = Path(args.json)
        out.write_text(json.dumps({"summary": summary, "results": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nFull report: {out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
