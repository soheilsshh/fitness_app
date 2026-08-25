import { lazyPage } from "@/lib/lazy-page";

const FunnelLeadsClient = lazyPage(() => import("./_components/FunnelLeadsClient"));

export const metadata = {
  title: "فانل ۱ · لید و فانل | پنل مدیر",
  description: "فانل ۱ — ارزیابی هوشمند بدن",
};

export default function AdminFunnelLeadsPage() {
  return <FunnelLeadsClient />;
}
