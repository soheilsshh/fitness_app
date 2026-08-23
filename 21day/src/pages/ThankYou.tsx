import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, MessageSquareText, Timer, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import FitinoBrandMark from "@/components/FitinoBrandMark";

const NEXT_STEPS = [
  {
    id: "sms",
    step: "۰۱",
    title: "لینک روی شمارهٔ توست",
    body: "پیام دسترسی همین الان برات ارسال شده — گوشی رو چک کن.",
    icon: MessageSquareText,
    tone: "bg-[#26fce3] text-[#0a1a18]",
  },
  {
    id: "time",
    step: "۰۲",
    title: "۷۲ ساعت فرصت داری",
    body: "پنجرهٔ تماشا محدود است؛ هرچه زودتر شروع کنی، جلوتری.",
    icon: Timer,
    tone: "bg-[#f5f5f0] text-[#0e0e0e]",
  },
  {
    id: "gift",
    step: "۰۳",
    title: "هدیه بعد از تکمیل",
    body: "با تمام کردن دوره، هدیهٔ ویژهٔ فیتینو مال توست.",
    icon: Gift,
    tone: "bg-[#187272] text-[#e8fffb]",
  },
] as const;

const ThankYou = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUser();
  const reduceMotion = useReducedMotion();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          navigate("/videos");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLoggedIn, navigate]);

  const goToVideos = () => navigate("/videos");

  const reveal = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
        },
      };

  const stagger = reduceMotion
    ? { visible: { transition: { staggerChildren: 0 } } }
    : { visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } } };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0c0c] text-[#f8fafc]">
      {/* Geometric field — not aurora blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -start-16 h-72 w-72 rotate-12 bg-[#26fce3]/20" />
        <div className="absolute top-1/3 -end-10 h-56 w-56 -rotate-6 bg-[#58cac0]/25" />
        <div className="absolute bottom-0 start-1/4 h-40 w-[120%] -rotate-2 bg-[#187272]/40" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        className="relative z-10 mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Hero block */}
        <motion.section
          variants={reveal}
          className="flex flex-col justify-between gap-10 border-b border-white/10 p-6 sm:p-10 lg:border-b-0 lg:border-e lg:border-white/10 lg:p-12"
        >
          <div className="flex items-center gap-3">
            <FitinoBrandMark size={44} pulse={!reduceMotion} />
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight">فیتینو</p>
              <p className="text-xs text-white/55">مسیر ۲۱ روزه</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 bg-[#26fce3] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0a1a18]">
              ثبت‌نام قطعی شد
            </p>

            <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              خوش اومدی
              <span className="mt-2 block text-[#26fce3]">به جمع سازنده‌ها</span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
              ثبت‌نامت کامل شد. از اینجا فقط یک کار مونده: ویدیوها رو باز کن و
              مسیر رو شروع کن.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              onClick={goToVideos}
              className="h-14 w-full max-w-md cursor-pointer rounded-none bg-[#26fce3] px-8 text-base font-extrabold text-[#0a1a18] transition-colors duration-200 hover:bg-[#7dffe8] focus-visible:ring-2 focus-visible:ring-[#26fce3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c0c]"
            >
              <Play className="ms-1 h-5 w-5" aria-hidden />
              شروع تماشای ویدیوها
              <ArrowLeft className="me-1 h-5 w-5" aria-hidden />
            </Button>

            {isLoggedIn && countdown > 0 && (
              <div
                className="flex max-w-md items-center gap-4 border border-white/15 bg-white/[0.04] px-4 py-3"
                role="status"
                aria-live="polite"
              >
                <div
                  className="relative grid h-12 w-12 place-items-center font-extrabold tabular-nums text-[#26fce3]"
                  style={{
                    background: `conic-gradient(#26fce3 ${(countdown / 5) * 360}deg, rgba(255,255,255,0.12) 0)`,
                  }}
                >
                  <span className="absolute inset-[3px] grid place-items-center bg-[#0a0c0c] text-lg">
                    {countdown}
                  </span>
                </div>
                <p className="text-sm text-white/75">
                  انتقال خودکار به صفحهٔ ویدیوها در{" "}
                  <span className="font-bold text-white">{countdown}</span> ثانیه
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Next-step color blocks */}
        <motion.section
          variants={reveal}
          className="flex flex-col justify-center gap-3 p-6 sm:p-10 lg:gap-4 lg:p-12"
          aria-label="قدم‌های بعدی"
        >
          <p className="mb-2 text-xs font-bold tracking-[0.2em] text-white/45">
            قدم بعدی
          </p>

          {NEXT_STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.id}
                variants={reveal}
                className={`group relative flex gap-4 p-5 sm:p-6 ${item.tone} transition-transform duration-200 hover:-translate-y-0.5`}
                style={{ marginInlineStart: reduceMotion ? 0 : `${index * 4}%` }}
              >
                <div className="flex flex-col items-start gap-3">
                  <span className="text-3xl font-black leading-none opacity-35 sm:text-4xl">
                    {item.step}
                  </span>
                  <Icon className="h-6 w-6" aria-hidden strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1 self-center">
                  <h2 className="text-lg font-extrabold sm:text-xl">{item.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-80 sm:text-[0.95rem]">
                    {item.body}
                  </p>
                </div>
              </motion.article>
            );
          })}

          <p className="mt-4 text-center text-xs text-white/40 lg:text-start">
            لینک‌های دسترسی به شمارهٔ شما ارسال شد
          </p>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default ThankYou;
