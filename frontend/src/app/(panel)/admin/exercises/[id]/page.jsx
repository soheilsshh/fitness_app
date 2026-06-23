import { lazyPage } from "@/lib/lazy-page";

const ExerciseDetailsClient = lazyPage(() => import("./_components/ExerciseDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function AdminExerciseDetailsPage({ params }) {
  const { id } = await params;
  return <ExerciseDetailsClient id={id} />;
}
