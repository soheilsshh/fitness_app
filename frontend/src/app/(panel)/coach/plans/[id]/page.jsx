import { lazyPage } from "@/lib/lazy-page";

const CoachPlanDetailsClient = lazyPage(() => import("./_components/CoachPlanDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function CoachPlanDetailsPage({ params }) {
  const { id } = await params;
  return <CoachPlanDetailsClient id={id} />;
}
