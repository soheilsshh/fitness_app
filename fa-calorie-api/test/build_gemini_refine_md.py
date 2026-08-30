"""Build gemini_refine_50.md from the live Gemini JSON (model answers + scorecard)."""

from __future__ import annotations

import json
from pathlib import Path

TEST_DIR = Path(__file__).resolve().parent
SRC = TEST_DIR / "gemini_refine_50.json"
OUT = TEST_DIR / "gemini_refine_50.md"

# Manual audit of every committed drop against the v8 allowlist.
DROP_AUDIT = {
    3: ("ok", "wrong-match", "spoken «سیب» در بافت «سیب زمینی داخل خورشت» بود."),
    10: ("incorrect", "keep-required", "تکرار فیله مرغ دلیل drop نیست."),
    20: ("ok", "wrong-match", "همان «وی» با کاندیدای پروتئین وی جایگزین شد؛ کراتین unmatched ماند."),
    30: ("ok", "wrong-match", "«کم نمک» صفت دوغ است نه خوردن نمک."),
    37: ("ok", "correction", "ماکارونی صریحاً با لازانیا جایگزین شد."),
    46: ("incorrect", "keep-required", "سالاد و مرغ در متن هستند؛ «شب» unmatched دلیل drop نیست."),
    49: ("incorrect", "keep-required", "«شب مرغ» در متن است؛ خورشت unmatched دلیل حذف مرغ نیست."),
}


def foods(rows: list | None) -> str:
    names = [str(i.get("food") or "—") for i in rows or []]
    return "، ".join(names) if names else "—"


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    meta = data["meta"]
    results = data["results"]

    incorrect = sum(1 for v in DROP_AUDIT.values() if v[0] == "incorrect")
    leak = int(meta.get("nutrition_leak_clips") or 0)
    fake = int(meta.get("rejected_id_clips") or 0)
    hall = 0
    for r in results:
        known = {i.get("food_id") for i in (r.get("items_before") or []) + (r.get("candidates") or [])}
        for it in r.get("items_after") or []:
            fid = it.get("food_id")
            if fid and fid not in known:
                hall += 1

    lines = [
        "# گزارش لایه Gemini — ۵۰ ویس (nutrition-v8)",
        "",
        "ورودی: متن ASR گزارش کالری ۵۰ ویس → `extract()` لایه ۸ → داور JSON در Go.",
        "Whisper دوباره اجرا نشد. Extractor تغییر نکرد.",
        "",
        f"- **تاریخ:** {meta.get('generated_at')}",
        f"- **پرامپت:** `{meta.get('prompt')}`",
        f"- **مدل:** gemini-2.5-flash (GapGPT)",
        f"- **فراخوانی:** {meta.get('gemini_called')} / رد تمیز: {meta.get('gemini_skipped')} / خطا: {meta.get('error_count')}",
        "",
        "## Scorecard",
        "",
        "| Metric | Count |",
        "|--------|------:|",
        f"| Food hallucination | {hall} |",
        f"| Fake food_id | {fake} |",
        f"| Kcal leakage | {leak} |",
        f"| Incorrect committed drop | {incorrect} |",
        "| Negation errors | 0 |",
        "| Correction errors | 0 |",
        "",
        "تعریف hallucination: آیتم در `items_after` که `food_id` آن در items/candidates لایه ۸ نبود.",
        "Fake food_id: `choose_food_ids` خارج از JSON ورودی (apply رد می‌کند).",
        "Kcal leakage: کلید kcal/grams/macros در JSON خام مدل.",
        "Incorrect drop: drop خارج از سه قانون (نفی همان آیتم / اصلاح همان آیتم / match غلط).",
        "Negation: «قند نخوردم»، «بدون سس»، «سس نداشتم»، «سوخاری نخوردم» — غذای نفی‌شده committed نبود؛ چای/سالاد/همبرگر حذف نشدند.",
        "Correction: کلیپ ۳۷ (ماکارونی→لازانیا) درست drop شد. کلیپ ۹ (ماکارونی با گوشت چرخ‌کرده) هر دو KEEP شدند.",
        "",
        "## Drop audit",
        "",
        "| # | نتیجه | قانون | توضیح |",
        "|---|--------|--------|--------|",
    ]
    for cid in sorted(DROP_AUDIT):
        status, rule, why = DROP_AUDIT[cid]
        mark = "OK" if status == "ok" else "INCORRECT"
        lines.append(f"| {cid:02d} | {mark} | {rule} | {why} |")

    lines.extend(
        [
            "",
            "---",
            "",
            "## جواب مدل برای هر کلیپ",
            "",
        ]
    )

    for r in results:
        rid = int(r["id"])
        lines.append(f"## #{rid:02d} — {r.get('file')} ({r.get('category')})")
        lines.append("")
        lines.append(f"**مرجع:** {r.get('reference_text') or '—'}")
        lines.append("")
        lines.append(f"**ASR / raw_text:** {r.get('raw_text') or '—'}")
        lines.append("")
        if r.get("skipped"):
            lines.append("Gemini **صدا نشد** (لاگ committed تمیز).")
            lines.append("")
            lines.append(f"**items:** {foods(r.get('items_before'))}")
            lines.append("")
            lines.append("---")
            lines.append("")
            continue

        lines.append(f"**items قبل:** {foods(r.get('items_before'))}")
        lines.append("")
        lines.append(f"**candidates:** {foods(r.get('candidates'))}")
        lines.append("")
        unmatched = r.get("unmatched") or []
        lines.append(f"**unmatched:** {', '.join(unmatched) if unmatched else '—'}")
        lines.append("")
        lines.append(f"**items بعد از apply:** {foods(r.get('items_after'))}")
        lines.append("")
        qs = r.get("questions") or []
        if qs:
            lines.append("**questions:**")
            for q in qs:
                lines.append(f"- {q}")
            lines.append("")
        if r.get("notes"):
            lines.append(f"**notes:** {r['notes']}")
            lines.append("")
        if rid in DROP_AUDIT:
            status, rule, why = DROP_AUDIT[rid]
            lines.append(f"**drop audit:** {status} / {rule} — {why}")
            lines.append("")
        refine = r.get("refine")
        if refine is not None:
            lines.append("**JSON مدل:**")
            lines.append("")
            lines.append("```json")
            lines.append(json.dumps(refine, ensure_ascii=False, indent=2))
            lines.append("```")
            lines.append("")
        leak = r.get("nutrition_leak") or []
        rejected = r.get("rejected_choose_ids") or []
        lines.append(
            f"_leak={leak or '[]'}  rejected_ids={rejected or '[]'}  "
            f"latency={r.get('latency_ms')}ms  tokens={r.get('prompt_tokens')}+{r.get('completion_tokens')}_"
        )
        lines.append("")
        lines.append("---")
        lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
