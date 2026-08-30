"""Spoken Persian measurement units -> a canonical unit key.

Deterministic on purpose: this is exactly the step that was silently "guessed" by
the Qwen prompt in fa-nutrition-stt (asked for a gram quantity with no instruction
to keep the spoken unit), which is the likely source of the 1g->100g bug. Canonical
keys are normalized Persian phrases so they line up with the `unit` field in
data/Persian_food_facts.json. Gram conversion for kitchen units is food-specific
(household_units.py); GENERIC_GRAMS is not applied to unknown foods.
"""

from __future__ import annotations

# spoken variant (already run through text.normalize_fa) -> canonical unit key
UNIT_ALIASES: dict[str, str] = {
    "گرم": "گرم",
    "گر": "گرم",
    "گره": "گرم",
    "کیلو": "کیلوگرم",
    "کیلوگرم": "کیلوگرم",
    "قاشق چای خوری": "قاشق چایخوری",
    "قاشق چایخوری": "قاشق چایخوری",
    "قاشق غذاخوری": "قاشق غذاخوری",
    "قاشق غذا خوری": "قاشق غذاخوری",
    "قاشق سوپخوری": "قاشق غذاخوری",
    "قاشق": "قاشق غذاخوری",  # bare "قاشق" defaults to the more common tablespoon reading
    "کف دست": "کف دست",
    "مشت": "کف دست",
    "لیوان": "لیوان",
    "استکان": "استکان",
    "فنجان": "فنجان",
    "بشقاب": "بشقاب",
    "دیس": "بشقاب",
    "کاسه": "کاسه",
    "پرس": "پرس",
    "پیمانه": "پیمانه",
    "اسکوپ": "اسکوپ",
    "سکوپ": "اسکوپ",
    "ملاقه": "ملاقه",
    "کفگیر": "ملاقه",
    "قوطی کبریت": "قوطی کبریت",
    "عدد": "عدد",
    "تا": "عدد",
    "دونه": "عدد",
    "دانه": "عدد",
    "حبه": "عدد",
    "تکه": "تکه",
    "برش": "تکه",
}

# Multi-word aliases must be tried before single-word ones; longest phrase first.
MULTI_WORD_UNITS: list[tuple[tuple[str, ...], str]] = sorted(
    ((tuple(k.split()), v) for k, v in UNIT_ALIASES.items() if " " in k),
    key=lambda kv: -len(kv[0]),
)

# Used only when a food has no matching unit row of its own in the database —
# a generic kitchen-measure default, clearly flagged as "estimated" by the caller.
GENERIC_GRAMS: dict[str, float] = {
    "گرم": 1,
    "کیلوگرم": 1000,
    "قاشق چایخوری": 5,
    "قاشق غذاخوری": 15,
    "کف دست": 80,
    "لیوان": 200,
    "استکان": 90,
    "فنجان": 90,
    "بشقاب": 250,
    "کاسه": 250,
    "پرس": 250,
    "پیمانه": 150,
    "ملاقه": 120,
    "قوطی کبریت": 40,
    "عدد": 80,
    "تکه": 60,
}


# Casual first-person speech attaches possessive suffixes directly onto nouns
# ("کفه دستم" = "my palmful", not the dictionary form "کف دست") and colloquial
# pronunciation adds a dangling "ه" ("کفه" for "کف"). Real recordings hit this
# constantly, so unit matching normalizes for it instead of requiring dictionary
# spelling.
#
# This used to be a generic rule stripping trailing "م"/"ت"/"ش" as possessive
# suffixes from ANY word. That's unsafe: "دست" (hand) itself ends in "ت", so the
# generic rule stripped it down to "دس" and broke the exact phrase it was meant to
# fix — confirmed against a real recording where "کفه دست" fell through to
# unmatched instead of resolving. An explicit table of forms actually observed in
# real audio is slower to extend but can't misfire on a word never encountered.
_SPELLING_FIX = {
    "کفه": "کف",
    "دستم": "دست",
    "دستت": "دست",
    "دستش": "دست",
    "دستمون": "دست",
    "دستتون": "دست",
    "دستشون": "دست",
    # 15-clip set: "صد گرفت" / "دویست گرهام" / "لیون چای" / "کاسته ماست"
    "گرفت": "گرم",
    "گرهام": "گرم",
    "گره": "گرم",
    "لیون": "لیوان",
    "کاسته": "کاسه",
}


def _normalize_unit_token(word: str) -> str:
    return _SPELLING_FIX.get(word, word)


def find_unit(tokens: list[str], start: int) -> tuple[str, int] | None:
    """Match a unit phrase (multi-word first) starting at tokens[start]."""
    for phrase, canonical in MULTI_WORD_UNITS:
        end = start + len(phrase)
        window = tokens[start:end]
        if tuple(window) == phrase or tuple(_normalize_unit_token(w) for w in window) == phrase:
            return canonical, end
    word = tokens[start] if start < len(tokens) else ""
    if word in UNIT_ALIASES:
        return UNIT_ALIASES[word], start + 1
    normalized = _normalize_unit_token(word)
    if normalized in UNIT_ALIASES:
        return UNIT_ALIASES[normalized], start + 1
    return None
