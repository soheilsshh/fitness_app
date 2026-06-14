"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiChevronDown, FiTool } from "react-icons/fi";

const TOOL_LINKS = [
  { href: "/coach/tools/calorie-calculator", label: "محاسبه‌گر کالری" },
  { href: "/coach/tools/bmi-calculator", label: "محاسبه‌گر BMI" },
];

export default function CoachToolsNav({ collapsed, onNavigate }) {
  const pathname = usePathname();
  const inTools = pathname?.startsWith("/coach/tools");
  const [open, setOpen] = useState(inTools);

  useEffect(() => {
    if (inTools) setOpen(true);
  }, [inTools]);

  if (collapsed) {
    const active = inTools;
    return (
      <Link
        href="/coach/tools/calorie-calculator"
        onClick={onNavigate}
        title="ابزارها"
        className={[
          "group flex items-center justify-center rounded-2xl py-1.5 text-sm transition",
          active
            ? "bg-white text-zinc-950"
            : "text-zinc-200 hover:bg-white/5 hover:text-white",
        ].join(" ")}
      >
        <span
          className={[
            "inline-flex h-11 w-11 items-center justify-center rounded-xl border transition",
            active
              ? "border-white/0 bg-zinc-950/10"
              : "border-white/10 bg-white/5 group-hover:bg-white/10",
          ].join(" ")}
        >
          <FiTool className="text-[22px]" />
        </span>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex w-full items-center gap-3 rounded-2xl px-3 py-1.5 text-sm transition",
          inTools
            ? "bg-white/10 text-white"
            : "text-zinc-200 hover:bg-white/5 hover:text-white",
        ].join(" ")}
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <FiTool className="text-[20px]" />
        </span>
        <span className="flex-1 truncate text-right font-bold">ابزارها</span>
        <FiChevronDown
          className={[
            "text-zinc-400 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div className="mr-3 space-y-1 border-r border-white/10 pr-2">
          {TOOL_LINKS.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={[
                  "block rounded-xl px-3 py-2 text-[13px] font-bold transition",
                  active
                    ? "bg-emerald-400/15 text-emerald-100"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
