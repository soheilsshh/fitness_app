import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const TicketDetailsClient = lazyPage(() => import("./_components/TicketDetailsClient"));

export default function ContactDetailsPage() {
  return (
    <Suspense fallback={null}>
      <TicketDetailsClient />
    </Suspense>
  );
}
