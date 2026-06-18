"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/axios/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const PRIORITIES = [
  { value: "low", label: "کم" },
  { value: "normal", label: "معمولی" },
  { value: "high", label: "بالا" },
];

export default function TicketCreateForm({ disabled, assignedCoachName, onCreated }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const helper = useMemo(() => {
    if (disabled) return "برای ثبت تیکت، باید مربی به شما تخصیص داده شده باشد.";
    if (assignedCoachName) return `تیکت برای مربی: ${assignedCoachName}`;
    return "تیکت شما برای مربی تخصیص‌داده‌شده ارسال می‌شود.";
  }, [disabled, assignedCoachName]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.post("/me/tickets", { title, priority, message });
      setTitle("");
      setPriority("normal");
      setMessage("");
      setSuccess("تیکت شما ثبت شد.");
      onCreated?.(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "ثبت تیکت ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ثبت تیکت جدید</CardTitle>
        <CardDescription className="text-start">{helper}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {success}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ticket-title">عنوان</Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: سوال درباره برنامه تمرینی"
              disabled={disabled || loading}
              required
              className="text-start"
            />
          </div>

          <div className="space-y-2">
            <Label>اولویت</Label>
            <Select value={priority} onValueChange={setPriority} disabled={disabled || loading}>
              <SelectTrigger className="text-start">
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              پیشنهاد: برای موارد فوری از <Badge variant="secondary">بالا</Badge> استفاده کنید.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-message">متن پیام</Label>
            <Textarea
              id="ticket-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را کامل بنویسید…"
              disabled={disabled || loading}
              required
              className="min-h-28 text-start leading-7"
            />
          </div>

          <Button type="submit" disabled={disabled || loading}>
            {loading ? "در حال ارسال..." : "ثبت تیکت"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

