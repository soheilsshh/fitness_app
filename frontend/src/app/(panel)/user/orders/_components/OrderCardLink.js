"use client";

import Link from "next/link";
import { ChevronLeft, CreditCard, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calcTotals, formatDateTimeFa, formatToman, statusMeta } from "./helpers";

function paymentStatusBadgeClass(status) {
  switch (status) {
    case "paid":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "pending":
      return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "failed":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export default function OrderCardLink({ order }) {
  const meta = statusMeta(order.status);
  const { total } = calcTotals(order.items, order.discountPercent);

  return (
    <Link
      href={`/user/orders/${encodeURIComponent(order.id)}`}
      className="group block h-full"
    >
      <Card
        className={cn(
          "h-full bg-gradient-to-t from-primary/5 to-card shadow-xs transition-colors",
          "hover:bg-muted/40 dark:bg-card"
        )}
      >
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={paymentStatusBadgeClass(order.status)}
            >
              {meta.label}
            </Badge>

            <Badge variant="outline">
              <Hash data-icon="inline-start" />
              {order.id}
            </Badge>
          </div>

          <CardDescription className="mt-2 text-start">
            {formatDateTimeFa(order.createdAt)}
          </CardDescription>

          <CardTitle className="mt-3 text-start text-base font-semibold">
            مبلغ پرداختی: {formatToman(total)}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CreditCard className="size-3.5" />
              {order.paymentMethod}
            </span>
            <span>
              کد پیگیری:{" "}
              <span className="font-medium text-foreground">
                {order.trackingCode}
              </span>
            </span>
          </div>

          <CardAction>
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg border border-border",
                "bg-muted/50 text-muted-foreground transition-colors",
                "group-hover:bg-muted group-hover:text-foreground"
              )}
            >
              <ChevronLeft className="size-4" />
            </span>
          </CardAction>
        </CardHeader>

        <CardContent className="pt-4">
          <p className="text-start text-xs text-muted-foreground">آیتم‌ها</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {order.items.slice(0, 3).map((item) => (
              <Badge key={item.refId} variant="secondary">
                {item.title}
              </Badge>
            ))}
            {order.items.length > 3 ? (
              <Badge variant="outline">
                +{(order.items.length - 3).toLocaleString("fa-IR")} مورد دیگر
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
