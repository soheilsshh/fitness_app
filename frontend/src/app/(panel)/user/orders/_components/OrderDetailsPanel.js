"use client";

import { CreditCard, Hash, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function SummaryRow({ label, value, strong, muted }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={muted ? "text-muted-foreground/70" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}

export default function OrderDetailsPanel({ order }) {
  const meta = statusMeta(order.status);
  const { subtotal, discount, total } = calcTotals(
    order.items,
    order.discountPercent
  );

  return (
    <Card
      className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card"
      dir="rtl"
    >
      <CardHeader>
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

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CreditCard className="size-3.5" />
            {order.paymentMethod}
          </span>
          <span>
            کد پیگیری:{" "}
            <span className="font-medium text-foreground">{order.trackingCode}</span>
          </span>
        </div>

        {order.note ? (
          <Card size="sm" className="mt-3">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">یادداشت</p>
              <p className="mt-1 text-sm">{order.note}</p>
            </CardContent>
          </Card>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(240px,320px)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">آیتم‌های سفارش</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead className="text-center">تعداد</TableHead>
                    <TableHead className="text-end">مبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.refId}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.type === "program" ? "برنامه" : "افزونه"}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {Number(item.qty || 1).toLocaleString("fa-IR")}
                      </TableCell>
                      <TableCell className="text-end font-medium tabular-nums">
                        {formatToman(
                          (Number(item.price) || 0) * (Number(item.qty) || 1)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {order.discountPercent ? (
                <Badge variant="outline" className="mt-4 gap-1.5">
                  <Tag className="size-3" />
                  تخفیف اعمال شده:{" "}
                  <span className="font-semibold tabular-nums">
                    {Number(order.discountPercent).toLocaleString("fa-IR")}%
                  </span>
                </Badge>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="size-4 text-primary" />
                خلاصه پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <SummaryRow label="جمع جزء" value={formatToman(subtotal)} />
              <SummaryRow
                label="تخفیف"
                value={
                  order.discountPercent
                    ? `(${Number(order.discountPercent).toLocaleString("fa-IR")}%) ${formatToman(discount)}`
                    : formatToman(0)
                }
                muted={!order.discountPercent}
              />
              <Separator />
              <SummaryRow label="مبلغ نهایی" value={formatToman(total)} strong />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
