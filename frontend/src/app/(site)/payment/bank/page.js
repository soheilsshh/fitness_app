import { Suspense } from "react";
import BankPaymentClient from "./_components/BankPaymentClient";

export default function BankGatewayPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-zinc-400">در حال بارگذاری...</div>}>
      <BankPaymentClient />
    </Suspense>
  );
}
