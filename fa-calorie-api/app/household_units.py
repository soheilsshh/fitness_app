"""Approximate household-unit -> grams for spoken meal logs.

This table is the only place Fitino invents a gram weight for بشقاب / لیوان /
کف دست / قاشق غذاخوری / قاشق چایخوری. If the food is not listed for that unit,
grams stay unknown — the caller must not guess. Calories always come from the
food DB per 100g after grams are known.

Direct گرم / کیلوگرم from the user always win (no table lookup).
"""

from __future__ import annotations

from .text import normalize_fa
from .units import UNIT_ALIASES

# Canonical unit -> {normalized food hint: grams per 1 unit}. Longer hints win
# when several match the same catalog name (ماست چکیده before ماست).
_RAW: dict[str, dict[str, float]] = {
    "بشقاب": {
        "برنج پخته": 250,
        "برنج": 250,
        "چلو": 250,
        "عدس پلو": 300,
        "استانبولی پلو": 300,
        "استانبولی": 300,
        "لوبیا پلو": 300,
        "زرشک پلو": 300,
        "باقالی پلو": 300,
        "باقلا پلو": 300,
        "سبزی پلو": 300,
        "ماکارونی پخته": 300,
        "ماکارونی": 300,
        "لازانیا": 300,
        "قیمه": 300,
        "قورمه سبزی": 300,
        "قورمه": 300,
        "فسنجان": 250,
        "آبگوشت": 350,
        "دیزی": 350,
        "عدسی": 300,
        "خوراک لوبیا": 300,
        "خوراک مرغ": 300,
        "خوراک گوشت": 300,
        "مرغ": 300,
        "گوشت": 300,
        "کشک بادمجان": 250,
        "میرزا قاسمی": 250,
        "میرزاقاسمی": 250,
        "کوکو سبزی": 250,
        "کوکو": 250,
        "کتلت": 250,
        "املت": 250,
        "سوپ": 300,
        "سالاد": 250,
    },
    "لیوان": {
        "شیر کم چرب": 240,
        "شیر پرچرب": 240,
        "شیر": 240,
        "دوغ": 240,
        "ماست چکیده": 250,
        "ماست یونانی": 240,
        "ماست کم چرب": 240,
        "ماست": 240,
        "آب پرتقال": 240,
        "آب سیب": 240,
        "آبمیوه": 240,
        "نوشابه رژیمی": 240,
        "نوشابه": 240,
        "قهوه": 240,
        "چای": 240,
        "آب": 240,
        "سوپ": 240,
        "عدسی": 240,
        "خوراک لوبیا": 240,
        "لوبیا پخته": 170,
        "عدس پخته": 170,
        "نخود پخته": 170,
        "ذرت پخته": 165,
        "برنج پخته": 185,
        "برنج": 185,
        "ماکارونی پخته": 140,
        "ماکارونی": 140,
        "جو دوسر": 80,
        "آرد جو": 100,
        "آرد گندم": 125,
        "آرد ذرت": 120,
        "آرد": 125,
        "شکر": 200,
        "عسل": 335,
        "پنیر خردشده": 110,
        "پنیر": 110,
        "کشمش": 150,
        "خرما خردشده": 150,
        "خرما": 150,
        "بادام زمینی": 145,
        "بادام": 140,
        "گردو خردشده": 120,
        "گردو": 120,
        "تخمه": 140,
    },
    "کف دست": {
        "نان بربری": 50,
        "نان سنگک": 50,
        "نان لواش": 25,
        "نان تافتون": 40,
        "نان تست": 25,
        "نان سبوس دار": 30,
        "نان جو": 30,
        "سینه مرغ پخته": 80,
        "سینه مرغ": 80,
        "مرغ گریل": 80,
        "مرغ کبابی": 80,
        "مرغ سوخاری": 80,
        "گوشت چرخ کرده پخته": 80,
        "گوشت چرخ کرده": 80,
        "گوشت قرمز پخته": 80,
        "گوشت قرمز": 80,
        "ماهی پخته": 100,
        "ماهی": 100,
        "کباب کوبیده": 80,
        "کوبیده": 80,
        "مرغ": 80,
        "گوشت": 80,
    },
    "قاشق غذاخوری": {
        "برنج پخته": 15,
        "برنج": 15,
        "ماکارونی پخته": 15,
        "ماکارونی": 15,
        "عدس پخته": 15,
        "لوبیا پخته": 15,
        "نخود پخته": 15,
        "ذرت پخته": 15,
        "ماست چکیده": 20,
        "ماست یونانی": 15,
        "ماست کم چرب": 15,
        "ماست": 15,
        "کشک": 20,
        "حمص": 15,
        "سوپ": 15,
        "قیمه": 20,
        "قورمه سبزی": 20,
        "قورمه": 20,
        "فسنجان": 20,
        "خوراک لوبیا": 20,
        "خوراک عدس": 20,
        "سس گوجه": 15,
        "رب گوجه": 18,
        "سس کچاپ": 17,
        "سس مایونز": 15,
        "سس خردل": 15,
        "سس سیر": 15,
        "روغن زیتون": 14,
        "روغن": 14,
        "کره بادام زمینی": 16,
        "کره": 14,
        "ارده": 16,
        "عسل": 21,
        "شیره انگور": 20,
        "شیره خرما": 20,
        "مربا": 20,
        "شکر": 12,
        "پودر قند": 12,
        "آرد جو": 8,
        "آرد": 8,
        "جو دوسر": 10,
        "بذر چیا": 12,
        "تخم کتان": 10,
        "گردو خردشده": 7,
        "گردو": 7,
        "بادام خردشده": 8,
        "بادام زمینی خردشده": 9,
        "بادام زمینی": 9,
        "بادام": 8,
        "کشمش": 10,
        "پنیر خردشده": 15,
        "پنیر": 15,
        "توت خشک": 10,
        "نارگیل خشک": 7,
        "پودر کاکائو": 5,
        "پودر پروتئین": 10,
        "پودر کراتین": 5,
    },
    "قاشق چایخوری": {
        "شکر": 4,
        "عسل": 7,
        "مربا": 7,
        "شیره خرما": 7,
        "شیره انگور": 7,
        "کره بادام زمینی": 5,
        "کره": 5,
        "روغن زیتون": 4.5,
        "روغن": 4.5,
        "ارده": 5,
        "سس کچاپ": 5,
        "سس مایونز": 5,
        "سس خردل": 5,
        "سس سیر": 5,
        "رب گوجه": 6,
        "ماست یونانی": 5,
        "ماست": 5,
        "کشک": 7,
        "حمص": 5,
        "پودر پروتئین": 3,
        "پودر کراتین": 3,
        "پودر کاکائو": 2.5,
        "قهوه فوری": 2,
        "نسکافه": 2,
        "آرد جو": 3,
        "آرد": 3,
        "جو دوسر": 3,
        "بذر چیا": 4,
        "تخم کتان": 3,
        "گردو خردشده": 2.5,
        "گردو": 2.5,
        "بادام خردشده": 3,
        "بادام زمینی خردشده": 3,
        "بادام زمینی": 3,
        "بادام": 3,
        "کشمش": 3,
        "پنیر خردشده": 5,
        "پنیر": 5,
        "نمک": 6,
        "دارچین": 2.5,
        "زردچوبه": 2,
        "فلفل سیاه": 2,
        "پودر سیر": 3,
        "پودر زنجبیل": 2,
        "پودر نارگیل": 2,
        "توت خشک": 3,
        "کنجد": 3,
        "نارگیل خشک": 2,
        "پودر قند": 4,
    },
}

