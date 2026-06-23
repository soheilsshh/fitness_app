import { lazyPage } from "@/lib/lazy-page";

const PaymentClient = lazyPage(() => import("../_components/PaymentClient"));

export default function PaymentPage() {
  return <PaymentClient />;
}
