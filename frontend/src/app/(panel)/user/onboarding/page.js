import { lazyPage } from "@/lib/lazy-page";

const OnboardingClient = lazyPage(() => import("./_components/OnboardingClient"));

export default function OnboardingPage() {
  return <OnboardingClient />;
}
