// 8 funnel questions — keys stored in answers; mapAnswersForBackend() maps to lead API.
export const QUESTIONS = [
  {
    key: "gender",
    title: "برای محاسبات دقیق‌تر، جنسیت شما چیست؟",
    subtitle: "",
    options: [
      { value: "male", label: "مرد", emoji: "👨" },
      { value: "female", label: "زن", emoji: "👩" },
      { value: "prefer_not_say", label: "ترجیح می‌دهم نگویم", emoji: "🙂" },
    ],
  },
  {
    key: "primaryGoal",
    title: "هدف اصلی شما چیست؟",
    subtitle: "پایه علمی برنامه بر اساس این انتخاب شکل می‌گیرد.",
    options: [
      { value: "weight_loss", label: "کاهش چربی و وزن", emoji: "🔥", scenario: "A" },
      { value: "muscle_gain", label: "عضله‌سازی و فرم‌دهی", emoji: "💪", scenario: "B" },
      { value: "fitness", label: "تناسب اندام و سلامت عمومی", emoji: "⚡", scenario: "C" },
    ],
  },
  {
    key: "activityLevel",
    title: "در طول روز چقدر فعالیت دارید؟",
    subtitle: "",
    options: [
      { value: "sedentary", label: "بیشتر نشسته و کم‌تحرک", emoji: "🪑" },
      { value: "moderate", label: "فعالیت متوسط و پیاده‌روی روزانه", emoji: "🚶" },
      { value: "active", label: "بسیار فعال / کار فیزیکی یا ورزش منظم", emoji: "🏃" },
    ],
  },
  {
    key: "trainingFrequency",
    title: "در حال حاضر چقدر ورزش می‌کنید؟",
    subtitle: "",
    options: [
      { value: "none", label: "اصلاً ورزش نمی‌کنم", emoji: "🛋️" },
      { value: "sessions_1_3", label: "۱ تا ۳ جلسه در هفته", emoji: "📅" },
      { value: "sessions_4_plus", label: "۴ جلسه یا بیشتر در هفته", emoji: "🏋️" },
    ],
  },
  {
    key: "nutritionChallenge",
    title: "وضعیت تغذیه فعلی‌تان را چطور توصیف می‌کنید؟",
    subtitle: "",
    options: [
      { value: "irregular", label: "معمولاً نامنظم و بدون برنامه", emoji: "🍔" },
      { value: "partly_controlled", label: "نسبتاً خوب ولی گاهی از برنامه خارج می‌شوم", emoji: "🥗" },
      { value: "controlled", label: "منظم و کنترل‌شده", emoji: "✅" },
    ],
  },
  {
    key: "sleepHours",
    title: "معمولاً چند ساعت در شب می‌خوابید؟",
    subtitle: "",
    options: [
      { value: "under_6", label: "کمتر از ۶ ساعت", emoji: "🌙" },
      { value: "hours_6_8", label: "۶ تا ۸ ساعت", emoji: "😴" },
      { value: "over_8", label: "بیشتر از ۸ ساعت", emoji: "💤" },
    ],
  },
  {
    key: "stressLevel",
    title: "سطح استرس روزانه شما چقدر است؟",
    subtitle: "",
    options: [
      { value: "low", label: "کم", emoji: "🧘" },
      { value: "medium", label: "متوسط", emoji: "⚖️" },
      { value: "high", label: "زیاد", emoji: "😰" },
    ],
  },
  {
    key: "commitment",
    title: "چقدر برای اجرای یک برنامه منظم آماده‌اید؟",
    subtitle: "شدت پیشنهاد AI بر اساس این پاسخ تنظیم می‌شود.",
    options: [
      { value: "flexible", label: "فقط تغییرات ساده و کم‌فشار", emoji: "🌿" },
      { value: "steady", label: "می‌توانم بیشتر روزها پایبند باشم", emoji: "📆" },
      { value: "max_results", label: "کاملاً آماده‌ام و می‌خواهم جدی پیش بروم", emoji: "🔥" },
    ],
  },
];

