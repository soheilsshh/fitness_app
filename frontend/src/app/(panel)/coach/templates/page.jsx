import { lazyPage } from "@/lib/lazy-page";

const CoachTemplatesClient = lazyPage(() =>
  import("./_components/CoachTemplatesClient"),
);

export default function CoachTemplatesPage() {
  return <CoachTemplatesClient />;
}
