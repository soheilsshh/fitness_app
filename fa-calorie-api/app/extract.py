"""Persian text -> committed items / candidates / unmatched. Deterministic:
Layer 6 classifies names (no kcal). Layer 7 fills grams/kcal only on committed
items. Number words come from numbers.py, units from units.py + the food's own
rows in Persian_food_facts.json. Nothing here calls a generative model.
"""

from __future__ import annotations

from . import numbers, units
from .foods_db import FoodDB, FoodMatch, is_committed
from .negation import demote_corrected_mentions, filter_negated_items
from .text import tokenize

MEAL_WORDS = {
    "صبحانه": "breakfast", "صبحونه": "breakfast", "ناشتا": "breakfast", "صبح": "breakfast",
    "ناهار": "lunch", "ظهر": "lunch",
    "شام": "dinner", "دیشب": "dinner",
    "میانوعده": "snack", "میان وعده": "snack", "عصرونه": "snack", "عصرانه": "snack", "عصر": "snack",
}
# Verbs/fillers/discourse words that show up around food mentions but aren't part
# of a food name. Filtered out BEFORE fuzzy matching on purpose: a short discourse
# word like "امروز" (today) can still score above the cutoff against some unrelated
# 3-letter food name by sheer character overlap (e.g. "امروز" ~ "موز"/banana at 75),
# so relying on the matcher alone to reject non-food words isn't reliable enough.
FILLER_WORDS = {
    "خوردم", "خوردیم", "خورد", "میخورم", "خورده", "خوردن", "خوردی",
    "میل", "کردم", "کردیم", "صرف", "برای", "برداشتم", "ریختم", "گذاشتم",
    "امروز", "دیروز", "دیشب", "پریروز", "الان", "بعد", "قبل", "دیگه",
    "هم", "خیلی", "یه", "تقریبا", "حدودا", "حدود", "فکرکنم", "کلا",
    "میان", "وعده", "واقعا", "بودن", "بود", "بوده", "کوچیک", "بزرگ", "متوسط", "اندازه",
    "تست", "تسته", "تسه",
    # Series-2 ASR discourse that fuzzy-matched as food (کنار the fruit, به quince)
    # or leaked test-number prefixes into the meal text.
    "کنار", "به", "بست", "حس", "اصل", "گرفتم", "داشتم", "رس", "پست", "ترس",
    "دوم", "شماره",
    "منظورم", "منظور", "فقط", "ولی", "گفتم", "اول",
    "اصلا", "اصلاً",
}
# Connectors that must end a food-name scan, or they get pulled into the fuzzy
# query and corrupt it — "شیر و" (milk and...) matches "شیر جو" (oat milk) at 91%
# because they differ by one character, even though "و" here just meant "and".
_CONNECTORS = {"و", "با"}

# Second token of a compound food name — do not commit the head token alone.
_COMPOUND_SECOND: dict[str, frozenset[str]] = {
    "سیب": frozenset({"زمینی"}),
    "گوجه": frozenset({"کبابی", "فرنگی", "سبز", "خشک"}),
    "تخم": frozenset({"مرغ"}),
    "گوشت": frozenset({"چرخ", "گوسفند", "گاو", "مرغ"}),
}
# Cooking / prep tokens that continue a food phrase after the compound core.
_FOOD_MODIFIERS = frozenset({
    "آب", "پز", "پس", "شده", "خام", "سرخ", "کرده", "چرخ", "کبابی", "آبپز",
    "بخارپز", "گریل", "گریل شده", "آب", "پخته",
})

# Plate/serving units that bind to the most recent dish without quantity, not the
# next meat token ("ماکارونی ... یک بشقاب ... گوشت").
_PLATE_UNITS = frozenset({"بشقاب", "پرس", "کاسه", "پیاله", "ظرف"})
_MEAT_STAPLES = frozenset({"گوشت", "مرغ", "فیله", "جوجه", "گوساله", "گوسفند"})

# Vague amount talk — never becomes a numeric quantity.
_AMBIGUOUS_QTY_PHRASES: list[tuple[str, ...]] = sorted(
    [
        ("چند", "تا"),
        ("چند", "عدد"),
        ("چند", "دونه"),
        ("چند", "دانه"),
        ("یه", "مقدار"),
        ("یک", "مقدار"),
        ("یه", "خورده"),
        ("یه", "کم"),
        ("مقدار", "کمی"),
        ("کمی", "از"),
        ("مقدار", "کمی"),
    ],
    key=lambda p: -len(p),
)
_AMBIGUOUS_QTY_WORDS = frozenset({
    "چند", "کمی", "کم", "مقداری", "مقدار", "خورده", "یکم",
})

