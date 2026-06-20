import { Suspense } from "react";
import FunnelPaymentClient from "./_components/FunnelPaymentClient";

export const metadata = {
  title: "پرداخت | قیف فروش",
};

export default function FunnelPaymentPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">...</div>}>
      <FunnelPaymentClient />
    </Suspense>
  );
}
