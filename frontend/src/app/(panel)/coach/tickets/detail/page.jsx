import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const CoachTicketDetailsClient = lazyPage(() => import("./_components/CoachTicketDetailsClient"));

export default function CoachTicketDetailsPage() {
  return (
    <Suspense fallback={null}>
      <CoachTicketDetailsClient />
    </Suspense>
  );
}
