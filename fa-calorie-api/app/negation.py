"""Negation and correction rules for meal-log text (layer 4/6)."""

from __future__ import annotations

import re

from .text import normalize_fa

_NEGATION_VERBS = (
    r"(?:نخوردم|نخورد|نخورده|نخوردیم|نداشتم|ندارم|مصرف\s+نکردم)"
)
_NEGATION_HEM_RE = re.compile(
    r"(?:^|[\s،])(?P<phrase>[\w\u0600-\u06FF]+)"
    r"\s+هم\s+(?:اصلاً?\s+)?" + _NEGATION_VERBS + r"(?:[\s،]|$)"
)
_NEGATION_RE = re.compile(
    r"(?:^|[\s،])(?P<phrase>[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+){0,2})"
    r"\s+(?:اصلاً?\s+)?" + _NEGATION_VERBS + r"(?:[\s،]|$)"
)
_WITHOUT_RE = re.compile(
    r"بدون\s+(?P<phrase>[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+){0,3})"
)
_NOT_THIS_RE = re.compile(
    r"نه\s+(?P<bad>[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+){0,3})"
    r"\s+بلکه\s+(?P<good>[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+){0,3})"
)


def _norm_phrase(s: str) -> str:
    return normalize_fa(s).strip()


def negated_phrases(text: str) -> set[str]:
    text = _norm_phrase(text)
    out: set[str] = set()
    for m in _NEGATION_HEM_RE.finditer(text):
        out.add(_norm_phrase(m.group("phrase")))
    for m in _NEGATION_RE.finditer(text):
        # "قند هم نخوردم" is handled by _NEGATION_HEM_RE — skip long greedy match.
        if re.search(r"\s+هم\s+(?:اصلاً?\s+)?" + _NEGATION_VERBS, m.group(0)):
            continue
        out.add(_norm_phrase(m.group("phrase")))
    for m in _WITHOUT_RE.finditer(text):
        out.add(_norm_phrase(m.group("phrase")))
    for m in _NOT_THIS_RE.finditer(text):
        out.add(_norm_phrase(m.group("bad")))
    return {p for p in out if p}


def _matches_negated(spoken: str, food: str, negated: set[str]) -> bool:
    spoken_n = _norm_phrase(spoken)
    food_n = _norm_phrase(food)
    for phrase in negated:
        if not phrase:
            continue
        if phrase == spoken_n or phrase == food_n:
            return True
        if spoken_n and spoken_n in phrase.split():
            return True
        if food_n and food_n.split()[0] in phrase.split() if food_n.split() else False:
            return True
        # staple token overlap (برنج in برنج سفید...)
        p_tokens = set(phrase.split())
        if len(p_tokens) == 1:
            token = next(iter(p_tokens))
            if len(token) <= 5 and token in spoken_n.split():
                return True
            if len(token) <= 5 and token in food_n.split() and token == food_n.split()[0]:
                return True
    return False


_CORRECTION_WRONG_RE = re.compile(
    r"(?:اول\s+گفتم|اول\s+خواستم)\s+"
    r"(?P<wrong>[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+){0,2})"
    r".*?اشتباه",
)
_WAS_NOT_RE = re.compile(
    r"(?P<wrong>[\w\u0600-\u06FF]+)\s+نبود"
)
_NOT_X_COMMA_Y_RE = re.compile(
    r"نه\s+(?P<wrong>[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+){0,1})\s*[،,]\s*"
    r"(?P<good>[\w\u0600-\u06FF]+(?:\s+[\w\u0600-\u06FF]+){0,2})"
)


def invalidated_by_correction(text: str) -> set[str]:
    """Food mentions the speaker retracted before giving the real intent."""
    text = _norm_phrase(text)
    out: set[str] = set()
    m = _CORRECTION_WRONG_RE.search(text)
    if m:
        out.add(_norm_phrase(m.group("wrong")))
    for m in _WAS_NOT_RE.finditer(text):
        out.add(_norm_phrase(m.group("wrong")))
    m = _NOT_X_COMMA_Y_RE.search(text)
    if m:
        out.add(_norm_phrase(m.group("wrong")))
    return {p for p in out if p}


def _spoken_matches_invalid(spoken: str, food: str, invalidated: set[str]) -> bool:
    spoken_n = _norm_phrase(spoken)
    food_n = _norm_phrase(food)
    for phrase in invalidated:
        if not phrase:
            continue
        if phrase == spoken_n or phrase in spoken_n.split():
            return True
        p0 = phrase.split()[0] if phrase.split() else ""
        if p0 and p0 == spoken_n:
            return True
        if p0 and food_n.startswith(p0):
            return True
    return False


def demote_corrected_mentions(
    text: str,
    committed: list,
    candidates: list[dict],
) -> tuple[list, list[dict], list[dict]]:
    """Move retracted foods out of committed. They are corrections, not consumed."""
    invalidated = invalidated_by_correction(text)
    if not invalidated:
        return committed, candidates, []
    kept = []
    corrections: list[dict] = []
    for match, row in committed:
        spoken = str(row.get("spoken") or "")
        food = str(row.get("food") or "")
        if _spoken_matches_invalid(spoken, food, invalidated):
            corrections.append(
                {
                    "spoken": spoken,
                    "spoken_original": spoken,
                    "spoken_corrected": "",
                    "food_id": row.get("food_id"),
                    "food": food,
                    "match_score": row.get("match_score"),
                    "status": "corrected",
                    "quantity": None,
                    "unit": None,
                }
            )
        else:
            kept.append((match, row))
    if len(corrections) == 1 and kept:
        corrections[0]["spoken_corrected"] = str(kept[0][1].get("spoken") or "")
    return kept, candidates, corrections


def filter_negated_items(text: str, items: list[dict]) -> tuple[list[dict], list[dict]]:
    negated_set = negated_phrases(text)
    if not negated_set:
        return items, []
    kept: list[dict] = []
    negated: list[dict] = []
    for item in items:
        spoken = str(item.get("spoken") or "")
        food = str(item.get("food") or "")
        if _matches_negated(spoken, food, negated_set):
            negated.append(
                {
                    "spoken": spoken,
                    "food": food,
                    "food_id": item.get("food_id"),
                    "status": "negated",
                }
            )
            continue
        kept.append(item)
    return kept, negated


def strip_false_rice_fix(text: str) -> str:
    """Keep ASR 'فرنج' when speaker negated rice — don't rewrite to برنج."""
    return re.sub(
        r"فرنج\s+(نخوردم|نخورد|نخورده|نداشتم|ندارم)",
        r"فرنج \1",
        normalize_fa(text),
    )
