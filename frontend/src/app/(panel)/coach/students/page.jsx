import { lazyPage } from "@/lib/lazy-page";

const CoachStudentsClient = lazyPage(() => import("./_components/CoachStudentsClient"));

export default function CoachStudentsPage() {
  return <CoachStudentsClient />;
}
