import { lazyPage } from "@/lib/lazy-page";

const CoachTicketsClient = lazyPage(() => import("./_components/CoachTicketsClient"));

export default function CoachTicketsPage() {
  return <CoachTicketsClient />;
}
