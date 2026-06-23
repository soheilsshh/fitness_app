import { lazyPage } from "@/lib/lazy-page";

const PlansClient = lazyPage(() => import("./_components/PlansClient"));

export default function AdminPlansPage() {
  return <PlansClient />;
}
