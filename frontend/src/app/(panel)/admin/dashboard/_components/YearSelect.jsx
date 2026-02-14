// app/admin/dashboard/_components/YearSelect.jsx
"use client";

import { FiCalendar } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function YearSelect({ years, value, onChange }) {
  return (
    <div className="absolute right-3 top-3 z-20">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-200 shadow">
        <FiCalendar className="text-[16px] text-emerald-200" />

        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "cursor-pointer bg-transparent text-zinc-100 outline-none",
            "text-xs font-bold"
          )}
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-zinc-950">
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
