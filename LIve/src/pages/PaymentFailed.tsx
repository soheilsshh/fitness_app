import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/api";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const authority = searchParams.get("authority");
    const errorParam = searchParams.get("error");
    const codeParam = searchParams.get("code");

    if (authority && !errorParam) {
      setLoading(true);
      apiService.verifyPayment(authority)
        .then((result) => {
          if (result.success && result.status === "success") {
            navigate(`/payment/success?authority=${authority}`);
          } else {
            setError(result.error || "پرداخت ناموفق بود");
            setCode(result.code || "NOT_VERIFIED");
            
            // Track payment failed
            if (result.phone) {
              apiService.trackLandingActivity(result.phone, 'payment_failed', result.first_name, result.last_name, {
                authority,
                error: result.error,
                code: result.code
              }).catch(err => {
                console.error('Failed to track payment failed:', err);
              });
            }
          }
        })
        .catch((err) => {
          console.error("Payment verification failed:", err);
          setError("خطا در تأیید پرداخت");
          setCode("VERIFICATION_ERROR");
          
          // Try to get phone from localStorage to track failure
          const registrationData = localStorage.getItem('registrationData');
          if (registrationData) {
            try {
              const data = JSON.parse(registrationData);
              if (data.phone) {
                apiService.trackLandingActivity(data.phone, 'payment_failed', data.firstName, data.lastName, {
                  authority,
                  error: 'خطا در تأیید پرداخت',
                  code: 'VERIFICATION_ERROR'
                }).catch(trackErr => {
                  console.error('Failed to track payment failed:', trackErr);
                });
              }
            } catch (e) {
              console.error('Failed to parse registration data:', e);
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError(errorParam);
      setCode(codeParam);
      
      // Track payment failed for cancelled or error cases
      const registrationData = localStorage.getItem('registrationData');
      if (registrationData) {
        try {
          const data = JSON.parse(registrationData);
          if (data.phone) {
            apiService.trackLandingActivity(data.phone, 'payment_failed', data.firstName, data.lastName, {
              authority: authority || '',
              error: errorParam || 'پرداخت ناموفق بود',
              code: codeParam || 'UNKNOWN'
            }).catch(err => {
              console.error('Failed to track payment failed:', err);
            });
          }
        } catch (e) {
          console.error('Failed to parse registration data:', e);
        }
      }
    }
  }, [searchParams, navigate]);

  const getErrorMessage = (code: string | null) => {
    if (!code) return "پرداخت ناموفق بود";
    
    switch (code) {
      case "CANCELLED":
        return "پرداخت توسط شما لغو شد";
      case "NOT_FOUND":
        return "تراکنش یافت نشد";
      case "VERIFICATION_FAILED":
        return "تأیید پرداخت ناموفق بود";
      case "NOT_VERIFIED":
        return "پرداخت تأیید نشد";
      default:
        return error || "پرداخت ناموفق بود";
    }
  };

  if (loading) {
    return (
      <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground" dir="rtl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ borderColor: "hsl(var(--warning) / 0.4)" }} />
          <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ borderColor: "hsl(var(--warning) / 0.4)", animationDelay: "-1.5s" }} />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="fp-card fp-notch flex flex-col items-center gap-4 p-8 text-center">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-4 border-warning/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-warning animate-spin" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">در حال بررسی وضعیت پرداخت...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Ambient bloom, tuned to the failure state's semantic color, same
          motif as the rest of the app's ambient glow. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ borderColor: "hsl(var(--destructive) / 0.35)" }} />
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ borderColor: "hsl(var(--destructive) / 0.35)", animationDelay: "-1.5s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--destructive)/0.08),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        {/* Asymmetric composition, same genre as the 404 page: an oversized
            status glyph watermark paired with a spine-accented action card. */}
        <div className="mx-auto grid w-full max-w-4xl items-center gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-4">
          <div className="pointer-events-none flex select-none justify-center lg:justify-end" aria-hidden>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-destructive/10 blur-3xl" />
              <XCircle className="relative h-32 w-32 text-destructive/20 sm:h-44 sm:w-44 lg:h-52 lg:w-52" strokeWidth={1.1} />
            </div>
          </div>

          <div className="fp-card fp-spine fp-notch relative overflow-visible p-7 pt-9 text-right md:p-9 md:pt-10">
            <span className="fp-ribbon">
              <XCircle className="size-3" aria-hidden />
              پرداخت ناموفق
            </span>

            <div className="mb-4 flex items-center gap-3 justify-end">
              <h1 className="text-2xl font-bold md:text-3xl">{getErrorMessage(code)}</h1>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-5 w-5" aria-hidden />
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm leading-relaxed text-destructive">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button variant="gradient" size="lg" onClick={() => navigate("/ai")} className="flex-1">
                <RefreshCw className="h-4 w-4" aria-hidden />
                تلاش مجدد
              </Button>
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground text-xs">
              در صورت کسر وجه از حساب، مبلغ تا 72 ساعت به حساب شما بازگردانده می‌شود
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;

