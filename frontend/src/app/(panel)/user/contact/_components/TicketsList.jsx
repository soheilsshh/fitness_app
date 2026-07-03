"use client";

import RowActions from "@/app/(panel)/_shared/RowActions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function faDate(d) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return "";
  }
}

function statusLabel(status) {
  switch (status) {
    case "pending":
      return { label: "در حال بررسی", variant: "secondary" };
    case "in_review":
      return { label: "در حال بررسی", variant: "secondary" };
    case "answered":
      return { label: "پاسخ داده شده", variant: "default" };
    case "closed":
      return { label: "بسته شده", variant: "outline" };
    default:
      return { label: status || "نامشخص", variant: "outline" };
  }
}

function priorityLabel(priority) {
  switch (priority) {
    case "low":
      return { label: "کم", variant: "outline" };
    case "high":
      return { label: "بالا", variant: "destructive" };
    default:
      return { label: "معمولی", variant: "secondary" };
  }
}

export default function TicketsList({ loading, error, items }) {
  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        تیکتی برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>عنوان</TableHead>
          <TableHead>تاریخ</TableHead>
          <TableHead>وضعیت</TableHead>
          <TableHead>اولویت</TableHead>
          <TableHead className="text-end">عملیات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((t) => {
          const st = statusLabel(t.status);
          const pr = priorityLabel(t.priority);
          return (
            <TableRow key={t.id}>
              <TableCell className="max-w-xs">
                <span className="block truncate text-sm font-medium">{t.title}</span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {faDate(t.createdAt)}
              </TableCell>
              <TableCell>
                <Badge variant={st.variant}>{st.label}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={pr.variant}>{pr.label}</Badge>
              </TableCell>
              <TableCell className="text-end">
                <RowActions viewHref={`/user/contact/detail?id=${encodeURIComponent(t.id)}`} viewLabel="جزئیات" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