HOUSEHOLD_UNITS: frozenset[str] = frozenset(_RAW)

# «کف دست» is for solid pieces, not stews/soups/rice dishes that happen to
# contain the word مرغ or گوشت.
_PALM_VOLUME_TOKENS = frozenset({
    "خوراک", "سوپ", "خورش", "خورشت", "پلو", "چلو", "ماکارونی", "لازانیا",
    "عدسی", "آبگوشت", "دیزی", "سالاد", "آش", "قیمه", "قورمه", "فسنجان",
    "املت", "کوکو", "کتلت", "عدس", "لوبیا",
})


def _build_table() -> dict[str, list[tuple[list[str], float]]]:
    out: dict[str, list[tuple[list[str], float]]] = {}
    for unit, hints in _RAW.items():
        rows: list[tuple[list[str], float]] = []
        for hint, grams in hints.items():
            tokens = normalize_fa(hint).split()
            if tokens and grams > 0:
                rows.append((tokens, float(grams)))
        out[unit] = rows
    return out


_TABLE = _build_table()


def canonical_unit(unit: str | None) -> str:
    n = normalize_fa(unit or "")
    if not n:
        return ""
    return UNIT_ALIASES.get(n, n)


def is_household_unit(unit: str | None) -> bool:
    return canonical_unit(unit) in HOUSEHOLD_UNITS


