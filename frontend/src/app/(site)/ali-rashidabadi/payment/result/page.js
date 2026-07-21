import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const FunnelPaymentResultClient = lazyPage(() =>
  import("./_components/FunnelPaymentResultClient")
);

export const metadata = {
  title: "نتیجه پرداخت | قیف فروش",
};

export default function FunnelPaymentResultPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">...</div>}>
      <FunnelPaymentResultClient />
    </Suspense>
  );
}
