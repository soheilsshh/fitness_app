// 7 specialized funnel questions (keys match CreateFunnelLeadRequest).
export const QUESTIONS = [
  {
    key: "primaryGoal",
    title: "هدف اصلی شما برای تغییر استایل چیست؟",
    subtitle: "پایه علمی برنامه تو بر اساس این انتخاب شکل می‌گیرد.",
    options: [
      { value: "weight_loss", label: "چربی‌سوزی سریع و کات بدون ریزش عضلات", emoji: "🔥", scenario: "A" },
      { value: "muscle_gain", label: "ساخت عضلات باکیفیت و حجم‌دهی عضلانی", emoji: "💪", scenario: "B" },
      { value: "fitness", label: "افزایش قدرت، انرژی روزانه و فیتنس عمومی", emoji: "⚡", scenario: "C" },
    ],
  },
  {
    key: "activityLevel",
    title: "وضعیت فعالیت روزانه شما (خارج از باشگاه) چطور است؟",
    subtitle: "سطح متابولیسم و کالری مورد نیاز شما از اینجا محاسبه می‌شود",
    options: [
      { value: "sedentary", label: "پشت‌میزنشین و کم‌تحرک (کارمندی / دانشجویی)", emoji: "🪑" },
      { value: "moderate", label: "تحرک متوسط (پیاده‌روی روزانه یا کار سرپا)", emoji: "🚶" },
      { value: "active", label: "بسیار پرتحرک (کار بدنی سنگین یا ورزشکار فعال)", emoji: "🏃" },
    ],
  },
  {
    key: "trainingEnv",
    title: "شرایط و ترجیح شما برای انجام تمرینات چگونه است؟",
    subtitle: "برنامه تمرینی شما متناسب با امکانات شما نوشته می‌شود",
    options: [
      { value: "home", label: "فقط در خانه (با کش، دمبل یا وزن بدن)", emoji: "🏠" },
      { value: "gym", label: "در باشگاه بدنسازی (دسترسی به تمام دستگاه‌ها)", emoji: "🏋️" },
    ],
  },
  {
    key: "experience",
    title: "چقدر با محیط باشگاه و حرکات بدنسازی آشنایی دارید؟",
    subtitle: "سطح آموزشی برنامه با تجربه شما تنظیم می‌شود",
    options: [
      { value: "beginner", label: "مبتدی (صفر هستم و نیاز به آموزش تک‌تک حرکات دارم)", emoji: "🌱" },
      { value: "intermediate", label: "متوسط (حرکات را می‌شناسم اما برنامه اصولی نداشته‌ام)", emoji: "📘" },
      { value: "advanced", label: "پیشرفته (سابقه تمرین مداوم دارم و حرفه‌ای کار می‌کنم)", emoji: "🏅" },
    ],
  },
  {
    key: "nutritionChallenge",
    title: "بزرگ‌ترین چالش شما در رعایت رژیم غذایی چیست؟",
    subtitle: "نقطه ضعف تغذیه‌ای شما کلید طراحی رژیم پایدار است",
    options: [
      { value: "sweets", label: "اشتیاق شدید به شیرینی‌جات و ریزه‌خواری عصبی", emoji: "🍫" },
      { value: "low_appetite", label: "کم‌اشتهایی شدید (نمی‌توانم به اندازه کافی غذا بخورم)", emoji: "🍽️" },
      { value: "no_time", label: "نداشتن وقت برای آشپزی و آماده‌سازی وعده‌ها", emoji: "⏰" },
    ],
  },
  {
    key: "mainObstacle",
    title: "بزرگترین مانعی که در برنامه‌های قبلی شما را متوقف کرد چه بود؟",
    subtitle: "ما اینجاییم تا زنجیره شکست‌های قبلی را قطع کنیم.",
    options: [
      { value: "motivation", label: "رها شدن توسط مربی و عدم نظارت و پیگیری مداوم", emoji: "🎯" },
      { value: "plateau", label: "استپ وزنی و نتیجه نگرفتن از رژیم‌های سخت", emoji: "📉" },
      { value: "knowledge", label: "تا به حال مسیر اصولی را شروع نکرده‌ام", emoji: "🚀" },
    ],
  },
  {
    key: "commitment",
    title: "چقدر برای رسیدن به این هدف مصمم هستید؟",
    subtitle: "میزان تعهد شما، شدت و سرعت برنامه را مشخص می‌کند",
    options: [
      { value: "flexible", label: "می‌خواهم با یک برنامه منعطف و بدون فشار زیاد شروع کنم", emoji: "🌿" },
      { value: "max_results", label: "کاملاً آماده‌ام؛ سریع‌ترین و بهترین نتیجه را می‌خواهم", emoji: "🔥" },
    ],
  },
];

