import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const FunnelSuccessClient = lazyPage(() =>
  import("../../ali-rashidabadi/success/_components/FunnelSuccessClient")
);

export const metadata = {
  title: "پرداخت موفق | آنالیز هوشمند بدن",
  robots: { index: false, follow: false },
};

export default function FunnelSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">...</div>}>
      <FunnelSuccessClient />
    </Suspense>
  );
}
