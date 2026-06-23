import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const NutritionEditorClient = lazyPage(() => import("./_components/NutritionEditorClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function NutritionEditorPage({ params }) {
  const { id } = await params;
  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-lg font-semibold tracking-tight">ویرایشگر برنامه غذایی</h1>
      <Suspense fallback={<div className="text-sm text-muted-foreground">در حال بارگذاری...</div>}>
        <NutritionEditorClient studentId={id} />
      </Suspense>
    </div>
  );
}
