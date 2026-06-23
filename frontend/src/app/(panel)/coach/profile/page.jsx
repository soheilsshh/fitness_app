import { lazyPage } from "@/lib/lazy-page";

const ProfileClient = lazyPage(() => import("./_components/ProfileClient"));

export default function CoachProfilePage() {
  return <ProfileClient />;
}
