"use client";

export default function OrdersFilterChips({ value, onChange }) {
  const items = [
    { key: "all", label: "همه" },
    { key: "paid", label: "موفق" },
    { key: "pending", label: "در انتظار" },
    { key: "failed", label: "ناموفق" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((x) => {
        const active = value === x.key;
        return (
          <button
            key={x.key}
            onClick={() => onChange(x.key)}
            className={[
              "rounded-full border px-4 py-2 text-sm font-bold transition",
              active
                ? "border-white/0 bg-white text-zinc-950"
                : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
            ].join(" ")}
          >
            {x.label}
          </button>
        );
      })}
    </div>
  );
}
