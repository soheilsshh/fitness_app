import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, Calendar, MessageSquare, Gift, Star, Phone, ArrowLeft } from "lucide-react";
import { getJalaliDate, getJalaliDayName, getJalaliMonthName } from "@/utils/jalali";
import { apiService } from "@/services/api";

interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  registrationTime: string; // Should be UTC time string
}

const SuccessPage = () => {
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [webinarInfo, setWebinarInfo] = useState({
    date: "", // e.g., "امروز" or "فردا"
    time: "۱۹:۰۰", // Will be loaded from API
    smsTime: "۱۸:۳۰", // Fixed SMS time: 18:30
  });

  useEffect(() => {
    const savedData = localStorage.getItem('registrationData');
    if (!savedData) {
      navigate('/');
      return;
    }

    const data: RegistrationData = JSON.parse(savedData);
    setRegistrationData(data);

    // Fetch webinar info from API to get actual start time
    const fetchWebinarInfo = async () => {
      try {
        const info = await apiService.getWebinarInfo();
        
        // Parse start time from API (RFC3339 format with timezone)
        const startTime = new Date(info.start_time);
        
        // CRITICAL: Convert to Iran timezone for display
        // The API returns RFC3339 which includes timezone, but we need to display in Iran timezone
        const iranTimeString = startTime.toLocaleString("en-US", {
          timeZone: "Asia/Tehran",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
        
        // Extract hour and minute from Iran timezone
        const [hour, minute] = iranTimeString.split(':').map(Number);
        
        // Convert to Persian digits for display
        const persianHour = hour.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
        const persianMinute = minute.toString().padStart(2, '0').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
        const formattedTime = `${persianHour}:${persianMinute}`;
        
        // Calculate date for display
        // Use the start time from API to determine if it's today or tomorrow
        const now = new Date();
        const nowIran = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
        const startTimeIran = new Date(startTime.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
        
        // Check if start time is today or tomorrow
        const isToday = startTimeIran.getDate() === nowIran.getDate() &&
                       startTimeIran.getMonth() === nowIran.getMonth() &&
                       startTimeIran.getFullYear() === nowIran.getFullYear();
        
        let dateText = "";
        if (isToday) {
          const todayFormatted = getJalaliDayName(now);
          dateText = `امروز ${todayFormatted} ساعت ${formattedTime}`;
        } else {
          const tomorrow = new Date(startTime);
          const tomorrowFormatted = getJalaliDayName(tomorrow);
          dateText = `فردا ${tomorrowFormatted} ساعت ${formattedTime}`;
        }

        setWebinarInfo({
          date: dateText,
          time: formattedTime,
          smsTime: "حدود ساعت ۱۸:۳۰",
        });
      } catch (error) {
        console.error('Failed to fetch webinar info:', error);
        // Fallback to default if API fails
        const registrationDate = new Date(data.registrationTime);
        const tomorrow = new Date(registrationDate.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowFormatted = getJalaliDayName(tomorrow);
        const fullDateText = `فردا ${tomorrowFormatted} ساعت ۱۹:۰۰`;
        
        setWebinarInfo({
          date: fullDateText,
          time: "۱۹:۰۰",
          smsTime: "حدود ساعت ۱۸:۳۰",
        });
      }
    };

    fetchWebinarInfo();
  }, [navigate]);

  const getScenarioContent = () => {
      return {
        title: "ثبت‌نام شما با موفقیت انجام شد!",
      subtitle: "کارگاه فردا راس ساعت ۱۹ برگزار میشه",
      cta: "آلارمتو کوک کن این کارگاه فوق العاده رو از دست ندی"
      };
  };

  const handleBackClick = () => {
    navigate('/');
  };

  if (!registrationData) {
    return null;
  }

  const content = getScenarioContent();

  return (
    <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={handleBackClick}
          className="group rounded-full border border-border bg-card/80 p-2.5 text-foreground shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-card sm:p-3"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
        </button>
      </div>

      {/* Ambient pulse rings */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: '-1.5s' }} />
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="relative z-10 container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl">
          {/* Smooth Success Animation */}
          <div className="text-center mb-10">
            <div className="mb-6">
              {/* Animated Check Icon */}
              <div className="relative inline-block">
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-20 h-20 bg-success/30 rounded-full animate-ping mx-auto"></div>
                <div className="absolute inset-0 w-20 h-20 bg-success/20 rounded-full animate-pulse mx-auto"></div>

                {/* Main Icon Container */}
                <div
                  className="relative w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-success/50"
                  style={{
                    animation: 'checkAppear 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
                  }}
                >
                  <CheckCircle
                    className="text-success-foreground"
                    size={40}
                    style={{
                      animation: 'checkReveal 0.8s ease-out 0.6s both'
                    }}
                  />
                </div>
              </div>

              <h2
                className="text-4xl font-bold text-foreground mt-6"
                dir="rtl"
                style={{
                  unicodeBidi: 'embed',
                  animation: 'textFadeIn 0.8s ease-out 1s both'
                }}
              >
                تبریک!‎
              </h2>
            </div>
          </div>

          {/* Success Sound Effect */}
          <audio 
            autoPlay 
            style={{ display: 'none' }}
            onCanPlay={(e) => {
              const audio = e.target as HTMLAudioElement;
              audio.volume = 0.3;
              audio.play().catch(() => {
                // Handle autoplay restrictions silently
              });
            }}
          >
            <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSEELIHO8tiJOAgZZ7zn559NEAxQp+PwtmMcBjiR1/LMeSEELIHO8tiJOAgh" type="audio/wav" />
          </audio>

          {/* Elegant Animation Styles */}
          <style>{`
            @keyframes checkAppear {
              0% {
                opacity: 0;
                transform: scale(0) rotate(-180deg);
              }
              60% {
                opacity: 1;
                transform: scale(1.2) rotate(-10deg);
              }
              100% {
                opacity: 1;
                transform: scale(1) rotate(0deg);
              }
            }
            
            @keyframes checkReveal {
              0% {
                opacity: 0;
                transform: scale(0.3);
              }
              50% {
                opacity: 1;
                transform: scale(1.1);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes textFadeIn {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Confirmation zone + user-info sidebar, asymmetric instead of
              one long centered stack. */}
          <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-8">
            <div className="fp-card fp-notch relative overflow-visible p-7 pt-9 text-center md:p-8 md:pt-10" dir="rtl">
              <span className="fp-ribbon">
                <CheckCircle className="size-3" aria-hidden />
                ثبت‌نام تأیید شد
              </span>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" dir="rtl" style={{unicodeBidi: 'embed'}}>
                {content.title}
              </h1>

              <h2 className="text-xl md:text-2xl font-bold text-success mb-4" dir="rtl" style={{unicodeBidi: 'embed'}}>
                {content.subtitle}
              </h2>

              {/* Tomorrow's Date — big HUD number instead of a boxed line. */}
              <div className="fp-hud-num gradient-text text-2xl md:text-3xl mb-2" dir="rtl" style={{unicodeBidi: 'embed'}}>
                {webinarInfo.date}
              </div>

              <p className="text-xl font-bold text-foreground mt-2" dir="rtl" style={{unicodeBidi: 'embed'}}>
                {content.cta}
              </p>
            </div>

            {/* User info: vertical detail list on a spine-accented sidebar,
                not a 3-column grid crammed inside the hero card. */}
            <div className="fp-spine rounded-xl border border-border bg-card/60 p-5" dir="rtl">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">اطلاعات ثبت‌نام شما</h3>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-muted-foreground">نام</span>
                  <span className="font-bold text-foreground">{registrationData.firstName} {registrationData.lastName}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-muted-foreground">شماره تماس</span>
                  <span className="fp-hud-num font-bold text-foreground" dir="ltr">{registrationData.phone}</span>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-muted-foreground">وضعیت</span>
                  <span className="font-bold text-success" dir="rtl" style={{unicodeBidi: 'embed'}}>تایید شده ✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Instructions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="fp-card fp-notch fp-notch-sm p-6" dir="rtl">
              <div className="flex items-center gap-3 mb-4 justify-end">
                <div className="w-12 h-12 bg-gradient-to-l from-[#187272] to-[#26fce3] rounded-full flex items-center justify-center">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <div className="text-right flex-1">
                  <h3 className="text-foreground font-bold text-lg">دریافت لینک ورود</h3>
                  <span className="bg-[#26fce3]/20 text-[#26fce3] text-xs px-2 py-1 rounded">مهم</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#58cac0]">
                  <Phone size={16} />
                  <span className="text-sm">پیامک حاوی لینک ورود</span>
                </div>
                <div className="flex items-center gap-2 text-[#58cac0]">
                  <Clock size={16} />
                  <span className="text-sm">زمان ارسال: {webinarInfo.smsTime}</span>
                </div>
                <p className="text-xs text-muted-foreground" dir="rtl" style={{unicodeBidi: 'embed'}}>
                  حتماً شماره تماست رو چک کن تا پیامک رو دریافت کنی‎
                </p>
              </div>
            </div>

            <div className="fp-card fp-notch fp-notch-sm p-6" dir="rtl">
              <div className="flex items-center gap-3 mb-4 justify-end">
                <div className="w-12 h-12 bg-gradient-to-l from-[#2a9c96] to-[#58cac0] rounded-full flex items-center justify-center">
                  <Calendar className="text-white" size={24} />
                </div>
                <div className="text-right flex-1">
                  <h3 className="text-foreground font-bold text-lg">زمان کارگاه‌ آنلاین</h3>
                  <span className="bg-[#58cac0]/20 text-[#58cac0] text-xs px-2 py-1 rounded">یادآوری</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[#58cac0] text-lg font-bold">
                  {webinarInfo.date} - ساعت {webinarInfo.time}
                </div>
                <div className="text-[#58cac0] text-sm">
                  ⏰ مدت زمان: ۷۵ دقیقه فشرده
                </div>
                <p className="text-xs text-muted-foreground" dir="rtl" style={{unicodeBidi: 'embed'}}>
                  حتماً یه یادآوری برای خودت تنظیم کن‎
                </p>
              </div>
            </div>
          </div>

          {/* Final Message */}
          <div className="fp-card fp-spine text-center p-6" dir="rtl">
            <h4 className="text-success font-bold text-lg mb-2" dir="rtl" style={{unicodeBidi: 'embed'}}>
              🚀 آماده‌ای برای تحول در زندگی‌ت؟‎
            </h4>
            <p className="text-foreground leading-relaxed" dir="rtl" style={{unicodeBidi: 'embed'}}>
              تو رو به یک سفر هیجان‌انگیز به دنیای تناسب‌اندام هوشمند دعوت می‌کنیم‎.
              <br />
              <span className="text-success font-semibold">این شروع یک دگرگونی بزرگه!‎</span>
            </p>
            <p className="text-muted-foreground text-sm mt-4" dir="rtl" style={{unicodeBidi: 'embed'}}>
              لینک کارگاه‌ آنلاین در زمان مقرر برایت پیامک خواهد شد‎
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage; 