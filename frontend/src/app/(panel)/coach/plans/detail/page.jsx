import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const CoachPlanDetailsClient = lazyPage(() => import("./_components/CoachPlanDetailsClient"));

export default function CoachPlanDetailsPage() {
  return (
    <Suspense fallback={null}>
      <CoachPlanDetailsClient />
    </Suspense>
  );
}
