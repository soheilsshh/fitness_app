import { lazyPage } from "@/lib/lazy-page";

const CoachRegistrationRequestsClient = lazyPage(() =>
  import("./_components/CoachRegistrationRequestsClient"),
);

export default function AdminCoachRequestsPage() {
  return <CoachRegistrationRequestsClient />;
}
