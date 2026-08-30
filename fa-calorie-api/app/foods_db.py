"""Loads data/Persian_food_facts.json (3,353 canonical Iranian foods, ~7.3k rows
including per-unit convenience measures) and resolves spoken food + unit + count
into grams and kcal — no LLM guessing. Household units (بشقاب, لیوان, …) use
the food-specific table in household_units.py; foods missing from that table
are not given a generic gram weight.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from rapidfuzz import fuzz, process

from .supplements import merge_supplements_into_db
from .text import normalize_fa

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "Persian_food_facts.json"

_PAREN_RE = re.compile(r"\(([\d.]+)\s*گرم\)")
_STRIP_PAREN_RE = re.compile(r"\(.*?\)")

# Colloquial/dialect names that don't appear verbatim in the database.
DIALECT_ALIASES: dict[str, str] = {
    "دیزی": "آبگوشت",
    "آگوش": "آبگوشت",
    "چیپس سرکه": "چیپس نمکی",
    "همبرگر": "همبرگر ۸۵٪ گوشتین",
    "سالاد": "سالاد فصل",
    "سوپ": "سوپ سبزیجات",
    "سیب زمینی سرخ": "سیب زمینی سرخ شده",
    "سیب زمینی سرخ کرده": "سیب زمینی سرخ شده",
    "سیب زمینی": "سیب زمینی پخته",
    "سیب زمینی آب پز": "سیب زمینی پخته در آب نمک",
    "سیب زمینی آبپز": "سیب زمینی پخته در آب نمک",
    "گوجه کبابی": "گوجه فرنگی",
    "شیر کم چرب": "شیر کم چرب",
    "جور کباب": "جوجه کباب",
}

# The database has no bare/generic entry for these everyday staples — every row is
# qualified (fat %, brand, cut, raw-vs-cooked...), so an unqualified mention needs a
# picked default or it falls through to fuzzy matching, which for a 2-4 character
# word against ~3300 candidates reliably finds garbage (e.g. "نان" ~ "آناناس"
# because "نان" is a literal substring of "آناناس"). These are first-pass, best-guess
# picks (favoring the cooked variant where raw-vs-cooked changes kcal/100g a lot,
# e.g. rice/meat) — worth a manual sanity check against what your users actually mean.
GENERIC_DEFAULTS: dict[str, str] = {
    "نان": "نان لواش",
    "شیر": "شیر 3 درصد چربی پاستوریزه",
    "ماست": "ماست از شیر کامل",
    "پنیر": "پنیر سفید",
    "روغن": "روغن مخلوط",
    "برنج": "برنج سفید بدون گلوتن پخته",
    "گوشت": "گوشت گوسفند بدون چربی پخته",
    "مرغ": "فیله مرغ",
    "سیب": "سیب قرمز",
    "چای": "چای سیاه",
    "گوجه": "گوجه فرنگی",  # bare "گوجه" means tomato in everyday speech, not the sour-plum "گوجه سبز"
    "بادام": "بادام درختی",  # not "بادام زمینی" (peanut) — different food entirely
    "پسته": "پسته خام",
    "زیتون": "زیتون سبز",
    "چیپس": "چیپس نمکی",
    # No bare "تخم مرغ" row exists (only "تخم مرغ آب پز" / "تخم مرغ خام" / ...).
    # Without this, fuzz.ratio prefers the similar-length "تخم شترمرغ" (~82) over
    # the longer real egg rows — series-2 test 14 committed ostrich egg at 1932 kcal.
    "تخم مرغ": "تخم مرغ آب پز",
}

ALIASES: dict[str, str] = {**DIALECT_ALIASES, **GENERIC_DEFAULTS}

# Particle/discourse tokens that happen to be exact food names in the database
# ("به" = quince). Meal logs never mean the fruit; extract also lists these as
# fillers so find() is not called, but block here in case a caller bypasses that.
BLOCKED_QUERIES = {"به"}
# Fuzzy still lands on quince dishes ("غبطه پخته" ~87 → "به پخته"). Never commit
# those rows unless we add a real quince mention later; ASR never meant the fruit.
BLOCKED_FOOD_NAMES = {"به", "به خام", "به پخته", "به پلو با مرغ"}

# Spoken staples ≤4 characters: exact/alias match only, never fuzzy. Without this,
# a 3-4 letter ASR fragment clears a low cutoff against 3300 names by chance.
SHORT_FOOD_ALLOWLIST = {
    "نان", "نون", "برنج", "مرغ", "گوشت", "چای", "سوپ", "ماست", "شیر", "سیب",
    "پنیر", "روغن", "خرما", "موز", "عسل", "قهوه", "آب", "دوغ", "کره", "سس",
    "نمک", "تخم", "آش", "پلو", "چلو", "ماهی", "گردو", "وی",
}

# Fuzzy floor for a candidate (Gemini may still see it). Raised from 72 after
# series-2 ASR: "چای بدون قند" ~72 "چیپس بدون نمک", "بادون" ~73 "براونی".
CANDIDATE_CUTOFF = 80
# Exact/alias is 100. Single-token fuzzy must be this high to enter items/total_kcal.
COMMITTED_CUTOFF = 90
# Multi-word dishes (کره بادام زمینی, سینه مرغ گریل شده) land in the mid-80s on
# slightly garbled ASR; commit only when 3+ spoken tokens (گوجه کبابی@84 stays candidate).
MULTIWORD_COMMITTED_CUTOFF = 84
MULTIWORD_MIN_TOKENS = 3

# Fuzzy pairs that must never auto-commit (ASR confusion).
_BLOCKED_FUZZY_PAIRS: tuple[tuple[str, str], ...] = (
    ("گوجه", "جوجه"),
)


def _strip_paren(unit_str: str) -> str:
    return normalize_fa(_STRIP_PAREN_RE.sub("", unit_str))


def _embedded_grams(unit_str: str) -> float | None:
    m = _PAREN_RE.search(unit_str)
    return float(m.group(1)) if m else None


class FoodMatch:
    def __init__(self, name: str, rows: list[dict], score: float):
        self.name = name
        self.rows = rows
        self.score = score
        self.canonical = next(
            (r for r in rows if r.get("isCanonical") and r.get("unit") == "گرم"),
            rows[0],
        )
        cal = self.canonical.get("calories")
        self.kcal_per_gram = (cal / 100.0) if cal is not None else None

    def _macros_for_grams(self, grams: float | None) -> dict:
        if grams is None or grams <= 0:
            return {"protein_g": None, "carbs_g": None, "fat_g": None}
        scale = grams / 100.0

        def scaled(key: str) -> float | None:
            value = self.canonical.get(key)
            if value is None:
                return None
            return round(float(value) * scale, 1)

        return {
            "protein_g": scaled("protein"),
            "carbs_g": scaled("carbs"),
            "fat_g": scaled("fat"),
        }

    def food_id(self) -> str:
        return str(self.canonical.get("externalId") or "").strip()

    def grams_per_unit(self, unit_key: str) -> float | None:
        """Grams for one of this food's units. None if there is no conversion."""
        if unit_key == "گرم":
            return 1.0
        if unit_key == "کیلوگرم":
            return 1000.0
        from .household_units import grams_each, is_household_unit

        if is_household_unit(unit_key):
            table = grams_each(self.name, unit_key)
            if table is not None:
                return table
        return self._catalog_grams_per_unit(unit_key)

    def _catalog_grams_per_unit(self, unit_key: str) -> float | None:
        for row in self.rows:
            if _strip_paren(row["unit"]) != unit_key:
                continue
            amount = row.get("amount") or 1.0
            embedded = _embedded_grams(row["unit"])
            if embedded is not None:
                return embedded / amount
            if self.kcal_per_gram and row.get("calories") is not None:
                return (row["calories"] / self.kcal_per_gram) / amount
        return None

    def available_units(self) -> list[dict]:
        """Units this food can convert in the DB (for UI dropdown / Gemini)."""
        seen: dict[str, float] = {}
        if self.kcal_per_gram is not None:
            seen["گرم"] = 1.0
            seen["کیلوگرم"] = 1000.0
        for row in self.rows:
            key = _strip_paren(row["unit"])
            if not key or key in seen:
                continue
            grams = self.grams_per_unit(key)
            if grams is not None:
                seen[key] = grams
        from .household_units import units_for_food

        for key, grams in units_for_food(self.name).items():
            seen[key] = grams
        return [{"unit": k, "grams_per_unit": round(v, 4) if v != int(v) else v} for k, v in seen.items()]

    def per_100g_fields(self) -> dict:
        """Canonical per-100g macros so the UI can rescale after the user picks a unit."""

        def num(key: str) -> float | None:
            value = self.canonical.get(key)
            if value is None:
                return None
            return round(float(value), 1)

        return {
            "kcal_per_100g": num("calories"),
            "protein_per_100g": num("protein"),
            "carbs_per_100g": num("carbs"),
            "fat_per_100g": num("fat"),
        }

    def resolve(self, unit_key: str | None, count: float | None) -> dict:
        """Turn a spoken (unit, count) into grams + kcal for THIS matched food.

        Never invent quantity or a generic grams fallback. Missing conversion
        → needs_conversion, kcal stays None. Household units (بشقاب / لیوان / …)
        use the food-specific table in household_units.py, then the catalog row.
        """
        units_list = self.available_units()
        base = {
            "food_id": self.food_id(),
            "food": self.name,
            "match_score": round(self.score, 1),
            "quantity": count,
            "unit": unit_key,
            "grams": None,
            "kcal": None,
            "protein_g": None,
            "carbs_g": None,
            "fat_g": None,
            "estimated": False,
            "needs_quantity": count is None or unit_key is None,
            "needs_conversion": False,
            "available_units": units_list,
            **self.per_100g_fields(),
        }
        if count is None or unit_key is None:
            base["note"] = "no quantity/unit stated"
            return base
        if count <= 0:
            base["needs_quantity"] = True
            base["note"] = "quantity must be > 0"
            return base

        grams_each, estimated = self._grams_each_for_unit(unit_key)
        if grams_each is None:
            base["needs_conversion"] = True
            base["note"] = "no conversion for this unit in food db"
            return base

        grams = count * grams_each
        kcal = round(grams * self.kcal_per_gram, 1) if self.kcal_per_gram is not None else None
        base["grams"] = round(grams, 1)
        base["kcal"] = kcal
        base["estimated"] = estimated
        base.update(self._macros_for_grams(grams))
        return base

    def _grams_each_for_unit(self, unit_key: str) -> tuple[float | None, bool]:
        """(grams_per_unit, from_household_table)."""
        from .household_units import grams_each, is_household_unit

        if unit_key == "گرم":
            return 1.0, False
        if unit_key == "کیلوگرم":
            return 1000.0, False
        if is_household_unit(unit_key):
            table = grams_each(self.name, unit_key)
            if table is not None:
                return table, True
        catalog = self._catalog_grams_per_unit(unit_key)
        if catalog is not None:
            return catalog, False
        return None, False

    def _grams_for_unit(self, unit_key: str, count: float) -> tuple[float | None, bool]:
        grams_each = self.grams_per_unit(unit_key)
        if grams_each is None:
            return None, True
        return count * grams_each, False


