import { FunnelLogoLayer } from "../ali-rashidabadi/_components/FunnelLogoLayer";

/** Legacy route — same funnel chrome as /analiz (redirect). */
export default function LeadFunnelLayout({ children }) {
  return (
    <div className="funnel-frame-shell" dir="rtl">
      <div className="funnel-frame-device text-white">
        <FunnelLogoLayer>{children}</FunnelLogoLayer>
      </div>
    </div>
  );
}
