"""Persian spoken-number parsing: word tokens -> int, with no LLM guessing involved.

Standalone word tables for voice meal logs; exposes a token-scanner that returns a
value directly, so callers get a real int instead of re-parsing digit text.
"""

from __future__ import annotations

UNITS = {"صفر": 0, "یک": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5, "شش": 6, "شیش": 6, "هفت": 7, "هشت": 8, "نه": 9}
TEENS = {
    "ده": 10, "یازده": 11, "دوازده": 12, "سیزده": 13, "چهارده": 14,
    "پانزده": 15, "پونزده": 15, "شانزده": 16, "شونزده": 16, "هفده": 17,
    "هیفده": 17, "هجده": 18, "هیجده": 18, "نوزده": 19,
}
TENS = {"بیست": 20, "سی": 30, "چهل": 40, "پنجاه": 50, "شصت": 60, "هفتاد": 70, "هشتاد": 80, "نود": 90}
HUNDREDS = {
    "صد": 100, "یکصد": 100, "دویست": 200, "سیصد": 300, "چهارصد": 400,
    "پانصد": 500, "پونصد": 500, "ششصد": 600, "شیشصد": 600, "هفتصد": 700,
    "هشتصد": 800, "نهصد": 900,
}
SCALES = {"هزار": 1000, "میلیون": 1000000, "میلیارد": 1000000000}
# "نیم" (half) and "یک دوم" show up a lot for units like a glass/spoon ("نیم لیوان").
HALF_WORDS = {"نیم", "نصف"}

NUMBER_WORDS = set(UNITS) | set(TEENS) | set(TENS) | set(HUNDREDS) | set(SCALES)
_FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
_FA_TO_ASCII = {fa: str(i) for i, fa in enumerate(_FA_DIGITS)}


def _word_value(word: str) -> int | None:
    for table in (UNITS, TEENS, TENS, HUNDREDS):
        if word in table:
            return table[word]
    return None


def _digit_value(word: str) -> float | None:
    """Parse a token that is already digits (Latin or Persian), e.g. '2' or '۲.۵'."""
    ascii_word = "".join(_FA_TO_ASCII.get(ch, ch) for ch in word)
    try:
        return float(ascii_word) if "." in ascii_word else int(ascii_word)
    except ValueError:
        return None


_QUANTITY_AFTER_NE = frozenset({"تا", "عدد", "تایی", "دونه", "دون", "قلم"})


def _is_negation_nah(tokens: list[str], start: int) -> bool:
    """«نه شیر» = negation; «نه تا» / «نه عدد» = the number nine."""
    if start >= len(tokens) or tokens[start] != "نه":
        return False
    if start + 1 >= len(tokens):
        return False
    nxt = tokens[start + 1]
    if nxt in NUMBER_WORDS or nxt in HALF_WORDS:
        return False
    if _digit_value(nxt) is not None:
        return False
    if nxt in _QUANTITY_AFTER_NE:
        return False
    return True


def parse_number_at(tokens: list[str], start: int) -> tuple[float, int] | None:
    """Try to parse a spoken/digit number starting at tokens[start].

    Returns (value, next_index) on success, else None. Consumes "و" (and) only
    when it links two number words, e.g. "صد و بیست" -> 120, so it never eats an
    unrelated "و" that separates two different food items.
    """
    if start >= len(tokens):
        return None

    first = tokens[start]
    if _is_negation_nah(tokens, start):
        return None
    if first in HALF_WORDS:
        return 0.5, start + 1

    if first == "یک" and start + 1 < len(tokens):
        if tokens[start + 1] == "چهارم":
            return 0.25, start + 2
        if tokens[start + 1] in ("سوم", "سومش"):
            return round(1 / 3, 4), start + 2

    digit_val = _digit_value(first)
    if digit_val is not None:
        nxt = start + 1
        if (
            nxt < len(tokens)
            and tokens[nxt] == "و"
            and nxt + 1 < len(tokens)
            and tokens[nxt + 1] in HALF_WORDS
        ):
            return float(digit_val) + 0.5, nxt + 2
        return digit_val, start + 1

    if first not in NUMBER_WORDS:
        return None

    total = 0
    current = 0
    i = start
    while i < len(tokens):
        word = tokens[i]
        if word == "و" and i + 1 < len(tokens) and tokens[i + 1] in NUMBER_WORDS:
            i += 1
            continue
        if word in SCALES:
            current = (current or 1) * SCALES[word]
            total += current
            current = 0
        elif word in NUMBER_WORDS:
            current += _word_value(word) or 0
        else:
            break
        i += 1
    total += current
    if (
        i < len(tokens)
        and tokens[i] == "و"
        and i + 1 < len(tokens)
        and tokens[i + 1] in HALF_WORDS
        and total > 0
    ):
        return total + 0.5, i + 2
    return total, i
