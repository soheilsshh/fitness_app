"use client";

export default function FilterChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
        active
          ? "bg-white text-zinc-950"
          : "border border-white/10 bg-zinc-950/30 text-zinc-200 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
