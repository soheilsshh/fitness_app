import { ArrowDown, Hourglass, Timer } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { REGISTRATION_COUNTDOWN, padCountdown } from '@/lib/registrationCountdown';

const CountdownSection = () => {
  const reduceMotion = useReducedMotion();
  const timeLeft = REGISTRATION_COUNTDOWN;

  const scrollToRegistration = () => {
    document.getElementById('registration')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const units = [
    { value: timeLeft.hours, label: 'ساعت', key: 'h' },
    { value: timeLeft.minutes, label: 'دقیقه', key: 'm' },
    { value: timeLeft.seconds, label: 'ثانیه', key: 's' },
  ] as const;

  const dayProgress = Math.min(100, Math.max(0, ((21 - timeLeft.days) / 21) * 100));

  return (
    <section id="countdown" className="relative overflow-hidden py-16 md:py-24">
      {/* Full-bleed atmosphere — not a floating card */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#26fce3]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-[#187272]/50 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-12deg, transparent, transparent 40px, rgba(38,252,227,0.35) 40px, rgba(38,252,227,0.35) 41px)',
          }}
        />
        <div className="absolute -end-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#26fce3]/10 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Marquee urgency rail */}
          <div
            className="mb-8 flex overflow-hidden border-y border-[#26fce3]/25 bg-[#187272]/15 py-2"
            dir="ltr"
            aria-hidden
          >
            <motion.div
              className="flex shrink-0 gap-10 whitespace-nowrap text-[11px] font-bold tracking-[0.25em] text-[#58cac0]"
              animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 22, ease: 'linear', repeat: Number.POSITIVE_INFINITY }
              }
            >
              {Array.from({ length: 2 }).map((_, loop) => (
                <span key={loop} className="flex gap-10">
                  {Array.from({ length: 8 }).map((__, i) => (
                    <span key={`${loop}-${i}`} className="inline-flex items-center gap-2">
                      <Hourglass className="h-3 w-3 text-[#26fce3]" />
                      REGISTRATION WINDOW · مهلت محدود
                    </span>
                  ))}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Asymmetric deadline board */}
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
            {/* Hero day stack */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="relative border border-white/10 bg-[#080c0c] px-6 py-10 md:px-10 md:py-14 lg:border-e-0"
              dir="rtl"
            >
              <div
                className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-[#26fce3] via-[#2a9c96] to-[#187272]"
                aria-hidden
              />

              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-[#58cac0]">
                <Timer className="h-3.5 w-3.5 text-[#26fce3]" aria-hidden />
                DEADLINE · ۲۱روز
              </p>

              <h2 className="max-w-md text-2xl font-extrabold leading-snug text-white md:text-4xl">
                پنجره ثبت‌نام
                <span className="mt-1 block bg-gradient-to-l from-[#187272] via-[#58cac0] to-[#26fce3] bg-clip-text text-transparent">
                  در حال بسته‌شدنه
                </span>
              </h2>

              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                مهلت خیلی محدوده — فقط تا پایان این شمارش فرصت داری وارد مسیر شی.
              </p>

              <div className="mt-10 flex items-end gap-3" dir="ltr">
                <div className="relative">
                  <span className="block font-mono text-[5.5rem] font-black leading-none tracking-tighter text-white tabular-nums sm:text-[7rem] md:text-[8rem]">
                    {padCountdown(timeLeft.days)}
                  </span>
                  <span
                    className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/40"
                    aria-hidden
                  />
                </div>
                <div className="mb-3 flex flex-col gap-1 pb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#26fce3]">
                    DAYS
                  </span>
                  <span className="text-sm font-semibold text-white/60">روز مانده</span>
                </div>
              </div>

              {/* Runway progress of window consumed */}
              <div className="mt-8">
                <div className="mb-2 flex justify-between text-[10px] font-semibold tracking-wide text-white/40">
                  <span>شروع پنجره</span>
                  <span>بسته شدن</span>
                </div>
                <div className="relative h-1.5 overflow-hidden bg-white/10">
                  <motion.div
                    className="absolute inset-y-0 start-0 bg-gradient-to-l from-[#187272] to-[#26fce3]"
                    initial={reduceMotion ? false : { width: 0 }}
                    whileInView={{ width: `${dayProgress || 4}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <span
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#0e0e0e] bg-[#26fce3] shadow-[0_0_12px_rgba(38,252,227,0.6)]"
                    style={{ insetInlineStart: `calc(${Math.max(dayProgress, 4)}% - 6px)` }}
                    aria-hidden
                  />
                </div>
              </div>
            </motion.div>

            {/* Time fragments + CTA slab */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="flex flex-col border border-[#26fce3]/25 bg-gradient-to-b from-[#187272]/30 via-[#0e0e0e] to-[#0e0e0e]"
            >
              <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-8 md:px-8 md:py-10" dir="rtl">
                <p className="text-[11px] font-bold tracking-[0.18em] text-white/45">
                  خرده‌زمان باقی‌مانده
                </p>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {units.map((u, i) => (
                    <motion.div
                      key={u.key}
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: 0.12 + i * 0.06 }}
                      className="relative overflow-hidden border border-white/10 bg-black/40 px-2 py-4 text-center"
                    >
                      <div
                        className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/10"
                        aria-hidden
                      />
                      <div className="relative font-mono text-2xl font-black tabular-nums text-white sm:text-3xl md:text-4xl">
                        {padCountdown(u.value)}
                      </div>
                      <div className="relative mt-2 text-[10px] font-semibold text-[#58cac0] sm:text-xs">
                        {u.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <p className="text-xs leading-relaxed text-white/40">
                  هر تیک = فرصت کمتر برای گرفتن جای خودت در دوره.
                </p>
              </div>

              <motion.button
                type="button"
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={scrollToRegistration}
                className="group flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-3 border-t border-[#26fce3]/30 bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] px-5 py-4 text-right transition-opacity duration-200 hover:opacity-95 touch-manipulation md:px-8"
                dir="rtl"
              >
                <span className="text-base font-black text-[#0e0e0e] md:text-lg">
                  همین الان ثبت‌نام کن
                </span>
                <ArrowDown className="h-5 w-5 shrink-0 text-[#0e0e0e] transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CountdownSection;
