import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Copy, Check, X, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/api";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refId, setRefId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  useEffect(() => {
    const authority = searchParams.get("authority");
    
    if (authority) {
      apiService.verifyPayment(authority)
        .then((result) => {
          if (result.success && result.status === "success") {
            setRefId(result.ref_id || null);
            setAmount(result.amount || null);
            setPaymentType(result.type || null);
            setLicenseKey((result as any).license_key || null);
            setUserPhone(result.phone || null);
            // Try to get payment_id from result or we'll need to find it by authority
            setPaymentId((result as any).payment_id || null);
            setError(null);
          } else {
            navigate(`/payment/failed?authority=${authority}&error=${result.error || "پرداخت تأیید نشد"}&code=${result.code || "NOT_VERIFIED"}`);
          }
        })
        .catch((err) => {
          console.error("Payment verification failed:", err);
          navigate(`/payment/failed?authority=${authority}&error=خطا در تأیید پرداخت&code=VERIFICATION_ERROR`);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const refIdParam = searchParams.get("ref_id");
      const amountParam = searchParams.get("amount");
      const typeParam = searchParams.get("type");

      if (refIdParam || amountParam || typeParam) {
        setRefId(refIdParam);
        setAmount(amountParam ? parseInt(amountParam, 10) : null);
        setPaymentType(typeParam);
        setLoading(false);
      } else {
        navigate("/payment/failed?error=کد پیگیری یافت نشد&code=NO_AUTHORITY");
      }
    }
  }, [searchParams, navigate]);

  const formatAmount = (amountNum: number | null) => {
    if (!amountNum) return "-";
    return new Intl.NumberFormat("fa-IR").format(amountNum) + " تومان";
  };

  const getTypeLabel = (type: string | null) => {
    if (!type) return "-";
    switch (type) {
      case "subscription":
        return "اشتراک مادام‌العمر";
      case "roadmap":
        return "رودمپ اختصاصی";
      default:
        return type;
    }
  };

  const copyRefId = () => {
    if (refId) {
      navigator.clipboard.writeText(refId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLicense = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShowGuide = async () => {
    setShowGuide(true);
    if (!licenseKey) {
      // Assign license if not available
      setLicenseLoading(true);
      try {
        const authority = searchParams.get("authority");
        if (!authority || !userPhone) {
          setLicenseLoading(false);
          alert("❌ اطلاعات پرداخت ناقص است");
          return;
        }

        const result = await apiService.assignLicense(authority, userPhone);
        if (result.success && result.license_code) {
          setLicenseKey(result.license_code);
        } else {
          alert(result.error || "❌ خطا در اختصاص لایسنس");
        }
      } catch (error: any) {
        console.error("Failed to assign license:", error);
        alert("❌ خطا در اختصاص لایسنس: " + (error.message || "خطای ناشناخته"));
      } finally {
        setLicenseLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground" dir="rtl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
          <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: "-1.5s" }} />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="fp-card fp-notch flex flex-col items-center gap-4 p-8 text-center">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">در حال تأیید پرداخت...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground" dir="rtl">
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="fp-card fp-spine fp-notch w-full max-w-md p-8 text-center">
            <p className="mb-6 text-sm leading-relaxed text-destructive">{error}</p>
            <Button variant="gradient" size="lg" onClick={() => navigate("/ai")} className="w-full">
              بازگشت
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Ambient bloom, same warm glow language as the rest of the app. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: "-1.5s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,252,227,0.06),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        {/* Asymmetric composition, same genre as the 404 / failed-payment
            pages: an oversized status glyph watermark paired with a
            spine-accented details card, not a single centered box. */}
        <div className="mx-auto grid w-full max-w-4xl items-center gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-4">
          <div className="pointer-events-none flex select-none justify-center lg:justify-end" aria-hidden>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-success/10 blur-3xl" />
              <CheckCircle2 className="relative h-32 w-32 text-success/20 sm:h-44 sm:w-44 lg:h-52 lg:w-52" strokeWidth={1.1} />
            </div>
          </div>

          <div className="fp-card fp-spine fp-notch relative overflow-visible p-7 pt-9 text-right md:p-9 md:pt-10">
            <span className="fp-ribbon">
              <CheckCircle2 className="size-3" aria-hidden />
              پرداخت موفق
            </span>

            <div className="mb-6 flex items-center gap-3 justify-end">
              <h1 className="text-2xl font-bold md:text-3xl">تراکنش شما با موفقیت انجام شد</h1>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </div>
            </div>

            {/* Transaction Details */}
            <div className="mb-6 divide-y divide-border rounded-xl border border-border bg-muted/40">
              {refId && (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-muted-foreground">شماره تراکنش</span>
                  <div className="flex items-center gap-2">
                    <span className="fp-hud-num font-mono text-sm">{refId}</span>
                    <button
                      onClick={copyRefId}
                      className="rounded-lg p-1.5 transition-colors hover:bg-foreground/10"
                      title="کپی"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              {amount !== null && (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-muted-foreground">مبلغ</span>
                  <span className="fp-hud-num text-lg font-semibold">{formatAmount(amount)}</span>
                </div>
              )}
              {paymentType && (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-muted-foreground">نوع</span>
                  <span className="font-medium">{getTypeLabel(paymentType)}</span>
                </div>
              )}
            </div>

            <Button variant="gradient" size="lg" onClick={handleShowGuide} className="w-full">
              <BookOpen className="h-5 w-5" aria-hidden />
              فعال سازی پلتفرم
            </Button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              رسید پرداخت به ایمیل شما ارسال خواهد شد
            </p>
          </div>
        </div>
      </div>

      {/* Guide Modal — asymmetric two-panel: license spine-panel beside the
          numbered steps, instead of one long stacked list. */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="fp-card fp-notch max-h-[90vh] w-full max-w-2xl overflow-y-auto animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card p-6">
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-2 transition-colors hover:bg-foreground/10"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">راهنمای استفاده</h2>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--fp-brand)] to-[var(--fp-glow)]">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Content: license panel + steps panel side by side on larger screens */}
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.2fr]">
              {/* License Section */}
              <div className="fp-spine rounded-xl border border-border bg-muted/30 p-5">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">لایسنس شما</h3>
                {licenseLoading ? (
                  <div className="flex items-center justify-center rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
                    <div className="space-y-3 text-center">
                      <div className="relative mx-auto h-12 w-12">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                      </div>
                      <p className="text-sm font-medium text-primary">در حال ساخت لایسنس...</p>
                    </div>
                  </div>
                ) : licenseKey ? (
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-primary">کد لایسنس</span>
                      <button
                        onClick={copyLicense}
                        className="rounded-lg p-1.5 transition-colors hover:bg-primary/10"
                        title="کپی لایسنس"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-primary/20 bg-background p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
                        <code className="fp-hud-num select-all font-mono text-sm text-primary">
                          {licenseKey}
                        </code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">لایسنس در دسترس نیست</p>
                  </div>
                )}

                <Button
                  variant="gradient"
                  onClick={() => window.open("https://t.me/fiti_noo", "_blank")}
                  className="mt-5 w-full"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  کانال پشتیبانی فیتینو
                </Button>
              </div>

              {/* Guide Steps */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">مراحل استفاده</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                      <span className="fp-hud-num text-sm text-primary">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 font-medium">وارد پنل کاربری فیتینو شوید</p>
                      <p className="text-sm text-muted-foreground">
                        با همین شماره تماس وارد داشبورد کاربری فیتینو شوید
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                      <span className="fp-hud-num text-sm text-primary">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 font-medium">کد فعال‌سازی را وارد کنید</p>
                      <p className="text-sm text-muted-foreground">
                        کد بالا را کپی کرده و در بخش فعال‌سازی پنل وارد کنید
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                      <span className="fp-hud-num text-sm text-primary">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 font-medium">مسیرتو با مربی شروع کن</p>
                      <p className="text-sm text-muted-foreground">
                        پس از فعال‌سازی، برنامه تمرین و تغذیه اختصاصی‌ت آماده می‌شه
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;

