import { lazyPage } from "@/lib/lazy-page";

const UsersClient = lazyPage(() => import("./_components/UsersClient"));

export default function AdminUsersPage() {
  return <UsersClient />;
}
