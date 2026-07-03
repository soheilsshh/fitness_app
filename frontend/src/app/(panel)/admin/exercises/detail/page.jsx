import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const ExerciseDetailsClient = lazyPage(() => import("./_components/ExerciseDetailsClient"));

export default function AdminExerciseDetailsPage() {
  return (
    <Suspense fallback={null}>
      <ExerciseDetailsClient />
    </Suspense>
  );
}
