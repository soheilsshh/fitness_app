import { Suspense } from "react";
import { lazyPage } from "@/lib/lazy-page";
import { absoluteUrl } from "@/lib/seo/siteUrl";
import { FUNNEL_PATH } from "@/lib/funnel/offer";

const LeadFunnelWizard = lazyPage(() =>
  import("../ali-rashidabadi/_components/LeadFunnelWizard")
);

const title = "آنالیز هوشمند بدن | فیتینو";
const description =
  "فرمول اختصاصی بدن تو؛ ترکیب علم مربیگری و پایش ۲۴ ساعته هوش مصنوعی فیتینو";

export const metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl(`${FUNNEL_PATH}/`) },
  openGraph: {
    title,
    description,
    url: absoluteUrl(`${FUNNEL_PATH}/`),
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
