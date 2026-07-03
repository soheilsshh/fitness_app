import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const UserDetailsClient = lazyPage(() => import("./_components/UserDetailsClient"));

export default function AdminUserDetailsPage() {
  return (
    <Suspense fallback={null}>
      <UserDetailsClient />
    </Suspense>
  );
}
