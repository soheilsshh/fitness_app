import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const FunnelPaymentClient = lazyPage(() =>
  import("../../ali-rashidabadi/payment/_components/FunnelPaymentClient")
);

export const metadata = {
  title: "پرداخت | آنالیز هوشمند بدن",
  robots: { index: false, follow: false },
};

export default function FunnelPaymentPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">...</div>}>
      <FunnelPaymentClient />
    </Suspense>
  );
}
