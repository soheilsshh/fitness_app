import { lazyPage } from "@/lib/lazy-page";

const FunnelLeadsClient = lazyPage(() => import("./_components/FunnelLeadsClient"));

export default function AdminFunnelLeadsPage() {
  return <FunnelLeadsClient />;
}
