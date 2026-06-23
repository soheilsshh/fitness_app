import { lazyPage } from "@/lib/lazy-page";

const StudentsClient = lazyPage(() => import("./_components/StudentsClient"));

export default function AdminStudentsPage() {
  return <StudentsClient />;
}
