import { lazyPage } from "@/lib/lazy-page";

const StudentDetailsClient = lazyPage(() => import("./_components/StudentDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function AdminStudentDetailsPage({ params }) {
  const resolved = await params;
  return <StudentDetailsClient id={resolved?.id} />;
}
