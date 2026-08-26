import { useEffect, type ReactNode } from "react";
import FitinoBrandMark from "@/components/FitinoBrandMark";

interface FitinoPageShellProps {
  children: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  /** Hide the header CTA on pages with no matching anchor/section (ThankYou, Payment, AI). */
  showHeaderCta?: boolean;
  showFooter?: boolean;
}

const FitinoPageShell = ({
  children,
  ctaHref = "#registration",
  ctaLabel = "شروع آنالیز رایگان",
  showHeaderCta = true,
  showFooter = true,
}: FitinoPageShellProps) => {
  useEffect(() => {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${pct}%`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fitino-landing relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div id="scroll-progress" aria-hidden />

      {/* Ambient "bloom" — concentric heartbeat-style glow rings. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
        <div
          className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2"
          style={{ animationDelay: "-1.5s" }}
        />
        <div
          className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2"
          style={{ animationDelay: "-3s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,252,227,0.06),transparent_55%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="flex cursor-pointer items-center gap-3">
            <FitinoBrandMark size={36} pulse={false} />
            <span className="text-lg font-extrabold tracking-tight">فیتینو</span>
          </a>
          {showHeaderCta && (
            <a
              href={ctaHref}
              className="fp-notch-btn hidden cursor-pointer border border-border bg-foreground/[0.03] px-4 py-2 text-sm font-bold text-foreground transition-colors duration-200 hover:bg-foreground/[0.06] sm:inline-flex"
            >
              {ctaLabel}
            </a>
          )}
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      {showFooter && (
        <footer className="relative z-10 border-t border-border py-10">
          <div className="container mx-auto flex flex-col items-center gap-3 px-4 text-center">
            <FitinoBrandMark size={40} pulse={false} />
            <p className="text-sm text-muted-foreground">
              پلتفرم تخصصی تمرین و تغذیه؛ مدیریت هوشمند و علمی تناسب اندام تحت نظر مربی.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default FitinoPageShell;
