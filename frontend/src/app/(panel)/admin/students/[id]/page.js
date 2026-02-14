import StudentDetailsClient from "./_components/StudentDetailsClient";

export default async function AdminStudentDetailsPage({ params }) {
  const resolved = await params;
  return <StudentDetailsClient id={resolved?.id} />;
}
