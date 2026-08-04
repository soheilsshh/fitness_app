import { lazyPage } from "@/lib/lazy-page";

const NutritionTemplatesClient = lazyPage(() =>
  import("./_components/NutritionTemplatesClient"),
);

export default function AdminNutritionTemplatesPage() {
  return <NutritionTemplatesClient />;
}
