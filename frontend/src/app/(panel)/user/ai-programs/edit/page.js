import { lazyPage } from "@/lib/lazy-page";

const AIProgramEditClient = lazyPage(() => import("./_components/AIProgramEditClient"));

export default function AIProgramEditPage() {
  return <AIProgramEditClient />;
}
