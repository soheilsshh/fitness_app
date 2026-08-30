"""Build layer-8 JSON for the Gemini referee from the 50-clip ASR texts.

Does not call Whisper. Reuses calorie_report_50.json asr_text + extract().
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.extract import extract  # noqa: E402
from app.foods_db import FoodDB  # noqa: E402

TEST_DIR = Path(__file__).resolve().parent
REPORT = TEST_DIR / "calorie_report_50.json"
OUT = TEST_DIR / "gemini_layer8_50.json"


def slim_row(row: dict) -> dict:
    keep = (
        "food_id",
        "food",
        "spoken",
        "meal",
        "quantity",
        "unit",
        "grams",
        "kcal",
        "protein_g",
        "carbs_g",
        "fat_g",
        "estimated",
        "possible_duplicate",
        "match_score",
        "note",
        "needs_quantity",
        "needs_conversion",
        "available_units",
        "kcal_per_100g",
        "protein_per_100g",
        "carbs_per_100g",
        "fat_per_100g",
        "status",
    )
    return {k: row[k] for k in keep if k in row}


def main() -> int:
    src = json.loads(REPORT.read_text(encoding="utf-8"))
    results = src.get("results") or []
    if len(results) != 50:
        print(f"expected 50 clips in {REPORT}, got {len(results)}", file=sys.stderr)
        return 1

    db = FoodDB()
    clips = []
    for row in results:
        text = (row.get("asr_text") or "").strip()
        parsed = extract(text, db)
        clips.append(
            {
                "id": row["id"],
                "file": row["file"],
                "category": row.get("category") or "",
                "reference_text": row.get("reference_text") or "",
                "parsed": {
                    "meal": parsed.get("meal") or "",
                    "items": [slim_row(it) for it in parsed.get("items") or []],
                    "candidates": [slim_row(it) for it in parsed.get("candidates") or []],
                    "unmatched": parsed.get("unmatched") or [],
                    "raw_text": parsed.get("raw_text") or text,
                    "low_confidence": False,
                    "confidence": {"level": "high"},
                },
            }
        )

    OUT.write_text(
        json.dumps({"source": str(REPORT), "clips": clips}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {OUT} ({len(clips)} clips)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
