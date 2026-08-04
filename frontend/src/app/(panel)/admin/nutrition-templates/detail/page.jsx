import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const NutritionTemplateEditorClient = lazyPage(() =>
  import("./_components/NutritionTemplateEditorClient"),
);

export default function AdminNutritionTemplateDetailPage() {
  return (
    <Suspense fallback={null}>
      <NutritionTemplateEditorClient mode="edit" />
    </Suspense>
  );
}
