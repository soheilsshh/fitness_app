import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const PlanDetailsClient = lazyPage(() => import("./_components/PlanDetailsClient"));

export default function AdminPlanDetailsPage() {
  return (
    <Suspense fallback={null}>
      <PlanDetailsClient />
    </Suspense>
  );
}
