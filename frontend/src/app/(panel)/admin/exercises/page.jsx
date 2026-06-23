import { lazyPage } from "@/lib/lazy-page";

const ExercisesClient = lazyPage(() => import("./_components/ExercisesClient"));

export default function AdminExercisesPage() {
  return <ExercisesClient />;
}
