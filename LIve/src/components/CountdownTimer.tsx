import { Clock } from "lucide-react";
import StatusChip from "@/components/StatusChip";

interface CountdownTimerProps {
  timeLeft: number;
}

const CountdownTimer = ({ timeLeft }: CountdownTimerProps) => {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const units = [
    { value: hours, label: "ساعت" },
    { value: minutes, label: "دقیقه" },
    { value: seconds, label: "ثانیه" },
  ];

  return (
    <div className="fp-card fp-notch relative overflow-hidden p-6 text-center sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,252,227,0.08),transparent_60%)]" />

      <div className="relative z-10">
        <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <StatusChip tone="live" pulse>
            کارگاه زنده در حال پخش
          </StatusChip>
          <h2 className="text-xl font-black text-white sm:text-2xl">فرصت محدود برای تماشا ⚡</h2>
        </div>

        <div className="mb-6 flex items-center justify-center gap-3 sm:gap-4">
          {units.map((unit, i) => (
            <div key={unit.label} className="flex items-center gap-3 sm:gap-4">
              <div className="fp-card fp-notch fp-notch-sm min-w-[76px] px-3 py-3 sm:min-w-[88px] sm:px-4">
                <div className="fp-hud-num gradient-text text-3xl md:text-4xl">
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-xs font-semibold text-white/45">{unit.label}</div>
              </div>
              {i < units.length - 1 && (
                <span className="fp-hud-num text-xl text-[#26fce3]/70">:</span>
              )}
            </div>
          ))}
        </div>

        <div className="fp-card fp-notch fp-notch-sm border-amber-400/25 bg-amber-500/[0.06] p-4">
          <p className="mb-1 flex items-center justify-center gap-2 text-sm font-semibold text-amber-300 md:text-base">
            <Clock className="h-4 w-4" aria-hidden />
            هشدار: دسترسی محدود!
          </p>
          <p className="text-sm leading-relaxed text-white/60">
            این کارگاه فقط یک‌بار پخش می‌شود و بعد از پایان، دیگر در دسترس نخواهد بود.
            <span className="font-bold text-amber-300"> الان یا هیچ‌وقت!</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
