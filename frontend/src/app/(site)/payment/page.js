import { lazyPage } from "@/lib/lazy-page";

const PaymentClient = lazyPage(() => import("../_components/PaymentClient"));

export const metadata = {
  robots: { index: false, follow: false },
};

export default function PaymentPage() {
  return <PaymentClient />;
}
