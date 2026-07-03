import { Suspense } from "react";
import PaymentResultClient from "./_components/PaymentResultClient";

export const metadata = {
  title: "نتیجه پرداخت | فیتینو",
};

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-zinc-400">در حال بارگذاری...</div>}>
      <PaymentResultClient />
    </Suspense>
  );
}
