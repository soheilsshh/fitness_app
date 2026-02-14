import PlanDetailsClient from "./_components/PlanDetailsClient";

export default async function AdminPlanDetailsPage({ params }) {
  const resolved = await params;
  return <PlanDetailsClient id={resolved.id} />;
}
