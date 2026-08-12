import { lazyPage } from "@/lib/lazy-page";

const AIProgramNewClient = lazyPage(() => import("./_components/AIProgramNewClient"));

export default function AIProgramNewPage() {
  return <AIProgramNewClient />;
}
