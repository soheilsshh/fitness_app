import { lazyPage } from "@/lib/lazy-page";

const CoachTicketDetailsClient = lazyPage(() => import("./_components/CoachTicketDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function CoachTicketDetailsPage({ params }) {
  const { id } = await params;
  return <CoachTicketDetailsClient id={id} />;
}
