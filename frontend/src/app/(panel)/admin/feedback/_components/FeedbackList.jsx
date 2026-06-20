"use client";

import { FiMail, FiPhone } from "react-icons/fi";
import RowActions from "@/app/(panel)/_shared/RowActions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDateFa(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

export default function FeedbackList({ items, onSelect }) {
  return (
    <Card dir="rtl" className="overflow-hidden">
      <CardContent className="border-b bg-muted/30 py-3 text-xs text-muted-foreground">
        لیست پیام‌ها
      </CardContent>

      <CardContent className="pt-4">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            پیامی وجود ندارد.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>فرستنده</TableHead>
                <TableHead>تماس</TableHead>
                <TableHead>پیام</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead className="text-end">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="text-sm font-medium">{x.fullName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {x.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <FiPhone className="size-3" />
                          {x.phone}
                        </span>
                      ) : null}
                      {x.email ? (
                        <span className="inline-flex items-center gap-1">
                          <FiMail className="size-3" />
                          <span className="max-w-[200px] truncate">{x.email}</span>
                        </span>
                      ) : null}
                      {!x.phone && !x.email ? "—" : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="line-clamp-2 text-sm text-foreground">
                      {x.message}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateFa(x.createdAt)}
                  </TableCell>
                  <TableCell className="text-end">
                    <RowActions onView={() => onSelect?.(x.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