# Layer 7 keys. Candidates and unmatched must never carry these.
_NUTRITION_KEYS = (
    "kcal", "grams", "protein_g", "carbs_g", "fat_g", "estimated",
    "needs_quantity", "needs_conversion",
)


def detect_meal(tokens: list[str]) -> str | None:
    joined = " ".join(tokens)
    for word, meal in MEAL_WORDS.items():
        if word in tokens or word in joined:
            return meal
    return None


def _meal_at(tokens: list[str], i: int) -> tuple[str, int] | None:
    """Return (meal, next_index) if tokens[i:] starts with a meal word."""
    if i + 1 < len(tokens):
        phrase = f"{tokens[i]} {tokens[i + 1]}"
        if phrase in MEAL_WORDS:
            return MEAL_WORDS[phrase], i + 2
    if tokens[i] in MEAL_WORDS:
        return MEAL_WORDS[tokens[i]], i + 1
    return None


def _is_boundary(token: str) -> bool:
    if token in FILLER_WORDS or token in MEAL_WORDS or token in _CONNECTORS or token in (",", "،"):
        return True
    if numbers.parse_number_at([token], 0) is not None:
        return True
    if token in units.UNIT_ALIASES:
        return True
    return False


def _extend_compound_phrase(tokens: list[str], start: int, end: int) -> int:
    """Extend end through compound foods (سیب زمینی آب پز) and prep modifiers."""
    while end < len(tokens):
        head = tokens[end - 1] if end > start else ""
        if end < len(tokens) and head in _COMPOUND_SECOND and tokens[end] in _COMPOUND_SECOND[head]:
            end += 1
            while end < len(tokens) and tokens[end] in _FOOD_MODIFIERS:
                end += 1
            continue
        if end < len(tokens) and tokens[end] in _FOOD_MODIFIERS and end > start:
            end += 1
            continue
        break
    return end


def _food_phrase_end(tokens: list[str], start: int) -> int:
    j = start
    while j < len(tokens) and not _is_boundary(tokens[j]):
        j += 1
    return _extend_compound_phrase(tokens, start, j)


def _ambiguous_quantity_at(tokens: list[str], start: int) -> int | None:
    """Return next index if tokens[start:] is a vague amount (چند تا / یه کم / …)."""
    if start >= len(tokens):
        return None
    for phrase in _AMBIGUOUS_QTY_PHRASES:
        end = start + len(phrase)
        if tuple(tokens[start:end]) == phrase:
            unit = units.find_unit(tokens, end)
            return unit[1] if unit else end
    if tokens[start] in _AMBIGUOUS_QTY_WORDS:
        end = start + 1
        unit = units.find_unit(tokens, end)
        return unit[1] if unit else end
    return None


def _bind_pending_retroactive(
    committed: list[tuple[FoodMatch, dict]],
    pending_count: float | None,
    pending_unit: str | None,
) -> tuple[float | None, str | None]:
    """Attach an explicit count+unit to the latest committed item without quantity."""
    if pending_count is None or pending_unit is None:
        return pending_count, pending_unit
    for idx in range(len(committed) - 1, -1, -1):
        _, row = committed[idx]
        if row.get("quantity") is not None or row.get("unit") is not None:
            continue
        row["quantity"] = pending_count
        row["unit"] = pending_unit
        return None, None
    return pending_count, pending_unit


def _maybe_rebind_plate_unit(
    committed: list[tuple[FoodMatch, dict]],
    spoken: str,
    pending_count: float | None,
    pending_unit: str | None,
) -> tuple[float | None, str | None]:
    if pending_unit not in _PLATE_UNITS:
        return pending_count, pending_unit
    if spoken not in _MEAT_STAPLES:
        return pending_count, pending_unit
    return _bind_pending_retroactive(committed, pending_count, pending_unit)


