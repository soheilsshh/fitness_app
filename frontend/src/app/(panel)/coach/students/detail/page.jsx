import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const CoachStudentDetailsClient = lazyPage(
  () => import("./_components/CoachStudentDetailsClient"),
);

export default function CoachStudentDetailsPage() {
  return (
    <Suspense fallback={null}>
      <CoachStudentDetailsClient />
    </Suspense>
  );
}
