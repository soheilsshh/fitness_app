"""Load bodybuilding supplement rows + voice aliases from CSV.

Source: data/bodybuilding_supplements_voice_matching.csv
Voice alias phrases live in the nutrientSource column (comma-separated).
"""

from __future__ import annotations

import csv
from pathlib import Path

from .text import normalize_fa

SUPPLEMENTS_CSV = (
    Path(__file__).resolve().parent.parent / "data" / "bodybuilding_supplements_voice_matching.csv"
)

_FLOAT_FIELDS = (
    "calories", "fat", "protein", "carbs", "fiber", "sugar", "sodium", "cholesterol",
    "calcium", "iron", "magnesium", "potassium", "phosphorus", "transFat", "saturatedFat",
    "water", "omega3", "omega6", "zinc", "vitaminC", "glycemicLoad", "kcalPerGram",
    "burnRun10KphMinPerGram", "burnWalk7KphMinPerGram", "burnCycle15KphMinPerGram",
    "burnSwimCrawlMinPerGram", "burnHikeMinPerGram", "burnAerobicsMinPerGram",
    "nutrientMatchScore",
)


def _parse_float(value: str) -> float | None:
    value = (value or "").strip()
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _parse_bool(value: str) -> bool:
    return str(value or "").strip().lower() in {"true", "1", "yes"}


def _voice_aliases_from_row(row: dict[str, str]) -> list[str]:
    raw = (row.get("voiceAliases") or row.get("nutrientSource") or "").strip()
    if not raw or raw.startswith("Supplement:"):
        return []
    return [normalize_fa(a.strip()) for a in raw.split(",") if a.strip()]


def _row_to_food_dict(row: dict[str, str]) -> dict:
    serving_grams = _parse_float(row.get("amount")) or 30.0
    serving_cal = _parse_float(row.get("calories")) or 0.0
    per_100_cal = round(serving_cal * 100.0 / serving_grams, 2) if serving_grams else serving_cal

    def macro_per_100(key: str) -> float | None:
        val = _parse_float(row.get(key))
        if val is None:
            return None
        return round(val * 100.0 / serving_grams, 2) if serving_grams else val

    base = {
        "externalId": row.get("externalId", "").strip(),
        "sourceExternalId": row.get("sourceExternalId") or None,
        "name": normalize_fa(row.get("name", "").strip()),
        "category": row.get("category", "مکمل").strip() or "مکمل",
        "fat": macro_per_100("fat"),
        "protein": macro_per_100("protein"),
        "carbs": macro_per_100("carbs"),
        "fiber": macro_per_100("fiber"),
        "sugar": macro_per_100("sugar"),
        "sodium": macro_per_100("sodium"),
        "cholesterol": macro_per_100("cholesterol"),
        "calcium": macro_per_100("calcium"),
        "iron": macro_per_100("iron"),
        "magnesium": macro_per_100("magnesium"),
        "potassium": macro_per_100("potassium"),
        "phosphorus": macro_per_100("phosphorus"),
        "transFat": macro_per_100("transFat"),
        "saturatedFat": macro_per_100("saturatedFat"),
        "water": macro_per_100("water"),
        "omega3": macro_per_100("omega3"),
        "omega6": macro_per_100("omega6"),
        "zinc": macro_per_100("zinc"),
        "vitaminC": macro_per_100("vitaminC"),
        "glycemicLoad": _parse_float(row.get("glycemicLoad")),
        "kcalPerGram": round(per_100_cal / 100.0, 4) if per_100_cal else None,
        "nutrientSource": "supplement_voice_csv",
        "nutrientSourceRef": row.get("nutrientSourceRef") or row.get("externalId"),
        "nutrientMatchScore": _parse_float(row.get("nutrientMatchScore")),
        "dataQualityStatus": row.get("dataQualityStatus") or "reference",
        "dataQualityFlags": row.get("dataQualityFlags") or "",
    }
    for key in (
        "burnRun10KphMinPerGram", "burnWalk7KphMinPerGram", "burnCycle15KphMinPerGram",
        "burnSwimCrawlMinPerGram", "burnHikeMinPerGram", "burnAerobicsMinPerGram",
    ):
        base[key] = _parse_float(row.get(key))

    gram_row = {
        **base,
        "unit": "گرم",
        "amount": 100.0,
        "isCanonical": True,
        "calories": per_100_cal,
    }
    scoop_row = {
        **base,
        "unit": "اسکوپ",
        "amount": 1.0,
        "isCanonical": False,
        "calories": round(serving_cal, 2),
        "fat": _parse_float(row.get("fat")),
        "protein": _parse_float(row.get("protein")),
        "carbs": _parse_float(row.get("carbs")),
    }
    scoop_row["unit"] = f"بستنی اسکوپی ({int(serving_grams)} گرم)"
    scoop_serving = {
        **scoop_row,
        "unit": scoop_row["unit"],
    }
    scoop_simple = {
        **base,
        "externalId": f"{base['externalId']}-SCOOP",
        "unit": "اسکوپ",
        "amount": 1.0,
        "isCanonical": False,
        "calories": round(serving_cal, 2),
        "fat": _parse_float(row.get("fat")),
        "protein": _parse_float(row.get("protein")),
        "carbs": _parse_float(row.get("carbs")),
    }
    return [gram_row, scoop_simple, scoop_serving]


def load_supplements(path: Path = SUPPLEMENTS_CSV) -> tuple[list[dict], dict[str, str]]:
    """Return flattened food rows and spoken->canonical alias map."""
    if not path.exists():
        return [], {}

    rows: list[dict] = []
    aliases: dict[str, str] = {}
    seen_alias: set[str] = set()

    with path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for raw in reader:
            name = normalize_fa((raw.get("name") or "").strip())
            if not name:
                continue
            rows.extend(_row_to_food_dict(raw))
            aliases[name] = name
            for phrase in _voice_aliases_from_row(raw):
                key = normalize_fa(phrase)
                if not key or key in seen_alias:
                    continue
                seen_alias.add(key)
                aliases[key] = name

    # Common ASR / colloquial paths not always in the CSV list.
    extras = {
        "اسکوپ پروتئین وی": aliases.get("پروتئین وی") or aliases.get("وی") or "وی بدون برند",
        "اسکوپ پروتئین": aliases.get("پروتئین وی") or aliases.get("وی") or "وی بدون برند",
        "شیک پروتئین": aliases.get("پروتئین وی") or "وی بدون برند",
    }
    for key, target in extras.items():
        k = normalize_fa(key)
        if k not in aliases:
            aliases[k] = normalize_fa(target)

    return rows, aliases


def merge_supplements_into_db(
    by_name: dict[str, list[dict]],
    path: Path = SUPPLEMENTS_CSV,
) -> dict[str, str]:
    """Add/replace supplement foods in by_name; return voice alias map."""
    rows, aliases = load_supplements(path)
    for row in rows:
        name = row["name"]
        by_name.setdefault(name, [])
        ext = row.get("externalId")
        unit = row.get("unit")
        replaced = False
        for i, existing in enumerate(by_name[name]):
            if existing.get("externalId") == ext and existing.get("unit") == unit:
                by_name[name][i] = row
                replaced = True
                break
        if not replaced:
            by_name[name].append(row)
    return aliases
