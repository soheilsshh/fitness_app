"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatFaNumber(value) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
  } catch {
    return String(value ?? 0);
  }
}

function SectionCardSkeleton() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-24" />
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5">
        <Skeleton className="h-3 w-20" />
      </CardFooter>
    </Card>
  );
}

export function SectionCards({ items = [], loading = false, className }) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5 dark:*:data-[slot=card]:bg-card",
          className
        )}
      >
        {Array.from({ length: items.length || 5 }).map((_, index) => (
          <SectionCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-5 dark:*:data-[slot=card]:bg-card",
        className
      )}
      dir="rtl"
    >
      {items.map((item) => (
        <Card key={item.title} className="@container/card">
          <CardHeader>
            <CardDescription className="text-start">{item.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {item.displayValue ?? formatFaNumber(item.value)}
            </CardTitle>
            {item.badge ? (
              <Badge variant="outline" className="w-fit">
                {item.badge}
              </Badge>
            ) : null}
          </CardHeader>
          {item.hint ? (
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="text-muted-foreground">{item.hint}</div>
            </CardFooter>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
