import { lazyPage } from "@/lib/lazy-page";

const DailyPlanClient = lazyPage(() => import("./_components/DailyPlanClient"));

export default function AINutritionDailyPage() {
  return <DailyPlanClient />;
}
