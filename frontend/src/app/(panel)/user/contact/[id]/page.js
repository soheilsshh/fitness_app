import TicketDetailsClient from "./_components/TicketDetailsClient";

export default async function ContactDetailsPage({ params }) {
  const { id } = await params;
  return <TicketDetailsClient id={id} />;
}