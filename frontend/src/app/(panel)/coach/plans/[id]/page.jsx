import CoachPlanDetailsClient from "./_components/CoachPlanDetailsClient";

export default async function CoachPlanDetailsPage({ params }) {
  const { id } = await params;
  return <CoachPlanDetailsClient id={id} />;
}
