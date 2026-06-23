import { lazyPage } from "@/lib/lazy-page";

const CoachStudentDetailsClient = lazyPage(() => import("./_components/CoachStudentDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function CoachStudentDetailsPage({ params }) {
  const { id } = await params;
  return <CoachStudentDetailsClient id={id} />;
}
