"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const FILTER_ITEMS = [
  { key: "all", label: "همه" },
  { key: "paid", label: "موفق" },
  { key: "pending", label: "در انتظار" },
  { key: "failed", label: "ناموفق" },
];

export default function OrdersFilterChips({ value, onChange }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      variant="outline"
      size="sm"
      spacing={2}
      dir="rtl"
    >
      {FILTER_ITEMS.map((item) => (
        <ToggleGroupItem
          key={item.key}
          value={item.key}
          aria-label={item.label}
          className="min-w-16 px-3"
        >
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
