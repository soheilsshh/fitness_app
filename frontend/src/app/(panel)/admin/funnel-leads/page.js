import { lazyPage } from "@/lib/lazy-page";

const FunnelLeadsClient = lazyPage(() => import("./_components/FunnelLeadsClient"));

export const metadata = {
  title: "لید و فانل | پنل مدیر",
  description: "مدیریت لیدهای قیف فروش علی رشیدآبادی",
};

export default function AdminFunnelLeadsPage() {
  return <FunnelLeadsClient />;
}
