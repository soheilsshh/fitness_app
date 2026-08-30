# -*- coding: utf-8 -*-
"""Regenerate the Persian exercise catalog from the English one.

    python relocalize.py --check     # report only, write nothing
    python relocalize.py --write     # rewrite data/exercises-fa/exercises.fa.json

The shipped Persian catalog was machine-translated and its names/taxonomy are
wrong or embarrassing in Persian (see terms.py). This rebuilds every `name`,
`category`, `body_part`, `equipment`, `muscle_group`, `target` and
`secondary_muscles` value from the English twin using curated vocabulary,
leaving ids, media paths and instructions untouched.
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from terms import (  # noqa: E402
    BODY_PART,
    EQUIPMENT,
    EQUIPMENT_IN_NAME,
    INSTRUCTION_FIXES,
    MUSCLE,
)
from names import DROP, HEADS, MODIFIERS, OVERRIDES as RAW_OVERRIDES  # noqa: E402

DATA = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data")
)
EN_FILE = os.path.join(DATA, "exercises-en", "exercises.json")
FA_FILE = os.path.join(DATA, "exercises-fa", "exercises.fa.json")

# Equipment prefixes, longest first, so "ez barbell" beats "barbell".
EQUIP_KEYS = sorted(EQUIPMENT.keys(), key=len, reverse=True)
HEAD_KEYS = sorted(HEADS, key=lambda kv: len(kv[0]), reverse=True)
MOD_KEYS = sorted(MODIFIERS.keys(), key=len, reverse=True)

# Compound names ("barbell squat jump step rear lunge") carry a second movement
# word outside the chosen head. Fall back to the head vocabulary for those.
HEAD_AS_MODIFIER = {phrase: persian for phrase, persian in HEADS}
# One merged table so longest-phrase always wins: "push up" (a head) must beat
# the single word "push" (a modifier).
LOOKUP = {}
LOOKUP.update(MUSCLE)
LOOKUP.update(HEAD_AS_MODIFIER)
LOOKUP.update(MODIFIERS)

# Equipment as it appears inside a name, which is not always the taxonomy value
# ("lever" for "leverage machine"). Without these the equipment word leaks into
# the modifier run and gets printed twice.
EQUIP_ALIASES = {
    "lever": "leverage machine",
    "leverage": "leverage machine",
    "smith": "smith machine",
    "sled": "sled machine",
    "sledge": "sled machine",
    "skierg": "skierg machine",
    "stepmill": "stepmill machine",
    "elliptical": "elliptical machine",
    "bodyweight": "body weight",
    "exercise ball": "stability ball",
    "stability ball": "stability ball",
    "bosu ball": "bosu ball",
    "medicine ball": "medicine ball",
    "ez-bar": "ez barbell",
    "ez-barbell": "ez barbell",
    "ez bar": "ez barbell",
    "ez barbell": "ez barbell",
    "trap bar": "trap bar",
    "olympic barbell": "olympic barbell",
    "resistance band": "resistance band",
    "wheel roller": "wheel roller",
    "upper body ergometer": "upper body ergometer",
    "stationary bike": "stationary bike",
}
EQUIP_ALIAS_KEYS = sorted(EQUIP_ALIASES.keys(), key=lambda k: -len(k.split()))

def normalize(name):
    """Fold the punctuation variants the source catalog uses inconsistently."""
    # The source catalog carries a few cp1251-mangled degree signs ("45в°").
    text = name.strip().lower().replace("в°", "°").replace("_", " ")
    text = text.replace("°", " درجه ")
    text = re.sub(r"\.(?!\s*\d)", " ", text)   # keep the "v. 2" version marker
    text = re.sub(r"\s*,\s*", " ", text)
    return re.sub(r"\s+", " ", text).strip()


GENDER_RE = re.compile(r"\s*\((male|female)\)\s*$", re.I)
VERSION_RE = re.compile(r"\s*v\.?\s*(\d+)\s*$", re.I)
PAREN_RE = re.compile(r"\(([^)]*)\)")

OVERRIDES = {}
FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def _build_overrides():
    for key, value in RAW_OVERRIDES.items():
        OVERRIDES[normalize(key)] = value


def fa_digits(text):
    return text.translate(FA_DIGITS)


def strip_marker(name, regex):
    """Pull a trailing marker off the name, returning (rest, captured|None)."""
    m = regex.search(name)
    if not m:
        return name, None
    return name[: m.start()].strip(), m.group(1)


def take_phrase(tokens, table_keys, table):
    """Greedy longest-phrase match at the head of `tokens`.

    Returns (persian, consumed_token_count) or (None, 0).
    """
    for size in (4, 3, 2, 1):
        if size > len(tokens):
            continue
        phrase = " ".join(tokens[:size])
        if phrase in table:
            return table[phrase], size
    return None, 0


def find_head(tokens):
    """Locate the rightmost movement head. Returns (persian, start, end)."""
    best = None
    for phrase, persian in HEAD_KEYS:
        parts = phrase.split()
        n = len(parts)
        for i in range(len(tokens) - n, -1, -1):
            if tokens[i : i + n] == parts:
                # Prefer the head that ends latest; on a tie prefer the longer phrase.
                cand = (i + n, n, persian, i)
                if best is None or cand[:2] > best[:2]:
                    best = cand
                break
    if best is None:
        return None, -1, -1
    end, _, persian, start = best
    return persian, start, end


def translate_modifiers(tokens):
    """Translate a modifier token run, longest-phrase first."""
    out = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok in DROP or tok == "-":
            i += 1
            continue
        persian, used = take_phrase(tokens[i:], None, LOOKUP)
        if used:
            if persian:
                out.append(persian)
            i += used
            continue
        if re.fullmatch(r"\d+", tok):
            out.append(fa_digits(tok))
            i += 1
            continue
        # Unknown word — keep it verbatim so the reviewer can spot it.
        out.append(tok)
        i += 1
    return out


# Prepositions that only read well with something after them.
DANGLING = {"به", "از", "روی", "در", "با", "بین", "زیر", "بالای", "و", "دور"}


def tidy(parts):
    """Drop repeated terms and prepositions left dangling by reordering."""
    cleaned = []
    for part in parts:
        if not part:
            continue
        if part in cleaned:          # "جلو بازو متناوب جلو بازو"
            continue
        cleaned.append(part)
    while cleaned and cleaned[-1] in DANGLING:
        cleaned.pop()
    return cleaned


def compose(en_name, equipment):
    """Build a Persian name for one English exercise name."""
    raw = normalize(en_name)
    if raw in OVERRIDES:
        return OVERRIDES[raw], []

    name, gender = strip_marker(raw, GENDER_RE)
    if name in OVERRIDES:
        base = OVERRIDES[name]
        return (base + (" (%s)" % ("مردان" if gender == "male" else "زنان")) if gender else base), []

    name, version = strip_marker(name, VERSION_RE)

    # Pull parentheticals out and translate them separately.
    extras = []
    for inner in PAREN_RE.findall(name):
        inner = inner.strip()
        if inner:
            extras.append(" ".join(translate_modifiers(inner.replace("-", " ").split())))
    name = PAREN_RE.sub(" ", name)

    # Equipment: prefer the record's own equipment field when the name repeats it.
    equip_fa = None
    tokens = name.split()
    for alias in EQUIP_ALIAS_KEYS:
        parts = alias.split()
        if tokens[: len(parts)] == parts:
            equip_fa = EQUIPMENT_IN_NAME[EQUIP_ALIASES[alias]]
            tokens = tokens[len(parts) :]
            break
    if equip_fa is None:
        for key in EQUIP_KEYS:
            parts = key.split()
            if tokens[: len(parts)] == parts:
                equip_fa = EQUIPMENT_IN_NAME[key]
                tokens = tokens[len(parts) :]
                break
    # The equipment can also sit mid-name ("weighted russian twist" handled
    # above; "chest dip on dip-pull-up cage" not) — strip a later occurrence too.
    if equip_fa is not None:
        for alias in EQUIP_ALIAS_KEYS:
            parts = alias.split()
            n = len(parts)
            for i in range(len(tokens) - n + 1):
                if tokens[i : i + n] == parts and EQUIPMENT_IN_NAME[EQUIP_ALIASES[alias]] == equip_fa:
                    tokens = tokens[:i] + tokens[i + n :]
                    break
    if equip_fa is None and equipment in EQUIPMENT_IN_NAME and equipment not in (
        "body weight",
        "weighted",
        "assisted",
    ):
        equip_fa = EQUIPMENT_IN_NAME[equipment]

    head_fa, start, end = find_head(tokens)
    unknown = []
    if head_fa is None:
        body = translate_modifiers(tokens)
        parts = body
    else:
        before = translate_modifiers(tokens[:start])
        after = translate_modifiers(tokens[end:])
        parts = [head_fa] + before + after

    parts = tidy(parts)
    parts.extend(extras)
    parts = tidy(parts)
    if equip_fa:
        prefix = "" if equip_fa.startswith("با ") else "با "
        parts.append(prefix + equip_fa)
    parts = tidy(parts)
    if version:
        parts.append("نسخه " + fa_digits(version))
    if gender:
        parts.append("(%s)" % ("مردان" if gender == "male" else "زنان"))

    result = re.sub(r"\s+", " ", " ".join(parts)).strip()
    # Any surviving latin run means a word we have no term for.
    unknown = re.findall(r"[a-z][a-z'/-]*", result)
    return result, unknown


def fix_instructions(record_fa):
    """Apply the terminology repairs to the translated instruction paragraph."""
    body = (record_fa.get("instructions") or {}).get("fa")
    if not body:
        return False
    fixed = body
    for wrong, right in INSTRUCTION_FIXES:
        fixed = fixed.replace(wrong, right)
    if fixed == body:
        return False
    record_fa["instructions"]["fa"] = fixed
    return True


def relocalize(record_en):
    """Return the Persian field values for one English record."""
    name, unknown = compose(record_en["name"], record_en.get("equipment", ""))
    return {
        "name": name,
        "category": BODY_PART.get(record_en.get("category", ""), record_en.get("category", "")),
        "body_part": BODY_PART.get(record_en.get("body_part", ""), record_en.get("body_part", "")),
        "equipment": EQUIPMENT.get(record_en.get("equipment", ""), record_en.get("equipment", "")),
        "muscle_group": MUSCLE.get(record_en.get("muscle_group", ""), record_en.get("muscle_group", "")),
        "target": MUSCLE.get(record_en.get("target", ""), record_en.get("target", "")),
        "secondary_muscles": [
            MUSCLE.get(m, m) for m in (record_en.get("secondary_muscles") or [])
        ],
    }, unknown


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--report", default="")
    args = ap.parse_args()

    _build_overrides()

    with open(EN_FILE, encoding="utf-8") as fh:
        en = json.load(fh)
    with open(FA_FILE, encoding="utf-8") as fh:
        fa = json.load(fh)

    en_by_id = {e["id"]: e for e in en}
    unknown_words = {}
    missing_en = []
    lines = []
    changed = 0
    instructions_fixed = 0

    for rec in fa:
        src = en_by_id.get(rec["id"])
        if src is None:
            missing_en.append(rec["id"])
            continue
        fields, unknown = relocalize(src)
        for w in unknown:
            unknown_words.setdefault(w, []).append(src["name"])
        if rec["name"] != fields["name"]:
            changed += 1
        if fix_instructions(rec):
            instructions_fixed += 1
        lines.append("%s\t%s\t%s\t%s" % (rec["id"], src["name"], rec["name"], fields["name"]))
        rec.update(fields)

    print("records: %d  names changed: %d  instructions fixed: %d  no english twin: %d"
          % (len(fa), changed, instructions_fixed, len(missing_en)))
    if missing_en:
        print("  missing:", ", ".join(missing_en[:20]))
    if unknown_words:
        print("untranslated words: %d" % len(unknown_words))
        for w, uses in sorted(unknown_words.items(), key=lambda kv: -len(kv[1])):
            print("   %-22s x%d  e.g. %s" % (w, len(uses), uses[0]))

    if args.report:
        with open(args.report, "w", encoding="utf-8") as fh:
            fh.write("id\ten\told_fa\tnew_fa\n")
            fh.write("\n".join(lines))
        print("report ->", args.report)

    if args.write:
        with open(FA_FILE, "w", encoding="utf-8") as fh:
            json.dump(fa, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print("wrote", FA_FILE)


if __name__ == "__main__":
    main()
