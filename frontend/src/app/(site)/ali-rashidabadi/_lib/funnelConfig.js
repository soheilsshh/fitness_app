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

export const HERO_COPY = {
  title: "فرمول اختصاصی بدن تو؛ ترکیب علم مربیگری و پایش ۲۴ ساعته هوش مصنوعی",
  subtitle:
    "رژیم‌های تکراری و برنامه‌های رها شده را فراموش کن. در فیتینو، مربی علی و ایجنت‌های هوش مصنوعی، لحظه به لحظه مسیر تغییر بدنت را زیر نظر دارند تا مطمئن شویم این‌بار حتماً به نتیجه می‌رسی.",
  cta: "شروع ارزیابی هوشمند بدنم (رایگان)",
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
  cta: "تایید و ورود به بخش دریافت برنامه اختصاصی",
};

export const RESULT_COPY = {
  title: "گزارش اولیه آنالیز هوشمند بدنی شما آماده شد",
  cta: "دریافت راهکار و برنامه اختصاصی از مربی علی",
  aiWarning:
    "تحلیل سیستم: الگوی پاسخ‌های شما نشان می‌دهد بدنتان مقاومت بالایی به استپ وزنی در هفته‌های سوم به بعد دارد. مربی علی برای شکستن این استپ عضلانی، نیاز به اعمال یک سیستم بارگذاری متناوب در تمرین شما دارد.",
};

export const PAYMENT_COPY = {
  title: "سیستم تحول بدنی فیتینو؛ جایی که هیچ‌کس رها نمی‌شود!",
  socialProof: "کسانی که مثل تو فکر می‌کردند تغییر، غیرممکن است... (مشاهده نتایج قبل و بعد)",
  cta: "همین حالا تغییر را شروع کن (دریافت برنامه + فعال‌سازی پایش هوشمند)",
  features: [
    {
      icon: "bot",
      title: "پایش ثانیه‌ای با هوش مصنوعی",
      body: "ایجنت‌های ما هر روز تمرین و تغذیه شما را پایش کرده و گزارش پیشرفت یا علائم استپ را فوراً به مربی علی مخابره می‌کنند تا برنامه شما آپدیت شود.",
    },
    {
      icon: "user",
      title: "طراحی علمی توسط مربی علی",
      body: "هیچ برنامه آماده یا رباتیکی در کار نیست؛ تمام جزییات تمرین بر اساس بیومکانیک اختصاصی بدن شما فرمول‌نویسی می‌شود.",
    },
    {
      icon: "utensils",
      title: "منوی غذایی کاملاً منعطف",
      body: "فرمول فیتینو بر پایه غذاهای سفارشی و در دسترس شماست. سیستم ما لیست غذاهای مورد علاقه‌تان را طوری می‌چیند که بدون زجر کشیدن رژیم بگیرید.",
    },
    {
      icon: "smartphone",
      title: "سادگی در بالاترین سطح",
      body: "بدون پیچیدگی‌های اضافه، همه‌چیز در ساده‌ترین و مدرن‌ترین فرمت روی موبایل شماست.",
    },
  ],
  transformations: [
    { before: "/images/1.png", after: "/images/11.png", name: "نتیجه واقعی ۱" },
    { before: "/images/2.png", after: "/images/22.png", name: "نتیجه واقعی ۲" },
  ],
};

