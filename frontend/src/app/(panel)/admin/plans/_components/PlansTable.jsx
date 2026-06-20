"use client";

import RowActions from "@/app/(panel)/_shared/RowActions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatNumber(v) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(v) || 0);
  } catch {
    return String(v ?? 0);
  }
}

/**
 * Shared plans table for the admin (read-only) and coach (manageable) panels.
 * Pass `onDelete(id)` only where deletion is supported (coach) — it enables the
 * حذف action in the row's عملیات menu.
 */
export default function PlansTable({ items, basePath = "/admin/plans", onDelete }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>عنوان</TableHead>
          <TableHead>دوره / مربی</TableHead>
          <TableHead>قیمت</TableHead>
          <TableHead>وضعیت</TableHead>
          <TableHead className="text-end">عملیات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((plan) => {
          const price = Number(plan.price || 0);
          const discountPrice = Number(plan.discountPrice || 0);
          const hasDiscount =
            Number(plan.discountPercent || 0) > 0 || discountPrice > 0;
          const finalPrice = discountPrice > 0 ? discountPrice : price;

          return (
            <TableRow key={plan.id}>
              <TableCell className="max-w-xs">
                <p className="text-sm font-semibold">{plan.title || "—"}</p>
                {plan.subtitle ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {plan.subtitle}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <p className="text-sm">{plan.courseName || "—"}</p>
                {plan.coachName ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    مربی: {plan.coachName}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <p className="text-sm font-semibold tabular-nums">
                  {formatNumber(finalPrice)}
                </p>
                {hasDiscount && price > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground line-through tabular-nums">
                    {formatNumber(price)}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  {plan.isPopular ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    >
                      محبوب
                    </Badge>
                  ) : null}
                  <Badge
                    variant="outline"
                    className={
                      hasDiscount
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : undefined
                    }
                  >
                    {hasDiscount ? "تخفیف‌دار" : "عادی"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-end">
                <RowActions
                  viewHref={`${basePath}/${plan.id}`}
                  onDelete={onDelete ? () => onDelete(plan.id) : undefined}
                  deleteTitle="حذف پلن"
                  deleteDescription={`آیا از حذف پلن «${plan.title || ""}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
