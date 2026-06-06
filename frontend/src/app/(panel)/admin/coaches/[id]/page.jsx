import CoachDetailsClient from "./_components/CoachDetailsClient";

export default async function AdminCoachDetailsPage({ params }) {
  const { id } = await params;
  return <CoachDetailsClient id={id} />;
}
