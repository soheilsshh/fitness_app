import CoachTicketDetailsClient from "./_components/CoachTicketDetailsClient";

export default async function CoachTicketDetailsPage({ params }) {
  const { id } = await params;
  return <CoachTicketDetailsClient id={id} />;
}
