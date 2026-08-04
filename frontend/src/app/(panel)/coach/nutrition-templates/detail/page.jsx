import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const CoachNutritionTemplateDetailClient = lazyPage(() =>
  import("./_components/CoachNutritionTemplateDetailClient"),
);

export default function CoachNutritionTemplateDetailPage() {
  return (
    <Suspense fallback={null}>
      <CoachNutritionTemplateDetailClient />
    </Suspense>
  );
}
