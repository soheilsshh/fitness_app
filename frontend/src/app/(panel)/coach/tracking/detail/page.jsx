import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const CoachStudentTrackingClient = lazyPage(
  () => import("./_components/CoachStudentTrackingClient"),
);

export default function CoachStudentTrackingPage() {
  return (
    <Suspense fallback={null}>
      <CoachStudentTrackingClient />
    </Suspense>
  );
}
