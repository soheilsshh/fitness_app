import { Suspense } from "react";
import FunnelSuccessClient from "./_components/FunnelSuccessClient";

export const metadata = {
  title: "پرداخت موفق | قیف فروش",
};

export default function FunnelSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">...</div>}>
      <FunnelSuccessClient />
    </Suspense>
  );
}
