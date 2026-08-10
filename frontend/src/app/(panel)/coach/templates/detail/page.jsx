import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const CoachTemplateDetailClient = lazyPage(() =>
  import("./_components/CoachTemplateDetailClient"),
);

export default function CoachTemplateDetailPage() {
  return (
    <Suspense fallback={null}>
      <CoachTemplateDetailClient />
    </Suspense>
  );
}
