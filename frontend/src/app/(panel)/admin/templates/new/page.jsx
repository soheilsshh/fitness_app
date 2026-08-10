import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const TemplateEditorClient = lazyPage(() =>
  import("../detail/_components/TemplateEditorClient"),
);

export default function AdminTemplateNewPage() {
  return (
    <Suspense fallback={null}>
      <TemplateEditorClient mode="new" />
    </Suspense>
  );
}