def _match_row(
    match: FoodMatch,
    spoken: str,
    unit_key: str | None,
    count: float | None,
    meal: str | None,
) -> dict:
    """Layer 6 identity only — no grams/kcal."""
    row = {
        "spoken": spoken,
        "food_id": match.food_id(),
        "food": match.name,
        "match_score": round(match.score, 1),
        "quantity": count,
        "unit": unit_key,
        "available_units": match.available_units(),
        **match.per_100g_fields(),
    }
    if meal:
        row["meal"] = meal
    return row


def _strip_nutrition(row: dict) -> dict:
    return {k: v for k, v in row.items() if k not in _NUTRITION_KEYS}


def _emit(
    match: FoodMatch,
    spoken: str,
    unit_key: str | None,
    count: float | None,
    meal: str | None,
    committed: list[tuple[FoodMatch, dict]],
    candidates: list[dict],
) -> None:
    row = _match_row(match, spoken, unit_key, count, meal)
    if is_committed(match, spoken):
        committed.append((match, row))
    else:
        candidates.append(row)


def _emit_with_pending(
    match: FoodMatch,
    spoken: str,
    pending_count: float | None,
    pending_unit: str | None,
    meal: str | None,
    committed: list[tuple[FoodMatch, dict]],
    candidates: list[dict],
    pending_needs_quantity: bool = False,
) -> tuple[float | None, str | None, bool]:
    if pending_needs_quantity:
        _emit(match, spoken, None, None, meal, committed, candidates)
        return None, None, False
    pending_count, pending_unit = _maybe_rebind_plate_unit(
        committed, spoken, pending_count, pending_unit,
    )
    _emit(match, spoken, pending_unit, pending_count, meal, committed, candidates)
    return None, None, False


def _apply_layer7(match: FoodMatch, row: dict) -> dict:
    """Grams/kcal only for committed items with a DB conversion. Candidates never enter here."""
    resolved = match.resolve(row.get("unit"), row.get("quantity"))
    resolved["spoken"] = row["spoken"]
    resolved["status"] = "committed"
    if row.get("meal"):
        resolved["meal"] = row["meal"]
    return resolved


