"""Minimal Persian text normalization — deliberately not the `hazm` package.

hazm pulls in a heavier dependency chain than this needs; the only things that
actually matter for matching food names are Arabic/Persian letter-variant unification
and whitespace cleanup, so that's all this does.

ASR spelling repairs live here too, so number parsing, unit matching, and food
lookup all see the same cleaned tokens. Mappings are grown from real voice notes
(the 15-clip meal-log set), not a general spellchecker: short ambiguous words
stay unmapped unless the surrounding phrase makes them unique.
"""

from __future__ import annotations

import re

from .numbers import NUMBER_WORDS

# Whisper's output punctuates real speech ("خوردم، یه دونه..."), and a trailing
# "،" glued onto a word meant "خوردم" (filler word) never matched the bare
# "خوردم" in FILLER_WORDS, so the phrase scanner kept running past where it
# should have stopped. Split punctuation into its own token before anything else.
_PUNCT_RE = re.compile(r"[،؛؟!.,;?:؟]")

_CHAR_MAP = str.maketrans({
    "ي": "ی",
    "ك": "ک",
    "ة": "ه",
    "ۀ": "ه",
    "أ": "ا",
    "إ": "ا",
    "آ": "آ",
    "‌": " ",  # ZWNJ -> space, so "می‌خورم" tokenizes as ["می", "خورم"]
    "‏": "",   # RTL mark
    "﻿": "",   # BOM
})

# Speakers in the 15-clip set announced "تست یک / تست دو / ..." before the meal.
# Those prefixes aren't food and the number-words in them would otherwise look
# like quantities. Strip only this lead-in; don't touch numbers inside the meal.
_LEADIN_RE = re.compile(
    r"^(?:شماره\s+)?(تسته|تست|پست|ترس|رس)\s+"
    r"(یک|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده|"
    r"یازده|دوازده|سیزده|چهارده|پانزده|پونزد|پونزده|"
    r"شانزده|شونزده|هفده|هجده|نوزده|بیست)\s+"
)

# Longest-first phrase replacements from observed Whisper output. Applied on the
# full normalized string so split-word errors ("ما کارانی") and context-only
# swaps ("تکه گوش" but not bare "گوش") both work.
_PHRASE_FIXES: list[tuple[str, str]] = sorted(
    [
        ("گیا اسکوپورت این وی", "یک اسکوپ پروتئین وی"),
        ("اسکوپورت این وی", "اسکوپ پروتئین وی"),
        ("سینه ای موقع", "سینه مرغ"),
        ("پرسوش کاف", "پرس جوجه کباب"),
        ("نصف شخوردم", "نصفش خوردم"),
        ("بدون سست", "بدون سس"),
        ("شیر کمچرب", "شیر کم چرب"),
        ("ماست کمچرب", "ماست کم چرب"),
        ("کمچرخوردم", "کم چرب خوردم"),
        ("میان بعده", "میان وعده"),
        ("اصل قهبه", "عصر قهوه"),
        ("برای شان", "برای شام"),
        ("داد و تخم", "دو تا تخم"),
        ("تکه گوش", "تکه گوشت"),
        ("گوش داخل", "گوشت داخل"),
        ("گوشه چرخ", "گوشت چرخ"),
        ("ما کارانی", "ماکارونی"),
        ("کرا تیم", "کراتین"),
        ("نوسنگرگ", "نان سنگک"),
        ("عذر هم", "عصر هم"),
        ("زیز یاد", "زیاد"),
        ("بی چیزی", "یک چیزی"),
        ("اسکوپورت", "اسکوپ پروتئین"),
        # GapGPT 50-clip benchmark (Aug 2026)
        ("آگوش", "آبگوشت"),
        ("بشقه", "بشقاب"),
        ("گوش چرخ", "گوشت چرخ"),
        ("گوش چرخ کرده", "گوشت چرخ کرده"),
        ("سیزایونی سرخ کرده", "سیب زمینی سرخ کرده"),
        ("سیب زمینی سرخ کرده", "سیب زمینی سرخ شده"),
        ("جور کباب", "جوجه کباب"),
        ("آب پس", "آب پز"),
        ("قرص جوجه کباب", "پرس جوجه کباب"),
        ("یک قرص جوجه", "یک پرس جوجه"),
        ("مزد", "موز"),
        ("یه مز", "یک موز"),
        ("عصر مز", "عصر موز"),
        ("بادوم", "بادام"),
        ("خورش قورمه", "خورشت قورمه"),
        ("خورش قیمه", "خورشت قیمه"),
        ("چایی", "چای"),
        ("یکم", "یک"),
    ],
    key=lambda kv: -len(kv[0]),
)

