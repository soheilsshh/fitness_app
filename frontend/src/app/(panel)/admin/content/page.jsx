import { lazyPage } from "@/lib/lazy-page";

const ContentAdminClient = lazyPage(() => import("./_components/ContentAdminClient"));

export default function AdminContentPage() {
  return <ContentAdminClient />;
}
