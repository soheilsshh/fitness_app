import { lazyPage } from "@/lib/lazy-page";

const WeeklyPlanClient = lazyPage(() => import("./_components/WeeklyPlanClient"));

export default function AINutritionWeeklyPage() {
  return <WeeklyPlanClient />;
}
