import { lazyPage } from "@/lib/lazy-page";

const ProfileClient = lazyPage(() => import("./_components/ProfileClient"));

export default function ProfilePage() {
  return <ProfileClient />;
}
