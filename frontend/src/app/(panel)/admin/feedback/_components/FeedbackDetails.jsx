"use client";

import { Mail, MessageSquare, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDateTimeFa(iso) {
  try {
    return new Date(iso).toLocaleString("fa-IR");
  } catch {
    return "—";
  }
}

export default function FeedbackDetails({ item }) {
  if (!item) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          یک پیام را از لیست انتخاب کنید.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>جزئیات پیام</CardTitle>
          <CardDescription>{formatDateTimeFa(item.createdAt)}</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <MessageSquare className="size-3.5" />
          پیام کامل
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoChip icon={User} label="نام و نام خانوادگی" value={item.fullName} />
          <InfoChip icon={Phone} label="شماره تماس" value={item.phone} />
          <InfoChip icon={Mail} label="ایمیل" value={item.email} />
        </div>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">متن پیام</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap break-words text-sm">{item.message}</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <Card size="sm">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </div>
        <div className="mt-2 text-sm font-semibold">{value || "—"}</div>
      </CardContent>
    </Card>
  );
}
