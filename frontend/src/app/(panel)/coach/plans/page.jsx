import { lazyPage } from "@/lib/lazy-page";

const CoachPlansClient = lazyPage(() => import("./_components/CoachPlansClient"));

export default function CoachPlansPage() {
  return <CoachPlansClient />;
}