const ACTIVITY_LABELS = {
  sedentary: "کم‌تحرک (پشت‌میزنشین)",
  moderate: "تحرک متوسط",
  active: "پرتحرک و ورزشکار",
};

const ENV_LABELS = {
  home: "تمرین در خانه",
  gym: "باشگاه بدنسازی",
};

const EXPERIENCE_LABELS = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

const NUTRITION_LABELS = {
  sweets: "ریزه‌خواری و شیرینی عصبی",
  low_appetite: "کم‌اشتهایی شدید",
  no_time: "نبود وقت برای آشپزی",
};

const OBSTACLE_LABELS = {
  motivation: "رها کردن مسیر و کمبود انگیزه",
  plateau: "استپ وزنی و نتیجه نگرفتن",
  knowledge: "نداشتن برنامه و دانش تمرینی",
};

const COMMITMENT_LABELS = {
  flexible: "شروع منعطف و بدون فشار",
  max_results: "حداکثر نتیجه در کمترین زمان",
};

const SCENARIO_META = {
  A: {
    color: "rose",
    badge: "مسیر چربی‌سوزی و کاهش وزن",
    method: "کرب‌سایکلینگ (نوسان کربوهیدرات)",
    bodyType: "اندومورف متابولیک",
  },
  B: {
    color: "emerald",
    badge: "مسیر افزایش حجم و عضله‌سازی",
    method: "تنش مکانیکی بالا (Progressive Overload)",
    bodyType: "اکتومورف مستعد کاتابولیسم",
  },
  C: {
    color: "sky",
    badge: "مسیر فیتنس و فرم‌دهی",
    method: "سیستم پیگیری هوشمند (Accountability)",
    bodyType: "مزومورف متعادل",
  },
};

/** Funnel 1 — dedicated sales funnel for علی رشیدآبادی.
 *  Funnel 2 (future) would be a separate route for another coach.
 */
export const FUNNEL_META = {
  key: "funnel_1",
  label: "فانل ۱",
  coachName: "علی رشیدآبادی",
  description: "اختصاصی طراحی‌شده برای علی رشیدآبادی",
  path: "/ali-rashidabadi",
};

export const HERO_COPY = {
  title: "فرمول اختصاصی بدن تو؛ ترکیب علم مربیگری و پایش ۲۴ ساعته هوش مصنوعی",
  subtitle:
    "رژیم‌های تکراری و برنامه‌های رها شده را فراموش کن. در فیتینو، مربی علی و ایجنت‌های هوش مصنوعی، لحظه به لحظه مسیر تغییر بدنت را زیر نظر دارند تا مطمئن شویم این‌بار حتماً به نتیجه می‌رسی.",
  cta: "شروع ارزیابی هوشمند بدنم (رایگان)",
  funnelBadge: "فانل ۱ · اختصاصی علی رشیدآبادی",
};

export const METRICS_COPY = {
  title: "کالیبره کردن سیستم پردازش بر اساس ساختار فیزیولوژیک شما",
  guide:
    "اطلاعات فعلی خود را وارد کنید تا ایجنت هوش مصنوعی، نرخ متابولیسم پایه (BMR) و توزیع ماکروهای بدنتان را محاسبه کند.",
  cta: "محاسبه شاخص‌ها و استخراج بیوگرافی بدنی",
};

