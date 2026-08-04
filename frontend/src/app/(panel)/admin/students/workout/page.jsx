import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const WorkoutEditorClient = lazyPage(
  () =>
    import("@/app/(panel)/coach/students/workout/_components/WorkoutEditorClient"),
);

export default function AdminStudentWorkoutPage() {
  return (
    <div className="space-y-4" dir="rtl">
      <h1 className="text-lg font-semibold tracking-tight">
        ویرایشگر برنامه تمرین (ادمین)
      </h1>
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
        }
      >
        <WorkoutEditorClient apiBase="admin" />
      </Suspense>
    </div>
  );
}
