import { lazyPage } from "@/lib/lazy-page";

const SingleMealClient = lazyPage(() => import("./_components/SingleMealClient"));

export default function AINutritionSinglePage() {
  return <SingleMealClient />;
}
