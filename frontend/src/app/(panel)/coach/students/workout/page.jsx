import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const WorkoutEditorClient = lazyPage(
  () => import("./_components/WorkoutEditorClient"),
);

export default function WorkoutEditorPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold text-white">
        ویرایشگر برنامه تمرین
      </h1>
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
        }
      >
        <WorkoutEditorClient />
      </Suspense>
    </div>
  );
}
