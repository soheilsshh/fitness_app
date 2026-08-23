import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const FunnelPaymentClient = lazyPage(() => import("./_components/FunnelPaymentClient"));

export const metadata = {
  title: "پرداخت | قیف فروش",
  robots: { index: false, follow: false },
};

export default function FunnelPaymentPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">...</div>}>
      <FunnelPaymentClient />
    </Suspense>
  );
}
