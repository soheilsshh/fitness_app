import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const FunnelPaymentResultClient = lazyPage(() =>
  import("../../../ali-rashidabadi/payment/result/_components/FunnelPaymentResultClient")
);

export const metadata = {
  title: "نتیجه پرداخت | آنالیز هوشمند بدن",
  robots: { index: false, follow: false },
};

export default function FunnelPaymentResultPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">...</div>}>
      <FunnelPaymentResultClient />
    </Suspense>
  );
}
