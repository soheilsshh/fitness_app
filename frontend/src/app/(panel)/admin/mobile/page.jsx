import { lazyPage } from "@/lib/lazy-page";

const MobileAdminClient = lazyPage(() =>
  import("./_components/MobileAdminClient"),
);

export default function AdminMobilePage() {
  return <MobileAdminClient />;
}
