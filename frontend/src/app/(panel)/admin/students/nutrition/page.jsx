import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const NutritionEditorClient = lazyPage(
  () =>
    import(
      "@/app/(panel)/coach/students/nutrition/_components/NutritionEditorClient"
    ),
);

export default function AdminStudentNutritionPage() {
  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-lg font-semibold tracking-tight">
        ویرایشگر برنامه غذایی (ادمین)
      </h1>
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
        }
      >
        <NutritionEditorClient apiBase="admin" />
      </Suspense>
    </div>
  );
}
