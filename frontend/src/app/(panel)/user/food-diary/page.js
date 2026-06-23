import { lazyPage } from "@/lib/lazy-page";

const FoodDiaryClient = lazyPage(() => import("./_components/FoodDiaryClient"));

export default function FoodDiaryPage() {
  return <FoodDiaryClient />;
}
