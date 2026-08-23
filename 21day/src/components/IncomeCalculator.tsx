import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, Clock, Flame, Gauge, Target, Zap } from 'lucide-react';

const LEVELS = [
  { id: 'beginner', label: 'مبتدی', hint: 'شروع مسیر', multiplier: 0.6, icon: Flame },
  { id: 'intermediate', label: 'متوسط', hint: 'در مسیر', multiplier: 1, icon: Activity },
  { id: 'pro', label: 'حرفه‌ای', hint: 'سطح بالا', multiplier: 1.6, icon: Zap },
] as const;

type LevelId = (typeof LEVELS)[number]['id'];

const TIME_STEPS = [30, 60, 90, 120, 150] as const;

const formatTrainingTime = (minutes: number) => {
  if (minutes < 60) return `${minutes} دقیقه`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} ساعت` : `${hours}:${String(mins).padStart(2, '0')}`;
};

const IncomeCalculator = () => {
  const reduceMotion = useReducedMotion();
  const [minutes, setMinutes] = useState(90);
  const [levelId, setLevelId] = useState<LevelId>('intermediate');

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[1];

  const { low, high, intensity } = useMemo(() => {
    const programDays = 21;
    const dailyFactor = minutes / 60;
    const round = (n: number) => Math.round(n * 10) / 10;
    const lowVal = round(dailyFactor * level.multiplier * programDays * 0.04);
    const highVal = round(dailyFactor * level.multiplier * programDays * 0.09);
    return {
      low: lowVal,
      high: highVal,
      intensity: Math.min(1, highVal / 12),
    };
  }, [minutes, level.multiplier]);

  const ringSize = 220;
  const stroke = 10;
  const r = (ringSize - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const offset = arc * (1 - intensity);

  return (
    <section id="calculator" className="relative overflow-hidden py-16 md:py-24">
      {/* Atmosphere — not a card frame */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#26fce3]/35 to-transparent" />
        <div className="absolute -start-24 top-1/4 h-72 w-72 rounded-full bg-[#187272]/20 blur-[100px]" />
        <div className="absolute -end-16 bottom-0 h-80 w-80 rounded-full bg-[#26fce3]/10 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Asymmetric header — brand-first, not centered chip stack */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between"
            dir="rtl"
          >
            <div className="max-w-xl text-right">
              <p className="mb-2 flex items-center justify-start gap-2 text-[11px] font-bold tracking-[0.2em] text-[#58cac0]">
                <Gauge className="h-3.5 w-3.5 text-[#26fce3]" aria-hidden />
                FITINO · ESTIMATE
              </p>
              <h2 className="text-3xl font-extrabold leading-tight text-white md:text-5xl">
                پتانسیل بدنت
                <span className="mt-1 block bg-gradient-to-l from-[#187272] via-[#58cac0] to-[#26fce3] bg-clip-text text-transparent">
                  روی عقربه
                </span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/55 md:text-left" dir="rtl">
              زمان روزانه و سطحت رو تنظیم کن؛ عقربه پیشرفت تخمینی ۲۱ روز رو نشون می‌ده.
            </p>
          </motion.div>

          {/* Split stage: dial | controls — no bento tile shell */}
          <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-0">
            {/* Dial HUD */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative flex flex-col items-center justify-center border border-white/10 bg-[#0a1212]/80 px-6 py-10 md:px-10 md:py-14 lg:rounded-s-3xl lg:border-e-0"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 42%, rgba(38,252,227,0.12), transparent 55%)',
                }}
                aria-hidden
              />

              <div className="relative" style={{ width: ringSize, height: ringSize }}>
                <svg
                  width={ringSize}
                  height={ringSize}
                  viewBox={`0 0 ${ringSize} ${ringSize}`}
                  className="-rotate-[225deg]"
                  aria-hidden
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={stroke}
                    strokeDasharray={`${arc} ${c}`}
                    strokeLinecap="round"
                  />
                  <motion.circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={r}
                    fill="none"
                    stroke="url(#fitino-dial-grad)"
                    strokeWidth={stroke}
                    strokeDasharray={`${arc} ${c}`}
                    strokeLinecap="round"
                    initial={false}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                  />
                  <defs>
                    <linearGradient id="fitino-dial-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#187272" />
                      <stop offset="55%" stopColor="#58cac0" />
                      <stop offset="100%" stopColor="#26fce3" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
                  <span className="mb-1 text-[10px] font-semibold tracking-widest text-white/45">
                    بهبود تخمینی
                  </span>
                  <motion.div
                    key={`${low}-${high}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}
                    className="text-4xl font-black tabular-nums text-white md:text-5xl"
                  >
                    <span className="bg-gradient-to-l from-[#58cac0] to-[#26fce3] bg-clip-text text-transparent">
                      {low}
                    </span>
                    <span className="mx-1 text-white/35">–</span>
                    <span className="bg-gradient-to-l from-[#26fce3] to-[#58cac0] bg-clip-text text-transparent">
                      {high}
                    </span>
                    <span className="ms-1 text-2xl text-[#26fce3] md:text-3xl">٪</span>
                  </motion.div>
                  <span className="mt-2 text-xs text-white/50">در ۲۱ روز · ترکیب بدنی</span>
                </div>
              </div>

              <div className="mt-8 flex w-full max-w-sm items-center justify-between gap-3 border-t border-dashed border-white/10 pt-5 text-[11px] text-white/45">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#58cac0]" aria-hidden />
                  {formatTrainingTime(minutes)} / روز
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-[#26fce3]" aria-hidden />
                  {level.label}
                </span>
              </div>

              <p className="mt-4 max-w-sm text-center text-[11px] leading-relaxed text-white/40">
                برآورد تقریبی است، نه قول. نتیجه واقعی به پایبندی، تغذیه و کیفیت تمرین بستگی دارد.
              </p>
            </motion.div>

            {/* Control deck */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="relative flex flex-col justify-center gap-10 border border-[#26fce3]/20 bg-gradient-to-br from-[#187272]/25 via-[#0e0e0e] to-[#0e0e0e] px-5 py-8 md:px-8 md:py-12 lg:rounded-e-3xl"
              dir="rtl"
            >
              <div
                className="pointer-events-none absolute inset-y-6 start-0 w-1 rounded-full bg-gradient-to-b from-[#26fce3] via-[#2a9c96] to-transparent"
                aria-hidden
              />

              {/* Time as timeline ticks — not a slider */}
              <div>
                <div className="mb-5 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">۱ · روزانه چقدر وقت می‌ذاری؟</h3>
                  <span className="font-mono text-lg font-black tabular-nums text-[#26fce3]">
                    {formatTrainingTime(minutes)}
                  </span>
                </div>

                <div
                  role="radiogroup"
                  aria-label="زمان تمرین روزانه"
                  className="relative"
                >
                  {/* Track: line centered on the dots */}
                  <div className="relative flex h-4 items-center justify-between">
                    <div
                      className="absolute start-3 end-3 top-1/2 z-0 h-px -translate-y-1/2 bg-white/15"
                      aria-hidden
                    />
                    {TIME_STEPS.map((step) => {
                      const active = minutes === step;
                      return (
                        <button
                          key={step}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setMinutes(step)}
                          aria-label={formatTrainingTime(step)}
                          className="relative z-[1] flex min-h-[44px] min-w-[44px] flex-1 cursor-pointer items-center justify-center touch-manipulation"
                        >
                          <span
                            className={`block h-3.5 w-3.5 rounded-full border-2 transition-all duration-200 ${
                              active
                                ? 'scale-125 border-[#26fce3] bg-[#26fce3] shadow-[0_0_18px_rgba(38,252,227,0.55)]'
                                : 'border-white/25 bg-[#0e0e0e] hover:border-[#58cac0]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between gap-1">
                    {TIME_STEPS.map((step) => {
                      const active = minutes === step;
                      return (
                        <button
                          key={`label-${step}`}
                          type="button"
                          tabIndex={-1}
                          aria-hidden
                          onClick={() => setMinutes(step)}
                          className={`flex-1 cursor-pointer text-center text-[10px] font-semibold tabular-nums transition-colors duration-200 sm:text-xs ${
                            active ? 'text-white' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {formatTrainingTime(step)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Level as stacked mission cards — not 3 equal pills */}
              <div>
                <h3 className="mb-4 text-sm font-bold text-white">۲ · سطح فعلی‌ات کجاست؟</h3>
                <div role="radiogroup" aria-label="سطح تمرین" className="flex flex-col gap-2">
                  {LEVELS.map((l) => {
                    const Icon = l.icon;
                    const active = levelId === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setLevelId(l.id)}
                        className={`flex min-h-[52px] cursor-pointer items-center gap-3 border px-3 py-3 text-right transition-all duration-200 touch-manipulation ${
                          active
                            ? 'border-[#26fce3]/45 bg-[#26fce3]/[0.08] shadow-[inset_3px_0_0_#26fce3]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                            active ? 'bg-[#187272]/50 text-[#26fce3]' : 'bg-white/5 text-white/50'
                          }`}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="flex-1">
                          <span
                            className={`block text-sm font-bold ${active ? 'text-white' : 'text-white/70'}`}
                          >
                            {l.label}
                          </span>
                          <span className="text-[11px] text-white/40">{l.hint}</span>
                        </span>
                        {active && (
                          <span className="text-[10px] font-bold tracking-wide text-[#26fce3]">
                            ACTIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IncomeCalculator;
