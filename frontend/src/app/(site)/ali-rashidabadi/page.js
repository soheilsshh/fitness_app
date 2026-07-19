import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";

const LeadFunnelWizard = lazyPage(() => import("./_components/LeadFunnelWizard"));

export const metadata = {
  title: "ارزیابی هوشمند بدن | فیتینو",
  description:
    "فرمول اختصاصی بدن تو؛ ترکیب علم مربیگری و پایش ۲۴ ساعته هوش مصنوعی فیتینو",
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
