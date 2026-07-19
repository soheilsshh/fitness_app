import { lazyPage } from "@/lib/lazy-page";

const FunnelLeadsClient = lazyPage(() => import("./_components/FunnelLeadsClient"));

export const metadata = {
  title: "فانل ۱ · لید و فانل | پنل مدیر",
  description: "فانل ۱ — اختصاصی علی رشیدآبادی",
};

export default function AdminFunnelLeadsPage() {
  return <FunnelLeadsClient />;
}
