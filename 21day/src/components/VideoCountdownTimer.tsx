import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Timer } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const COUNTDOWN_KEY = 'video_countdown_start';
const COUNTDOWN_HOURS = 72;
const COUNTDOWN_MS = COUNTDOWN_HOURS * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

const VideoCountdownTimer = () => {
  const reduceMotion = useReducedMotion();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 3,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let startTime = localStorage.getItem(COUNTDOWN_KEY);
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(COUNTDOWN_KEY, startTime);
    }
    const startTimestamp = parseInt(startTime, 10);
    const endTime = startTimestamp + COUNTDOWN_MS;

    const tick = () => {
      const now = Date.now();
      const difference = endTime - now;
      setElapsedMs(Math.min(COUNTDOWN_MS, Math.max(0, now - startTimestamp)));

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return false;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
      return true;
    };

    tick();
    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progressPct = useMemo(
    () => Math.min(100, Math.max(0, (elapsedMs / COUNTDOWN_MS) * 100)),
    [elapsedMs]
  );

  const urgent = timeLeft.days === 0 && timeLeft.hours < 24;
  const fragments = [
    { key: 'h', label: 'ساعت', value: timeLeft.hours },
    { key: 'm', label: 'دقیقه', value: timeLeft.minutes },
    { key: 's', label: 'ثانیه', value: timeLeft.seconds },
  ] as const;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 w-full"
    >
      {/* Compact deadline strip — not a glow-card */}
      <div
        className={`relative overflow-hidden border ${
          urgent ? 'border-amber-400/40' : 'border-[#26fce3]/25'
        } bg-[#080c0c]`}
      >
        <div
          className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-[#26fce3] via-[#2a9c96] to-[#187272]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-12deg, transparent, transparent 28px, rgba(38,252,227,0.4) 28px, rgba(38,252,227,0.4) 29px)',
          }}
          aria-hidden
        />

        <div className="relative grid gap-0 sm:grid-cols-[auto_1fr]">
          {/* Days hero */}
          <div
            className="flex items-end gap-2 border-b border-white/10 px-4 py-3 sm:border-b-0 sm:border-e sm:px-5 sm:py-4"
            dir="ltr"
          >
            <span className="font-mono text-4xl font-black leading-none tracking-tighter text-white tabular-nums sm:text-5xl">
              {pad(timeLeft.days)}
            </span>
            <div className="mb-0.5 flex flex-col gap-0.5 pb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#26fce3]">
                DAYS
              </span>
              <span className="text-[11px] font-semibold text-white/55">روز مانده</span>
            </div>
          </div>

          {/* Meta + fragments */}
          <div className="flex flex-col justify-center gap-3 px-4 py-3 sm:px-5 sm:py-4" dir="rtl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Timer className="h-3.5 w-3.5 shrink-0 text-[#26fce3]" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-white">پنجره دسترسی دوره</p>
                  <p className="text-[11px] text-white/45">۷۲ ساعت برای تکمیل مسیر</p>
                </div>
              </div>
              {urgent && (
                <span className="inline-flex items-center gap-1.5 border border-amber-400/35 bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  کمتر از ۲۴ ساعت
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {fragments.map((u) => (
                <div
                  key={u.key}
                  className="relative overflow-hidden border border-white/10 bg-black/35 px-1.5 py-2 text-center sm:px-2"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/10"
                    aria-hidden
                  />
                  <div className="relative font-mono text-lg font-black tabular-nums text-white sm:text-xl">
                    {pad(u.value)}
                  </div>
                  <div className="relative mt-0.5 text-[9px] font-semibold text-[#58cac0] sm:text-[10px]">
                    {u.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Runway */}
            <div>
              <div className="mb-1 flex justify-between text-[9px] font-semibold tracking-wide text-white/35">
                <span>شروع</span>
                <span>پایان دسترسی</span>
              </div>
              <div className="relative h-1 overflow-hidden bg-white/10">
                <div
                  className="absolute inset-y-0 start-0 bg-gradient-to-l from-[#187272] to-[#26fce3] transition-[width] duration-500"
                  style={{ width: `${Math.max(progressPct, 2)}%` }}
                />
                <span
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-[#0e0e0e] bg-[#26fce3]"
                  style={{ insetInlineStart: `calc(${Math.max(progressPct, 2)}% - 5px)` }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoCountdownTimer;
