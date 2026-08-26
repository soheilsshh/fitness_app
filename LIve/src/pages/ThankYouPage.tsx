import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Gift, Target, TrendingUp, Clock, CheckCircle2, Calendar, Radio } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { apiService } from "@/services/api";
import { getJalaliDayName, toPersianDigits } from "@/utils/jalali";
import { config } from "@/config/environment";

interface RegistrationData {
  firstName: string;
  lastName: string;
  phone: string;
  registrationTime: string;
  userId?: number;
}

interface WebinarInfo {
  date: string; // e.g., "فردا دوشنبه ساعت ۱۹:۰۰"
  time: string; // e.g., "۱۹:۰۰"
}

interface UserAnswers {
  obstacle?: string;
  incomePreference?: string;
  experienceLevel?: string;
  attendanceCommitment?: string;
}

const ThankYouPage = () => {
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [webinarInfo, setWebinarInfo] = useState<WebinarInfo>({
    date: "",
    time: "",
  });
  // Start with popup open to prevent initial page flash
  const [popupStep, setPopupStep] = useState<number>(1); // 0 = closed, 1-7 = steps
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [showStaticContent, setShowStaticContent] = useState(false);
  const [introStage, setIntroStage] = useState<"loading" | "confirm" | "details" | "gift">("loading");
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [typedDetails, setTypedDetails] = useState("");
  const [typedGift, setTypedGift] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalPopupLoading, setFinalPopupLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState<number[]>([]);
  const sectionTimersRef = useRef<number[]>([]);
  const trackedThankYouEventsRef = useRef<Set<string>>(new Set());
  const landingPopupTrackedRef = useRef<boolean>(false);

  const clearSectionTimers = useCallback(() => {
    sectionTimersRef.current.forEach(timer => window.clearTimeout(timer));
    sectionTimersRef.current = [];
  }, []);

  const trackThankYouEvent = useCallback(
    (status: string, metadata?: Record<string, any>) => {
      if (!registrationData?.phone) return;
      const key = status; // once per session per status
      if (trackedThankYouEventsRef.current.has(key)) return;
      trackedThankYouEventsRef.current.add(key);

      const mergedMetadata = {
        ...(metadata || {}),
        ...(registrationData?.userId ? { userId: registrationData.userId } : {}),
      };

      apiService.trackLandingActivity(
        registrationData.phone,
        status,
        registrationData.firstName,
        registrationData.lastName,
        mergedMetadata
      );
    },
    [registrationData]
  );

  const scheduleSectionReveal = useCallback((sectionId: number, delay = 180) => {
    const timer = window.setTimeout(() => {
      setVisibleSections(prev => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
    }, delay);
    sectionTimersRef.current.push(timer);
  }, []);

  useEffect(() => {
    // Check if user came from registration
    const savedData = localStorage.getItem('registrationData');
    if (!savedData) {
      navigate('/');
      return;
    }

    const data: RegistrationData = JSON.parse(savedData);
    setRegistrationData(data);

    // Fetch webinar info from API
    const fetchWebinarInfo = async () => {
      try {
        const info = await apiService.getWebinarInfo();
        
        // CRITICAL: Use custom ThankYou display time if available, otherwise use start_time
        let formattedTime = "";
        if (info.thankyou_display_time) {
          // Use custom display time (format: "HH:MM")
          const [hour, minute] = info.thankyou_display_time.split(':').map(Number);
          const persianHour = toPersianDigits(hour);
          const persianMinute = toPersianDigits(minute.toString().padStart(2, '0'));
          formattedTime = `${persianHour}:${persianMinute}`;
        } else {
          // Fallback to start_time from webinar schedule
          const startTime = new Date(info.start_time);
          const iranTimeString = startTime.toLocaleString("en-US", {
            timeZone: "Asia/Tehran",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          });
          const [hour, minute] = iranTimeString.split(':').map(Number);
          const persianHour = toPersianDigits(hour);
          const persianMinute = toPersianDigits(minute.toString().padStart(2, '0'));
          formattedTime = `${persianHour}:${persianMinute}`;
        }
        
        // Calculate date for display
        const now = new Date();
        const nowIran = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
        
        // IMPORTANT: Never show "امروز" in ThankYouPage (always show tomorrow label).
        const tomorrowIran = new Date(nowIran);
        tomorrowIran.setDate(tomorrowIran.getDate() + 1);
        const tomorrowFormatted = getJalaliDayName(tomorrowIran);
        const dateText = `فردا ${tomorrowFormatted} ساعت ${formattedTime}`;

        setWebinarInfo({
          date: dateText,
          time: formattedTime,
        });
      } catch (error) {
        console.error('Failed to fetch webinar info:', error);
        // Fallback
        setWebinarInfo({
          date: "فردا ساعت ۱۹:۰۰",
          time: "۱۹:۰۰",
        });
      }
    };

    fetchWebinarInfo();

    // Popup is opened by default; no delayed open (prevents flash)
    return;
  }, [navigate]);

  // Lock background scroll while popup is open
  useEffect(() => {
    if (popupStep > 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [popupStep]);

  // Track when user views the "برنامه پیشنهادی متناسب با شما" popup
  useEffect(() => {
    if (!registrationData?.phone) return;
    if (visibleSections.includes(0) && !landingPopupTrackedRef.current) {
      // User is viewing the landing popup - track this event only once
      // This will update popup_progress to POPUP_COMPLETED in backend
      landingPopupTrackedRef.current = true;
      trackThankYouEvent("landing_popup_viewed", {
        event: "popup_viewed",
        timestamp: new Date().toISOString()
      });
    }
  }, [visibleSections, registrationData, trackThankYouEvent]);

  // Play success sound when first popup appears
  useEffect(() => {
    if (popupStep !== 1) return;

    const createAudioContext = () => {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      return AudioContextClass ? new AudioContextClass() : null;
    };

    const playSuccessSound = () => {
      try {
        const audioContext = createAudioContext();
        if (!audioContext) return;
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - Major chord
        
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          const now = audioContext.currentTime;
          const startTime = now + index * 0.1;
          const duration = 0.3;
          
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        });
      } catch (error) {
        console.log('Audio context not supported:', error);
      }
    };

    const soundTimer = setTimeout(() => {
      playSuccessSound();
    }, 200);

    return () => {
      clearTimeout(soundTimer);
    };
  }, [popupStep]);

  // Intro staging for popup 1
  const startTyping = (
    text: string,
    setter: (val: string) => void,
    speed = 30,
    onDone?: () => void
  ) => {
    let i = 0;
    setter("");
    const intervalId = window.setInterval(() => {
      i += 1;
      setter(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(intervalId);
        if (onDone) onDone();
      }
    }, speed);
    return intervalId;
  };

  useEffect(() => {
    if (popupStep !== 1) {
      setIntroStage("loading");
      setTypedSubtitle("");
      setTypedDetails("");
      setTypedGift("");
      return;
    }

    setIntroStage("loading");
    setTypedSubtitle("");
    setTypedDetails("");
    setTypedGift("");

    const timers: number[] = [];
    timers.push(window.setTimeout(() => setIntroStage("confirm"), 900));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [popupStep]);

  useEffect(() => {
    if (popupStep !== 1) return;

    let intervalId: number | undefined;
    let timerId: number | undefined;

    const confirmSubtitle = "از همین‌جا وارد مسیر تغییر بدنت می‌شی.";
    const detailsText = `🕖 زمان کارگاه: ${webinarInfo.date || "فردا ساعت ۱۹:۰۰"}\n🎯 وضعیت شما: شرکت‌کننده‌ی تاییدشده`;
    const giftText = "یه هدیه ویژه شخصی‌سازی‌شده واست آماده کردم همین الان بگیرش👇🏼🎁";

    if (introStage === "confirm") {
      intervalId = startTyping(confirmSubtitle, setTypedSubtitle, 28, () => {
        timerId = window.setTimeout(() => setIntroStage("details"), 1000);
      });
    } else if (introStage === "details") {
      intervalId = startTyping(detailsText, setTypedDetails, 18, () => {
        timerId = window.setTimeout(() => setIntroStage("gift"), 2000);
      });
    } else if (introStage === "gift") {
      intervalId = startTyping(giftText, setTypedGift, 26);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, [introStage, popupStep, webinarInfo.date, webinarInfo.time]);

  // Subtle success sound when gift becomes ready
  useEffect(() => {
    if (introStage !== "gift") return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const tones = [659.25, 987.77]; // E5, B5
      tones.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioContext.destination);
        const now = audioContext.currentTime + idx * 0.02;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch (error) {
      console.log("Audio context not supported for gift sound:", error);
    }
  }, [introStage]);

  // Celebration when roadmap appears
  useEffect(() => {
    if (popupStep !== 7) {
      setShowConfetti(false);
      setFinalPopupLoading(true);
      setVisibleSections([]);
      return;
    }
    setShowConfetti(true);
    const timer = window.setTimeout(() => setShowConfetti(false), 1600);
    return () => window.clearTimeout(timer);
  }, [popupStep]);

  // Final popup loading and section reveal - every 2 seconds a new section appears
  useEffect(() => {
    clearSectionTimers();

    if (popupStep !== 7) {
      setFinalPopupLoading(true);
      setVisibleSections([]);
      return;
    }

    // Initial loading: 1.5 seconds
    setFinalPopupLoading(true);
    setVisibleSections([]);

    const initialTimer = window.setTimeout(() => {
      setFinalPopupLoading(false);
      // Title shows first
      setVisibleSections([0]);
      // Section 1 appears after 2 seconds
      scheduleSectionReveal(1, 2000);
    }, 1500);

    sectionTimersRef.current.push(initialTimer);

    // Schedule sections 2-6, each 2 seconds after previous
    for (let i = 2; i <= 6; i++) {
      scheduleSectionReveal(i, 1500 + (i * 2000));
    }
    
    // Section 7 (social proof) appears after section 6 (after 2 seconds)
    scheduleSectionReveal(7, 1500 + (7 * 2000));

    return () => {
      clearSectionTimers();
    };
  }, [popupStep, clearSectionTimers, scheduleSectionReveal]);

  // Track that user has reached final popup (step 7)
  useEffect(() => {
    if (popupStep === 7) {
      trackThankYouEvent("thankyou_step_7", { step: 7, event: "reached" });
    }
  }, [popupStep, trackThankYouEvent]);

  // Track that ThankYou popup flow has opened (start of funnel)
  useEffect(() => {
    if (popupStep === 1) {
      trackThankYouEvent("thankyou_open", { step: 1, event: "opened" });
    }
  }, [popupStep, trackThankYouEvent]);

  // Track when user exits ThankYou page (left_landing) - sends SMS immediately
  useEffect(() => {
    if (!registrationData?.phone) return;

    const trackExit = () => {
      // Track left_landing event - this will trigger immediate SMS in backend
      apiService.trackLandingActivity(
        registrationData.phone,
        'left_landing',
        registrationData.firstName,
        registrationData.lastName
      ).catch(err => {
        console.error('Failed to track landing exit:', err);
      });
    };

    // Track on page unload (user closes tab/navigates away)
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable tracking on page unload
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          phone: registrationData.phone,
          status: 'left_landing',
          first_name: registrationData.firstName,
          last_name: registrationData.lastName,
        });
        navigator.sendBeacon(
          `${config.API_BASE_URL}/api/track/landing-activity`,
          new Blob([data], { type: 'application/json' })
        );
      } else {
        // Fallback: synchronous fetch (may not always work on unload)
        trackExit();
      }
    };

    // Track on component unmount (user navigates to another page in the app)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page went to background - track exit
        trackExit();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup: track exit when component unmounts
      trackExit();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [registrationData]);

  const handleAnswer = (questionKey: keyof UserAnswers, answer: string) => {
    // Track completion of the current popup step (3-6)
    if (popupStep >= 3 && popupStep <= 6) {
      trackThankYouEvent(`thankyou_step_${popupStep}`, {
        step: popupStep,
        event: "completed",
        questionKey,
        answer,
      });
    }
    setAnswers(prev => ({ ...prev, [questionKey]: answer }));
    setTimeout(() => {
      setPopupStep(prev => prev + 1);
    }, 180);
  };

  const handleNext = () => {
    // Track completion of step 1/2 when user clicks next
    if (popupStep === 1 || popupStep === 2) {
      trackThankYouEvent(`thankyou_step_${popupStep}`, { step: popupStep, event: "completed" });
    }
    setPopupStep(prev => prev + 1);
  };

  const handlePopupComplete = () => {
    trackThankYouEvent("thankyou_complete", { step: 7, event: "completed" });
    setPopupStep(0);
    setShowStaticContent(true);
  };

  // Generate personalized summary based on answers
  const getPersonalizedSummary = () => {
    const obstacle = answers.obstacle;
    const goal = answers.incomePreference;
    const level = answers.experienceLevel;

    let suggestedPath = "مسیر آنالیز هوشمند بدنی و برنامه‌ریزی اختصاصی";
    let mainRisk = "استپ وزنی و از دست دادن انگیزه";
    let focusPoint = "پیاده‌سازی عملی برنامه در زندگی روزمره";

    if (obstacle?.includes("وقت")) {
      suggestedPath = "مسیر برنامه فشرده و کم‌زمان";
      focusPoint = "چطور بدون صرف زمان زیاد، نتیجه بگیری";
    } else if (obstacle?.includes("تغذیه")) {
      suggestedPath = "مسیر اصلاح تغذیه با سفره ایرانی";
      focusPoint = "منوی غذایی که واقعاً قابل اجراست";
    } else if (obstacle?.includes("انگیزه")) {
      suggestedPath = "مسیر پایش روزانه و همراهی مربی";
      mainRisk = "رها کردن برنامه در نیمه راه";
      focusPoint = "چطور با پیگیری مربی انگیزه‌تو حفظ کنی";
    } else if (obstacle?.includes("مصدومیت")) {
      suggestedPath = "مسیر تمرین اصلاحی و ایمن";
      mainRisk = "تشدید آسیب در اثر تمرین اشتباه";
      focusPoint = "طراحی تمرین متناسب با محدودیت‌های بدنی";
    }

    if (goal?.includes("چربی‌سوزی")) {
      focusPoint = "چربی‌سوزی هدفمند بدون افت عضله";
    } else if (goal?.includes("عضله")) {
      focusPoint = "افزایش حجم عضلانی با تغذیه دقیق";
    }

    if (level?.includes("حرفه")) {
      focusPoint = "تکنیک‌های پیشرفته برای عبور از استپ";
    } else if (level?.includes("تازه")) {
      focusPoint = "شروع از صفر با راهنمایی کامل مربی";
    }

    return { suggestedPath, mainRisk, focusPoint };
  };

  const renderPopupStep = () => {
    switch (popupStep) {
      case 1:
        return (
          <div className="text-center space-y-8">
            <div className="fp-card fp-notch relative overflow-hidden p-6 shadow-2xl shadow-[#26fce3]/15">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(38,252,227,0.12),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(38,252,227,0.10),transparent_28%)]"></div>
              <div className="relative flex flex-col gap-4 text-right">
                {introStage === "loading" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-base text-foreground">در حال ثبت نهایی اطلاعات شما</span>
                      <div className="flex items-center gap-1 text-accent text-lg">
                        <span className="dot dot-1">•</span>
                        <span className="dot dot-2">•</span>
                        <span className="dot dot-3">•</span>
                      </div>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="absolute inset-0 loading-bar"></div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      چند ثانیه صبر کن... سیستم دارد داده‌ها را رمزگذاری می‌کند.
                    </p>
                  </div>
                )}

                {introStage !== "loading" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                        {registrationData?.firstName ? `${registrationData.firstName}، ثبت‌نامت با موفقیت انجام شد` : "ثبت‌نامت با موفقیت انجام شد"}
                        <span className="ml-2 text-success text-2xl align-middle">✅</span>
                      </div>
                    </div>

                    {introStage === "confirm" && (
                      <p className="text-foreground/80 text-base leading-relaxed min-h-[44px]">
                        {typedSubtitle}
                        <span className="caret-blink">|</span>
                      </p>
                    )}

                    {introStage === "details" && (
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-4 min-h-[96px]">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#26fce3]/10 via-transparent to-[#26fce3]/5"></div>
                        <div className="relative space-y-2 text-foreground text-base">
                          {typedDetails.split("\n").map((line, idx, arr) => (
                            <div key={idx} className="flex items-center gap-2 leading-relaxed">
                              <span>{line}</span>
                              {idx === arr.length - 1 && <span className="caret-blink">|</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {introStage === "gift" && (
                      <div className="space-y-2">
                        <div className="text-foreground/80 text-base leading-relaxed min-h-[42px]">
                          {typedGift}
                          <span className="caret-blink">|</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={introStage !== "gift"}
              className={`w-full group relative overflow-hidden bg-gradient-to-r from-[#187272] via-[#2a9c96] to-[#26fce3] text-white font-semibold py-4 px-6 rounded-2xl text-base transition-all duration-300 shadow-lg shadow-[#26fce3]/25 border border-white/10 ${
                introStage === "gift"
                  ? "hover:scale-[1.02] active:scale-[0.99] opacity-100 cta-pulse"
                  : "opacity-90 cursor-not-allowed"
              }`}
            >
              {introStage === "gift" ? (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  دریافت هدیه ویژه
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-[-3px] transition-transform duration-300" />
                </span>
              ) : (
                <span className="relative z-10 flex flex-col items-center justify-center gap-1 text-sm text-foreground">
                  <span className="text-lg font-bold whitespace-nowrap relative inline-block overflow-hidden">
                    <span className="relative z-10">صبر کن! هدیت داره آماده میشه🎁</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></span>
                  </span>
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
            </button>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#26fce3]/20 rounded-xl blur-2xl animate-pulse"></div>
                <div className="absolute inset-0 bg-[#26fce3]/10 rounded-xl blur-lg"></div>
                <div className="relative w-14 h-14 bg-card rounded-xl flex items-center justify-center border border-primary/30 shadow-lg shadow-[#26fce3]/10">
                  <Gift className="w-7 h-7 text-[#26fce3] drop-shadow-lg" strokeWidth={2} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                ۳ سؤال ۲۰ ثانیه‌ای = نقشه راه اختصاصی تو
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto">
                بر اساس شرایط خودت، یه مسیر شخصی می‌سازیم که فردا داخل کارگاه کاملش می‌کنیم
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-foreground/80">
              {[
                { icon: "⏱️", text: "کمتر از ۱ دقیقه" },
                { icon: "🧠", text: "شخصی‌سازی‌شده" },
              ].map((item) => (
                <div key={item.text} className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-center gap-2 whitespace-nowrap">
                  <span>{item.icon}</span>
                  <span className="text-xs sm:text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleNext}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-[#187272] via-[#2a9c96] to-[#26fce3] hover:from-[#1a8a89] hover:via-[#33b0a8] hover:to-[#30e0cb] text-white font-semibold py-4 px-6 rounded-2xl text-base transition-all duration-300 shadow-lg shadow-[#26fce3]/25 hover:shadow-[#26fce3]/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                شروع دریافت هدیه
                <Gift className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#26fce3]/20 rounded-xl blur-2xl animate-pulse"></div>
                <div className="absolute inset-0 bg-[#26fce3]/10 rounded-xl blur-lg"></div>
                <div className="relative w-14 h-14 bg-card rounded-xl flex items-center justify-center border border-primary/30 shadow-lg shadow-[#26fce3]/10">
                  <Target className="w-7 h-7 text-[#26fce3] drop-shadow-lg" strokeWidth={2} />
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                بزرگ‌ترین مانع فعلی تو برای شروع تناسب‌اندام چیه؟
              </h2>
              <p className="text-muted-foreground text-sm">یکی رو انتخاب کن</p>
            </div>
            <div className="space-y-2.5 option-buttons-container">
              {[
                "⏳ وقت کافی ندارم",
                "🍏 دانش تغذیه‌ای ندارم",
                "😔 انگیزه‌مو از دست دادم",
                "🤕 مصدومیت یا محدودیت جسمی دارم",
                "❓ نمی‌دونم از کجا شروع کنم",
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer('obstacle', option)}
                  type="button"
                  className={`option-btn option-btn--gradient w-full relative py-3.5 px-5 text-right rounded-xl transition-all duration-300 text-base font-medium focus:outline-none focus-visible:outline-none ${
                    answers.obstacle === option
                      ? "border-2 border-primary text-foreground bg-card"
                      : "border border-border text-muted-foreground bg-card"
                  }`}
                >
                  <span className="relative z-10 flex items-center justify-between">
                    <span>{option}</span>
                    <div className="option-btn__chev w-0 h-0 border-t-2 border-l-2 transition-all duration-300"></div>
                  </span>
                  {/* Subtle glow on hover */}
                  <div className="option-btn__overlay absolute inset-0 rounded-xl transition-all duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#26fce3]/10 rounded-full blur-xl"></div>
                <div className="relative w-14 h-14 bg-card rounded-xl flex items-center justify-center border border-primary/30">
                  <TrendingUp className="w-7 h-7 text-[#26fce3]" strokeWidth={2} />
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                بزرگ‌ترین هدفت از این تغییر چیه؟
              </h2>
              <p className="text-muted-foreground text-sm">یکی رو انتخاب کن</p>
            </div>
            <div className="space-y-2.5 option-buttons-container">
              {[
                "🔥 چربی‌سوزی سریع و کات بدن",
                "💪 عضله‌سازی و افزایش حجم",
                "⚖️ سلامت عمومی و تناسب‌اندام",
                "🏃 افزایش استقامت و انرژی روزانه",
                "😐 فرقی نمی‌کنه، هر چی جواب بده",
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer('incomePreference', option)}
                  type="button"
                  className={`option-btn option-btn--soft w-full group relative py-3.5 px-5 text-right rounded-xl transition-all duration-300 text-base font-medium focus:outline-none focus-visible:outline-none ${
                    answers.incomePreference === option
                      ? "border-2 border-primary text-foreground bg-card"
                      : "border border-border text-muted-foreground bg-card"
                  }`}
                >
                  <span className="relative z-10">{option}</span>
                  <div className="option-btn__chev absolute left-5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-2 border-l-2 transition-all duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#26fce3]/10 rounded-full blur-xl"></div>
                <div className="relative w-14 h-14 bg-card rounded-xl flex items-center justify-center border border-primary/30">
                  <Sparkles className="w-7 h-7 text-[#26fce3]" strokeWidth={2} />
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                سطح فعلی خودتو کجا می‌بینی؟
              </h2>
              <p className="text-muted-foreground text-sm">یکی رو انتخاب کن</p>
            </div>
            <div className="space-y-2.5 option-buttons-container">
              {[
                "🌱 تازه‌کارم، تازه می‌خوام شروع کنم",
                "⚙️ یه تجربه‌هایی دارم",
                "🏆 حرفه‌ای‌ام، دنبال نتیجه قطعی‌ام",
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer('experienceLevel', option)}
                  type="button"
                  className={`option-btn option-btn--soft w-full relative py-3.5 px-5 text-right rounded-xl transition-all duration-300 text-base font-medium focus:outline-none focus-visible:outline-none ${
                    answers.experienceLevel === option
                      ? "border-2 border-primary text-foreground bg-card"
                      : "border border-border text-muted-foreground bg-card"
                  }`}
                >
                  <span className="relative z-10">{option}</span>
                  <div className="option-btn__chev absolute left-5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-2 border-l-2 transition-all duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-[#26fce3]/10 rounded-full blur-xl"></div>
                <div className="relative w-14 h-14 bg-card rounded-xl flex items-center justify-center border border-primary/30">
                  <Clock className="w-7 h-7 text-[#26fce3]" strokeWidth={2} />
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                فردا ساعت {webinarInfo.time} می‌تونی با خیال راحت تو کارگاه باشی؟
              </h2>
              <p className="text-muted-foreground text-sm">چون ادامه همین نقشه راه دقیقاً داخل کارگاه کامل می‌شه</p>
            </div>
            <div className="space-y-2.5 option-buttons-container">
              {[
                "✅ قطعاً میام",
                "👍 احتمال زیاد میام",
                "🟡 سعی می‌کنم برسم",
              ].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer('attendanceCommitment', option)}
                  type="button"
                  className={`option-btn option-btn--soft w-full relative py-3.5 px-5 text-right rounded-xl transition-all duration-300 text-base font-medium focus:outline-none focus-visible:outline-none ${
                    answers.attendanceCommitment === option
                      ? "border-2 border-primary text-foreground bg-card"
                      : "border border-border text-muted-foreground bg-card"
                  }`}
                >
                  <span className="relative z-10">{option}</span>
                  <div className="option-btn__chev absolute left-5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-2 border-l-2 transition-all duration-300"></div>
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        {
          const obstacle = answers.obstacle || "";
          const incomeType = answers.incomePreference || "";
          const experienceLevel = answers.experienceLevel || "";

          // Determine experience level label
          let levelLabel = experienceLevel;
          let beginnerBullet = "";
          if (experienceLevel.includes("تازه") || experienceLevel.includes("تازه کار")) {
            beginnerBullet = "مناسب شروع از صفر";
          } else if (experienceLevel.includes("متوسط") || experienceLevel.includes("تجربه")) {
            beginnerBullet = "مناسب ساخت سیستم پایدار";
          } else if (experienceLevel.includes("حرفه")) {
            beginnerBullet = "مناسب ارتقاء و سیستم‌سازی";
          }

          // Minimal Circular Loader component
          const MinimalLoader = ({ size = "w-8 h-8" }: { size?: string }) => (
            <div className={`relative ${size}`}>
              <div className={`absolute inset-0 border-2 border-[#26fce3]/20 rounded-full`}></div>
              <div className={`absolute inset-0 border-2 border-transparent border-t-[#26fce3] rounded-full animate-spin`}></div>
            </div>
          );

          // Loading component for sections - Minimal Circular Loader
          const SectionLoader = () => (
            <div className="bg-card rounded-2xl p-5 border border-success/40">
              <div className="flex items-center justify-center py-6">
                <MinimalLoader size="w-10 h-10" />
              </div>
            </div>
          );

          // Initial loading screen - Minimal Circular Loader
          if (finalPopupLoading) {
            return (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <MinimalLoader size="w-16 h-16" />
                <p className="text-muted-foreground text-sm">در حال ساخت نقشه اختصاصی شما</p>
              </div>
            );
          }

          const nextSectionId = (() => {
            if (!visibleSections.length) return 1;
            const maxVisible = Math.max(...visibleSections);
            const next = maxVisible + 1;
            return next <= 7 ? next : null;
          })();
          const shouldShowLoader = (sectionId: number) => nextSectionId === sectionId;

          return (
            <div className="text-right space-y-6 max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent px-1 pb-40">
              {/* Title Section */}
              {visibleSections.includes(0) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-2 text-center"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    برنامه پیشنهادی متناسب با شما
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    بر اساس جواب‌هایی که خودت دادی
                  </p>
                </motion.div>
              ) : (
                <SectionLoader />
              )}

              {/* Section 1: System Identity */}
              {visibleSections.includes(1) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card rounded-2xl p-5 border border-success/40"
                >
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-success text-lg font-bold mb-3"
                  >
                    مدل پیشنهادی تو
                  </motion.h3>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="space-y-2"
                  >
                    <p className="text-foreground text-base font-medium">
                      برنامه تمرین و تغذیه مبتنی بر AI (دقیق و قابل اجرا)
                    </p>
                    <p className="text-muted-foreground text-xs">
                      نه رژیم عمومی اینترنتی، نه حدس و گمان
                    </p>
                    <p className="text-foreground/80 text-sm">
                      مناسب سطح «{levelLabel}»
                    </p>
                    {beginnerBullet && (
                      <p className="text-[#58cac0] text-sm mt-2">
                        • {beginnerBullet}
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              ) : shouldShowLoader(1) ? (
                <SectionLoader />
              ) : null}

              {/* Section 2: Mirror Effect */}
              {visibleSections.includes(2) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card rounded-2xl p-5 border border-success/40"
                >
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-success text-lg font-bold mb-3"
                  >
                    چرا این مدل به تو می‌خوره؟
                  </motion.h3>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="space-y-3 text-foreground/80 text-sm leading-relaxed"
                  >
                    <p>چون خودت گفتی:</p>
                    {obstacle && (
                      <p>• مانع اصلیت: {obstacle}</p>
                    )}
                    {incomeType && (
                      <p>• ترجیحت: {incomeType}</p>
                    )}
                    <p className="text-[#58cac0] font-medium mt-3">
                      این سیستم دقیقاً برای همین شرایط طراحی شده.
                    </p>
                  </motion.div>
                </motion.div>
              ) : shouldShowLoader(2) ? (
                <SectionLoader />
              ) : null}

              {/* Section 3: Cost Transparency */}
              {visibleSections.includes(3) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card rounded-2xl p-5 border border-success/40"
                >
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-success text-lg font-bold mb-3"
                  >
                    از تو چی می‌گیره؟
                  </motion.h3>
                  <motion.ul 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="space-y-2 text-foreground/80 text-sm"
                  >
                    <li>• روزی حدود ۱ تا ۲ ساعت زمان</li>
                    <li>• بدون نیاز به تجهیزات خاص</li>
                    <li>• بدون نیاز به تجربه قبلی</li>
                  </motion.ul>
                </motion.div>
              ) : shouldShowLoader(3) ? (
                <SectionLoader />
              ) : null}

              {/* Section 4: Future Lock */}
              {visibleSections.includes(4) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card rounded-2xl p-5 border border-success/40"
                >
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-success text-lg font-bold mb-3"
                  >
                    اگه درست اجرا بشه، چی می‌سازه؟
                  </motion.h3>
                  <motion.ul 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="space-y-2 text-foreground/80 text-sm"
                  >
                    <li>• یک تغییر بدنی واقعی و ماندگار</li>
                    <li>• قابل پیگیری و قابل اندازه‌گیری</li>
                    <li>• وابسته به برنامه، نه شانس</li>
                  </motion.ul>
                </motion.div>
              ) : shouldShowLoader(4) ? (
                <SectionLoader />
              ) : null}

              {/* Section 5: Pain Bonding */}
              {visibleSections.includes(5) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card rounded-2xl p-5 border border-success/40"
                >
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-success text-lg font-bold mb-3"
                  >
                    جایی که بیشتر آدما زمین می‌خورن
                  </motion.h3>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="space-y-3 text-foreground/80 text-sm leading-relaxed"
                  >
                    <p>۹۰٪ آدما اینجا شکست می‌خورن، چون:</p>
                    <ul className="space-y-1 mr-4">
                      <li>• از جای اشتباه شروع می‌کنن</li>
                      <li>• ابزار اشتباه انتخاب می‌کنن</li>
                      <li>• وسط مسیر سردرگم می‌شن</li>
                    </ul>
                    <p className="text-[#58cac0] font-medium mt-3">
                      کارگاه فردا دقیقاً برای حذف همین ۳ خطاست.
                    </p>
                  </motion.div>
                </motion.div>
              ) : shouldShowLoader(5) ? (
                <SectionLoader />
              ) : null}

              {/* Section 6: Attendance Lock */}
              {visibleSections.includes(6) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card rounded-2xl p-5 border border-success/40"
                >
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-success text-lg font-bold mb-3"
                  >
                    نکته مهم
                  </motion.h3>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="space-y-3 text-foreground/80 text-sm leading-relaxed"
                  >
                    <p>این فقط تصویر کلی سیستم تو بود.</p>
                    <p className="font-medium">📌 فردا داخل کارگاه:</p>
                    <ul className="space-y-1 mr-4">
                      <li>• ساخت دقیق همین سیستم رو می‌بینی</li>
                      <li>• ابزارهای مخصوصش رو می‌گیری</li>
                      <li>• و دقیقاً می‌فهمی قدم اولت چیه</li>
                    </ul>
                    <p className="text-[#58cac0] font-medium mt-3">
                      اگه نیای، این تصویر کامل نمی‌شه.
                    </p>
                  </motion.div>
                </motion.div>
              ) : shouldShowLoader(6) ? (
                <SectionLoader />
              ) : null}

              {/* Section 7: Social Proof */}
              {visibleSections.includes(7) ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-gradient-to-r from-success/10 to-primary/10 rounded-2xl p-5 border border-success/40"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-success text-base font-semibold text-center leading-relaxed"
                  >
                    بیشتر آدما دقیقاً با همین شرایط وارد کارگاه می‌شن و مسیر تغییر بدنی خودشون رو می‌سازن🚀
                  </motion.p>
                </motion.div>
              ) : shouldShowLoader(6) ? (
                <SectionLoader />
              ) : null}

              {/* Final CTA */}
              {visibleSections.includes(7) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <button
                    onClick={handlePopupComplete}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-[#187272] via-[#2a9c96] to-[#26fce3] hover:from-[#1a8a89] hover:via-[#33b0a8] hover:to-[#30e0cb] text-white font-semibold py-4 px-6 rounded-2xl text-base transition-all duration-300 shadow-lg shadow-[#26fce3]/30 hover:shadow-[#26fce3]/50 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="relative z-10">باشه، فردا می‌بینمت</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                  </button>
                </motion.div>
              )}
            </div>
          );
        }

      default:
        return null;
    }
  };

  if (!registrationData) {
    return null;
  }

  return (
    <div className="fitino-landing relative min-h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Ambient bloom, same warm glow language as the rest of the app. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
        <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: "-1.5s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,252,227,0.06),transparent_55%)]" />
      </div>

      {/* Static Content - only after popup flow completes. Deliberately not
          a single centered stack: a prominent confirmation zone on one side,
          a spine-accented "what happens next" sidebar on the other. */}
      {showStaticContent && (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
          <div className="mx-auto grid w-full max-w-4xl items-start gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
            {/* Confirmation zone */}
            <div className="text-center lg:text-right">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success lg:mx-0 lg:h-20 lg:w-20">
                <CheckCircle2 className="h-8 w-8 lg:h-10 lg:w-10" aria-hidden />
              </div>
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
                {registrationData.firstName ? `${registrationData.firstName}، ثبت‌نامت انجام شد` : "ثبت‌نام شما با موفقیت انجام شد"}
              </h1>

              <div className="fp-card fp-notch relative mt-6 overflow-visible p-6 pt-8">
                <span className="fp-ribbon">
                  <Calendar className="size-3" aria-hidden />
                  زمان کارگاه
                </span>
                <div className="fp-hud-num gradient-text text-2xl sm:text-3xl">
                  {webinarInfo.date || "فردا ساعت ۱۹:۰۰"}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  کارگاه آنلاین آنالیز بدنی و برنامه‌ریزی هوشمند تمرین و تغذیه
                </p>
              </div>
            </div>

            {/* What happens next — sidebar of details, not a stacked paragraph. */}
            <div className="fp-spine animate-in fade-in space-y-3 rounded-xl border border-border bg-card/60 p-5 duration-500">
              <h2 className="text-sm font-semibold text-muted-foreground">قبل از فردا بدون</h2>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Radio className="h-4 w-4" aria-hidden />
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">
                  این کارگاه <span className="font-semibold text-success">زنده و آنلاین</span> برگزار می‌شه و ضبط نمی‌شه
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" aria-hidden />
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">
                  یادت نره ساعت {webinarInfo.time || "۱۹:۰۰"} بیای
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {popupStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
          {/* Backdrop - non-clickable during flow */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>

          {/* Popup Content */}
          <div className={`relative z-10 w-full ${popupStep === 7 ? 'max-w-2xl h-full max-h-[90vh]' : 'max-w-md'} animate-in slide-in-from-bottom-4 duration-500`}>
            {/* Subtle outer glow */}
            <div className="absolute -inset-1 bg-[#26fce3]/10 rounded-3xl blur-xl"></div>

            {/* Main card, same fp-card/fp-notch shape language as the rest of the app */}
            <div className={`fp-card fp-notch relative overflow-hidden shadow-2xl ${popupStep === 7 ? 'h-full' : ''}`}>

              <div className={`relative ${popupStep === 7 ? 'p-5 sm:p-6' : 'p-6 sm:p-8'}`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={popupStep}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {renderPopupStep()}
                  </motion.div>
                </AnimatePresence>

                {/* Progress indicator */}
                {popupStep > 1 && popupStep < 7 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {[2, 3, 4, 5, 6].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                          step <= popupStep
                            ? 'bg-primary w-12'
                            : 'bg-muted w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .caret-blink { animation: caret 1s steps(1, end) infinite; }
        .dot { animation: dots 1.2s ease-in-out infinite; }
        .dot-2 { animation-delay: 0.15s; }
        .dot-3 { animation-delay: 0.3s; }
        .loading-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          transform: translateX(-100%);
          animation: shimmer 1.4s ease-in-out infinite;
        }
        .cta-pulse {
          animation: cta-pulse 1.8s ease-in-out infinite;
        }
        .confetti-piece {
          position: absolute;
          top: 10%;
          width: 8px;
          height: 14px;
          border-radius: 2px;
          opacity: 0.95;
          animation: confetti-fall 1.4s ease-out forwards;
        }
        .spin-slow { animation: slow-spin 8s linear infinite; }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-in-from-bottom-4 {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes caret {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }

        @keyframes dots {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-2px); opacity: 1; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        @keyframes cta-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(38, 252, 227, 0.25); }
          50% { transform: scale(1.03); box-shadow: 0 14px 36px rgba(38, 252, 227, 0.35); }
        }

        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(80px) rotate(240deg) scale(0.9); opacity: 0; }
        }
        @keyframes slow-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .slide-in-from-bottom-4 {
          animation: slide-in-from-bottom-4 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        /* Option buttons: no-hover by default (prevents sticky hover on mobile) */
        .option-btn__chev {
          opacity: 0;
          border-color: rgba(38, 252, 227, 0);
        }
        .option-btn__overlay {
          background-color: rgba(38, 252, 227, 0);
        }

        /* Desktop-only hover styles */
        @media (hover: hover) and (pointer: fine) {
          .option-btn--soft:hover {
            background-color: hsl(var(--card));
            border-color: rgba(38, 252, 227, 0.45);
            color: hsl(var(--foreground));
            box-shadow: 0 10px 30px rgba(38, 252, 227, 0.10);
          }

          .option-btn--gradient:hover {
            background-image: linear-gradient(270deg, rgba(38, 252, 227, 0.12), rgba(38, 252, 227, 0.0), rgba(0, 0, 0, 0));
            border-color: rgba(38, 252, 227, 0.55);
            color: hsl(var(--foreground));
            box-shadow: 0 14px 34px rgba(38, 252, 227, 0.16);
          }

          .option-btn:hover .option-btn__chev {
            opacity: 1;
            transform: translateX(-4px);
            border-color: rgba(38, 252, 227, 1);
          }

          .option-btn--gradient:hover .option-btn__overlay {
            background-color: rgba(38, 252, 227, 0.05);
          }
        }
      `}</style>
    </div>
  );
};

export default ThankYouPage;
