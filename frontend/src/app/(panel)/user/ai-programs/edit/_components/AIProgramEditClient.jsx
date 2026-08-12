"use client";

import { PencilLineIcon } from "lucide-react";
import PageHeader from "../../../_components/ui/PageHeader";
import PanelEmptyState from "../../../_components/ui/PanelEmptyState";

/**
 * Dedicated entry point for "ویرایش برنامه با AI" — pick a saved program and
 * ask AI to suggest edits to it. Placeholder until the edit flow is built.
 */
export default function AIProgramEditClient() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="ویرایش برنامه با هوش مصنوعی"
        description="یکی از برنامه‌های ذخیره‌شدهٔ خود را انتخاب کنید تا هوش مصنوعی پیشنهاد ویرایش بدهد."
      />
      <PanelEmptyState
        icon={PencilLineIcon}
        title="انتخاب برنامه برای ویرایش با AI به‌زودی اینجا قرار می‌گیرد"
        description="این بخش هنوز تکمیل نشده. فعلاً می‌توانید برنامه‌های ذخیره‌شدهٔ خود را از «برنامه‌های من» مرور کنید."
        actionHref="/user/my-programs"
        actionLabel="بازگشت به برنامه‌های من"
      />
    </div>
  );
}
