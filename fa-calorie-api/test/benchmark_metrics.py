"""Shared metrics for ASR + extract benchmarks."""

from __future__ import annotations

import re
import unicodedata
from typing import Any

from app import numbers, units
from app.extract import extract
from app.foods_db import FoodDB
from app.text import correct_asr_text, normalize_fa, tokenize


def norm(s: str) -> str:
    return normalize_fa(unicodedata.normalize("NFKC", s or "").strip())


def food_keys(items: list[dict]) -> set[str]:
    out: set[str] = set()
    for row in items:
        name = norm(row.get("food") or "")
        if name:
            out.add(name)
    return out


def strip_negated_phrases(text: str) -> str:
    parts = re.split(r"[،.]", text)
    kept: list[str] = []
    for part in parts:
        p = part.strip()
        if not p:
            continue
        if re.search(r"نخوردم|نخورد|نخورده|نداشتم|ندارم", p):
            if "فقط" in p:
                kept.append(p.split("فقط", 1)[-1])
            continue
        if "اشتباه بود" in p or "منظورم" in p:
            continue
        if p.startswith("اول گفتم") or p.startswith("اول خواستم"):
            continue
        kept.append(p)
    return "، ".join(kept) if kept else text


def expected_from_reference(text: str, db: FoodDB) -> dict[str, Any]:
    cleaned = strip_negated_phrases(text)
    result = extract(cleaned, db)
    return {
        "foods": sorted(food_keys(result["items"])),
        "items": result["items"],
    }


def match_food(expected: str, predicted_names: set[str]) -> bool:
    exp = norm(expected)
    if not exp:
        return False
    for got in predicted_names:
        g = norm(got)
        if exp == g or exp in g or g in exp:
            return True
        if set(exp.split()) & set(g.split()):
            return True
    return False


def strict_match_food(expected: str, predicted_names: set[str]) -> bool:
    exp = norm(expected)
    for got in predicted_names:
        g = norm(got)
        if exp == g or exp in g or g in exp:
            return True
    return False


def food_scores(expected: list[str], predicted: list[str]) -> dict[str, Any]:
    pred_set = set(predicted)
    if not expected:
        recall = 1.0 if not pred_set else 0.0
        precision = 1.0 if not pred_set else 0.0
        misses: list[str] = []
        extras = list(pred_set)
    else:
        hits = [e for e in expected if match_food(e, pred_set)]
        misses = [e for e in expected if e not in hits]
        extras = [p for p in predicted if not any(match_food(p, {e}) for e in expected)]
        recall = len(hits) / len(expected)
        precision = len(hits) / len(predicted) if predicted else (1.0 if not expected else 0.0)
    f1 = (2 * recall * precision / (recall + precision)) if (recall + precision) > 0 else 0.0
    clip_ok = recall >= 1.0 and len(extras) == 0
    return {
        "food_recall": round(recall, 3),
        "food_precision": round(precision, 3),
        "food_f1": round(f1, 3),
        "clip_complete": clip_ok,
        "missed_foods": misses,
        "extra_foods": extras,
    }


def scan_numbers(text: str) -> list[float]:
    tokens = tokenize(correct_asr_text(text))
    out: list[float] = []
    i = 0
    while i < len(tokens):
        parsed = numbers.parse_number_at(tokens, i)
        if parsed is None:
            i += 1
            continue
        val, i = parsed
        out.append(float(val))
    return out


def scan_units(text: str) -> list[str]:
    tokens = tokenize(correct_asr_text(text))
    out: list[str] = []
    i = 0
    while i < len(tokens):
        found = units.find_unit(tokens, i)
        if found is None:
            i += 1
            continue
        key, i = found
        out.append(key)
    return out


def extracted_quantities(items: list[dict]) -> list[float]:
    out: list[float] = []
    for row in items:
        q = row.get("quantity")
        if q is not None:
            out.append(float(q))
    return out


def extracted_units(items: list[dict]) -> list[str]:
    out: list[str] = []
    for row in items:
        u = norm(row.get("unit") or "")
        if u:
            out.append(u)
    return out


def _match_float(target: float, pool: list[float], tol: float = 0.01) -> bool:
    for v in pool:
        if abs(v - target) <= tol or abs(v - target) <= max(1.0, target * 0.05):
            return True
    return False


def numbers_recall(reference: str, asr_text: str, items: list[dict]) -> float:
    ref_nums = scan_numbers(reference)
    if not ref_nums:
        return 1.0
    got = scan_numbers(asr_text) + extracted_quantities(items)
    hits = sum(1 for n in ref_nums if _match_float(n, got))
    return hits / len(ref_nums)


def units_recall(reference: str, items: list[dict]) -> float:
    ref_units = scan_units(reference)
    if not ref_units:
        return 1.0
    got = extracted_units(items)
    hits = sum(1 for u in ref_units if u in got)
    return hits / len(ref_units)


def word_error_rate(reference: str, hypothesis: str) -> float:
    ref = tokenize(correct_asr_text(reference))
    hyp = tokenize(correct_asr_text(hypothesis))
    if not ref:
        return 0.0
    n, m = len(ref), len(hyp)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            cost = 0 if ref[i - 1] == hyp[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[n][m] / n


def evaluate_case(reference: str, asr_text: str, extracted: dict, db: FoodDB) -> dict[str, Any]:
    gold = expected_from_reference(reference, db)
    pred_foods = sorted(food_keys(extracted["items"]))
    scores = food_scores(gold["foods"], pred_foods)
    return {
        "expected_foods": gold["foods"],
        "predicted_foods": pred_foods,
        **scores,
        "numbers_recall": round(numbers_recall(reference, asr_text, extracted["items"]), 3),
        "units_recall": round(units_recall(reference, extracted["items"]), 3),
        "wer": round(word_error_rate(reference, asr_text), 3),
        "asr_text": asr_text,
    }


def summarize_rows(rows: list[dict], model: str) -> dict[str, Any]:
    n = len(rows) or 1
    return {
        "model": model,
        "count": len(rows),
        "food_recall": round(sum(r["food_recall"] for r in rows) / n, 3),
        "food_f1": round(sum(r["food_f1"] for r in rows) / n, 3),
        "numbers_recall": round(sum(r["numbers_recall"] for r in rows) / n, 3),
        "units_recall": round(sum(r["units_recall"] for r in rows) / n, 3),
        "wer": round(sum(r["wer"] for r in rows) / n, 3),
        "clip_complete_rate": round(100 * sum(1 for r in rows if r["clip_complete"]) / n, 1),
        "clip_complete_count": sum(1 for r in rows if r["clip_complete"]),
        "avg_total_ms": round(sum(r["total_ms"] for r in rows) / n, 1),
        "avg_asr_ms": round(sum(r["asr_ms"] for r in rows) / n, 1),
    }
