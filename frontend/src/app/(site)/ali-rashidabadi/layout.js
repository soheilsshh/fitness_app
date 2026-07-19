import { FunnelLogoLayer } from "./_components/FunnelLogoLayer";

/**
 * Funnel chrome: centered 430px phone frame on desktop, full-bleed on mobile
 * (site navbar hides itself on /ali-rashidabadi). One FunnelLogoLayer wraps
 * every funnel page so the brand mark travels between phases.
 */
export default function LeadFunnelLayout({ children }) {
  return (
    <div className="funnel-frame-shell" dir="rtl">
      <div className="funnel-frame-device text-white">
        <FunnelLogoLayer>{children}</FunnelLogoLayer>
      </div>
    </div>
  );
}
