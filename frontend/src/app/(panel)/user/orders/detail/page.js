import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const OrderDetailsClient = lazyPage(() => import("../_components/OrderDetailsClient"));

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={null}>
      <OrderDetailsClient />
    </Suspense>
  );
}
