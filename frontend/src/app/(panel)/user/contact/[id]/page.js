import { lazyPage } from "@/lib/lazy-page";

const TicketDetailsClient = lazyPage(() => import("./_components/TicketDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function ContactDetailsPage({ params }) {
  const { id } = await params;
  return <TicketDetailsClient id={id} />;
}