import { FunnelLogoLayer } from "./_components/FunnelLogoLayer";

/**
 * Funnel chrome:
 * - Mobile: original full-bleed phone UI
 * - Desktop/laptop: full viewport (no 430px framed device)
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
