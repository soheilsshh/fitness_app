"use client";

import { Button } from "@/components/ui/button";

export default function FilterChip({ active, children, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
