import { lazyPage } from "@/lib/lazy-page";

const TrackingClient = lazyPage(() => import("./_components/TrackingClient"));

export default function UserTrackingPage() {
  return <TrackingClient />;
}
