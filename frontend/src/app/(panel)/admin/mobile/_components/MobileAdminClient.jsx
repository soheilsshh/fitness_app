"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STORES = [
  { id: "myket", label: "مایکت" },
  { id: "bazaar", label: "کافه‌بازار" },
  { id: "play", label: "گوگل پلی" },
  { id: "appstore", label: "اپ استور" },
];

const EMPTY_RELEASE = {
  store: "play",
  versionName: "",
  versionCode: 1,
  releaseNotes: "",
  isPublished: false,
  downloadUrl: "",
  minOs: "",
  installsReported: 0,
};

function formatFa(n) {
  try {
    return new Intl.NumberFormat("fa-IR").format(Number(n) || 0);
  } catch {
    return String(n ?? 0);
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(iso);
  }
}

export default function MobileAdminClient() {
  const [overview, setOverview] = useState(null);
  const [devices, setDevices] = useState({ items: [], total: 0 });
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_RELEASE);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ov, rel, dev] = await Promise.all([
        api.get("/admin/mobile/overview"),
        api.get("/admin/mobile/releases"),
        api.get("/admin/mobile/devices", {
          params: {
            store: storeFilter,
            platform: platformFilter,
            page: 1,
            pageSize: 30,
          },
        }),
      ]);
      setOverview(ov.data);
      setReleases(rel.data?.items || []);
      setDevices(dev.data || { items: [], total: 0 });
    } catch (e) {
      setError(getApiErrorMessage(e, "بارگذاری گزارش موبایل ناموفق بود"));
    } finally {
      setLoading(false);
    }
  }, [storeFilter, platformFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(
    () => [
      {
        title: "کل دستگاه‌ها",
        value: overview?.totalDevices ?? 0,
        hint: "شناسه یکتا",
      },
      {
        title: "فعال ۷ روز",
        value: overview?.activeLast7Days ?? 0,
        hint: "heartbeat اخیر",
      },
      {
        title: "فعال ۳۰ روز",
        value: overview?.activeLast30Days ?? 0,
        hint: "ماه جاری",
      },
      {
        title: "کاربران متصل",
        value: overview?.linkedUsers ?? 0,
        hint: "با اکانت لاگین",
      },
    ],
    [overview],
  );

  const saveRelease = async () => {
    setSaving(true);
    try {
      const payload = {
        store: form.store,
        versionName: form.versionName.trim(),
        versionCode: Number(form.versionCode) || 1,
        releaseNotes: form.releaseNotes,
        isPublished: !!form.isPublished,
        downloadUrl: form.downloadUrl.trim(),
        minOs: form.minOs.trim(),
        installsReported: Number(form.installsReported) || 0,
      };
      if (editingId) {
        await api.patch(`/admin/mobile/releases/${editingId}`, payload);
      } else {
        await api.post("/admin/mobile/releases", payload);
      }
      setForm(EMPTY_RELEASE);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "ذخیره انتشار ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  const removeRelease = async (id) => {
    if (!window.confirm("این نسخه حذف شود؟")) return;
    try {
      await api.delete(`/admin/mobile/releases/${id}`);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "حذف ناموفق بود"));
    }
  };

  return (
    <div dir="rtl" className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl font-extrabold">گزارش اپلیکیشن موبایل</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          آمار نصب و فعالیت بر اساس فلیورهای مایکت، کافه‌بازار، گوگل پلی و اپ استور
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.title}>
            <CardHeader className="pb-2">
              <CardDescription>{k.title}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {loading ? <Skeleton className="h-8 w-16" /> : formatFa(k.value)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{k.hint}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(overview?.byStore || STORES.map((s) => ({ store: s.id, label: s.label }))).map(
          (s) => (
            <Card key={s.store}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{s.label || s.store}</CardTitle>
                  {s.isPublished ? (
                    <Badge>منتشر شده</Badge>
                  ) : (
                    <Badge variant="outline">پیش‌نویس / بدون انتشار</Badge>
                  )}
                </div>
                <CardDescription>کانال {s.store}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                <Stat label="دستگاه‌ها" value={s.devices} />
                <Stat label="نصب (کنسول)" value={s.installsReported} />
                <Stat label="آخرین نسخه" value={s.latestVersion || "—"} raw />
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">دستگاه‌ها</TabsTrigger>
          <TabsTrigger value="versions">نسخه‌ها</TabsTrigger>
          <TabsTrigger value="releases">انتشار فروشگاهی</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="فروشگاه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه فروشگاه‌ها</SelectItem>
                {STORES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="پلتفرم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه پلتفرم‌ها</SelectItem>
                <SelectItem value="android">اندروید</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={load}>
              بروزرسانی
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (devices.items || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  هنوز دستگاهی ثبت نشده. با باز شدن اپ، heartbeat ارسال می‌شود.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="px-2 py-2 text-start">فروشگاه</th>
                        <th className="px-2 py-2 text-start">پلتفرم</th>
                        <th className="px-2 py-2 text-start">نسخه</th>
                        <th className="px-2 py-2 text-start">کاربر</th>
                        <th className="px-2 py-2 text-start">آخرین بازدید</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(devices.items || []).map((d) => (
                        <tr key={d.id} className="border-b border-border/60">
                          <td className="px-2 py-2">{d.store}</td>
                          <td className="px-2 py-2">{d.platform}</td>
                          <td className="px-2 py-2">
                            {d.appVersion || "—"}
                            {d.buildNumber ? ` (${d.buildNumber})` : ""}
                          </td>
                          <td className="px-2 py-2">
                            {d.userId ? `#${d.userId}` : "مهمان"}
                          </td>
                          <td className="px-2 py-2">{formatDate(d.lastSeenAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-muted-foreground">
                    مجموع: {formatFa(devices.total)} دستگاه
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تفکیک نسخه اپ</CardTitle>
              <CardDescription>
                بر اساس آخرین heartbeat هر دستگاه
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(overview?.versions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">داده‌ای نیست.</p>
              ) : (
                <ul className="space-y-2">
                  {(overview?.versions || []).map((v, i) => (
                    <li
                      key={`${v.store}-${v.platform}-${v.appVersion}-${i}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>
                        {v.store} · {v.platform} · {v.appVersion || "نامشخص"}
                      </span>
                      <Badge variant="secondary">{formatFa(v.count)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="releases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {editingId ? "ویرایش انتشار" : "ثبت انتشار جدید"}
              </CardTitle>
              <CardDescription>
                نسخه‌های منتشرشده در فروشگاه‌ها و آمار نصب کنسول را اینجا نگه دارید
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>فروشگاه</Label>
                <Select
                  value={form.store}
                  onValueChange={(v) => setForm((p) => ({ ...p, store: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نام نسخه</Label>
                <Input
                  value={form.versionName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, versionName: e.target.value }))
                  }
                  placeholder="1.0.0"
                />
              </div>
              <div className="space-y-2">
                <Label>کد نسخه</Label>
                <Input
                  type="number"
                  value={form.versionCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, versionCode: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>نصب گزارش‌شده از کنسول</Label>
                <Input
                  type="number"
                  value={form.installsReported}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      installsReported: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>لینک دانلود / استور</Label>
                <Input
                  dir="ltr"
                  value={form.downloadUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, downloadUrl: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>حداقل OS</Label>
                <Input
                  value={form.minOs}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, minOs: e.target.value }))
                  }
                  placeholder="Android 8 / iOS 15"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant={form.isPublished ? "default" : "outline"}
                  onClick={() =>
                    setForm((p) => ({ ...p, isPublished: !p.isPublished }))
                  }
                >
                  {form.isPublished ? "منتشر شده" : "پیش‌نویس"}
                </Button>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>یادداشت انتشار</Label>
                <Textarea
                  rows={3}
                  value={form.releaseNotes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, releaseNotes: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="button" onClick={saveRelease} disabled={saving}>
                  {saving ? "در حال ذخیره..." : editingId ? "بروزرسانی" : "ثبت"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setForm(EMPTY_RELEASE);
                    }}
                  >
                    انصراف
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {releases.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {STORES.find((s) => s.id === r.store)?.label || r.store}
                      </span>
                      <Badge variant="outline">{r.versionName}</Badge>
                      <Badge variant="secondary">code {r.versionCode}</Badge>
                      {r.isPublished ? <Badge>منتشر</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      نصب کنسول: {formatFa(r.installsReported)}
                      {r.downloadUrl ? ` · ${r.downloadUrl}` : ""}
                    </p>
                    {r.releaseNotes ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {r.releaseNotes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(r.id);
                        setForm({
                          store: r.store,
                          versionName: r.versionName || "",
                          versionCode: r.versionCode || 1,
                          releaseNotes: r.releaseNotes || "",
                          isPublished: !!r.isPublished,
                          downloadUrl: r.downloadUrl || "",
                          minOs: r.minOs || "",
                          installsReported: r.installsReported || 0,
                        });
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeRelease(r.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, raw }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold tabular-nums">
        {raw ? value : formatFa(value)}
      </div>
    </div>
  );
}
