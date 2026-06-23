import { lazyPage } from "@/lib/lazy-page";

const CoachStudentTrackingClient = lazyPage(() => import("./_components/CoachStudentTrackingClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function CoachStudentTrackingPage() {
  return <CoachStudentTrackingClient />;
}
