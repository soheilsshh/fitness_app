import { lazyPage } from "@/lib/lazy-page";

const AdminDashboardClient = lazyPage(() =>
  import("./_components/AdminDashboardClient")
);

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
