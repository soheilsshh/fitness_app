import { lazyPage } from "@/lib/lazy-page";

const GuaranteeClient = lazyPage(() => import("./_components/GuaranteeClient"));

export default function GuaranteePage() {
  return <GuaranteeClient />;
}
