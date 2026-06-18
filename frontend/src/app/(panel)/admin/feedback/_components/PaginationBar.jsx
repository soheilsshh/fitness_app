"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
}

export default function PaginationBar({ page, totalPages, onPrev, onNext }) {
  return (
    <div dir="rtl" className="flex items-center justify-between gap-3">
      <div className="text-xs text-muted-foreground">
        صفحه <span className="font-bold text-foreground">{faNum(page)}</span> از{" "}
        <span className="font-bold text-foreground">{faNum(totalPages)}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onPrev}
          type="button"
          variant="outline"
          disabled={page <= 1}
        >
          <FiChevronRight />
          قبلی
        </Button>

        <Button
          onClick={onNext}
          type="button"
          variant="outline"
          disabled={page >= totalPages}
        >
          بعدی
          <FiChevronLeft />
        </Button>
      </div>
    </div>
  );
}
