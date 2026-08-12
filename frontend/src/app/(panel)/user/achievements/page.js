import { lazyPage } from "@/lib/lazy-page";

const AchievementsClient = lazyPage(() => import("./_components/AchievementsClient"));

export default function AchievementsPage() {
  return <AchievementsClient />;
}
