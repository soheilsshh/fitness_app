import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";
import { absoluteUrl } from "@/lib/seo/siteUrl";

const LeadFunnelWizard = lazyPage(() => import("./_components/LeadFunnelWizard"));

const title = "ارزیابی هوشمند بدن | فیتینو";
const description =
  "فرمول اختصاصی بدن تو؛ ترکیب علم مربیگری و پایش ۲۴ ساعته هوش مصنوعی فیتینو";

export const metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/ali-rashidabadi/") },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/ali-rashidabadi/"),
    siteName: "فیتینو",
    locale: "fa_IR",
    type: "website",
  },
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
