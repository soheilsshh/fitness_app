import { lazyPage } from "@/lib/lazy-page";

const WorkoutHistoryClient = lazyPage(() => import("./_components/WorkoutHistoryClient"));

export default function WorkoutHistoryPage() {
  return <WorkoutHistoryClient />;
}
