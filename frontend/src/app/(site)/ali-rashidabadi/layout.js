import { FunnelLogoLayer } from "./_components/FunnelLogoLayer";

/**
 * Funnel chrome:
 * - Mobile: full-bleed phone UI
 * - Desktop/laptop: centered 430px phone frame
 * Site navbar hides itself on /ali-rashidabadi.
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
