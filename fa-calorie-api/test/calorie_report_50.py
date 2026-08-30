"""Run all 50 voice clips: GapGPT ASR + FoodDB calorie extraction.

Output: test/calorie_report_50.json (full per-clip calorie breakdown from DB)

Run:
  cd fitness_app/fa-calorie-api
  .venv\\Scripts\\python.exe test/calorie_report_50.py
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
AUDIO_DIR = TEST_DIR / "audio"
TRANSCRIPTS = TEST_DIR / "transcripts.json"
OUT_JSON = TEST_DIR / "calorie_report_50.json"
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
    last_err: Exception | None = None
    for attempt in range(1, 8):
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
            if isinstance(payload, dict):
                return str(payload.get("text") or "").strip()
            return str(payload).strip()
        except urllib.error.HTTPError as exc:
            last_err = exc
            err_body = exc.read()
            if exc.code == 403 and b"insufficient_user_quota" in err_body:
                raise RuntimeError("GapGPT quota exhausted") from exc
            if exc.code not in (429, 500, 502, 503):
                raise
            wait = min(90, 8 * attempt)
            print(f"  ASR HTTP {exc.code}, retry {attempt}/7 in {wait}s", flush=True)
            time.sleep(wait)
    assert last_err is not None
    raise last_err


def write_report(
    results: list[dict],
    errors: list[dict],
    cases: list[dict],
    model: str,
    base_url: str,
) -> dict:
    results = sorted(results, key=lambda r: int(r["id"]))
    total_kcal_sum = sum(r["total_kcal"] or 0 for r in results)
    with_kcal = [r for r in results if r.get("total_kcal")]
    report = {
        "meta": {
            "clip_count": len(cases),
            "success_count": len(results),
            "error_count": len(errors),
            "asr_model": model,
            "asr_base_url": base_url,
            "food_db": "fa-calorie-api/data/Persian_food_facts.json",
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "total_kcal_all_clips": round(total_kcal_sum, 1),
            "avg_kcal_per_clip": round(total_kcal_sum / len(with_kcal), 1) if with_kcal else 0,
            "avg_response_ms": round(sum(r["total_ms"] for r in results) / len(results), 1) if results else 0,
        },
        "results": results,
        "errors": errors,
    }
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def run_case(case: dict, db: FoodDB, api_key: str, base_url: str, model: str) -> dict:
    wav = AUDIO_DIR / case["file"]
    t0 = time.perf_counter()
    raw_asr = transcribe_gapgpt(wav, api_key, base_url, model)
    asr_ms = round((time.perf_counter() - t0) * 1000, 1)
    asr_text = correct_asr_text(raw_asr)

    t1 = time.perf_counter()
    result = extract(asr_text, db)
    extract_ms = round((time.perf_counter() - t1) * 1000, 1)

    items = []
    for item in result.get("items") or []:
        items.append(
            {
                "food_id": item.get("food_id"),
                "food": item.get("food"),
                "spoken": item.get("spoken"),
                "quantity": item.get("quantity"),
                "unit": item.get("unit"),
                "grams": item.get("grams"),
                "kcal": item.get("kcal"),
                "protein_g": item.get("protein_g"),
                "carbs_g": item.get("carbs_g"),
                "fat_g": item.get("fat_g"),
                "estimated": item.get("estimated"),
                "meal": item.get("meal"),
                "match_score": item.get("match_score"),
            }
        )

    return {
        "id": case["id"],
        "file": case["file"],
        "category": case["category"],
        "reference_text": case["text"],
        "asr_text": asr_text,
        "meal": result.get("meal"),
        "items": items,
        "total_kcal": result.get("total_kcal"),
        "unmatched": result.get("unmatched") or [],
        "candidates_count": len(result.get("candidates") or []),
        "asr_ms": asr_ms,
        "extract_ms": extract_ms,
        "total_ms": round(asr_ms + extract_ms, 1),
    }


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    env = {**load_env(ENV_FILE), **dict(os.environ)}
    api_key = env.get("OPENAI_API_KEY", "").strip()
    base_url = env.get("OPENAI_BASE_URL", "https://api.gapgpt.app/v1").strip()
    model = env.get("GAPGPT_WHISPER_MODEL", "gapgpt/whisper-1").strip()
    if not api_key:
        print("OPENAI_API_KEY not found in backend/.env", file=sys.stderr)
        return 1

    cases = json.loads(TRANSCRIPTS.read_text(encoding="utf-8"))
    if len(cases) != 50:
        print(f"Expected 50 clips, found {len(cases)}", file=sys.stderr)
        return 1

    print(f"GapGPT ASR: {model}")
    print(f"FoodDB: Persian_food_facts.json")
    print(f"Running {len(cases)} clips...\n", flush=True)

    db = FoodDB()
    results: list[dict] = []
    errors: list[dict] = []
    done_ids: set[int] = set()
    if OUT_JSON.exists():
        prev = json.loads(OUT_JSON.read_text(encoding="utf-8"))
        for row in prev.get("results") or []:
            if row.get("id") is None:
                continue
            results.append(row)
            done_ids.add(int(row["id"]))
        if done_ids:
            print(f"Resuming: {len(done_ids)} clips already done\n", flush=True)

    for i, case in enumerate(cases, 1):
        if int(case["id"]) in done_ids:
            print(f"[{i}/50] {case['file']} skip (already done)", flush=True)
            continue
        print(f"[{i}/50] {case['file']} ({case['category']})...", flush=True)
        try:
            row = run_case(case, db, api_key, base_url, model)
            results.append(row)
            kcal = row["total_kcal"]
            foods = [it["food"] for it in row["items"] if it.get("food")]
            print(f"  total_kcal={kcal}  items={foods}", flush=True)
        except Exception as exc:
            print(f"  ERROR: {exc}", flush=True)
            errors.append({"id": case["id"], "file": case["file"], "error": str(exc)})
            if "quota exhausted" in str(exc).lower():
                write_report(results, errors, cases, model, base_url)
                print("Stopping: GapGPT quota exhausted", flush=True)
                break
        write_report(results, errors, cases, model, base_url)

    report = write_report(results, errors, cases, model, base_url)
    print(f"\nDone: {len(results)}/50 OK, {len(errors)} errors")
    print(f"Total kcal (all clips): {report['meta']['total_kcal_all_clips']}")
    print(f"Report: {OUT_JSON}")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
