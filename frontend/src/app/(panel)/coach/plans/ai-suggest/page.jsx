import { lazyPage } from "@/lib/lazy-page";

const CoachAISuggestClient = lazyPage(() => import("./_components/CoachAISuggestClient"));

export default function CoachAISuggestPage() {
  return <CoachAISuggestClient />;
}
