import { lazyPage } from "@/lib/lazy-page";

const PlanDetailsClient = lazyPage(() => import("./_components/PlanDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function AdminPlanDetailsPage({ params }) {
  const resolved = await params;
  return <PlanDetailsClient id={resolved.id} />;
}