def _hint_allowed(food_tokens: list[str], hint_tokens: list[str]) -> bool:
    """Drop generic hints that collide with compounds (تخم مرغ, آب پز)."""
    if hint_tokens == ["مرغ"] and _contains_seq(food_tokens, ["تخم", "مرغ"]):
        return False
    if hint_tokens == ["آب"]:
        try:
            idx = food_tokens.index("آب")
        except ValueError:
            return False
        nxt = food_tokens[idx + 1] if idx + 1 < len(food_tokens) else ""
        if nxt in {"پز", "پخته"}:
            return False
        return idx == 0
    return True


def _contains_seq(hay: list[str], needle: list[str]) -> bool:
    if not needle or len(needle) > len(hay):
        return False
    n = len(needle)
    for i in range(len(hay) - n + 1):
        if hay[i : i + n] == needle:
            return True
    return False


def grams_each(food_name: str, unit: str | None) -> float | None:
    """Grams for one unit of this food, or None if the pair is not in the table."""
    unit_key = canonical_unit(unit)
    rows = _TABLE.get(unit_key)
    if not rows:
        return None
    food_tokens = normalize_fa(food_name).split()
    if not food_tokens:
        return None
    if unit_key == "کف دست" and any(t in _PALM_VOLUME_TOKENS for t in food_tokens):
        rows = [(hint, grams) for hint, grams in rows if hint[:1] == ["نان"]]
    best: tuple[int, int, float] | None = None
    for hint_tokens, grams in rows:
        if not _contains_seq(food_tokens, hint_tokens):
            continue
        if not _hint_allowed(food_tokens, hint_tokens):
            continue
        score = (len(hint_tokens), len(" ".join(hint_tokens)))
        if best is None or score > best[:2]:
            best = (*score, grams)
    return None if best is None else best[2]


def units_for_food(food_name: str) -> dict[str, float]:
    """Household units that have a table row for this food."""
    out: dict[str, float] = {}
    for unit in HOUSEHOLD_UNITS:
        grams = grams_each(food_name, unit)
        if grams is not None:
            out[unit] = grams
    return out


def convert(food: str, amount: float | None, unit: str | None) -> dict:
    """Turn spoken amount+unit into estimated grams. Never invents kcal."""
    food_name = (food or "").strip()
    unit_key = canonical_unit(unit)
    result = {
        "food": food_name,
        "amount": amount,
        "unit": unit_key or (unit or ""),
        "estimated_grams": None,
        "conversion_confidence": "unknown",
    }
    if amount is None or amount <= 0 or not unit_key:
        return result
    if unit_key == "گرم":
        result["estimated_grams"] = round(float(amount), 1)
        result["conversion_confidence"] = "high"
        return result
    if unit_key == "کیلوگرم":
        result["estimated_grams"] = round(float(amount) * 1000, 1)
        result["conversion_confidence"] = "high"
        return result
    each = grams_each(food_name, unit_key)
    if each is None:
        return result
    result["estimated_grams"] = round(float(amount) * each, 1)
    result["conversion_confidence"] = "high"
    return result
