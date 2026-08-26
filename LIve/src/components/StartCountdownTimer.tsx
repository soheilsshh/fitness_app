import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface StartCountdownTimerProps {
  targetTime: Date; // زمان شروع وبینار
}

const StartCountdownTimer = ({ targetTime }: StartCountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetTime.getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    // Calculate immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  // Segmented HUD block — a single gradient tile carrying one tabular-nums
  // value, with its label pinned underneath like a dial readout, not a
  // dark glowing digital-clock digit.
  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fp-deep)] via-[var(--fp-brand)] to-[var(--fp-mid)] shadow-[0_10px_24px_-8px_rgba(38,252,227,0.4)] sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]">
        <div className="fp-hud-num text-2xl text-primary-foreground sm:text-3xl md:text-4xl">
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:text-[10px]">
        {label}
      </div>
    </div>
  );

  const Separator = () => (
    <div className="flex flex-col items-center justify-center gap-1 self-center px-1 pb-4 sm:px-2">
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" />
      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" style={{ animationDelay: '0.5s' }} />
    </div>
  );

  // If time has passed, show zero
  if (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* HUD dial card: a spine-accented panel framing the three segmented
          blocks, replacing the old dark glowing digital-clock box. */}
      <div className="fp-card fp-notch fp-spine relative overflow-hidden p-4 sm:p-5 md:p-6">
        <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground sm:mb-4">
          <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
        </div>
        <div className="flex items-start justify-center gap-2 sm:gap-3 md:gap-4">
          <TimeUnit value={timeLeft.hours} label="ساعت" />
          <Separator />
          <TimeUnit value={timeLeft.minutes} label="دقیقه" />
          <Separator />
          <TimeUnit value={timeLeft.seconds} label="ثانیه" />
        </div>
      </div>
    </div>
  );
};

export default StartCountdownTimer;
