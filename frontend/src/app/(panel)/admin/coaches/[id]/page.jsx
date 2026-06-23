import { lazyPage } from "@/lib/lazy-page";

const CoachDetailsClient = lazyPage(() => import("./_components/CoachDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function AdminCoachDetailsPage({ params }) {
  const { id } = await params;
  return <CoachDetailsClient id={id} />;
}