export const LEAD_COPY = {
  title: "اتصال دیتای ارزیابی به پنل اختصاصی مربی علی",
  subtitle:
    "برای ذخیره دایمی این آنالیز در بانک داده فیتینو و فعال‌سازی پروتکل پایش هوشمند، نام و شماره موبایل خود را وارد کنید.",
  otpSubtitle: "کد ۶ رقمی پیامک‌شده را وارد کنید تا هویت شما تایید شود.",
  sendOtp: "ارسال کد تایید",
  resendOtp: "ارسال مجدد کد",
  changePhone: "تغییر شماره",
  cta: "تایید و ورود به بخش دریافت برنامه اختصاصی",
  otpCta: "تایید کد و ادامه",
};

export const RESULT_COPY = {
  title: "گزارش اولیه آنالیز هوشمند بدنی شما آماده شد",
  cta: "دریافت راهکار و برنامه اختصاصی از مربی علی 🚀",
  analysisReadyTitle: "📊 گزارش آنالیز اختصاصی بدنی شما آماده است",
  analysisReadyBody:
    "داده‌های فیزیولوژیک شما ثبت شد. بلافاصله پس از تکمیل سفارش، کالیبراسیون و تنظیم برنامه توسط مربی علی آغاز می‌شود.",
  aiWarning:
    "تحلیل سیستم: الگوی پاسخ‌های شما نشان می‌دهد بدنتان مقاومت بالایی به استپ وزنی در هفته‌های سوم به بعد دارد. مربی علی رشیدآبادی برای شکستن این استپ عضلانی، نیاز به اعمال یک سیستم بارگذاری متناوب در تمرین شما دارد.",
  aiGuard:
    "پایش ضد استپ فیتینو: «این برنامه مجهز به پروتکل پایش روزانه است. به محض اینکه سرعت چربی‌سوزی شما کند شود، سیستم هوشمند تغییرات را به مربی علی گزارش داده و برنامه شما بدون هزینه اضافه آپدیت می‌شود.»",
  urgency:
    "به دلیل ترافیک بالای سرور پردازش و محدودیت در ظرفیت پذیرش مربی علی، این آنالیز اختصاصی و رزرو پنل شما فقط تا ۱۰:۰۰ دقیقه دیگر محفوظ می‌ماند.",
};

/** Canonical coach display name — keep consistent across funnel UI. */
export const COACH_FULL_NAME = "مربی علی رشیدآبادی";
export const COACH_SHORT_NAME = "علی رشیدآبادی";

const TARGET_ZONES = {
  weight_loss: "چربی‌های مقاوم شکم و پهلو",
  muscle_gain: "گروه‌های عضلانی اصلی با تمرکز بر هایپرتروفی",
  fitness: "فرم کلی بدن، انرژی روزانه و تعادل عضلانی",
};

const PHYSIO_BY_GOAL = {
  weight_loss: "سرعت سوخت‌وساز بدن شما کاهش یافته",
  muscle_gain: "بدن شما تمایل بالایی به کاتابولیسم (ریزش عضله) دارد",
  fitness: "ثبات تمرینی و بازیابی انرژی شما هنوز بهینه نشده",
};

const METABOLIC_STATUS = {
  weight_loss: "مقاوم",
  muscle_gain: "کاتابولیک سریع",
  fitness: "نامتعادل و ناپایدار",
};

const PROBLEM_INTENSITY = {
  weight_loss: "شدید",
  muscle_gain: "متوسط رو به بالا",
  fitness: "قابل کنترل اما مزمن",
};

const COMMON_MISTAKE = {
  weight_loss: "رژیم‌های کم-کالری سنتی",
  muscle_gain: "حجم‌خوری بدون چگالی کالری و برنامه اصولی",
  fitness: "برنامه‌های پراکنده بدون پیگیری مستمر",
};

const SIDE_EFFECT = {
  weight_loss: "تخریب بافت عضلانی",
  muscle_gain: "عدم افزایش حجم باکیفیت و خستگی متابولیک",
  fitness: "نتایج ناپایدار و بازگشت سریع به نقطه شروع",
};

