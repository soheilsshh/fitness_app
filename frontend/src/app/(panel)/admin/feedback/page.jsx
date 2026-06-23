import { lazyPage } from "@/lib/lazy-page";

const FeedbackClient = lazyPage(() => import("./_components/FeedbackClient"));

export default function AdminFeedbackPage() {
  return <FeedbackClient />;
}
