"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { GraduationCap, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminAcademy,
  getAdminFaq,
  updateAdminAcademy,
  updateAdminFaq,
} from "@/lib/api/content";
import AcademyEditor from "./AcademyEditor";
import FaqEditor from "./FaqEditor";
import SaveBar from "../../site/_components/SaveBar";

export default function ContentAdminClient() {
  const [tab, setTab] = useState("academy");
  const [academyItems, setAcademyItems] = useState([]);
  const [faqGroups, setFaqGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [academyRes, faqRes] = await Promise.all([
        getAdminAcademy(),
        getAdminFaq(),
      ]);
      setAcademyItems(academyRes?.items || []);
      setFaqGroups(faqRes?.groups || []);
    } catch {
      setAcademyItems([]);
      setFaqGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    try {
      setSaving(true);
      if (tab === "academy") {
        const res = await updateAdminAcademy(academyItems);
        setAcademyItems(res?.items || []);
      } else {
        const res = await updateAdminFaq(faqGroups);
        setFaqGroups(res?.groups || []);
      }
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
        text: "ذخیره انجام نشد.",
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
      <div className="space-y-4" dir="rtl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-iranianSansBlack text-2xl">مدیریت محتوا</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            آموزش‌های پنل کاربر و سوالات متداول را از اینجا مدیریت کنید.
          </p>
        </div>
        <SaveBar saving={saving} onSave={onSave} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-12 w-full max-w-md grid-cols-2">
          <TabsTrigger value="academy" className="gap-2">
            <GraduationCap className="size-4" />
            آموزش
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle className="size-4" />
            سوالات متداول
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academy" className="mt-6">
          <AcademyEditor value={academyItems} onChange={setAcademyItems} />
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <FaqEditor value={faqGroups} onChange={setFaqGroups} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