const SUCCESS_PCT = {
  weight_loss: 88,
  muscle_gain: 84,
  fitness: 86,
};

const STRATEGY_FOCUS = {
  weight_loss: "چربی‌سوزی همزمان با حفظ کامل بافت عضلانی و بازیابی توان متابولیک بدن شماست",
  muscle_gain: "افزایش حجم عضلانی باکیفیت بدون چربی زائد و تثبیت ریکاوری شماست",
  fitness: "فرم‌دهی پایدار، افزایش انرژی روزانه و ساخت عادت تمرینی ماندگار است",
};

export const PAYMENT_COPY = {
  title: "سیستم تعهد بدنی فیتینو؛ جایی که هیچ‌کس رها نمی‌شود!",
  socialProof: "کسانی که مثل تو فکر می‌کردند تغییر، غیرممکن است...",
  ctaFeatures: "ادامه — مشاهده نتایج واقعی",
  ctaProof: "انتخاب پلن و پرداخت",
  cta: "تکمیل سفارش و دریافت برنامه اختصاصی 🚀",
  securePay: "🔒 پرداخت امن از طریق درگاه رسمی شبکه شتاب | فعال‌سازی آنی پنل",
  features: [
    {
      icon: "bot",
      title: "پایش هوشمند و مداوم",
      body: "بدون توقف در مسیر؛ داده‌های بدنی شما هر روز تحلیل شده و در صورت نیاز، برنامه‌تان بلافاصله کالیبره و آپدیت می‌شود.",
    },
    {
      icon: "user",
      title: "طراحی ۱۰۰٪ اختصاصی با مربی علی",
      body: "تمامی حرکات طبق فیزیولوژی اختصاصی شما توسط مربی علی تنظیم می‌شود تا در کوتاه‌ترین زمان، بیشترین بازدهی را بگیرید.",
    },
    {
      icon: "utensils",
      title: "منوی غذایی کاملا منعطف",
      body: "بدون حذف غذاهای دلخواه و با مواد در دسترس، طوری برنامه‌ریزی می‌کنیم که بدون گرسنگی طاقت‌فرسا، به اندام ایده‌آل برسید.",
    },
    {
      icon: "smartphone",
      title: "سادگی در بالاترین حد ممکن",
      body: "برنامه تمرین، تغذیه، ویدیوهای آموزشی و ثبت روزانه داده‌ها؛ همه‌چیز به‌صورت منظم و شفاف در پنل اختصاصی شماست.",
    },
  ],
  transformations: [
    {
      before: "/images/1.png",
      after: "/images/11.png",
      name: "سارا محمدی",
      age: 28,
      heightCm: 165,
      weightKg: 72,
      bodyType: "اندومورف",
      quote:
        "بعد از سه ماه با مربی علی، نه فقط وزنم ریخت — حس می‌کنم بالاخره کسی رهایم نکرد و برنامه هر هفته با بدنم آپدیت شد.",
    },
    {
      before: "/images/2.png",
      after: "/images/22.png",
      name: "امیر حسینی",
      age: 34,
      heightCm: 178,
      weightKg: 86,
      bodyType: "مزومورف",
      quote:
        "قبلاً هر برنامه‌ای را وسط راه رها می‌کردم. اینجا پایش روزانه و تماس مربی باعث شد تا آخر مسیر بمونم.",
    },
  ],
  vipValueTable: {
    title: "۱. جدول ارزش‌گذاری پلن VIP (۳ ماهه)",
    serviceHeader: "خدمات اصلی پلن VIP",
    marketHeader: "ارزش واقعی در بازار",
    rows: [
      {
        service: "برنامه تمرین و تغذیه اختصاصی ۳ ماهه (بیومکانیک + سفره ایرانی)",
        value: 1_800_000,
      },
      {
        service: "پایش ۲۴ ساعته هوش مصنوعی (سیستم فعال ضد استپ وزنی)",
        value: 1_000_000,
      },
      {
        service: "گزارش آنالیز بدنی و پیش‌بینی ۱۲ هفته‌ای",
        value: 400_000,
      },
    ],
    marketTotalLabel: "جمع ارزش واقعی خدمات:",
    marketTotal: 3_200_000,
    investLabel: "سرمایه‌گذاری شما در فیتینو:",
    investAmount: 1_490_000,
    dailyPitch:
      "معادل روزی فقط ۱۶,۵۰۰ تومان — کمتر از قیمت یک بطری آب معدنی برای ۳ ماه تحول بدنی!",
  },
  cipValueTable: {
    title: "۲. جدول ارزش‌گذاری پلن CIP (۳ ماهه)",
    emoji: "👑",
    serviceHeader: "خدمات اصلی پلن CIP",
    marketHeader: "ارزش واقعی در بازار",
    rows: [
      {
        service: "تمامی امکانات کامل پلن VIP (تمرین + تغذیه + پایش AI)",
        value: 3_200_000,
      },
      {
        service: "پشتیبانی اختصاصی و مستقیم مربی علی رشیدآبادی",
        value: 1_800_000,
      },
      {
        service: "مشاوره اختصاصی (ویدئویی / حضوری)",
        value: 700_000,
      },
    ],
    marketTotalLabel: "جمع ارزش واقعی خدمات:",
    marketTotal: 5_700_000,
    investLabel: "سرمایه‌گذاری شما در فیتینو:",
    investAmount: 2_900_000,
    dailyPitch:
      "فقط روزی ۳۲,۰۰۰ تومان — برای داشتن مربی خصوصی و پایش ۲۴ ساعته مستقیم در پنل شخصی شما!",
  },
};

