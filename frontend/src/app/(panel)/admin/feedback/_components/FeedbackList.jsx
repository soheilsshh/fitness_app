"use client";

import { FiMail, FiPhone, FiUser } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

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

      <CardContent className="divide-y">
        {items.length === 0 ? (
          <div className="py-5 text-sm text-muted-foreground">پیامی وجود ندارد.</div>
        ) : (
          items.map((x) => (
            <Button
              key={x.id}
              type="button"
              variant="ghost"
              onClick={() => onSelect?.(x.id)}
              className={cn(
                "block h-auto w-full justify-start whitespace-normal rounded-none px-0 py-4 text-right"
              )}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-3 py-1 text-xs">
                      <FiUser />
                      {x.fullName}
                    </span>

                    {x.phone ? (
                      <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-3 py-1 text-xs">
                        <FiPhone />
                        {x.phone}
                      </span>
                    ) : null}

                    {x.email ? (
                      <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-3 py-1 text-xs">
                        <FiMail />
                        <span className="max-w-[220px] truncate">{x.email}</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 line-clamp-2 text-sm text-foreground">
                    {x.message}
                  </div>
                </div>

                <div className="shrink-0 text-xs text-muted-foreground">
                  {formatDateFa(x.createdAt)}
                </div>
              </div>
            </Button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
