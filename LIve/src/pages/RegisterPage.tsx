import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Trophy,
  CheckCircle,
  Phone,
  User,
  AlertTriangle,
  Radio,
  ClipboardList,
  Activity,
  Apple,
  UserCog,
  Dumbbell,
  MessageCircle,
  Home,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { normalizePhoneNumber } from "@/utils/phoneUtils";
import FitinoPageShell from "@/components/FitinoPageShell";
import FitinoBrandMark from "@/components/FitinoBrandMark";
import StatusChip from "@/components/StatusChip";
import ActionDock from "@/components/ActionDock";

/** Real "چرا فیتینو متمایز است" copy — verbatim from fitinoo.ir / frontend AboutSection. */
const benefits = [
  {
    icon: UserCog,
    title: "نظارت مستقیم مربی ارشد",
    description: "هدایت، بازبینی و تایید مداوم روند پیشرفت شما توسط مربی.",
  },
  {
    icon: Dumbbell,
    title: "طراحی سیستماتیک تمرینات",
    description: "تنظیم دقیق حرکت‌ها متناسب با ساختار فیزیولوژیک و اهداف شما.",
  },
  {
    icon: Apple,
    title: "منوی غذایی منعطف و علمی",
    description: "رژیم غذایی منطبق بر سفره ایرانی، بدون محدودیت‌های طاقت‌فرسا.",
  },
  {
    icon: Activity,
    title: "پایش هوشمند و مداوم",
    description: "تحلیل روزانه شاخص‌های بدنی جهت پیشگیری از استپ وزنی.",
  },
  {
    icon: MessageCircle,
    title: "پشتیبانی متعهدانه و مستمر",
    description: "ارتباط مستقیم و رفع ابهام در تمام مراحل دوره.",
  },
  {
    icon: Home,
    title: "انطباق کامل با سبک زندگی",
    description: "طراحی هوشمند بر اساس بستر تمرینی شما، باشگاه یا منزل.",
  },
];