export const SUCCESS_COPY = {
  title: "به فیتینو خوش آمدید! اولین و مهم‌ترین قدم را مقتدرانه برداشتید.",
  subtitle:
    "پرداخت شما با موفقیت تایید شد. سیستم هوشمند و تیم مربی علی در حال آماده‌سازی پنل اختصاصی شما هستند.",
  consultationTitle: "درخواست مشاوره و برنامه شما ثبت شد",
  consultationBody:
    "تیم مربی به زودی با شما تماس می‌گیرند. مربی در زمان مناسب با شما هماهنگ می‌کند و برنامه اختصاصی‌تان را آماده می‌کند.",
  dashboardCta: "ورود به داشبورد کاربر",
  copyTracking: "کپی کد پیگیری",
  copiedTracking: "کپی شد",
};

export const PAY_RESULT_COPY = {
  failedTitle: "پرداخت کامل نشد",
  failedSubtitle:
    "نگران نباشید — سفارش شما هنوز باز است. می‌توانید دوباره به درگاه امن زرین‌پال برگردید و پرداخت را تمام کنید.",
  retryCta: "تلاش مجدد پرداخت",
  backToPlans: "بازگشت به انتخاب پلن",
  successRedirect: "پرداخت تایید شد — در حال انتقال...",
};

function getScenario(primaryGoal) {
  const q = QUESTIONS[0].options.find((o) => o.value === primaryGoal);
  return q?.scenario || "A";
}

/** Mifflin–St Jeor (male baseline; sex not collected in funnel). */
export function calculateBmr(age, heightCm, weightKg) {
  const a = Number(age);
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (![a, h, w].every((n) => Number.isFinite(n) && n > 0)) return null;
  return Math.round(10 * w + 6.25 * h - 5 * a + 5);
}

export function estimateBodyType(primaryGoal, bmi) {
  const meta = SCENARIO_META[getScenario(primaryGoal)];
  if (bmi && bmi >= 27) return "اندومورف با ذخیره چربی مقاوم";
  if (bmi && bmi < 20) return "اکتومورف با متابولیسم سریع";
  return meta?.bodyType || "مزومورف متعادل";
}

export function calculateBmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w || h <= 0) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

export function buildMacroSplit(primaryGoal, bmr) {
  if (!bmr) return null;
  if (primaryGoal === "muscle_gain") {
    return {
      calories: Math.round(bmr * 1.35),
      protein: "۳۵٪",
      carbs: "۴۰٪",
      fat: "۲۵٪",
    };
  }
  if (primaryGoal === "weight_loss") {
    return {
      calories: Math.round(bmr * 1.15),
      protein: "۴۰٪",
      carbs: "۳۰٪",
      fat: "۳۰٪",
    };
  }
  return {
    calories: Math.round(bmr * 1.25),
    protein: "۳۰٪",
    carbs: "۴۰٪",
    fat: "۳۰٪",
  };
}

