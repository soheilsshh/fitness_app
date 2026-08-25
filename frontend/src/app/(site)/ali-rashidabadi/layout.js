import { FunnelLogoLayer } from "./_components/FunnelLogoLayer";

/** Legacy route — same funnel chrome as /analysis (redirect). */
export default function LeadFunnelLayout({ children }) {
  return (
    <div className="funnel-frame-shell" dir="rtl">
      <div className="funnel-frame-device text-white">
        <FunnelLogoLayer>{children}</FunnelLogoLayer>
      </div>
    </div>
  );
}
