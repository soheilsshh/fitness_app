import { lazyPage } from "@/lib/lazy-page";

const SessionsClient = lazyPage(() => import("./_components/SessionsClient"));

export default function SessionsPage() {
  return <SessionsClient />;
}