export const SUCCESS_COPY = {
  title: "به فیتینو خوش آمدی! اولین و مهم‌ترین قدم را مقتدرانه برداشتی.",
  subtitle:
    "پرداخت شما با موفقیت تایید شد. سیستم هوشمند و مربی علی در حال آماده‌سازی پنل اختصاصی شما هستند.",
  bookingPrompt:
    "برای اینکه شروع بدون ابهام و طوفانی داشته باشی، همین حالا زمان تماس و هماهنگی اولیه خود را با تیم پشتیبانی مربی رزرو کن.",
  cta: "رزرو ساعت مشاوره و استارت نهایی برنامه",
  slots: ["۱۰:۰۰ – ۱۲:۰۰", "۱۲:۰۰ – ۱۴:۰۰", "۱۶:۰۰ – ۱۸:۰۰", "۱۸:۰۰ – ۲۰:۰۰"],
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

export function buildAnalysis(answers, coachName = "علی رشید آبادی") {
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
  const activity = ACTIVITY_LABELS[activityLevel] || "";
  const env = ENV_LABELS[trainingEnv] || "محیط تمرینی شما";
  const exp = EXPERIENCE_LABELS[experience] || "";
  const nutrition = NUTRITION_LABELS[nutritionChallenge] || "چالش تغذیه‌ای شما";
  const obstacle = OBSTACLE_LABELS[mainObstacle] || "";
  const meta = SCENARIO_META[scenario];
  const bmr = calculateBmr(age, heightCm, weightKg);
  const bmi = calculateBmi(heightCm, weightKg);
  const bodyType = estimateBodyType(primaryGoal, bmi);
  const macros = buildMacroSplit(primaryGoal, bmr);

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
        ]
      : primaryGoal === "weight_loss"
        ? [
            { label: "چربی‌سوزی", value: 88 },
            { label: "حفظ عضله", value: 70 },
            { label: "متابولیسم", value: 55 },
            { label: "ثبات", value: 62 },
          ]
        : [
            { label: "فرم", value: 78 },
            { label: "انرژی", value: 82 },
            { label: "قدرت", value: 68 },
            { label: "تعادل", value: 75 },
          ];

  if (primaryGoal === "weight_loss") {
    return {
      scenario,
      title: RESULT_COPY.title,
      subtitle: "تحلیل اختصاصی بر اساس ۷ پاسخ تخصصی و شاخص‌های فیزیولوژیک شما",
      meta,
      bmr,
      bmi,
      bodyType,
      macros,
      chartBars,
      aiWarning: RESULT_COPY.aiWarning,
      highlights: metricsHighlights,
      sections: [
        {
          title: "خلاصه وضعیت",
          body: `با توجه به پاسخ‌های شما، بدن شما احتمالاً در شرایط مقاومت انسولینی یا استپ متابولیک قرار دارد؛ به‌خصوص به دلیل چالشِ «${nutrition}». رژیم‌های کم‌کالریِ سنتی فقط باعث ریزش عضلات شما می‌شوند و دلیل اصلی ${mainObstacle === "plateau" ? "استپ‌های مکرر وزنی" : "نتایج ضعیف قبلی"} شماست.`,
        },
        {
          title: "راهکار اختصاصی استاد " + coachName,
          body: `اعمال متد ${meta.method} برای دور زدن استپ وزنی، به همراه تمرینات چربی‌سوزی هوشمند متناسب با سطح «${exp || "فعلی"}» شما و امکانات «${env}». با این روش بدون گرسنگی کشیدن، چربی‌های مقاوم شکم و پهلو هدف قرار می‌گیرند.`,
        },
        {
          title: "پیش‌بینی مسیر",
          body: "پتانسیل کاهش سایز شما در این دوره ۸۸٪ برآورد شده است. تمرکز اصلی روی حفظ عضله در حین کاهش چربی و بازآموزی متابولیسم خواهد بود.",
        },
      ],
      recommendations: [
        "برنامه تغذیه چرخه‌ای (کرب‌سایکلینگ) متناسب با متابولیسم شما",
        "تمرینات ترکیبی برای چربی‌سوزی هدفمند",
        "پیگیری و چکاپ هفتگی توسط تیم مربی",
      ],
      closing: LEAD_COPY.subtitle,
    };
  }

  if (primaryGoal === "muscle_gain") {
    return {
      scenario,
      title: RESULT_COPY.title,
      subtitle: "تحلیل ژنتیک و متابولیسم اختصاصی شما",
      meta,
      bmr,
      bmi,
      bodyType,
      macros,
      chartBars,
      aiWarning: RESULT_COPY.aiWarning,
      highlights: metricsHighlights,
      sections: [
        {
          title: "خلاصه وضعیت",
          body: `پاسخ‌های شما نشان می‌دهد تیپ بدنی شما تمایل شدیدی به کاتابولیسم (سوزاندن عضلات) دارد، به‌ویژه به این دلیل که با چالشِ «${nutrition}» روبرو هستید. شما برای حجم گرفتن نیاز به خوردن حجم زیادی غذا ندارید، بلکه نیاز به چگالی کالری بالا دارید.`,
        },
        {
          title: "راهکار اختصاصی استاد " + coachName,
          body: `طراحی رژیم غذایی زودهضم با بافت کالری متراکم، به همراه برنامه‌ریزی تمرینات بر پایه ${meta.method} در «${env}». با این روش، بدون افزایش چربی شکم و پهلو، عضلات شما فرم حجمی باکیفیت به خود می‌گیرند.`,
        },
        {
          title: "پیش‌بینی مسیر",
          body: `چانس موفقیت شما در این مسیر بالا و پایدار است. تمرکز روی افزایش تدریجی وزنه، ریکاوری کافی و دریافت پروتئین به‌موقع، متناسب با سطح «${exp || "تمرینی"}» شما خواهد بود.`,
        },
      ],
      recommendations: [
        "برنامه تمرینی ۴-۵ روزه با تمرکز ترکیبی",
        "رژیم پرکالریِ زودهضم و شخصی‌سازی‌شده",
        "مکمل‌سازی و زمان‌بندی دقیق وعده‌ها",
      ],
      closing: LEAD_COPY.subtitle,
    };
  }

  return {
    scenario,
    title: RESULT_COPY.title,
    subtitle: "برنامه انعطاف‌پذیر برای یک تغییر ماندگار",
    meta,
    bmr,
    bmi,
    bodyType,
    macros,
    chartBars,
    aiWarning: RESULT_COPY.aiWarning,
    highlights: metricsHighlights,
    sections: [
      {
        title: "خلاصه وضعیت",
        body: `هدف شما داشتن بدنی کات، بدون چربی زائد و با ماندگاری بالاست. بررسی پاسخ‌های شما نشان می‌دهد بزرگ‌ترین حلقه مفقوده شما «${obstacle}» بوده است. بدن شما پتانسیل عضلانی خوبی دارد اما نیاز به ثبات در تمرین دارد.`,
      },
      {
        title: "راهکار اختصاصی استاد " + coachName,
        body: `تنظیم برنامه‌ای که به‌راحتی با وضعیت فعالیت شما یعنی «${activity}» و امکانات «${env}» هماهنگ شود. همچنین سیستم ${meta.method} و چکاپ هفتگی در پنل سایت، شما را در این مسیر متعهد نگه می‌دارد تا به لایف‌استایل ایده‌آل خود برسید.`,
      },
      {
        title: "پیش‌بینی مسیر",
        body: "با توجه به تعهد شما، برنامه طوری طراحی می‌شود که در کمترین زمان بیشترین بازدهی را بگیرید. شما کاملاً آماده یک تغییر ماندگار هستید.",
      },
    ],
    recommendations: [
      "تمرینات کوتاه و مؤثر (۳-۴ روز در هفته)",
      "رژیم متعادل بدون محرومیت شدید",
      "گزارش‌دهی و چکاپ هفتگی در پنل اختصاصی",
    ],
    closing: LEAD_COPY.subtitle,
  };
}

export const ANALYZING_STEPS = [
  "محاسبه دقیق نرخ متابولیسم و تفکیک ماکروها انجام شد.",
  "متصل کردن متغیرهای شما به سیستم پایش لحظه‌ای هوش مصنوعی...",
  "تحلیل موانع غذایی و شخصی‌سازی منوی منعطف فیتینو...",
  "ارسال گزارش اولیه به پنل کاربری مربی علی جهت تایید نهایی...",
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
