"use client";

import { FiSave } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function SaveBar({ saving, onSave }) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200",
        saving ? "pointer-events-none opacity-60" : ""
      )}
    >
      <FiSave />
      {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
    </button>
  );
}
