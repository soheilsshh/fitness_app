import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const NutritionTemplateEditorClient = lazyPage(() =>
  import("../detail/_components/NutritionTemplateEditorClient"),
);

export default function AdminNutritionTemplateNewPage() {
  return (
    <Suspense fallback={null}>
      <NutritionTemplateEditorClient mode="new" />
    </Suspense>
  );
}
