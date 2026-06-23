import { lazyPage } from "@/lib/lazy-page";

const NewCoachPlanClient = lazyPage(() => import("./_components/NewCoachPlanClient"));

export default function NewCoachPlanPage() {
  return <NewCoachPlanClient />;
}