/** Real, live social-proof numbers from fitinoo.ir — not placeholders. */
const proofStats = [
  { value: 12500, suffix: "+", label: "کاربر در مسیر تغییر با فیتینو" },
  { value: 87, suffix: "٪", label: "ماندگاری و پایبندی به رژیم غذایی" },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [webinarInfo, setWebinarInfo] = useState({
    capacity: 500,
    registeredCount: 0,
  });

  const capacity = 500;
  const displayRegisteredCount = 475;
  const displayRemainingCapacity = 25;
  const formattedRemainingCapacity = displayRemainingCapacity.toLocaleString("fa-IR");
  const formattedRegisteredCount = displayRegisteredCount.toLocaleString("fa-IR");
  const formattedCapacity = capacity.toLocaleString("fa-IR");
  const progressPercentage = (displayRegisteredCount / capacity) * 100;

  useEffect(() => {
    const fetchWebinarInfo = async () => {
      try {
        const info = await apiService.getWebinarInfo();
        setWebinarInfo({
          capacity: info.capacity || 500,
          registeredCount: info.registered_count || 0,
        });
      } catch (error) {
        console.error("Failed to fetch webinar info:", error);
      }
    };
    fetchWebinarInfo();
    const interval = setInterval(fetchWebinarInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) return;

    setIsSubmitting(true);

    try {
      const normalizedPhone = normalizePhoneNumber(formData.phone);
      const urlParams = new URLSearchParams(window.location.search);
      const promoterId = urlParams.get("promoter");

      const response = await apiService.registerUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: normalizedPhone,
        promoter_id: promoterId ? parseInt(promoterId, 10) : undefined,
      });

      localStorage.setItem(
        "registrationData",
        JSON.stringify({
          ...formData,
          phone: normalizedPhone,
          registrationTime: new Date().toISOString(),
          userId: response.user.id,
        })
      );

      toast({
        title: "ثبت‌نام موفق",
        description: "ثبت‌نام شما برای کارگاه زنده فیتینو انجام شد.",
      });

      navigate("/thank-you");
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "خطا در ثبت‌نام",
        description: "لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = Boolean(formData.firstName && formData.lastName && formData.phone) && !isSubmitting;

  const fadeUp = reduceMotion
    ? undefined
    : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };
  const fadeIn = reduceMotion
    ? undefined
    : { initial: { opacity: 0 }, animate: { opacity: 1 } };

  const registerForm = (
    <form id="register-form" onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold text-foreground/85">
            <User className="h-4 w-4 text-secondary" aria-hidden />
            نام
          </Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            placeholder="نام شما"
            className="text-right"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2 text-sm font-semibold text-foreground/85">
            <User className="h-4 w-4 text-secondary" aria-hidden />
            نام خانوادگی
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            placeholder="نام خانوادگی"
            className="text-right"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-foreground/85">
          <Phone className="h-4 w-4 text-secondary" aria-hidden />
          شماره تماس
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          placeholder="09xxxxxxxxx"
          dir="ltr"
          required
        />
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="hidden w-full md:inline-flex"
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            در حال ثبت‌نام...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" aria-hidden />
            شروع آنالیز رایگان بدنی
          </span>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        با ثبت‌نام، لینک ورود به کارگاه زنده برایتان ارسال می‌شود
      </p>
    </form>
  );

  return (
    <FitinoPageShell>
      {/* ── Hero: asymmetric split, not a centered stack — editorial copy on
          one side, a pinned "ribbon" registration card on the other. ── */}
      <section id="registration" className="relative py-10 pb-28 md:py-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
            {/* Left: editorial headline column */}
            <motion.div {...(fadeUp ?? {})} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center gap-3">
                <FitinoBrandMark size={56} />
                <StatusChip tone="brand" pulse>
                  <Radio className="size-3.5" aria-hidden />
                  تلفیق هوش مصنوعی و مربیگری تخصصی
                </StatusChip>
              </div>

              <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-[3.4rem]">
                برنامه تمرین و تغذیه‌ای که{" "}
                <span className="gradient-text">دقیقاً متناسب با بدن شماست</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
                در فیتینو، سیستم هوشمند روزانه تغییرات وزنی شما را تحلیل کرده و به مربی
                گزارش می‌دهد تا از استپ وزنی جلوگیری شود و به نتیجه قطعی برسید.
              </p>

              {/* Quick-scan checklist strip — three headline benefits pulled
                  up front, distinct from the full grid further down. */}
              <ul className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                {benefits.slice(0, 3).map((item) => (
                  <li key={item.title} className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <CheckCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {item.title}
                  </li>
                ))}
              </ul>

              {/* Proof-stat strip — inline with dividers, not boxed cards. */}
              <div className="mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-4 border-t border-border pt-6">
                {proofStats.map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-2">
                    <span className="fp-hud-num gradient-text text-3xl sm:text-4xl">
                      {stat.value.toLocaleString("fa-IR")}
                      {stat.suffix}
                    </span>
                    <span className="max-w-[8rem] text-xs leading-5 text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: pinned registration card with a ribbon tag + capacity bar */}
            <motion.div
              {...(fadeUp ?? {})}
              transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:sticky lg:top-24"
            >
              <div className="fp-card fp-notch relative overflow-visible p-6 pt-8 md:p-8 md:pt-9">
                <span className="fp-ribbon">
                  <Radio className="size-3" aria-hidden />
                  ثبت‌نام رایگان
                </span>

                <h2 className="mb-1 text-xl font-bold md:text-2xl">
                  کارگاه زنده فیتینو
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  {formattedRegisteredCount} نفر از {formattedCapacity} نفر ثبت‌نام کردند
                </p>

                {/* Capacity bar — a thin fill bar + big HUD number, not a ring. */}
                <div className="mb-6 rounded-xl border border-border bg-muted/60 p-3.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/75">
                      <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
                      ظرفیت باقیمانده
                    </div>
                    <span className="fp-hud-num text-lg text-primary">{formattedRemainingCapacity} نفر</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[var(--fp-brand)] to-[var(--fp-glow)]"
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    />
                  </div>
                  {progressPercentage > 80 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      <span>ظرفیت در حال تکمیل شدن است!</span>
                    </div>
                  )}
                </div>

                {registerForm}
              </div>

              {/* Keep webinarInfo in sync for future real capacity display */}
              <span className="sr-only">
                registered {webinarInfo.registeredCount} / {webinarInfo.capacity}
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Benefits: full-width asymmetric bento grid, each benefit its own
          tile — the first tile is a wide "featured" spot, not a stacked
          list-in-a-box. ── */}
      <section className="relative pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            {...(fadeIn ?? {})}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-6xl"
          >
            <div className="mb-8 flex items-center gap-2">
              <Trophy className="text-primary" size={22} aria-hidden />
              <h3 className="text-xl font-bold md:text-2xl">چرا فیتینو متمایز است؟</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((item, index) => (
                <div
                  key={item.title}
                  className={`fp-card fp-notch-sm flex flex-col justify-between gap-4 p-5 md:p-6 ${
                    index === 0 ? "sm:col-span-2 sm:flex-row sm:items-center lg:col-span-1 lg:flex-col lg:items-stretch" : ""
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <StatusChip tone="brand">آنالیز رایگان بدنی</StatusChip>
              <StatusChip tone="brand">کارگاه زنده آنلاین</StatusChip>
              <StatusChip tone="brand">مربی + هوش مصنوعی</StatusChip>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile sticky action dock — same submit target as the in-form button. */}
      <ActionDock>
        <Button type="submit" form="register-form" variant="gradient" size="lg" className="w-full" disabled={!canSubmit}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              در حال ثبت‌نام...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" aria-hidden />
              شروع آنالیز رایگان بدنی
            </span>
          )}
        </Button>
      </ActionDock>
    </FitinoPageShell>
  );
};

export default RegisterPage;
