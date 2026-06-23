import { lazyPage } from "@/lib/lazy-page";

const NewExerciseClient = lazyPage(() => import("./_components/NewExerciseClient"));

export default function AdminNewExercisePage() {
  return <NewExerciseClient />;
}
