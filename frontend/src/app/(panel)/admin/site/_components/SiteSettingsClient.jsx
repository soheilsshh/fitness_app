"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "@/lib/axios/client";
import ImageUploader from "./ImageUploader";
import FeatureBulletsEditor from "./FeatureBulletsEditor";
import StatsEditor from "./StatsEditor";
import StepsEditor from "./StepsEditor";
import SaveBar from "./SaveBar";
import ContactInfoEditor from "./ContactInfoEditor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SiteSettingsClient() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/admin/site-settings");
        if (!cancelled) setSettings(res.data);
      } catch {
        if (!cancelled) setSettings(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      let payload = { ...settings };

      if (settings.heroImage?.file) {
        const form = new FormData();
        form.append("file", settings.heroImage.file);
        const uploadRes = await api.post("/admin/site-settings/hero-image", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        payload = {
          ...payload,
          heroImage: { url: uploadRes.data?.url || "" },
        };
      }

      const res = await api.put("/admin/site-settings", payload);
      setSettings(res.data);
      await Swal.fire({
        icon: "success",
        title: "ذخیره شد",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "خطا",
        text: "ذخیره تنظیمات انجام نشد.",
        confirmButtonText: "باشه",
        background: "#0a0a0a",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card dir="rtl">
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card dir="rtl">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          بارگذاری تنظیمات سایت ناموفق بود.
        </CardContent>
      </Card>
    );
  }

  return (
    <div dir="rtl" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-end justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>سایت</CardTitle>
            <CardDescription>تنظیمات بخش‌های صفحه اصلی را مدیریت کنید</CardDescription>
          </div>
        <SaveBar saving={saving} onSave={onSave} />
        </CardHeader>
      </Card>

      <ImageUploader
        value={settings.heroImage}
        onChange={(heroImage) => setSettings((p) => ({ ...p, heroImage }))}
      />

      <FeatureBulletsEditor
        value={settings.featureBullets}
        onChange={(featureBullets) => setSettings((p) => ({ ...p, featureBullets }))}
      />

      <StatsEditor
        value={settings.stats}
        onChange={(stats) => setSettings((p) => ({ ...p, stats }))}
      />

      <StepsEditor
        value={settings.steps}
        onChange={(steps) => setSettings((p) => ({ ...p, steps }))}
      />

      <ContactInfoEditor
        value={settings.contactInfo}
        onChange={(contactInfo) => setSettings((p) => ({ ...p, contactInfo }))}
      />
    </div>
  );
}
