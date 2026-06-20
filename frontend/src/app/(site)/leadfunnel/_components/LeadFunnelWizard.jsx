"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { isValidIranPhone, toastError } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ANALYZING_MESSAGES,
  QUESTIONS,
  buildAnalysis,
} from "../_lib/funnelConfig";

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}

export default function LeadFunnelWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [config, setConfig] = useState(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({});
  const [analyzingMsg, setAnalyzingMsg] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const utmSource = searchParams.get("utm_source") || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  useEffect(() => {
    api.get("/public/funnel/config").then((res) => setConfig(res.data)).catch(() => {
      setConfig({
        coachName: "علی رشید آبادی",
        packageTitle: "پکیج مربیگری اختصاصی",
        amount: 2500000,
      });
    });
  }, []);

  const coachName = config?.coachName || "علی رشید آبادی";

  const analysis = useMemo(() => {
    if (step < 4 || !answers.primaryGoal) return null;
    return buildAnalysis(answers, coachName);
  }, [answers, coachName, step]);

  const totalSteps = 5;
  const progressValue = useMemo(() => {
    if (step <= 2) return ((step + 1) / totalSteps) * 100;
    if (step === 3) return 80;
    return 100;
  }, [step]);

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const goBack = useCallback(() => {
    if (step <= 0 || step === 3) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }, [step]);

  const selectOption = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
    setTimeout(goNext, 280);
  };

  useEffect(() => {
    if (step !== 3) return;
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % ANALYZING_MESSAGES.length;
      setAnalyzingMsg(msgIdx);
    }, 700);
    const doneTimer = setTimeout(() => {
      setDirection(1);
      setStep(4);
    }, 2800);
    return () => {
      clearInterval(msgTimer);
      clearTimeout(doneTimer);
    };
  }, [step]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      return toastError("اطلاعات ناقص", "نام و نام خانوادگی را وارد کنید.");
    }
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }
    if (!analysis) return;

    setSubmitting(true);
    try {
      const res = await api.post("/public/funnel/leads", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        primaryGoal: answers.primaryGoal,
        activityLevel: answers.activityLevel,
        mainObstacle: answers.mainObstacle,
        scenario: analysis.scenario,
        analysisTitle: analysis.title,
        analysisBody: analysis.sections.map((s) => `${s.title}\n${s.body}`).join("\n\n"),
        utmSource,
        utmCampaign,
      });
      const token = res.data?.checkoutToken;
      if (!token) throw new Error("no token");
      router.push(`/leadfunnel/payment?token=${token}`);
    } catch (err) {
      const msg = err?.response?.data?.error || "ثبت اطلاعات ناموفق بود.";
      toastError("خطا", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const scenarioColor = analysis?.meta?.color || "primary";

  return (
    <div dir="rtl" className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-chart-2/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Badge variant="outline" className="mb-4 gap-2 px-4 py-1.5">
            <Sparkles className="size-3.5 text-primary" />
            ارزیابی رایگان · استاد {coachName}
          </Badge>
          {step <= 2 && (
            <>
              <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
                {QUESTIONS[step]?.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {QUESTIONS[step]?.subtitle}
              </p>
            </>
          )}
        </motion.div>

        {step <= 2 && (
          <div className="mb-8 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>مرحله {step + 1} از {totalSteps}</span>
              <span>{Math.round(progressValue)}٪</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step <= 2 && (
            <motion.div
              key={`q-${step}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid gap-3"
            >
              {QUESTIONS[step].options.map((opt, i) => {
                const selected = answers[QUESTIONS[step].key] === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => selectOption(QUESTIONS[step].key, opt.value)}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-2xl border p-5 text-start transition-all duration-200",
                      "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                      selected
                        ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                        : "border-border bg-card/60 backdrop-blur-sm"
                    )}
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl transition-transform group-hover:scale-110">
                      {opt.emoji}
                    </span>
                    <span className="flex-1 text-sm font-medium leading-7 text-foreground md:text-base">
                      {opt.label}
                    </span>
                    <ArrowLeft className="size-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </motion.button>
                );
              })}

              {step > 0 && (
                <Button type="button" variant="ghost" onClick={goBack} className="mt-2 self-start">
                  <ArrowRight className="size-4" />
                  سوال قبل
                </Button>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-16 text-center"
            >
              <div className="relative mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="size-20 rounded-full border-2 border-primary/20 border-t-primary"
                />
                <Loader2 className="absolute inset-0 m-auto size-8 animate-spin text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">در حال تحلیل پاسخ‌های شما</h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={analyzingMsg}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {ANALYZING_MESSAGES[analyzingMsg]}
                </motion.p>
              </AnimatePresence>
              <div className="mt-8 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="size-2 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && analysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden border-primary/20 bg-card/80 py-0 shadow-xl backdrop-blur-sm">
                <div className={cn(
                  "bg-linear-to-l px-6 py-5",
                  scenarioColor === "rose" && "from-rose-500/20 via-rose-500/10 to-transparent",
                  scenarioColor === "emerald" && "from-emerald-500/20 via-emerald-500/10 to-transparent",
                  scenarioColor === "sky" && "from-sky-500/20 via-sky-500/10 to-transparent",
                )}>
                  <Badge className="mb-3">{analysis.meta.badge}</Badge>
                  <h2 className="text-xl font-extrabold text-foreground md:text-2xl">
                    {analysis.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{analysis.subtitle}</p>
                </div>

                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {analysis.highlights.map((h, i) => (
                      <motion.div
                        key={h.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="rounded-xl border border-border bg-muted/30 p-3 text-center"
                      >
                        <div className="text-xs text-muted-foreground">{h.label}</div>
                        <div className="mt-1 text-sm font-bold text-foreground">{h.value}</div>
                      </motion.div>
                    ))}
                  </div>

                  {analysis.sections.map((sec, i) => (
                    <motion.div
                      key={sec.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.12 }}
                      className="space-y-2"
                    >
                      <h3 className="text-sm font-bold text-primary">{sec.title}</h3>
                      <p className="text-sm leading-8 text-muted-foreground">{sec.body}</p>
                    </motion.div>
                  ))}

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h3 className="mb-3 text-sm font-bold text-foreground">پیشنهادهای کلیدی</h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec) => (
                        <li key={rec} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/80 bg-card/90 shadow-lg backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="size-5 text-primary" />
                    ثبت تحلیل و رزرو پکیج
                  </CardTitle>
                  <p className="text-sm leading-7 text-muted-foreground">{analysis.closing}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">نام</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="مثلاً سهیل"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">نام خانوادگی</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="مثلاً شورورزی"
                          className="h-11"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">شماره موبایل</Label>
                      <Input
                        id="phone"
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09150000000"
                        className="h-11 text-start"
                        required
                      />
                    </div>

                    {config?.amount && (
                      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">مبلغ پکیج: </span>
                        <span className="font-bold text-foreground">{formatToman(config.amount)}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="w-full rounded-full py-6 text-base font-bold"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          در حال ثبت...
                        </>
                      ) : (
                        <>
                          تأیید اطلاعات و رزرو پکیج مربیگری اختصاصی
                          <ArrowLeft className="size-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
