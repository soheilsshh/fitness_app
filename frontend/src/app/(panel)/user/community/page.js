import { lazyPage } from "@/lib/lazy-page";

const CommunityClient = lazyPage(() => import("./_components/CommunityClient"));

export default function CommunityPage() {
  return <CommunityClient />;
}
