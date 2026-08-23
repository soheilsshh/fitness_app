import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import FitinoBrandMark from "@/components/FitinoBrandMark";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Ambient bloom, same warm glow language as the rest of the app */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,252,227,0.06),transparent_55%)]" />
      </div>

      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={handleBackClick}
          className="group rounded-full border border-border bg-card/80 p-2.5 text-foreground shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-card sm:p-3"
        >
          <ArrowLeft size={20} className="transition-transform duration-200 group-hover:-translate-x-1" />
        </button>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        {/* Asymmetric composition: an oversized typographic "404" watermark
            paired with a spine-accented message card, not a single centered
            glass box. */}
        <div className="mx-auto grid w-full max-w-4xl items-center gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-4">
          <div className="pointer-events-none select-none text-center lg:text-right" aria-hidden>
            <span className="fp-hud-num gradient-text text-[7rem] leading-none sm:text-[9rem] lg:text-[10rem]">
              404
            </span>
          </div>

          <div className="fp-card fp-spine fp-notch relative overflow-visible p-7 pt-9 text-right md:p-9 md:pt-10">
            <span className="fp-ribbon">
              <Compass className="size-3" aria-hidden />
              مسیر گم شد
            </span>

            <div className="mb-4 flex items-center gap-3 justify-end">
              <h1 className="text-2xl font-bold md:text-3xl">صفحه مورد نظر یافت نشد</h1>
              <FitinoBrandMark size={40} pulse={false} />
            </div>
            <p className="mb-8 leading-relaxed text-muted-foreground">
              متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button variant="gradient" size="lg" onClick={handleBackClick} className="flex-1">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                بازگشت
              </Button>
              <Button variant="outline" size="lg" onClick={handleHomeClick} className="flex-1">
                <Home className="h-4 w-4" aria-hidden />
                صفحه اصلی
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
