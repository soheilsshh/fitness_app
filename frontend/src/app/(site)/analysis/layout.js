import { FunnelLogoLayer } from "../ali-rashidabadi/_components/FunnelLogoLayer";

/**
 * Funnel chrome:
 * - Mobile (<768px): full-bleed
 * - Tablet/desktop (768px+): wide centered panel (~1120px)
 * Site navbar hides itself on /analysis.
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
