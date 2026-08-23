"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function formatRelative(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Polls GET /me/notifications (the first notification list built for
// students — previously only a coach-side "recent notifications" card and a
// settings toggle existed). Clicking an item marks it read and, if it has an
// actionPath (e.g. from a check-in reminder), navigates there.
export default function UserNotificationBell({ className }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/me/notifications", { params: { limit: 10 } });
      setItems(res.data?.items || []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function handleClick(item) {
    setOpen(false);
    if (!item.isRead) {
      try {
        await api.patch(`/me/notifications/${item.id}/read`);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      } catch {
        // non-blocking — navigation still proceeds
      }
    }
    if (item.actionPath) {
      router.push(item.actionPath);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(className, "relative")}
          aria-label="اعلان‌ها"
          title="اعلان‌ها"
        >
          <Bell className="size-4 shrink-0" />
          {unreadCount > 0 ? (
            <Badge className="absolute -top-1 -end-1 flex size-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px]">
              {unreadCount > 9 ? "۹+" : unreadCount.toLocaleString("fa-IR")}
            </Badge>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" dir="rtl">
        <DropdownMenuLabel>اعلان‌ها</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">اعلانی وجود ندارد</p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                "flex flex-col items-start gap-0.5 whitespace-normal py-2",
                !n.isRead && "bg-primary/5"
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-xs font-medium">{n.title}</span>
                {!n.isRead ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
              </span>
              {n.message ? (
                <span className="text-[11px] text-muted-foreground">{n.message}</span>
              ) : null}
              <span className="text-[10px] text-muted-foreground">{formatRelative(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
