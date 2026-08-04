import { lazyPage } from "@/lib/lazy-page";

const TemplatesClient = lazyPage(() => import("./_components/TemplatesClient"));

export default function AdminTemplatesPage() {
  return <TemplatesClient />;
}
