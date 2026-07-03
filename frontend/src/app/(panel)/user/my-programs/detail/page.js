import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const ProgramDetailsClient = lazyPage(() => import("../_components/ProgramDetailsClient"));

export default function ProgramDetailsPage() {
  return (
    <Suspense fallback={null}>
      <ProgramDetailsClient />
    </Suspense>
  );
}
