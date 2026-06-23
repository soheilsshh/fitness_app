import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const BankPaymentClient = lazyPage(() => import("./_components/BankPaymentClient"));

export default function BankGatewayPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-zinc-400">در حال بارگذاری...</div>}>
      <BankPaymentClient />
    </Suspense>
  );
}
