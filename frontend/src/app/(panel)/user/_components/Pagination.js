"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <Card dir="rtl">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
        <p className="text-sm text-muted-foreground">
          صفحه{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {page.toLocaleString("fa-IR")}
          </span>{" "}
          از{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {totalPages.toLocaleString("fa-IR")}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => onPage(page - 1)}
          >
            <ChevronRight data-icon="inline-start" />
            قبلی
          </Button>

          <div className="flex items-center gap-1">
            {pages.map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === page ? "default" : "outline"}
                size="icon-sm"
                className={cn("tabular-nums", p === page && "pointer-events-none")}
                onClick={() => onPage(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p.toLocaleString("fa-IR")}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onPage(page + 1)}
          >
            بعدی
            <ChevronLeft data-icon="inline-end" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
