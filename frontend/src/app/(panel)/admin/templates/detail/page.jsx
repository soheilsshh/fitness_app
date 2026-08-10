import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const TemplateEditorClient = lazyPage(() =>
  import("./_components/TemplateEditorClient"),
);

export default function AdminTemplateDetailPage() {
  return (
    <Suspense fallback={null}>
      <TemplateEditorClient mode="edit" />
    </Suspense>
  );
}
