import { lazyPage } from "@/lib/lazy-page";

const CalorieCalculatorClient = lazyPage(() => import("./_components/CalorieCalculatorClient"));

export default function CalorieCalculatorPage() {
  return <CalorieCalculatorClient />;
}
