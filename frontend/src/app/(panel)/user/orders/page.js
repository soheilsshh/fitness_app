import { lazyPage } from "@/lib/lazy-page";

const OrdersListClient = lazyPage(() => import("./_components/OrdersListClient"));

export default function OrdersPage() {
  return <OrdersListClient />;
}
