import CoachStudentDetailsClient from "./_components/CoachStudentDetailsClient";

export default async function CoachStudentDetailsPage({ params }) {
  const { id } = await params;
  return <CoachStudentDetailsClient id={id} />;
}
