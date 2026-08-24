import { useEffect, type ReactNode } from "react";
import FitinoBrandMark from "@/components/FitinoBrandMark";
import JourneyRail, { type JourneyStep } from "@/components/JourneyRail";

interface FitinoPageShellProps {
  children: ReactNode;
  railSteps?: JourneyStep[];
}

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