export function buildAnalysis(answers, coachName = COACH_SHORT_NAME) {
  const {
    primaryGoal,
    activityLevel,
    trainingEnv,
    experience,
    nutritionChallenge,
    mainObstacle,
    age,
    heightCm,
    weightKg,
  } = answers;

  const scenario = getScenario(primaryGoal);
  const activity = ACTIVITY_LABELS[activityLevel] || "سطح فعالیت فعلی";
  const env = ENV_LABELS[trainingEnv] || "محیط تمرینی شما";
  const exp = EXPERIENCE_LABELS[experience] || "فعلی";
  const nutrition = NUTRITION_LABELS[nutritionChallenge] || "چالش تغذیه‌ای شما";
  const obstacle = OBSTACLE_LABELS[mainObstacle] || "موانع قبلی";
  const meta = SCENARIO_META[scenario];
  const bmr = calculateBmr(age, heightCm, weightKg);
  const bmi = calculateBmi(heightCm, weightKg);
  const bodyType = estimateBodyType(primaryGoal, bmi);
  const macros = buildMacroSplit(primaryGoal, bmr);
  const coachLabel = COACH_FULL_NAME;
  const goalKey = primaryGoal || "fitness";

  // Template variables (developer guide)
  const physiologicIndex = PHYSIO_BY_GOAL[goalKey] || PHYSIO_BY_GOAL.fitness;
  const metabolicStatus = METABOLIC_STATUS[goalKey] || METABOLIC_STATUS.fitness;
  const problemIntensity = PROBLEM_INTENSITY[goalKey] || PROBLEM_INTENSITY.fitness;
  const commonMistake = COMMON_MISTAKE[goalKey] || COMMON_MISTAKE.fitness;
  const sideEffect = SIDE_EFFECT[goalKey] || SIDE_EFFECT.fitness;
  const biggestObstacle =
    mainObstacle === "plateau"
      ? "استپ‌های مکرر وزنی شما"
      : obstacle || "بزرگ‌ترین مانع قبلی شما";
  const methodName = meta?.method || "پروتکل اختصاصی فیتینو";
  const readinessLevel = exp;
  const trainingPlace = env;
  const targetZones = TARGET_ZONES[goalKey] || TARGET_ZONES.fitness;
  const successPct = SUCCESS_PCT[goalKey] || 86;
  const strategyFocus = STRATEGY_FOCUS[goalKey] || STRATEGY_FOCUS.fitness;

  const statusSummary = {
    title: "خلاصه وضعیت",
    vars: {
      physiologicIndex,
      metabolicStatus,
      problemIntensity,
      commonMistake,
      sideEffect,
      biggestObstacle,
      nutrition,
    },
    body:
      goalKey === "weight_loss"
        ? `تحلیل داده‌های فیزیولوژیک نشان می‌دهد ${physiologicIndex} و سیستم متابولیک در وضعیت ${metabolicStatus} قرار دارد. در این شرایط، استفاده از ${commonMistake} نه تنها موثر نیست، بلکه با ${sideEffect}، عامل اصلی ${biggestObstacle} خواهد بود.`
        : goalKey === "muscle_gain"
          ? `تحلیل داده‌های فیزیولوژیک نشان می‌دهد ${physiologicIndex} و سیستم متابولیک در وضعیت ${metabolicStatus} قرار دارد. در این شرایط (${problemIntensity})، ${commonMistake} نه تنها موثر نیست، بلکه با ${sideEffect}، مانع اصلی رشد شماست. چالش «${nutrition}» و «${biggestObstacle}» باید در پروتکل جدید خنثی شوند.`
          : `تحلیل داده‌های فیزیولوژیک نشان می‌دهد ${physiologicIndex} و سیستم متابولیک در وضعیت ${metabolicStatus} قرار دارد. در این شرایط (${problemIntensity})، ${commonMistake} معمولاً به ${sideEffect} منجر می‌شود. بزرگ‌ترین مانع شما «${biggestObstacle}» است که با چالش «${nutrition}» هم‌پوشانی دارد.`,
  };

  const customSolution = {
    title: `راهکار اختصاصی ${coachLabel}`,
    vars: {
      methodName,
      readinessLevel,
      trainingPlace,
      targetZones,
      activity,
    },
    body:
      goalKey === "weight_loss"
        ? `اعمال پروتکل اختصاصی «${methodName}» جهت وادار کردن بدن به چربی‌سوزی فعال. این متد به همراه تمرینات هدفمند متناسب با سطح آمادگی ${readinessLevel} و امکانات (${trainingPlace}) تنظیم می‌شود تا بدون گرسنگی طاقت‌فرسا، ${targetZones} را از بین ببرد.`
        : goalKey === "muscle_gain"
          ? `اعمال پروتکل اختصاصی «${methodName}» برای ساخت عضله باکیفیت. این متد همراه با تغذیه چگال و تمرینات متناسب با سطح «${readinessLevel}» در (${trainingPlace}) طراحی می‌شود تا ${targetZones} بدون چربی زائد رشد کنند.`
          : `اعمال پروتکل اختصاصی «${methodName}» برای فرم‌دهی پایدار. برنامه با سطح «${readinessLevel}»، فعالیت روزانه «${activity}» و امکانات (${trainingPlace}) هماهنگ می‌شود تا ${targetZones} هدف قرار گیرد.`,
  };

  const routePrediction = {
    title: "پیش‌بینی مسیر",
    successPct,
    vars: { successPct, strategyFocus },
    body: `شاخص سازگاری و موفقیت شما در این دوره ${new Intl.NumberFormat("fa-IR").format(successPct)}٪ برآورد شده است. استراتژی اصلی این مسیر، ${strategyFocus}.`,
  };

  const metricsHighlights = [
    { label: "تیپ بدنی تخمینی", value: bodyType, icon: "body" },
    {
      label: "نرخ متابولیسم پایه (BMR)",
      value: bmr ? `${new Intl.NumberFormat("fa-IR").format(bmr)} کالری` : "—",
      icon: "flame",
    },
    {
      label: "شاخص توده بدنی",
      value: bmi != null ? new Intl.NumberFormat("fa-IR").format(bmi) : "—",
      icon: "chart",
    },
    {
      label: "هدف کالری روزانه",
      value: macros
        ? `${new Intl.NumberFormat("fa-IR").format(macros.calories)} کالری`
        : "—",
      icon: "target",
    },
  ];

  const chartBars =
    primaryGoal === "muscle_gain"
      ? [
          { label: "قدرت", value: 72 },
          { label: "حجم", value: 85 },
          { label: "استقامت", value: 58 },
          { label: "ریکاوری", value: 64 },
          { label: "ثبات", value: 68 },
        ]
      : primaryGoal === "weight_loss"
        ? [
            { label: "چربی‌سوزی", value: 88 },
            { label: "حفظ عضله", value: 70 },
            { label: "ثبات", value: 62 },
            { label: "متابولیسم", value: 55 },
            { label: "استقامت", value: 60 },
          ]
        : [
            { label: "فرم", value: 78 },
            { label: "انرژی", value: 82 },
            { label: "قدرت", value: 68 },
            { label: "تعادل", value: 75 },
            { label: "ثبات", value: 72 },
          ];

  const recommendations =
    goalKey === "weight_loss"
      ? [
          "برنامه تغذیه چرخه‌ای (کرب‌سایکلینگ) متناسب با متابولیسم شما",
          "تمرینات ترکیبی برای چربی‌سوزی هدفمند",
          "پیگیری و چکاپ هفتگی توسط تیم مربی",
        ]
      : goalKey === "muscle_gain"
        ? [
            "برنامه تمرینی ۴-۵ روزه با تمرکز ترکیبی",
            "رژیم پرکالریِ زودهضم و شخصی‌سازی‌شده",
            "مکمل‌سازی و زمان‌بندی دقیق وعده‌ها",
          ]
        : [
            "تمرینات کوتاه و مؤثر (۳-۴ روز در هفته)",
            "رژیم متعادل بدون محرومیت شدید",
            "گزارش‌دهی و چکاپ هفتگی در پنل اختصاصی",
          ];

  const subtitle =
    goalKey === "muscle_gain"
      ? "تحلیل ژنتیک و متابولیسم اختصاصی شما"
      : goalKey === "fitness"
        ? "برنامه انعطاف‌پذیر برای یک تغییر ماندگار"
        : "تحلیل اختصاصی بر اساس ۷ پاسخ تخصصی و شاخص‌های فیزیولوژیک شما";

  return {
    scenario,
    title: RESULT_COPY.title,
    subtitle,
    meta,
    bmr,
    bmi,
    bodyType,
    macros,
    chartBars,
    successPct,
    aiWarning: RESULT_COPY.aiWarning,
    highlights: metricsHighlights,
    statusSummary,
    customSolution,
    routePrediction,
    // Keep flat sections for PNG export / legacy consumers
    sections: [
      { title: statusSummary.title, body: statusSummary.body },
      { title: customSolution.title, body: customSolution.body },
      { title: routePrediction.title, body: routePrediction.body },
    ],
    recommendations,
    closing: LEAD_COPY.subtitle,
    coachName: coachLabel,
  };
}

