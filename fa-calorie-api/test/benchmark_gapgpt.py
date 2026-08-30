"""Benchmark 50 clips with GapGPT Whisper API vs local Whisper report.

Run:
  cd fitness_app/fa-calorie-api
  .venv\\Scripts\\python.exe test/benchmark_gapgpt.py

Reads OPENAI_API_KEY + OPENAI_BASE_URL from fitness_app/backend/.env
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.extract import extract  # noqa: E402
from app.foods_db import FoodDB  # noqa: E402
from app.text import correct_asr_text  # noqa: E402
TEST_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(TEST_DIR))

from benchmark_metrics import evaluate_case, summarize_rows  # noqa: E402
AUDIO_DIR = TEST_DIR / "audio"
TRANSCRIPTS = TEST_DIR / "transcripts.json"
LOCAL_REPORT = TEST_DIR / "benchmark_report.json"
OUT_JSON = TEST_DIR / "benchmark_gapgpt_report.json"
ENV_FILE = ROOT.parent / "backend" / ".env"


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip().strip('"').strip("'")
    return out


def transcribe_gapgpt(wav: Path, api_key: str, base_url: str, model: str) -> str:
    boundary = "----FitinoGapGPTBoundary"
    data = wav.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{wav.name}"\r\n'
        "Content-Type: audio/wav\r\n\r\n"
    ).encode("utf-8") + data + (
        f"\r\n--{boundary}\r\n"
        f'Content-Disposition: form-data; name="model"\r\n\r\n'
        f"{model}\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")
    url = base_url.rstrip("/") + "/audio/transcriptions"
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GapGPT HTTP {exc.code}: {detail}") from exc
    if isinstance(payload, dict):
        return str(payload.get("text") or "").strip()
    return str(payload).strip()


def run_gapgpt_case(case: dict, db: FoodDB, api_key: str, base_url: str, model: str) -> dict:
    wav = AUDIO_DIR / case["file"]
    t0 = time.perf_counter()
    raw = transcribe_gapgpt(wav, api_key, base_url, model)
    asr_ms = (time.perf_counter() - t0) * 1000
    text = correct_asr_text(raw)
    t1 = time.perf_counter()
    extracted = extract(text, db)
    extract_ms = (time.perf_counter() - t1) * 1000
    metrics = evaluate_case(case["text"], text, extracted, db)
    return {
        "id": case["id"],
        "file": case["file"],
        "category": case["category"],
        "reference_text": case["text"],
        "raw_asr_text": raw,
        "asr_ms": round(asr_ms, 1),
        "extract_ms": round(extract_ms, 1),
        "total_ms": round(asr_ms + extract_ms, 1),
        "total_kcal": extracted.get("total_kcal"),
        "unmatched": extracted.get("unmatched") or [],
        **metrics,
    }


def local_rows_from_report() -> list[dict]:
    if not LOCAL_REPORT.exists():
        return []
    data = json.loads(LOCAL_REPORT.read_text(encoding="utf-8"))
    rows = []
    for r in data.get("results", []):
        rows.append(
            {
                "id": r["id"],
                "food_recall": r.get("food_recall", 0),
                "food_f1": r.get("food_f1", 0),
                "numbers_recall": r.get("numbers_recall", 0),
                "units_recall": r.get("units_recall", 0),
                "wer": r.get("wer", 0),
                "clip_complete": r.get("food_pass", r.get("clip_complete", False)),
                "total_ms": r.get("total_ms", 0),
                "asr_ms": r.get("asr_ms", 0),
            }
        )
    return rows


def enrich_local_report(db: FoodDB) -> list[dict]:
    """Recompute numbers/units/wer for saved local whisper run."""
    if not LOCAL_REPORT.exists():
        return []
    data = json.loads(LOCAL_REPORT.read_text(encoding="utf-8"))
    rows = []
    for r in data.get("results", []):
        extracted = extract(r.get("asr_text", ""), db)
        m = evaluate_case(r["reference_text"], r.get("asr_text", ""), extracted, db)
        rows.append(
            {
                "id": r["id"],
                "food_recall": m["food_recall"],
                "food_f1": m["food_f1"],
                "numbers_recall": m["numbers_recall"],
                "units_recall": m["units_recall"],
                "wer": m["wer"],
                "clip_complete": m["clip_complete"],
                "total_ms": r.get("total_ms", 0),
                "asr_ms": r.get("asr_ms", 0),
            }
        )
    return rows


def print_comparison(local: dict, gapgpt: dict) -> None:
    headers = ["مدل", "دقت غذا", "اعداد", "واحدها", "WER", "کلیپ کامل", "میانگین پاسخ"]
    print("\n" + "=" * 88)
    print("مقایسه ASR + Extract (۵۰ کلیپ)")
    print("=" * 88)
    print(f"{'مدل':<28} {'دقت غذا':>10} {'اعداد':>8} {'واحدها':>8} {'WER':>8} {'کلیپ کامل':>12} {'میانگین پاسخ':>14}")
    print("-" * 88)
    for s in (local, gapgpt):
        print(
            f"{s['model']:<28} "
            f"{s['food_recall']*100:>9.1f}% "
            f"{s['numbers_recall']*100:>7.1f}% "
            f"{s['units_recall']*100:>7.1f}% "
            f"{s['wer']*100:>7.1f}% "
            f"{s['clip_complete_count']:>5}/{s['count']} ({s['clip_complete_rate']:>5.1f}%) "
            f"{s['avg_total_ms']/1000:>11.2f}s"
        )
    print("=" * 88)
    print("دقت غذا = food recall | کلیپ کامل = همه غذاهای مورد انتظار بدون اضافه | WER پایین‌تر بهتر")


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    env = {**load_env(ENV_FILE), **{k: os.environ[k] for k in os.environ}}
    api_key = env.get("OPENAI_API_KEY", "").strip()
    base_url = env.get("OPENAI_BASE_URL", "https://api.gapgpt.app/v1").strip()
    model = env.get("GAPGPT_WHISPER_MODEL", "gapgpt/whisper-1").strip()
    if not api_key:
        print("OPENAI_API_KEY not found in backend/.env", file=sys.stderr)
        return 1

    cases = json.loads(TRANSCRIPTS.read_text(encoding="utf-8"))
    db = FoodDB()

    print(f"GapGPT ASR: {model} @ {base_url}")
    print(f"Running {len(cases)} clips...\n", flush=True)

    gap_rows: list[dict] = []
    for i, case in enumerate(cases, 1):
        print(f"[{i}/{len(cases)}] {case['file']}...", flush=True)
        try:
            row = run_gapgpt_case(case, db, api_key, base_url, model)
        except Exception as exc:
            print(f"  ERROR: {exc}", flush=True)
            row = {
                "id": case["id"],
                "file": case["file"],
                "category": case["category"],
                "error": str(exc),
                "food_recall": 0.0,
                "food_f1": 0.0,
                "numbers_recall": 0.0,
                "units_recall": 0.0,
                "wer": 1.0,
                "clip_complete": False,
                "total_ms": 0.0,
                "asr_ms": 0.0,
            }
        gap_rows.append(row)
        if "error" not in row:
            status = "PASS" if row["clip_complete"] else "FAIL"
            print(
                f"  {status} recall={row['food_recall']} nums={row['numbers_recall']} "
                f"units={row['units_recall']} WER={row['wer']} {row['total_ms']:.0f}ms",
                flush=True,
            )

    gap_summary = summarize_rows([r for r in gap_rows if "error" not in r], model)
    local_rows = enrich_local_report(db)
    local_summary = summarize_rows(local_rows, "whisper-small-persian (local CT2)")

    print_comparison(local_summary, gap_summary)

    OUT_JSON.write_text(
        json.dumps(
            {
                "comparison": {"local": local_summary, "gapgpt": gap_summary},
                "gapgpt_results": gap_rows,
                "local_enriched": local_rows,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nFull report: {OUT_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
