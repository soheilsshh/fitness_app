import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const FunnelSuccessClient = lazyPage(() => import("./_components/FunnelSuccessClient"));

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
