import { lazyPage } from "@/lib/lazy-page";

const CoachDashboardClient = lazyPage(() => import("./_components/CoachDashboardClient"));

export default function CoachDashboardPage() {
  return <CoachDashboardClient />;
}
