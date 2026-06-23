import { lazyPage } from "@/lib/lazy-page";

const CoachTrackingClient = lazyPage(() => import("./_components/CoachTrackingClient"));

export default function CoachTrackingPage() {
  return <CoachTrackingClient />;
}
