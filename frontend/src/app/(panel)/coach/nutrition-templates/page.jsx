import { lazyPage } from "@/lib/lazy-page";

const CoachNutritionTemplatesClient = lazyPage(() =>
  import("./_components/CoachNutritionTemplatesClient"),
);

export default function CoachNutritionTemplatesPage() {
  return <CoachNutritionTemplatesClient />;
}
