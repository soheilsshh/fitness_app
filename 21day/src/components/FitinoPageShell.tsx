import { useEffect, type ReactNode } from "react";
import FitinoBrandMark from "@/components/FitinoBrandMark";
import JourneyRail, { type JourneyStep } from "@/components/JourneyRail";
import { REGISTRATION_COUNTDOWN, padCountdown } from "@/lib/registrationCountdown";

interface FitinoPageShellProps {
  children: ReactNode;
  railSteps?: JourneyStep[];
}

const HeaderCountdown = () => {
  const units = [
    { value: REGISTRATION_COUNTDOWN.days, label: "روز" },
    { value: REGISTRATION_COUNTDOWN.hours, label: "ساعت" },
    { value: REGISTRATION_COUNTDOWN.minutes, label: "دقیقه" },
    { value: REGISTRATION_COUNTDOWN.seconds, label: "ثانیه" },
  ];

  return (
    <div className="sticky top-[4.75rem] z-40 px-4">
      <div className="container mx-auto flex max-w-3xl justify-end">
        <a
          href="#countdown"
          aria-label="مهلت ثبت‌نام باقی‌مانده"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0e0e0e]/85 px-2.5 py-1.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:gap-2 sm:px-3 sm:py-2"
        >
          {units.map((unit, index) => (
            <span key={unit.label} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 && <span className="text-[10px] text-white/25 sm:text-xs">:</span>}
              <span className="flex flex-col items-center leading-none">
                <span className="text-[11px] font-extrabold tabular-nums text-[#26fce3] sm:text-sm">
                  {padCountdown(unit.value)}
                </span>
                <span className="mt-0.5 text-[8px] text-muted-foreground sm:text-[9px]">{unit.label}</span>
              </span>
            </span>
          ))}
        </a>
      </div>
    </div>
  );
};

const FitinoPageShell = ({ children, railSteps }: FitinoPageShellProps) => {
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#0e0e0e] text-foreground">
      <div id="scroll-progress" aria-hidden />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora-blob absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#26fce3]/15 blur-[140px]" />
        <div className="aurora-blob-delay absolute bottom-0 end-0 h-80 w-80 rounded-full bg-[#2a9c96]/18 blur-[120px]" />
        <div className="aurora-blob absolute top-1/3 -start-20 h-64 w-64 rounded-full bg-[#187272]/25 blur-[100px]" />
      </div>

      <header className="sticky top-4 z-40 px-4">
        <div className="floating-nav container mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <a href="#registration" className="flex cursor-pointer items-center gap-2.5">
            <FitinoBrandMark size={30} pulse={false} />
            <span className="text-base font-extrabold tracking-tight">فیتینو</span>
          </a>
          <a
            href="#registration"
            className="cursor-pointer rounded-full bg-gradient-to-l from-[#187272] to-[#26fce3] px-4 py-2 text-xs font-bold text-black transition-transform duration-200 hover:scale-105 sm:text-sm"
          >
            شروع رایگان
          </a>
        </div>
      </header>

      <HeaderCountdown />

      {railSteps && railSteps.length > 0 && <JourneyRail steps={railSteps} />}

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 border-t border-white/8 py-12">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center">
          <FitinoBrandMark size={36} pulse={false} />
          <p className="text-sm text-muted-foreground">فیتینو — مربیگری هوشمند برای بدن و درآمد</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span>© {new Date().getFullYear()} فیتینو</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>تمامی حقوق محفوظ است</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FitinoPageShell;
