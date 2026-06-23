import { lazyPage } from "@/lib/lazy-page";

const BmiCalculatorClient = lazyPage(() => import("./_components/BmiCalculatorClient"));

export default function BmiCalculatorPage() {
  return <BmiCalculatorClient />;
}