export const QUIZ_KEYS = QUESTIONS.map((q) => q.key);

export const QUIZ_PROGRESS_LABEL = "کمتر از ۱ دقیقه تا تحلیل شما";
export const QUIZ_PROGRESS_HINT = "فقط ۸ انتخاب سریع";

/** Map quiz answers to backend lead/analyze contract fields. */
export function mapAnswersForBackend(answers = {}) {
  let experience = "";
  switch (answers.trainingFrequency) {
    case "none":
      experience = "beginner";
      break;
    case "sessions_1_3":
      experience = "intermediate";
      break;
    case "sessions_4_plus":
      experience = "advanced";
      break;
    default:
      experience = answers.experience || "";
  }

  let mainObstacle = "";
  switch (answers.stressLevel) {
    case "low":
      mainObstacle = "knowledge";
      break;
    case "medium":
      mainObstacle = "motivation";
      break;
    case "high":
      mainObstacle = "plateau";
      break;
    default:
      mainObstacle = answers.mainObstacle || "knowledge";
  }

  return {
    primaryGoal: answers.primaryGoal || "",
    activityLevel: answers.activityLevel || "",
    trainingEnv: "",
    experience,
    nutritionChallenge: answers.nutritionChallenge || "",
    mainObstacle,
    commitment: answers.commitment || "",
    gender: answers.gender || "",
    sleepHours: answers.sleepHours || "",
    stressLevel: answers.stressLevel || "",
    trainingFrequency: answers.trainingFrequency || "",
  };
}

const ACTIVITY_LABELS = {
  sedentary: "کم‌تحرک",
  moderate: "فعالیت متوسط",
  active: "بسیار فعال",
};

const TRAINING_FREQ_LABELS = {
  none: "بدون ورزش منظم",
  sessions_1_3: "۱ تا ۳ جلسه در هفته",
  sessions_4_plus: "۴ جلسه یا بیشتر در هفته",
};

const EXPERIENCE_LABELS = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

const NUTRITION_LABELS = {
  irregular: "تغذیه نامنظم",
  partly_controlled: "تغذیه نسبتاً کنترل‌شده",
  controlled: "تغذیه منظم و کنترل‌شده",
  sweets: "ریزه‌خواری و شیرینی عصبی",
  low_appetite: "کم‌اشتهایی شدید",
  no_time: "نبود وقت برای آشپزی",
};

const SLEEP_LABELS = {
  under_6: "خواب کمتر از ۶ ساعت",
  hours_6_8: "خواب ۶ تا ۸ ساعت",
  over_8: "خواب بیشتر از ۸ ساعت",
};

const STRESS_LABELS = {
  low: "استرس کم",
  medium: "استرس متوسط",
  high: "استرس زیاد",
};

const OBSTACLE_LABELS = {
  motivation: "استرس و انگیزه",
  plateau: "استرس بالا و مقاومت متابولیک",
  knowledge: "نیاز به مسیر ساده‌تر",
};

const COMMITMENT_LABELS = {
  flexible: "تغییرات ساده و کم‌فشار",
  steady: "پایبندی در بیشتر روزها",
  max_results: "برنامه جدی و پرشدت",
};

