import ExerciseDetailsClient from "./_components/ExerciseDetailsClient";

export default async function AdminExerciseDetailsPage({ params }) {
  const { id } = await params;
  return <ExerciseDetailsClient id={id} />;
}
