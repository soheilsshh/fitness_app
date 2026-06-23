import { lazyPage } from "@/lib/lazy-page";

const CoachesClient = lazyPage(() => import("./_components/CoachesClient"));

export default function AdminCoachesPage() {
  return <CoachesClient />;
}
