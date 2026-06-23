import { lazyPage } from "@/lib/lazy-page";

const OrderDetailsClient = lazyPage(() => import("../_components/OrderDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function OrderDetailsPage() {
  return <OrderDetailsClient />;
}
