import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const StudentDetailsClient = lazyPage(() => import("./_components/StudentDetailsClient"));

export default function AdminStudentDetailsPage() {
  return (
    <Suspense fallback={null}>
      <StudentDetailsClient />
    </Suspense>
  );
}
