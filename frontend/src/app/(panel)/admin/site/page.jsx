import { lazyPage } from "@/lib/lazy-page";

const SiteSettingsClient = lazyPage(() => import("./_components/SiteSettingsClient"));

export default function AdminSitePage() {
  return <SiteSettingsClient />;
}
