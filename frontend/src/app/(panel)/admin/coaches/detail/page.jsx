import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const CoachDetailsClient = lazyPage(() => import("./_components/CoachDetailsClient"));

export default function AdminCoachDetailsPage() {
  return (
    <Suspense fallback={null}>
      <CoachDetailsClient />
    </Suspense>
  );
}