def extract(text: str, db: FoodDB) -> dict:
    tokens = tokenize(text)
    meal = detect_meal(tokens)

    committed: list[tuple[FoodMatch, dict]] = []
    candidates: list[dict] = []
    unmatched: list[str] = []
    i = 0
    pending_count: float | None = None
    pending_unit: str | None = None
    pending_needs_quantity = False
    current_meal: str | None = None
    skip_next_food = False

    while i < len(tokens):
        tok = tokens[i]

        meal_hit = _meal_at(tokens, i)
        if meal_hit is not None:
            current_meal, i = meal_hit
            continue
        amb = _ambiguous_quantity_at(tokens, i)
        if amb is not None:
            pending_needs_quantity = True
            pending_count = None
            pending_unit = None
            i = amb
            continue

        if tok == "یه" and units.find_unit(tokens, i + 1) is not None:
            pending_count = 1
            pending_needs_quantity = False
            i += 1
            continue

        if tok in FILLER_WORDS or tok in (",", "،"):
            if pending_unit is not None or pending_count is not None:
                pending_count, pending_unit = _bind_pending_retroactive(
                    committed, pending_count, pending_unit,
                )
            i += 1
            continue
        if tok == "و":
            i += 1
            continue

        if tok == "نه" and numbers._is_negation_nah(tokens, i):
            skip_next_food = True
            i += 1
            continue

        num = numbers.parse_number_at(tokens, i)
        if num is not None:
            pending_count, i = num
            pending_needs_quantity = False
            continue

        unit_match = units.find_unit(tokens, i)
        if unit_match is not None:
            pending_unit, i = unit_match
            continue

        end = _food_phrase_end(tokens, i)
        if end == i:  # single stray token matched no rule above (e.g. stray punctuation)
            i += 1
            continue

        phrase_tokens = tokens[i:end]
        phrase = " ".join(phrase_tokens)
        if skip_next_food:
            unmatched.append(phrase)
            skip_next_food = False
            pending_count = None
            pending_unit = None
            pending_needs_quantity = False
            i = end
            continue

        whole = db.find(phrase)
        # Colloquial speech often drops "و" between two foods ("نان پنیر خوردم" =
        # bread [and] cheese). Try each token on its own too, and prefer that split
        # when every token is a committed match and the whole phrase isn't itself
        # an exact hit — otherwise a real two-word dish name like "قورمه سبزی"
        # would get needlessly split into two wrong single-word matches.
        splits = [db.find(w) for w in phrase_tokens] if len(phrase_tokens) > 1 else []
        split_all_committed = (
            len(splits) > 1
            and all(
                s is not None and is_committed(s, w)
                for s, w in zip(splits, phrase_tokens)
            )
        )
        whole_exact = whole is not None and whole.score >= 100

        if split_all_committed and not whole_exact:
            for s, w in zip(splits, phrase_tokens):
                assert s is not None
                pending_count, pending_unit, pending_needs_quantity = _emit_with_pending(
                    s, w, pending_count, pending_unit, current_meal, committed, candidates,
                    pending_needs_quantity,
                )
        elif whole is not None and is_committed(whole, phrase):
            pending_count, pending_unit, pending_needs_quantity = _emit_with_pending(
                whole, phrase, pending_count, pending_unit, current_meal, committed, candidates,
                pending_needs_quantity,
            )
        elif splits and any(
            s is not None and is_committed(s, w) for s, w in zip(splits, phrase_tokens)
        ):
            # Weak whole-phrase fuzzy (or no committed whole) still contains a
            # staple token: "سه عداد گردو", "گوشت چرخ کرده". Commit the staple
            # and leave the rest as candidates/unmatched instead of dropping it.
            applied_pending = False
            for s, w in zip(splits, phrase_tokens):
                if s is None:
                    unmatched.append(w)
                    continue
                if is_committed(s, w) and not applied_pending:
                    pending_count, pending_unit, pending_needs_quantity = _emit_with_pending(
                        s, w, pending_count, pending_unit, current_meal, committed, candidates,
                        pending_needs_quantity,
                    )
                    applied_pending = True
                else:
                    _emit(s, w, None, None, current_meal, committed, candidates)
        elif whole is not None:
            pending_count, pending_unit, pending_needs_quantity = _emit_with_pending(
                whole, phrase, pending_count, pending_unit, current_meal, committed, candidates,
                pending_needs_quantity,
            )
        elif splits and any(s is not None for s in splits):
            for s, w in zip(splits, phrase_tokens):
                if s is None:
                    unmatched.append(w)
                else:
                    _emit(s, w, None, None, current_meal, committed, candidates)
        else:
            unmatched.append(phrase)

        pending_count = None
        pending_unit = None
        pending_needs_quantity = False
        i = end

    committed, candidates, corrections = demote_corrected_mentions(text, committed, candidates)

    # Layer 7: nutrition only on committed rows. items == committed.
    items = [_apply_layer7(match, row) for match, row in committed]
    items, negated = filter_negated_items(text, items)
    candidates = [_strip_nutrition({**row, "status": "candidate"}) for row in candidates]

    # Rambling/self-correcting speech re-mentions the same food twice on purpose
    # ("...چیپس سرکه یه کوچیک خوردم... هشتاد گرم چیپس..." is very likely ONE bag
    # described twice, not two). There's no reliable way to tell that apart from a
    # genuine second portion, so both get counted (nothing here silently drops a
    # mention) but flagged for the caller to ask the user rather than guess.
    name_counts: dict[str, int] = {}
    for item in items:
        if item.get("food"):
            name_counts[item["food"]] = name_counts.get(item["food"], 0) + 1
    for item in items:
        if item.get("food") and name_counts[item["food"]] > 1:
            item["possible_duplicate"] = True

    needs_quantity = [
        {
            "food": item.get("food"),
            "food_id": item.get("food_id"),
            "spoken": item.get("spoken"),
            "quantity": item.get("quantity"),
            "unit": item.get("unit"),
            "available_units": item.get("available_units") or [],
            "needs_conversion": bool(item.get("needs_conversion")),
        }
        for item in items
        if item.get("needs_quantity") or item.get("needs_conversion")
    ]
    total_kcal = sum(
        item["kcal"]
        for item in items
        if item.get("kcal") is not None
        and not item.get("needs_quantity")
        and not item.get("needs_conversion")
    )
    return {
        "meal": meal,
        "items": items,
        "candidates": candidates,
        "unmatched": unmatched,
        "needs_quantity": needs_quantity,
        "negated": negated,
        "corrections": corrections,
        "total_kcal": round(total_kcal, 1),
        "raw_text": text,
    }