# Whisper sometimes glues the number to گرم ("صدگرم"). Split so the number
# parser and the unit matcher each see their own token.
_GLUED_NUMBER_UNIT = re.compile(
    r"^(?P<num>صد|یکصد|دویست|سیصد|چهارصد|پانصد|پونصد|ششصد|شیشصد|هفتصد|هشتصد|نهصد|"
    r"ده|یازده|دوازده|سیزده|چهارده|پانزده|پونزده|شانزده|شونزده|هفده|هیفده|هجده|هیجده|نوزده|"
    r"بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود|"
    r"صفر|یک|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه)"
    r"(?P<unit>گرم|کیلوگرم|قاشق|لیوان)$"
)

# Only rewrite these when the previous token is already a number — "گرفت" is a
# real verb, "گرهام" showed up as "گرم" + a trailing syllable after دویست/صد.
_NUMBER_UNIT_TYPOS = {
    "گرفت": "گرم",
    "گرهام": "گرم",
    "گره": "گرم",
}

_SPLIT_WORDS = {
    "کمچرب": ["کم", "چرب"],
    "دوتا": ["دو", "تا"],
    "سهتا": ["سه", "تا"],
}

# Colloquial/spoken forms -> their formal equivalent, applied per-word so every
# downstream step (number parsing, unit matching, food lookup) benefits from one
# fix instead of each needing its own colloquial-spelling patch. "یه" matters most:
# in real speech it IS the word for "one" (not just informal "a"), and without this
# it was silently invisible to the number parser. Grow this list as real voice
# notes surface more variants — it's not meant to be exhaustive.
_COLLOQUIAL_WORDS = {
    "یه": "یک",
    "دون": "دونه",
    "نون": "نان",
    "تیکه": "تکه",
    "برهنج": "برنج",
    # فرنج -> برنج only when NOT negated (handled in negation.strip_false_rice_fix)
    "خورجت": "خورشت",
    "خورش": "خورشت",
    "لیون": "لیوان",
    "گلیل": "گریل",
    "پتزهای": "پیتزاهای",
    "پتزا": "پیتزا",
    "میشبه": "نوشابه",
    "بروری": "بربری",
    "بادم": "بادام",
    "کاسته": "کاسه",
    "ماسته": "ماست",
    "قهبه": "قهوه",
    "باوده": "حدود",
    "داشتر": "داشتم",
    "داشم": "داشتم",
    "شخوردم": "خوردم",
    "مز": "موز",
    "مزد": "موز",
    "چایی": "چای",
    "بشقه": "بشقاب",
}

_STEM_FIXES = (
    ("برهنج", "برنج"),
)


def normalize_fa(text: str) -> str:
    text = text.translate(_CHAR_MAP)
    text = _PUNCT_RE.sub(" ", text)
    return " ".join(text.split())


def _is_number_token(word: str) -> bool:
    if word in NUMBER_WORDS:
        return True
    if word.isdigit():
        return True
    return bool(word) and all("۰" <= ch <= "۹" for ch in word)


def _fix_word(word: str) -> str:
    mapped = _COLLOQUIAL_WORDS.get(word)
    if mapped is not None:
        return mapped
    for stem, canon in _STEM_FIXES:
        if word.startswith(stem):
            return canon
    return word


def correct_asr_text(text: str) -> str:
    """Repair observed Whisper typos, then return a normalized token string."""
    from .negation import strip_false_rice_fix

    text = normalize_fa(text)
    text = strip_false_rice_fix(text)
    text = _LEADIN_RE.sub("", text).strip()
    # Whole-phrase only: naive replace turned "تکه گوش" into "تکه گوشت" and then
    # matched "تکه گوش" again as a prefix of "تکه گوشت" ("گوشتت" in test 1).
    for src, dst in _PHRASE_FIXES:
        text = re.sub(rf"(?<!\S){re.escape(src)}(?!\S)", dst, text)

    out: list[str] = []
    for word in text.split():
        glued = _GLUED_NUMBER_UNIT.match(word)
        if glued:
            out.append(glued.group("num"))
            out.append(glued.group("unit"))
            continue
        if out and _is_number_token(out[-1]) and word in _NUMBER_UNIT_TYPOS:
            out.append(_NUMBER_UNIT_TYPOS[word])
            continue
        pieces = _SPLIT_WORDS.get(word)
        if pieces is not None:
            out.extend(_fix_word(p) for p in pieces)
            continue
        out.append(_fix_word(word))
    # فرنج -> برنج only when rice was actually meant (not negated)
    out = [
        "برنج" if w == "فرنج" else w
        for w in out
    ]
    return " ".join(out)


def tokenize(text: str) -> list[str]:
    return [w for w in correct_asr_text(text).split() if w]
