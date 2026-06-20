import { Suspense } from "react";
import LeadFunnelWizard from "./_components/LeadFunnelWizard";

export const metadata = {
  title: "ارزیابی رایگان | قیف فروش",
  description: "ارزیابی اختصاصی تناسب اندام با استاد علی رشید آبادی",
};

export default function LeadFunnelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          در حال بارگذاری...
        </div>
      }
    >
      <LeadFunnelWizard />
    </Suspense>
  );
}