const GENDER_LABELS = {
  male: "مرد",
  female: "زن",
  prefer_not_say: "نامشخص",
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

/** Funnel 1 — public AI body-analysis sales funnel (coach binding stays internal). */
export const FUNNEL_META = {
  key: "funnel_1",
  label: "فانل ۱",
  coachName: "فیتینو",
  description: "ارزیابی هوشمند بدن با ایجنت‌های هوش مصنوعی فیتینو",
  path: "/analiz",
};

export const HERO_COPY = {
  title: "فرمول اختصاصی بدن تو؛ ترکیب علم مربیگری و پایش ۲۴ ساعته هوش مصنوعی",
  subtitle:
    "رژیم‌های تکراری و برنامه‌های رها شده را فراموش کن. در فیتینو، ایجنت‌های هوش مصنوعی لحظه به لحظه مسیر تغییر بدنت را زیر نظر دارند تا مطمئن شویم این‌بار حتماً به نتیجه می‌رسی.",
  cta: "شروع ارزیابی هوشمند بدنم (رایگان)",
  funnelBadge: "ارزیابی هوشمند بدن · پایش ۲۴ ساعته AI",
};

export const METRICS_COPY = {
  title: "کالیبره کردن سیستم پردازش بر اساس ساختار فیزیولوژیک شما",
  guide:
    "اطلاعات فعلی خود را وارد کنید تا ایجنت هوش مصنوعی، نرخ متابولیسم پایه (BMR) و توزیع ماکروهای بدنتان را محاسبه کند.",
  cta: "محاسبه شاخص‌ها و استخراج بیوگرافی بدنی",
};

export const LEAD_COPY = {
  title: "اتصال دیتای ارزیابی به پنل اختصاصی فیتینو",
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
  cta: "دریافت راهکار و برنامه اختصاصی فیتینو 🚀",
  analysisReadyTitle: "📊 گزارش آنالیز اختصاصی بدنی شما آماده است",
  analysisReadyBody:
    "داده‌های فیزیولوژیک شما ثبت شد. بلافاصله پس از تکمیل سفارش، کالیبراسیون و تنظیم برنامه توسط سیستم هوشمند فیتینو آغاز می‌شود.",
  aiWarning:
    "تحلیل سیستم: الگوی پاسخ‌های شما نشان می‌دهد بدنتان مقاومت بالایی به استپ وزنی در هفته‌های سوم به بعد دارد. ایجنت‌های فیتینو برای شکستن این استپ عضلانی، یک سیستم بارگذاری متناوب در تمرین شما اعمال می‌کنند.",
  aiGuard:
    "پایش ضد استپ فیتینو: این برنامه مجهز به پروتکل پایش روزانه است. به محض اینکه سرعت چربی‌سوزی شما کند شود، سیستم هوشمند برنامه شما را بدون هزینه اضافه آپدیت می‌کند.",
  urgency:
    "به دلیل ترافیک بالای سرور پردازش و محدودیت ظرفیت پذیرش، این آنالیز اختصاصی و رزرو پنل شما فقط تا ۱۰:۰۰ دقیقه دیگر محفوظ می‌ماند.",
};

/** Canonical coach display name — keep consistent across funnel UI. */
export const COACH_FULL_NAME = "ایجنت‌های هوش مصنوعی فیتینو";
export const COACH_SHORT_NAME = "فیتینو";

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
  freeStartCta: "شروع رایگان بدون خرید برنامه",
  freeStartHint: "الان وارد پنل اختصاصی‌ات شو؛ هر وقت آماده بودی، مسیر تهیه برنامه را از همان‌جا ادامه بده.",
  securePay: "🔒 پرداخت ۱۰۰٪ امن شبکه شتاب | ⚡️ فعال‌سازی آنی پنل | 🛡 گارانتی ۴۸ ساعته تطبیق برنامه",
  plansEyebrow: "فیتینو · سرمایه‌گذاری روی بدن",
  plansTitle: "مسیر تحول بدنی خود را آغاز کنید",
  plansSubtitle:
    "برای دریافت برنامه اختصاصی تمرین، تغذیه و پایش هوشمند، یکی از پلن‌های زیر را انتخاب کنید تا پنل شما بلافاصله فعال شود.",
  vipBadge: "🔥 پیشنهاد اصلی (پرفروش‌ترین)",
  cipBadge: "⭐️ ظرفیت محدود (فقط ۵ نفر)",
  trustItems: [
    {
      id: "secure",
      label: "پرداخت ۱۰۰٪ امن شبکه شتاب",
      icon: "lock",
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    },
    {
      id: "instant",
      label: "فعال‌سازی آنی پنل",
      icon: "zap",
      className:
        "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200",
    },
    {
      id: "guarantee",
      label: "گارانتی ۴۸ ساعته تطبیق برنامه",
      icon: "shield",
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    },
  ],
  planMeta: {
    vip: {
      subtitle: "دوره ۳ ماهه — تمرین + تغذیه + پایش ۲۴ ساعته AI",
      dailyNote: "معادل روزی فقط ۱۶٬۵۰۰ تومان",
      features: [
        "برنامه تمرین و تغذیه اختصاصی (بیومکانیک + سفره ایرانی)",
        "پایش پیشرفت با هوش‌مصنوعی",
        "گزارش جامع آنالیز بدنی و پیش‌بینی ۱۲ هفته‌ای",
        "پشتیبانی و رفع اشکال از طریق تیکت پنل",
        "دسترسی کامل به اپلیکیشن و امکانات داشبورد",
      ],
      cta: "انتخاب پلن VIP و شروع 🚀",
    },
    cip: {
      subtitle: "دوره ۳ ماهه — پشتیبانی ۱ به ۱ + مشاوره اختصاصی",
      dailyNote: "معادل روزی ۳۲٬۰۰۰ تومان",
      features: [
        "شامل تمامی امکانات و دسترسی‌های کامل پلن VIP",
        "پشتیبانی مستقیم و اختصاصی توسط ایجنت‌ها و تیم مربیگری فیتینو",
        "جلسات مشاوره و آنالیز اختصاصی (تصویری / حضوری)",
        "آنالیز ویدیویی فرم اجرای حرکات شما توسط مربی",
        "اولویت پردازش در کالیبراسیون و آپدیت برنامه‌ها",
      ],
      cta: "رزرو اختصاصی پلن CIP 👑",
    },
  },
  features: [
    {
      icon: "bot",
      title: "پایش هوشمند و مداوم",
      body: "بدون توقف در مسیر؛ داده‌های بدنی شما هر روز تحلیل شده و در صورت نیاز، برنامه‌تان بلافاصله کالیبره و آپدیت می‌شود.",
    },
    {
      icon: "user",
      title: "طراحی ۱۰۰٪ اختصاصی با سیستم هوشمند فیتینو",
      body: "تمامی حرکات طبق فیزیولوژی اختصاصی شما توسط ایجنت‌های فیتینو تنظیم می‌شود تا در کوتاه‌ترین زمان، بیشترین بازدهی را بگیرید.",
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
    // —— پسران
    {
      gender: "male",
      before: "/images/transformations/mohammad-before.jpg",
      after: "/images/transformations/mohammad-after.jpg",
      name: "محمد قره‌باغ",
      age: 21,
      heightCm: 183,
      weightBefore: 88,
      weightAfter: 80,
      bodyType: "مزومورف",
      quote:
        "وزن می‌خواستم بیاد پایین بدون ریزش عضله. برنامه اختصاصی با پایش روزانه باعث شد تو مسیر ثابت بمونم و از ۸۸ برسم به ۸۰.",
    },
    {
      gender: "male",
      before: "/images/transformations/reza-before.jpg",
      after: "/images/transformations/reza-after.jpg",
      name: "رضا بیرم‌آبادی",
      age: 21,
      heightCm: 180,
      weightBefore: 65,
      weightAfter: 73,
      bodyType: "مزومورف",
      quote: "بدن امروزت، نتیجه انتخاب‌های دیروزته.",
    },
    {
      gender: "male",
      before: "/images/1.png",
      after: "/images/11.png",
      name: "سینا محمدی",
      age: 26,
      heightCm: 182,
      weightBefore: 71,
      weightAfter: 78,
      bodyType: "اکتومورف",
      quote:
        "لاغر بودم و هر چی می‌خوردم وزن نمی‌گرفتم. برنامه حجم با پایش پروتئین روزانه‌ام باعث شد تو سه ماه تقریباً هفت کیلو عضله خشک اضافه کنم.",
    },
    {
      gender: "male",
      before: "/images/2.png",
      after: "/images/22.png",
      name: "علی اکبری",
      age: 41,
      heightCm: 174,
      weightBefore: 97,
      weightAfter: 85,
      bodyType: "اندومورف",
      quote:
        "کارمندی‌ام و وقت شام سنگین می‌خوردم. منوی منعطف با غذای خونگی بود، نه سالاد بی‌مزه. تو دوازده هفته دوازده کیلو کم کردم بدون اینکه کارم بخوابه.",
    },
    {
      gender: "male",
      before: "/images/1.png",
      after: "/images/11.png",
      name: "حسین کریمی",
      age: 31,
      heightCm: 180,
      weightBefore: 83,
      weightAfter: 80,
      bodyType: "مزومورف",
      quote:
        "هدفم فقط عدد روی ترازو نبود — فرم سینه و بازو می‌خواستم. فیلم حرکات و اصلاح فرم توسط مربی باعث شد آسیب شونه‌ام برنگرده و پیشرفت واقعی ببینم.",
    },
    // —— دختران (فعلاً همان جفت عکس نمونه؛ بعداً عوض می‌شود)
    {
      gender: "female",
      before: "/images/1.png",
      after: "/images/11.png",
      name: "سارا محمدی",
      age: 28,
      heightCm: 165,
      weightBefore: 74,
      weightAfter: 63,
      bodyType: "اندومورف",
      quote:
        "بعد از زایمان هر رژیمی می‌گرفتم برمی‌گشتم. اینجا وعده‌ها با شیر‌دهی و خواب کم تنظیم شد؛ تو ده هفته یازده کیلو اومد پایین و انرژی‌م برگشت.",
    },
    {
      gender: "female",
      before: "/images/2.png",
      after: "/images/22.png",
      name: "مهسا احمدی",
      age: 24,
      heightCm: 168,
      weightBefore: 58,
      weightAfter: 62,
      bodyType: "اکتومورف",
      quote:
        "می‌خواستم فرم باسن و پا بگیرم نه لاغری بیشتر. تمرین خانه با کش و برنامه پروتئین باعث شد تو دو ماه لباس‌هام بهتر بشینه بدون اینکه صورت‌م تکیده بشه.",
    },
    {
      gender: "female",
      before: "/images/1.png",
      after: "/images/11.png",
      name: "نرگس حسینی",
      age: 33,
      heightCm: 162,
      weightBefore: 81,
      weightAfter: 69,
      bodyType: "اندومورف",
      quote:
        "استپ وزنی دو ساله‌م رو شکستم. وقتی سرعت کم شد، سیستم هشدار داد و مربی کرب و تمرین رو عوض کرد — همون ماه دوباره شروع کردم به کم کردن.",
    },
    {
      gender: "female",
      before: "/images/2.png",
      after: "/images/22.png",
      name: "زهرا کاظمی",
      age: 27,
      heightCm: 170,
      weightBefore: 69,
      weightAfter: 64,
      bodyType: "مزومورف",
      quote:
        "شیرینی عصبی‌م بدجوری بود. برنامه به‌جای حذف کامل، جایگزینی هوشمند داد. تو هشت هفته پنج کیلو کم کردم و دیگه هر شب یخچال نمی‌رم.",
    },
    {
      gender: "female",
      before: "/images/1.png",
      after: "/images/11.png",
      name: "هانیه رضایی",
      age: 30,
      heightCm: 160,
      weightBefore: 76,
      weightAfter: 67,
      bodyType: "اندومورف",
      quote:
        "باشگاه رفتن بدون مربی فقط گیجم می‌کرد. ویدیوی هر حرکت و چک‌لیست روزانه باعث شد بدون سردرگمی پیش برم؛ دور کمر و پهلوم مشخصاً جمع شد.",
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
        service: "پشتیبانی اختصاصی و مستقیم ایجنت‌ها و تیم فیتینو",
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
    "پرداخت شما با موفقیت تایید شد. سیستم هوشمند فیتینو در حال آماده‌سازی پنل اختصاصی شماست.",
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
  const q = QUESTIONS.find((item) => item.key === "primaryGoal");
  const opt = q?.options.find((o) => o.value === primaryGoal);
  return opt?.scenario || "A";
}

/** Default 12-week trend templates by scenario (A/B/C). */
export const TREND_BY_SCENARIO = {
  A: {
    title: "پیش‌بینی روند ۱۲ هفته کاهش چربی فعال (چربی‌سوزی فعال)",
    yLabel: "درصد چربی تخمینی بدن (وزن)",
    values: [40, 34, 30, 27, 24, 21, 19, 16, 13, 10, 6, 2],
    yMax: 40,
  },
  B: {
    title: "پیش‌بینی روند ۱۲ هفته عضله‌سازی فعال (هایپرتروفی)",
    yLabel: "پیشرفت حجم عضلانی (٪)",
    values: [4, 9, 14, 18, 22, 26, 29, 32, 35, 37, 39, 40],
    yMax: 40,
  },
  C: {
    title: "پیش‌بینی روند ۱۲ هفته فرم‌دهی و آمادگی بدنی",
    yLabel: "امتیاز فرم و آمادگی (٪)",
    values: [6, 11, 16, 20, 24, 27, 30, 33, 35, 37, 39, 40],
    yMax: 40,
  },
};

export function buildTrendChart(scenario) {
  return TREND_BY_SCENARIO[scenario] || TREND_BY_SCENARIO.A;
}

/** Mifflin–St Jeor — uses gender when provided. */
export function calculateBmr(age, heightCm, weightKg, gender = "male") {
  const a = Number(age);
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (![a, h, w].every((n) => Number.isFinite(n) && n > 0)) return null;
  const base = 10 * w + 6.25 * h - 5 * a;
  if (gender === "female") return Math.round(base - 161);
  return Math.round(base + 5);
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

/** Local personalized AI warning — never reuse the static RESULT_COPY string. */
export function buildPersonalizedAiWarning(answers = {}) {
  const mapped = mapAnswersForBackend(answers);
  const goal = GOAL_LABELS[mapped.primaryGoal] || GOAL_LABELS[answers.primaryGoal] || "هدف فعلی";
  const stress =
    STRESS_LABELS[answers.stressLevel] ||
    OBSTACLE_LABELS[mapped.mainObstacle] ||
    "استرس روزانه";
  const sleep = SLEEP_LABELS[answers.sleepHours] || "الگوی خواب فعلی";
  const commit = COMMITMENT_LABELS[mapped.commitment] || "تعهد فعلی";
  const training =
    TRAINING_FREQ_LABELS[answers.trainingFrequency] ||
    EXPERIENCE_LABELS[mapped.experience] ||
    "سطح تمرین فعلی";
  const nutrition = NUTRITION_LABELS[mapped.nutritionChallenge] || "وضعیت تغذیه";

  if (mapped.primaryGoal === "muscle_gain") {
    return `تحلیل سیستم: برای هدف «${goal}» با «${training}» و «${sleep}»، خطر ریزش عضله در فاز حجم بالاست. با توجه به «${stress}» و تعهد «${commit}»، ایجنت‌های فیتینو بار تمرینی و پروتئین را طوری تنظیم می‌کنند که رشد عضله بدون چربی زائد پیش برود.`;
  }
  if (mapped.primaryGoal === "fitness") {
    return `تحلیل سیستم: مسیر «${goal}» با فعالیت فعلی و «${nutrition}» نشان می‌دهد ثبات ریکاوری هنوز بهینه نیست. با «${sleep}» و «${stress}»، پروتکل فیتینو شدت برنامه را متناسب با «${commit}» نگه می‌دارد تا بدون فرسودگی، فرم پایدار بسازید.`;
  }
  return `تحلیل سیستم: برای «${goal}» با «${nutrition}» و «${sleep}»، بدن شما در برابر استپ وزنی حساس است. با توجه به «${stress}» و آمادگی «${commit}»، ایجنت‌های فیتینو بارگذاری متناوب تمرین و تغذیه را برای شکستن این استپ تنظیم می‌کنند.`;
}

export function buildAnalysis(answers, coachName = COACH_SHORT_NAME) {
  const mapped = mapAnswersForBackend(answers);
  const {
    primaryGoal,
    activityLevel,
    experience,
    nutritionChallenge,
    mainObstacle,
    commitment,
    gender,
    sleepHours,
    stressLevel,
    trainingFrequency,
    age,
    heightCm,
    weightKg,
  } = { ...answers, ...mapped };

  const scenario = getScenario(primaryGoal);
  const activity = ACTIVITY_LABELS[activityLevel] || "سطح فعالیت فعلی";
  const training = TRAINING_FREQ_LABELS[trainingFrequency] || EXPERIENCE_LABELS[experience] || "فعلی";
  const nutrition = NUTRITION_LABELS[nutritionChallenge] || "وضعیت تغذیه فعلی";
  const sleep = SLEEP_LABELS[sleepHours] || "الگوی خواب فعلی";
  const stress = STRESS_LABELS[stressLevel] || OBSTACLE_LABELS[mainObstacle] || "استرس روزانه";
  const commitLabel = COMMITMENT_LABELS[commitment] || "تعهد فعلی";
  const meta = SCENARIO_META[scenario];
  const bmr = calculateBmr(age, heightCm, weightKg, gender);
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
  const biggestObstacle = stress;
  const methodName = meta?.method || "پروتکل اختصاصی فیتینو";
  const readinessLevel = training;
  const trainingPlace = training;
  const targetZones = TARGET_ZONES[goalKey] || TARGET_ZONES.fitness;
  const successPct =
    (SUCCESS_PCT[goalKey] || 86) +
    (commitment === "max_results" ? 4 : commitment === "steady" ? 2 : 0);
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
        ? `تحلیل داده‌های فیزیولوژیک نشان می‌دهد ${physiologicIndex} و سیستم متابولیک در وضعیت ${metabolicStatus} قرار دارد. با ${sleep} و ${stress}، ${commonMistake} نه تنها موثر نیست، بلکه با ${sideEffect}، عامل اصلی ${biggestObstacle} خواهد بود.`
        : goalKey === "muscle_gain"
          ? `تحلیل داده‌های فیزیولوژیک نشان می‌دهد ${physiologicIndex} و سیستم متابولیک در وضعیت ${metabolicStatus} قرار دارد. با ${sleep} و ${stress}، ${commonMistake} مانع رشد می‌شود. وضعیت تغذیه «${nutrition}» باید در پروتکل جدید لحاظ شود.`
          : `تحلیل داده‌های فیزیولوژیک نشان می‌دهد ${physiologicIndex} و سیستم متابولیک در وضعیت ${metabolicStatus} قرار دارد. ${sleep} و ${stress} با «${nutrition}» هم‌پوشانی دارند و ${commonMistake} معمولاً به ${sideEffect} منجر می‌شود.`,
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
        ? `اعمال پروتکل «${methodName}» با شدت «${commitLabel}». تمرین متناسب با «${readinessLevel}» و فعالیت روزانه «${activity}» طراحی می‌شود تا ${targetZones} هدف قرار گیرد.`
        : goalKey === "muscle_gain"
          ? `اعمال پروتکل «${methodName}» با شدت «${commitLabel}». برنامه با «${readinessLevel}» و فعالیت «${activity}» هماهنگ می‌شود تا ${targetZones} رشد کنند.`
          : `اعمال پروتکل «${methodName}» با شدت «${commitLabel}». برنامه با «${readinessLevel}»، فعالیت «${activity}» و وضعیت تغذیه «${nutrition}» هماهنگ می‌شود.`,
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
        : "تحلیل اختصاصی بر اساس ۸ پاسخ تخصصی و شاخص‌های فیزیولوژیک شما";

  return {
    scenario,
    title: RESULT_COPY.title,
    subtitle,
    meta,
    bmr,
    bmi,
    bodyType,
    macros,
    trendChart: buildTrendChart(scenario),
    chartBars,
    successPct,
    aiWarning: buildPersonalizedAiWarning(answers),
    analysisReadyTitle: RESULT_COPY.analysisReadyTitle,
    analysisReadyBody: RESULT_COPY.analysisReadyBody,
    aiGuard: RESULT_COPY.aiGuard,
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

/** Parse stored funnel AI JSON (checkout API or local draft). */
export function parseFunnelAnalysisPacket(raw) {
  if (!raw) return null;
  try {
    const packet = typeof raw === "string" ? JSON.parse(raw) : raw;
    return packet && typeof packet === "object" ? packet : null;
  } catch {
    return null;
  }
}

/** Overlay the backend AI JSON packet onto the local template analysis. */
export function mergeFunnelAI(base, packet) {
  if (!base) return base;
  if (!packet || typeof packet !== "object") return base;
  const next = { ...base };
  if (packet.aiWarning && String(packet.aiWarning).trim()) {
    next.aiWarning = packet.aiWarning;
  }
  if (packet.statusSummary) {
    next.statusSummary = { ...next.statusSummary, ...packet.statusSummary };
  }
  if (packet.customSolution) {
    next.customSolution = { ...next.customSolution, ...packet.customSolution };
  }
  if (packet.routePrediction) {
    next.routePrediction = { ...next.routePrediction, ...packet.routePrediction };
  }
  if (packet.trendChart?.values?.length === 12) {
    next.trendChart = {
      title: packet.trendChart.title || next.trendChart?.title,
      yLabel: packet.trendChart.yLabel || next.trendChart?.yLabel,
      values: packet.trendChart.values,
      yMax: packet.trendChart.yMax || next.trendChart?.yMax || 40,
    };
  }
  if (Array.isArray(packet.chartBars) && packet.chartBars.length === 5) {
    next.chartBars = packet.chartBars.map((bar) => ({
      label: bar.label,
      value: Number(bar.value) || 0,
    }));
  }
  const pct = Number(packet.successPct ?? packet.routePrediction?.successPct);
  if (Number.isFinite(pct) && pct > 0) {
    next.successPct = pct;
    next.routePrediction = { ...next.routePrediction, successPct: pct };
  }
  if (packet.analysisReadyTitle) next.analysisReadyTitle = packet.analysisReadyTitle;
  if (packet.analysisReadyBody) next.analysisReadyBody = packet.analysisReadyBody;
  if (packet.aiGuard) next.aiGuard = packet.aiGuard;
  if (packet.source) next.source = packet.source;
  next.sections = [
    { title: next.statusSummary?.title, body: next.statusSummary?.body },
    { title: next.customSolution?.title, body: next.customSolution?.body },
    { title: next.routePrediction?.title, body: next.routePrediction?.body },
  ];
  return next;
}

export const ANALYZING_STEPS = [
  "محاسبه دقیق نرخ متابولیسم و تفکیک ماکروها انجام شد.",
  "متصل کردن متغیرهای شما به سیستم پایش لحظه‌ای هوش مصنوعی...",
  "تحلیل موانع غذایی و شخصی‌سازی منوی منعطف فیتینو...",
  "ارسال گزارش اولیه به پنل کاربری فیتینو جهت تایید نهایی...",
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
  gender: GENDER_LABELS,
  primaryGoal: GOAL_LABELS,
  activityLevel: ACTIVITY_LABELS,
  trainingFrequency: TRAINING_FREQ_LABELS,
  experience: EXPERIENCE_LABELS,
  nutritionChallenge: NUTRITION_LABELS,
  sleepHours: SLEEP_LABELS,
  stressLevel: STRESS_LABELS,
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