def _blocked_fuzzy_commit(spoken: str, matched_name: str, score: float) -> bool:
    if score >= 100:
        return False
    spoken_n = normalize_fa(spoken)
    food_n = normalize_fa(matched_name)
    for spoken_needle, food_needle in _BLOCKED_FUZZY_PAIRS:
        if spoken_needle in spoken_n.split() and food_needle in food_n:
            return True
    return False


def is_committed(match: FoodMatch, spoken: str) -> bool:
    """True when this match is safe to put in items / total_kcal."""
    if _blocked_fuzzy_commit(spoken, match.name, match.score):
        return False
    if match.score >= COMMITTED_CUTOFF:
        return True
    if (
        match.score >= MULTIWORD_COMMITTED_CUTOFF
        and len(spoken.split()) >= MULTIWORD_MIN_TOKENS
    ):
        return True
    return False


class FoodDB:
    def __init__(self, path: Path = DB_PATH):
        raw = json.loads(path.read_text(encoding="utf-8"))
        self.by_name: dict[str, list[dict]] = {}
        for row in raw["foods"]:
            self.by_name.setdefault(normalize_fa(row["name"]), []).append(row)
        self.supplement_aliases = merge_supplements_into_db(self.by_name)
        # Supplement voice aliases override legacy DB names (e.g. پروتئین وی → وی بدون برند).
        self._aliases = {**ALIASES, **self.supplement_aliases}
        self.names = list(self.by_name.keys())

    def find(self, spoken_phrase: str, score_cutoff: float | None = None) -> FoodMatch | None:
        if score_cutoff is None:
            score_cutoff = CANDIDATE_CUTOFF
        raw = normalize_fa(spoken_phrase)
        if not raw or raw in BLOCKED_QUERIES:
            return None

        # Short non-staple tokens never match, even if the database has an exact
        # row (کنار the fruit, به the quince). Staples in the allowlist / alias
        # table still resolve exactly below.
        if (
            len(raw) <= 4
            and raw not in SHORT_FOOD_ALLOWLIST
            and raw not in self._aliases
        ):
            return None

        name = self._aliases.get(raw, raw)
        if name in BLOCKED_QUERIES or name in BLOCKED_FOOD_NAMES:
            return None
        if name in self.by_name:
            return FoodMatch(name, self.by_name[name], 100.0)

        # Plain `ratio` on purpose, not WRatio: WRatio's partial-match component
        # scores a short query as ~90 whenever it happens to be a contiguous
        # substring of a long candidate (e.g. "نان" inside "آناناس"), which was
        # matching bread to pineapple juice. Plain ratio penalizes the length
        # mismatch instead, which is the behavior we actually want here.
        # Allowlisted short staples that missed exact/alias still don't fuzzy.
        if len(raw) <= 4:
            return None
        match = process.extractOne(name, self.names, scorer=fuzz.ratio, score_cutoff=score_cutoff)
        if not match:
            return None
        matched_name, score, _ = match
        if matched_name in BLOCKED_FOOD_NAMES:
            return None
        return FoodMatch(matched_name, self.by_name[matched_name], score)