export const ANALYZING_STEPS = [
  "محاسبه دقیق نرخ متابولیسم و تفکیک ماکروها انجام شد.",
  "متصل کردن متغیرهای شما به سیستم پایش لحظه‌ای هوش مصنوعی...",
  "تحلیل موانع غذایی و شخصی‌سازی منوی منعطف فیتینو...",
  "ارسال گزارش اولیه به پنل کاربری مربی علی رشیدآبادی جهت تایید نهایی...",
];

export const ANALYZING_TITLE = "در حال تحلیل داده‌های ساختاری و طراحی استراتژی بدنی شما...";

export const ANALYZING_MESSAGES = ANALYZING_STEPS;

export const PREPARING_MESSAGES = [
  "در حال آماده‌سازی سوال بعدی هستیم...",
  "ثبت پاسخ شما...",
  "بارگذاری سوال بعدی...",
];

export const GOAL_LABELS = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش حجم",
  fitness: "فیتنس و فرم‌دهی",
};

export const ANSWER_LABELS = {
  activityLevel: ACTIVITY_LABELS,
  trainingEnv: ENV_LABELS,
  experience: EXPERIENCE_LABELS,
  nutritionChallenge: NUTRITION_LABELS,
  mainObstacle: OBSTACLE_LABELS,
  commitment: COMMITMENT_LABELS,
};

export const STATUS_LABELS = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت شده",
  contacted: "تماس گرفته شد",
  failed: "ناموفق",
};

/** Admin pipeline stages for Ali Rashidabadi funnel CRM. */
export const FUNNEL_PIPELINE = [
  {
    key: "pending_payment",
    label: "ثبت لید",
    short: "لید",
    desc: "ارزیابی تمام + شماره ثبت شده — هنوز پرداخت نکرده",
  },
  {
    key: "paid",
    label: "خرید نهایی",
    short: "خرید",
    desc: "پرداخت انجام شده — منتظر تماس تیم",
  },
  {
    key: "contacted",
    label: "تماس گرفته شد",
    short: "تماس",
    desc: "تیم مربی با لید هماهنگ شده",
  },
];

/** Progress for smart-processor bar: quiz 15→70, metrics 80, analyzing 90, result/lead 95+. */
export function funnelProgress(stage, qIndex) {
  if (stage === "quiz") {
    return 15 + (qIndex / QUESTIONS.length) * 55;
  }
  if (stage === "metrics") return 80;
  if (stage === "analyzing") return 90;
  if (stage === "result") return 95;
  if (stage === "lead") return 98;
  return 10;
}
