import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const NutritionEditorClient = lazyPage(
  () => import("./_components/NutritionEditorClient"),
);

export default function NutritionEditorPage() {
  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-lg font-semibold tracking-tight">
        ویرایشگر برنامه غذایی
      </h1>
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">
            در حال بارگذاری...
          </div>
        }
      >
        <NutritionEditorClient />
      </Suspense>
    </div>
  );
}
