import { lazyPage } from "@/lib/lazy-page";

const UserDashboardClient = lazyPage(() => import("./_components/UserDashboardClient"));

export default function UserDashboardPage() {
  return <UserDashboardClient />;
}
