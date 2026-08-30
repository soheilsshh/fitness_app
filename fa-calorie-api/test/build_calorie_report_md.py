"""Build calorie_report_50.md from calorie_report_50.json."""

from __future__ import annotations

import json
from pathlib import Path

TEST_DIR = Path(__file__).resolve().parent
SRC = TEST_DIR / "calorie_report_50.json"
OUT = TEST_DIR / "calorie_report_50.md"


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    meta = data["meta"]
    lines = [
        "# گزارش کالری ۵۰ ویس (پس از P0–P2 + مکمل‌ها)",
        "",
        f"- **تاریخ:** {meta['generated_at']}",
        f"- **ASR:** {meta['asr_model']}",
        f"- **دیتابیس:** {meta['food_db']} + supplements CSV",
        f"- **موفق:** {meta['success_count']}/{meta['clip_count']}",
        f"- **جمع کالری همه کلیپ‌ها:** {meta['total_kcal_all_clips']} kcal",
        f"- **میانگین (کلیپ‌های با kcal):** {meta['avg_kcal_per_clip']} kcal",
        f"- **میانگین زمان:** {meta['avg_response_ms']} ms",
    ]
    if meta.get("asr_note"):
        lines.append(f"- **یادداشت ASR:** {meta['asr_note']}")
    lines.extend(
        [
        "",
        "---",
        "",
        ]
    )
    for r in data["results"]:
        lines.append(f"## #{r['id']:02d} — {r['file']} ({r['category']})")
        lines.append("")
        lines.append(f"**متن مرجع:** {r['reference_text']}")
        lines.append("")
        lines.append(f"**ASR:** {r['asr_text']}")
        lines.append("")
        lines.append(f"**وعده:** {r.get('meal') or '—'}")
        lines.append("")
        lines.append(f"**جمع کالری:** {r['total_kcal']} kcal")
        lines.append("")
        if r["items"]:
            lines.append("| غذا | گفته‌شده | مقدار | واحد | گرم | kcal | پروتئین |")
            lines.append("|-----|----------|-------|------|-----|------|---------|")
            for it in r["items"]:
                q = it.get("quantity") if it.get("quantity") is not None else "—"
                u = it.get("unit") or "—"
                g = it.get("grams") if it.get("grams") is not None else "—"
                k = it.get("kcal") if it.get("kcal") is not None else "—"
                p = it.get("protein_g") if it.get("protein_g") is not None else "—"
                lines.append(
                    f"| {it.get('food', '')} | {it.get('spoken', '')} | {q} | {u} | {g} | {k} | {p} |"
                )
            lines.append("")
        else:
            lines.append("_غذای commit‌شده‌ای ثبت نشد._")
            lines.append("")
        if r.get("unmatched"):
            lines.append(f"**تشخیص‌نداده:** {', '.join(r['unmatched'])}")
            lines.append("")
        lines.append(
            f"_زمان: ASR {r['asr_ms']}ms + extract {r['extract_ms']}ms = {r['total_ms']}ms_"
        )
        lines.append("")
        lines.append("---")
        lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
