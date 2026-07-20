"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  normalizeNumericInput,
  toPersianDigits,
  toastError,
} from "@/app/(site)/auth/_components/helpers";
import { cn } from "@/lib/utils";
import {
  ANALYZING_STEPS,
  ANALYZING_TITLE,
  COACH_SHORT_NAME,
  LEAD_COPY,
  METRICS_COPY,
  PREPARING_MESSAGES,
  QUESTIONS,
  RESULT_COPY,
  buildAnalysis,
  funnelProgress,
} from "../_lib/funnelConfig";
import {
  clearFunnelDraft,
  hasFunnelProgress,
  loadFunnelDraft,
  saveFunnelDraft,
} from "../_lib/funnelDraft";
import AnalysisNarrative from "./AnalysisNarrative";
import AnalysisVisuals from "./AnalysisVisuals";
import FinalAnalyzeLoader from "./FinalAnalyzeLoader";
import FunnelHero from "./FunnelHero";
import { LogoAnchor } from "./FunnelLogoLayer";
import FunnelShell, { FunnelCta, FunnelGlass, FunnelProgressBar } from "./FunnelShell";
import PaymentConversionBlocks from "./PaymentConversionBlocks";
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
  const [ready, setReady] = useState(false);
  // hero | quiz | metrics | analyzing | result | lead
  const [stage, setStage] = useState("hero");
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState("typing");
  const [answers, setAnswers] = useState({});
  const [prepMsg, setPrepMsg] = useState(0);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const lockTimer = useRef(null);
  const persistReady = useRef(false);

  const utmSource = searchParams.get("utm_source") || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  // Restore mid-funnel progress so leaving the page does not restart from hero.
  useEffect(() => {
    const draft = loadFunnelDraft();
    if (draft && hasFunnelProgress(draft)) {
      if (draft.stage === "checkout" && draft.checkoutToken) {
        persistReady.current = true;
        setReady(true);
        router.replace(`/ali-rashidabadi/payment?token=${draft.checkoutToken}`);
        return;
      }
      setAnswers(draft.answers || {});
      setQIndex(draft.qIndex || 0);
      setAge(draft.age || "");
      setHeightCm(draft.heightCm || "");
      setWeightKg(draft.weightKg || "");
      setFullName(draft.fullName || "");
      setPhone(draft.phone || "");
      setPhase("options");
      setStage(draft.stage === "hero" ? "quiz" : draft.stage);
    }
    persistReady.current = true;
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!persistReady.current || !ready) return;
    if (stage === "hero") return;
    saveFunnelDraft({
      stage,
      qIndex,
      answers,
      age,
      heightCm,
      weightKg,
      fullName,
      phone,
    });
  }, [ready, stage, qIndex, answers, age, heightCm, weightKg, fullName, phone]);

  useEffect(() => {
    api
      .get("/public/funnel/config")
      .then((res) => setConfig(res.data))
      .catch(() => {
        setConfig({
          coachName: COACH_SHORT_NAME,
          coachSlug: "ali-rashidabadi",
          plans: [],
        });
      });
  }, []);

  useEffect(() => () => clearTimeout(lockTimer.current), []);

  // Result/lead are tall; sticky CTA + scroll anchoring otherwise opens at the bottom.
  useLayoutEffect(() => {
    if (stage !== "result" && stage !== "lead") return;
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    toTop();
    const raf = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const coachName = config?.coachName || COACH_SHORT_NAME;
  const currentQ = QUESTIONS[qIndex];

  const analysis = useMemo(() => {
    if ((stage !== "result" && stage !== "lead") || !answers.primaryGoal) return null;
    return buildAnalysis(answers, coachName);
  }, [answers, coachName, stage]);

  useEffect(() => {
    if (stage !== "quiz" || phase !== "preparing") return;
    const MSG_MS = 500;
    const rotate = setInterval(() => {
      setPrepMsg((m) => (m + 1) % PREPARING_MESSAGES.length);
    }, MSG_MS);
    const advance = setTimeout(() => {
      setQIndex((i) => Math.min(i + 1, LAST_INDEX));
      setPhase("typing");
    }, PREPARING_MESSAGES.length * MSG_MS);
    return () => {
      clearInterval(rotate);
      clearTimeout(advance);
    };
  }, [stage, phase]);

  const startQuiz = useCallback(() => {
    const draft = loadFunnelDraft();
    if (draft && hasFunnelProgress(draft)) {
      if (draft.stage === "checkout" && draft.checkoutToken) {
        router.push(`/ali-rashidabadi/payment?token=${draft.checkoutToken}`);
        return;
      }
      setAnswers(draft.answers || {});
      setQIndex(draft.qIndex || 0);
      setAge(draft.age || "");
      setHeightCm(draft.heightCm || "");
      setWeightKg(draft.weightKg || "");
      setFullName(draft.fullName || "");
      setPhone(draft.phone || "");
      setPhase("options");
      setStage(draft.stage === "hero" ? "quiz" : draft.stage);
    } else {
      clearFunnelDraft();
      setAnswers({});
      setQIndex(0);
      setPhase("typing");
      setAge("");
      setHeightCm("");
      setWeightKg("");
      setFullName("");
      setPhone("");
      setStage("quiz");
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [router]);

  const onTitleDone = useCallback(() => {
    setPhase((p) => (p === "typing" ? "options" : p));
  }, []);

  const selectOption = (value) => {
    if (phase !== "options") return;
    setAnswers((prev) => ({ ...prev, [currentQ.key]: value }));
    setPhase("locking");
    lockTimer.current = setTimeout(() => {
      if (qIndex >= LAST_INDEX) {
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
    const a = Number(normalizeNumericInput(age));
    const h = Number(normalizeNumericInput(heightCm));
    const w = Number(normalizeNumericInput(weightKg, { allowDecimal: true }));
    if (!a || a < 14 || a > 80) {
      return toastError("سن نامعتبر", "سن را بین ۱۴ تا ۸۰ وارد کنید.");
    }
    if (!h || h < 120 || h > 230) {
      return toastError("قد نامعتبر", "قد را به سانتی‌متر وارد کنید.");
    }
    if (!w || w < 35 || w > 250) {
      return toastError("وزن نامعتبر", "وزن را به کیلوگرم وارد کنید.");
    }
    setAge(String(a));
    setHeightCm(String(h));
    setWeightKg(String(w));
    setAnswers((prev) => ({ ...prev, age: a, heightCm: h, weightKg: w }));
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
          ? `\n\nشاخص‌ها: سن ${answers.age} | قد ${answers.heightCm} | وزن ${answers.weightKg} | BMR ${analysis.bmr ?? "—"} | تیپ ${analysis.bodyType} | موفقیت ${analysis.successPct ?? "—"}٪`
          : "";
      const narrativeBody = [
        analysis.statusSummary &&
          `${analysis.statusSummary.title}\n${analysis.statusSummary.body}`,
        analysis.customSolution &&
          `${analysis.customSolution.title}\n${analysis.customSolution.body}`,
        analysis.routePrediction &&
          `${analysis.routePrediction.title}\n${analysis.routePrediction.body}`,
      ]
        .filter(Boolean)
        .join("\n\n");
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
        analysisBody: (narrativeBody || analysis.sections.map((s) => `${s.title}\n${s.body}`).join("\n\n")) + metricsLine,
        utmSource,
        utmCampaign,
      });
      const token = res.data?.checkoutToken;
      if (!token) throw new Error("no token");
      saveFunnelDraft({
        stage: "checkout",
        checkoutToken: token,
        answers,
        qIndex,
        age,
        heightCm,
        weightKg,
        fullName,
        phone: normalizedPhone,
      });
      router.push(`/ali-rashidabadi/payment?token=${token}`);
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "already_subscribed") {
        toastError("برنامه فعال دارید", "شما قبلاً برنامه فعال دارید. به پنل کاربری بروید.");
        router.push(err?.response?.data?.panelUrl || "/user/dashboard");
        return;
      }
      const msg = err?.response?.data?.error || "ثبت اطلاعات ناموفق بود.";
      toastError("خطا", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#0e0e0e] text-white/50">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (stage === "hero") {
    const canResume = hasFunnelProgress(loadFunnelDraft());
    return <FunnelHero coachName={coachName} onStart={startQuiz} resume={canResume} />;
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
            <LogoAnchor id="preparing" size={88} thinking className="mb-6 rounded-full" />
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
              <LogoAnchor
                id="quiz"
                size={56}
                thinking={phase === "typing"}
                className="mx-auto mb-4 rounded-full"
              />
              <p className="mb-3 text-xs text-white/40">
                سوال {qIndex + 1} از {QUESTIONS.length}
              </p>
              <h1 className="min-h-[3.5rem] text-2xl font-extrabold leading-relaxed text-white md:text-3xl">
                {phase === "typing" ? (
                  <Typewriter key={`tw-${qIndex}`} text={currentQ.title} onDone={onTitleDone} />
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
              <LogoAnchor id="metrics" size={64} className="mx-auto mb-4 rounded-full" />
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
                    {
                      id: "age",
                      label: "سن (سال)",
                      value: age,
                      set: setAge,
                      placeholder: "۲۸",
                      allowDecimal: false,
                    },
                    {
                      id: "height",
                      label: "قد (سانتی‌متر)",
                      value: heightCm,
                      set: setHeightCm,
                      placeholder: "۱۷۸",
                      allowDecimal: false,
                    },
                    {
                      id: "weight",
                      label: "وزن فعلی (کیلوگرم)",
                      value: weightKg,
                      set: setWeightKg,
                      placeholder: "۸۲",
                      allowDecimal: true,
                    },
                  ].map((field) => (
                    <label key={field.id} className="block space-y-2 text-start">
                      <span className="text-xs text-white/50">{field.label}</span>
                      <input
                        id={field.id}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9۰-۹٠-٩.]*"
                        dir="rtl"
                        lang="fa"
                        autoComplete="off"
                        value={field.value ? toPersianDigits(field.value) : ""}
                        onChange={(e) =>
                          field.set(
                            normalizeNumericInput(e.target.value, {
                              allowDecimal: field.allowDecimal,
                            })
                          )
                        }
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
          >
            <FinalAnalyzeLoader
              title={ANALYZING_TITLE}
              steps={ANALYZING_STEPS}
              onComplete={() => setStage("result")}
            />
          </motion.div>
        )}

        {stage === "result" && analysis && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 [overflow-anchor:none]"
          >
            <div className="text-center">
              <LogoAnchor id="result" size={64} className="mx-auto mb-3 rounded-full" />
              <h2 className="text-xl font-extrabold text-white md:text-2xl">{analysis.title}</h2>
              <p className="mt-2 text-sm text-white/50">{analysis.subtitle}</p>
            </div>

            <FunnelGlass className="overflow-hidden">
              <div className="flex justify-end border-b border-white/10 px-4 py-4 sm:px-5">
                <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {analysis.meta.badge}
                </span>
              </div>
              <div className="space-y-6 p-5 md:p-6">
                <AnalysisVisuals analysis={analysis} />

                <div className="rounded-2xl border border-orange-400/35 bg-orange-500/10 p-4 shadow-[0_0_28px_-10px_rgba(251,146,60,0.4)]">
                  <p className="text-xs font-bold text-orange-300">هشدار هوش مصنوعی</p>
                  <p className="mt-2 text-sm leading-8 text-orange-50/90">{analysis.aiWarning}</p>
                </div>

                <AnalysisNarrative analysis={analysis} />
              </div>
            </FunnelGlass>

            <PaymentConversionBlocks storageKey="result" />

            <div className="sticky bottom-0 z-30 -mx-4 mt-1 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e] via-60% to-transparent px-4 pb-4 pt-6 [overflow-anchor:none]">
              <FunnelCta onClick={() => setStage("lead")}>
                {RESULT_COPY.cta}
              </FunnelCta>
            </div>
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
              <LogoAnchor id="lead" size={64} className="mx-auto mb-3 rounded-full" />
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
