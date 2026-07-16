"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Settings2,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import {
  isValidIranPhone,
  normalizeIranPhone,
  toastError,
} from "@/app/(site)/auth/_components/helpers";
import { cn } from "@/lib/utils";
import {
  ANALYZING_STEPS,
  ANALYZING_TITLE,
  LEAD_COPY,
  METRICS_COPY,
  PREPARING_MESSAGES,
  QUESTIONS,
  RESULT_COPY,
  buildAnalysis,
  funnelProgress,
} from "../_lib/funnelConfig";
import FunnelHero from "./FunnelHero";
import FunnelShell, { FunnelCta, FunnelGlass, FunnelProgressBar } from "./FunnelShell";
import Typewriter from "./Typewriter";

const LAST_INDEX = QUESTIONS.length - 1;

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export default function LeadFunnelWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [config, setConfig] = useState(null);
  // hero | quiz | metrics | analyzing | result | lead
  const [stage, setStage] = useState("hero");
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState("typing");
  const [answers, setAnswers] = useState({});
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [prepMsg, setPrepMsg] = useState(0);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const lockTimer = useRef(null);

  const utmSource = searchParams.get("utm_source") || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  useEffect(() => {
    api
      .get("/public/funnel/config")
      .then((res) => setConfig(res.data))
      .catch(() => {
        setConfig({
          coachName: "علی رشید آبادی",
          packageTitle: "پکیج مربیگری اختصاصی",
          amount: 2500000,
        });
      });
  }, []);

  useEffect(() => () => clearTimeout(lockTimer.current), []);

  const coachName = config?.coachName || "علی رشید آبادی";
  const currentQ = QUESTIONS[qIndex];

  const analysis = useMemo(() => {
    if ((stage !== "result" && stage !== "lead") || !answers.primaryGoal) return null;
    return buildAnalysis(answers, coachName);
  }, [answers, coachName, stage]);

  useEffect(() => {
    if (stage !== "quiz" || phase !== "preparing") return;
    const rotate = setInterval(() => {
      setPrepMsg((m) => (m + 1) % PREPARING_MESSAGES.length);
    }, 420);
    const advance = setTimeout(() => {
      setQIndex((i) => Math.min(i + 1, LAST_INDEX));
      setPhase("typing");
    }, 1150);
    return () => {
      clearInterval(rotate);
      clearTimeout(advance);
    };
  }, [stage, phase]);

  useEffect(() => {
    if (stage !== "analyzing") return;
    const rotate = setInterval(() => {
      setAnalyzingStep((s) => Math.min(s + 1, ANALYZING_STEPS.length));
    }, 1100);
    const done = setTimeout(() => setStage("result"), 4800);
    return () => {
      clearInterval(rotate);
      clearTimeout(done);
    };
  }, [stage]);

  const startQuiz = useCallback(() => {
    setAnswers({});
    setQIndex(0);
    setPhase("typing");
    setAge("");
    setHeightCm("");
    setWeightKg("");
    setStage("quiz");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const onTitleDone = useCallback(() => {
    setPhase((p) => (p === "typing" ? "options" : p));
  }, []);

  const selectOption = (value) => {
    if (phase !== "options") return;
    setAnswers((prev) => ({ ...prev, [currentQ.key]: value }));
    setPhase("locking");
    lockTimer.current = setTimeout(() => {
      if (qIndex >= LAST_INDEX) {
        setAnalyzingStep(0);
        setStage("metrics");
      } else {
        setPrepMsg(0);
        setPhase("preparing");
      }
    }, 320);
  };

  const goBack = () => {
    if (phase !== "options" || qIndex <= 0) return;
    clearTimeout(lockTimer.current);
    setQIndex((i) => i - 1);
    setPhase("options");
  };

  const submitMetrics = (e) => {
    e.preventDefault();
    const a = Number(age);
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!a || a < 14 || a > 80) {
      return toastError("سن نامعتبر", "سن را بین ۱۴ تا ۸۰ وارد کنید.");
    }
    if (!h || h < 120 || h > 230) {
      return toastError("قد نامعتبر", "قد را به سانتی‌متر وارد کنید.");
    }
    if (!w || w < 35 || w > 250) {
      return toastError("وزن نامعتبر", "وزن را به کیلوگرم وارد کنید.");
    }
    setAnswers((prev) => ({ ...prev, age: a, heightCm: h, weightKg: w }));
    setAnalyzingStep(0);
    setStage("analyzing");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName } = splitFullName(fullName);
    if (!firstName) {
      return toastError("اطلاعات ناقص", "نام و نام خانوادگی را وارد کنید.");
    }
    const normalizedPhone = normalizeIranPhone(phone);
    if (!isValidIranPhone(normalizedPhone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }
    setPhone(normalizedPhone);
    if (!analysis) return;

    setSubmitting(true);
    try {
      const metricsLine =
        answers.age && answers.heightCm && answers.weightKg
          ? `\n\nشاخص‌ها: سن ${answers.age} | قد ${answers.heightCm} | وزن ${answers.weightKg} | BMR ${analysis.bmr ?? "—"} | تیپ ${analysis.bodyType}`
          : "";
      const res = await api.post("/public/funnel/leads", {
        firstName,
        lastName,
        phone: normalizedPhone,
        primaryGoal: answers.primaryGoal,
        activityLevel: answers.activityLevel,
        trainingEnv: answers.trainingEnv,
        experience: answers.experience,
        nutritionChallenge: answers.nutritionChallenge,
        mainObstacle: answers.mainObstacle,
        commitment: answers.commitment,
        scenario: analysis.scenario,
        analysisTitle: analysis.title,
        analysisBody:
          analysis.sections.map((s) => `${s.title}\n${s.body}`).join("\n\n") + metricsLine,
        utmSource,
        utmCampaign,
      });
      const token = res.data?.checkoutToken;
      if (!token) throw new Error("no token");
      router.push(`/ali-rashidabadi/payment?token=${token}`);
    } catch (err) {
      const msg = err?.response?.data?.error || "ثبت اطلاعات ناموفق بود.";
      toastError("خطا", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "hero") {
    return <FunnelHero coachName={coachName} onStart={startQuiz} />;
  }

  const progressValue = funnelProgress(stage, qIndex);
  const showProgress = stage !== "result";

  return (
    <FunnelShell>
      {showProgress && (
        <FunnelProgressBar
          value={progressValue}
          label={`پردازش پردازنده هوشمند: ${Math.round(progressValue)}٪`}
        />
      )}

      <AnimatePresence mode="wait">
        {stage === "quiz" && phase === "preparing" && (
          <motion.div
            key="preparing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-20 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              className="mb-6 size-14 rounded-full border-2 border-primary/25 border-t-primary"
            />
            <AnimatePresence mode="wait">
              <motion.p
                key={prepMsg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm font-medium text-white/70"
              >
                {PREPARING_MESSAGES[prepMsg]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {stage === "quiz" && phase !== "preparing" && (
          <motion.div
            key={`q-${qIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            className="min-h-[20rem]"
          >
            <div className="mb-8 text-center">
              <p className="mb-3 text-xs text-white/40">
                سوال {qIndex + 1} از {QUESTIONS.length}
              </p>
              <h1 className="min-h-[3.5rem] text-2xl font-extrabold leading-relaxed text-white md:text-3xl">
                {phase === "typing" ? (
                  <Typewriter
                    key={`tw-${qIndex}`}
                    text={currentQ.title}
                    speed={36}
                    onDone={onTitleDone}
                  />
                ) : (
                  currentQ.title
                )}
              </h1>
              <AnimatePresence>
                {phase !== "typing" && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-white/50 md:text-base"
                  >
                    {currentQ.subtitle}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {phase !== "typing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
                  {currentQ.options.map((opt, i) => {
                    const selected = answers[currentQ.key] === opt.value;
                    const locked = phase === "locking";
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        disabled={locked}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.35 }}
                        onClick={() => selectOption(opt.value)}
                        className={cn(
                          "group flex w-full items-center gap-4 rounded-2xl border p-5 text-start transition-all duration-200",
                          "bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06]",
                          !locked && "hover:scale-[1.015]",
                          selected
                            ? "border-primary/60 shadow-[0_0_24px_-6px_oklch(0.58_0.11_187_/_0.4)]"
                            : "border-white/10 hover:border-primary/40"
                        )}
                      >
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl">
                          {opt.emoji}
                        </span>
                        <span className="flex-1 text-sm font-medium leading-7 text-white/90 md:text-base">
                          {opt.label}
                        </span>
                        {selected ? (
                          <CheckCircle2 className="size-5 shrink-0 text-primary" />
                        ) : (
                          <ArrowLeft className="size-5 shrink-0 text-white/25 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </motion.button>
                    );
                  })}

                  {qIndex > 0 && phase === "options" && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="mt-1 flex items-center gap-2 self-start text-sm text-white/40 hover:text-white/70"
                    >
                      <ArrowRight className="size-4" />
                      سوال قبل
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {stage === "metrics" && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-extrabold leading-relaxed text-white md:text-3xl">
                {METRICS_COPY.title}
              </h1>
              <p className="mt-3 text-sm leading-8 text-white/55 md:text-base">
                {METRICS_COPY.guide}
              </p>
            </div>

            <FunnelGlass className="p-6">
              <form onSubmit={submitMetrics} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { id: "age", label: "سن (سال)", value: age, set: setAge, placeholder: "۲۸" },
                    {
                      id: "height",
                      label: "قد (سانتی‌متر)",
                      value: heightCm,
                      set: setHeightCm,
                      placeholder: "۱۷۸",
                    },
                    {
                      id: "weight",
                      label: "وزن فعلی (کیلوگرم)",
                      value: weightKg,
                      set: setWeightKg,
                      placeholder: "۸۲",
                    },
                  ].map((field) => (
                    <label key={field.id} className="block space-y-2 text-start">
                      <span className="text-xs text-white/50">{field.label}</span>
                      <input
                        id={field.id}
                        type="number"
                        inputMode="numeric"
                        dir="ltr"
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        required
                        className="h-12 w-full rounded-xl border border-white/15 bg-black/40 px-3 text-center text-lg font-bold text-white outline-none transition placeholder:text-white/25 focus:border-primary/60 focus:shadow-[0_0_0_3px_oklch(0.58_0.11_187_/_0.2)]"
                      />
                    </label>
                  ))}
                </div>
                <FunnelCta type="submit">
                  <Settings2 className="size-5" />
                  {METRICS_COPY.cta}
                </FunnelCta>
              </form>
            </FunnelGlass>
          </motion.div>
        )}

        {stage === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10 text-center"
          >
            <div className="relative mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                className="size-24 rounded-full border-2 border-primary/20 border-t-primary border-r-chart-2/50"
              />
              <div className="absolute inset-0 m-auto size-14 rounded-full border border-white/10 bg-white/5 backdrop-blur" />
            </div>
            <h2 className="max-w-md text-lg font-bold leading-8 text-white md:text-xl">
              {ANALYZING_TITLE}
            </h2>
            <ul className="mt-8 w-full max-w-lg space-y-3 text-start">
              {ANALYZING_STEPS.map((step, i) => {
                const done = i < analyzingStep;
                const active = i === analyzingStep;
                return (
                  <motion.li
                    key={step}
                    initial={{ opacity: 0.25 }}
                    animate={{ opacity: done || active ? 1 : 0.3 }}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-7",
                      done
                        ? "border-primary/30 bg-primary/10 text-white/90"
                        : "border-white/10 bg-white/[0.03] text-white/45"
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    ) : active ? (
                      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
                    ) : (
                      <span className="mt-1.5 size-4 shrink-0 rounded-full border border-white/20" />
                    )}
                    <span className="font-mono text-[13px] tracking-tight">{step}</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {stage === "result" && analysis && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-white md:text-2xl">{analysis.title}</h2>
              <p className="mt-2 text-sm text-white/50">{analysis.subtitle}</p>
            </div>

            <FunnelGlass className="overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4">
                <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {analysis.meta.badge}
                </span>
              </div>
              <div className="space-y-6 p-5 md:p-6">
                <div className="grid grid-cols-2 gap-3">
                  {analysis.highlights.map((h, i) => (
                    <motion.div
                      key={h.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.06 }}
                      className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center"
                    >
                      <div className="text-[11px] text-white/45">{h.label}</div>
                      <div className="mt-1 text-sm font-bold text-white">{h.value}</div>
                    </motion.div>
                  ))}
                </div>

                {analysis.chartBars && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-white/45">نمای بیومکانیک تخمینی</p>
                    {analysis.chartBars.map((bar) => (
                      <div key={bar.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs text-white/55">
                          <span>{bar.label}</span>
                          <span className="tabular-nums">{bar.value}٪</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${bar.value}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full rounded-full bg-gradient-to-l from-primary to-chart-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-orange-400/35 bg-orange-500/10 p-4 shadow-[0_0_28px_-10px_rgba(251,146,60,0.4)]">
                  <p className="text-xs font-bold text-orange-300">هشدار هوش مصنوعی</p>
                  <p className="mt-2 text-sm leading-8 text-orange-50/90">{analysis.aiWarning}</p>
                </div>

                {analysis.sections.map((sec, i) => (
                  <motion.div
                    key={sec.title}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.1 }}
                    className="space-y-2"
                  >
                    <h3 className="text-sm font-bold text-primary">{sec.title}</h3>
                    <p className="text-sm leading-8 text-white/60">{sec.body}</p>
                  </motion.div>
                ))}
              </div>
            </FunnelGlass>

            <FunnelCta onClick={() => setStage("lead")}>
              {RESULT_COPY.cta}
              <ArrowLeft className="size-5" />
            </FunnelCta>
          </motion.div>
        )}

        {stage === "lead" && analysis && (
          <motion.div
            key="lead"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-white md:text-2xl">{LEAD_COPY.title}</h2>
              <p className="mt-3 text-sm leading-8 text-white/55">{LEAD_COPY.subtitle}</p>
            </div>

            <FunnelGlass className="p-6" glow="green">
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-2 text-start">
                  <span className="text-xs text-white/50">نام و نام خانوادگی</span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="نام و نام خانوادگی"
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary/50"
                  />
                </label>
                <label className="block space-y-2 text-start">
                  <span className="text-xs text-white/50">شماره موبایل</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(normalizeIranPhone(e.target.value))}
                    placeholder="09123456789"
                    required
                    className="h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-start text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary/50"
                  />
                </label>
                <FunnelCta type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <Lock className="size-5" />
                      {LEAD_COPY.cta}
                    </>
                  )}
                </FunnelCta>
              </form>
            </FunnelGlass>
          </motion.div>
        )}
      </AnimatePresence>
    </FunnelShell>
  );
}
