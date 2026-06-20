// 7 specialized funnel questions (see bodybuilding_lead_funnel_documentation.md).
// `key` matches the backend CreateFunnelLeadRequest json fields.
export const QUESTIONS = [
  {
    key: "primaryGoal",
    title: "هدف نهایی شما از تغییر بدنتان چیست؟",
    subtitle: "مسیر اختصاصی شما بر اساس این پاسخ طراحی می‌شود",
    options: [
      { value: "weight_loss", label: "چربی‌سوزی، کاهش وزن و سایز", emoji: "🔥", scenario: "A" },
      { value: "muscle_gain", label: "افزایش وزن، حجم عضلانی و ماندگار", emoji: "💪", scenario: "B" },
      { value: "fitness", label: "فیتنس، کات کردن، فرم‌دهی و سلامتی", emoji: "⚡", scenario: "C" },
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
    title: "اصلی‌ترین دلیلی که در مسیرهای قبلی شکست خوردید چه بود؟",
    subtitle: "شناسایی مانع ذهنی، کلید ساختن یک مسیر ماندگار است",
    options: [
      { value: "motivation", label: "نبود پیگیری مربی و بی‌انگیزه شدن بعد از چند هفته", emoji: "🎯" },
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
  },
  B: {
    color: "emerald",
    badge: "مسیر افزایش حجم و عضله‌سازی",
    method: "تنش مکانیکی بالا (Progressive Overload)",
  },
  C: {
    color: "sky",
    badge: "مسیر فیتنس و فرم‌دهی",
    method: "سیستم پیگیری هوشمند (Accountability)",
  },
};

function getScenario(primaryGoal) {
  const q = QUESTIONS[0].options.find((o) => o.value === primaryGoal);
  return q?.scenario || "A";
}

export function buildAnalysis(answers, coachName = "علی رشید آبادی") {
  const {
    primaryGoal,
    activityLevel,
    trainingEnv,
    experience,
    nutritionChallenge,
    mainObstacle,
  } = answers;

  const scenario = getScenario(primaryGoal);
  const activity = ACTIVITY_LABELS[activityLevel] || "";
  const env = ENV_LABELS[trainingEnv] || "محیط تمرینی شما";
  const exp = EXPERIENCE_LABELS[experience] || "";
  const nutrition = NUTRITION_LABELS[nutritionChallenge] || "چالش تغذیه‌ای شما";
  const obstacle = OBSTACLE_LABELS[mainObstacle] || "";
  const meta = SCENARIO_META[scenario];

  if (primaryGoal === "weight_loss") {
    return {
      scenario,
      title: "گزارش آنالیز سوخت‌وساز شما آماده شد!",
      subtitle: "تحلیل اختصاصی بر اساس ۷ پاسخ تخصصی شما",
      meta,
      highlights: [
        { label: "تیپ متابولیک", value: "مقاوم به چربی‌سوزی" },
        { label: "سطح فعالیت", value: activity },
        { label: "چالش تغذیه", value: nutrition },
        { label: "پتانسیل کاهش سایز", value: "۸۸٪" },
      ],
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
      closing: `برای ثبت این تحلیل در پرونده ورزشی شما و ارسال آن مستقیماً روی میز استاد ${coachName}، اطلاعات تماس خود را وارد کنید.`,
    };
  }

  if (primaryGoal === "muscle_gain") {
    return {
      scenario,
      title: "گزارش پتانسیل آنابولیک (عضله‌سازی) شما آماده شد!",
      subtitle: "تحلیل ژنتیک و متابولیسم اختصاصی شما",
      meta,
      highlights: [
        { label: "تیپ بدنی", value: "مستعد کاتابولیسم" },
        { label: "سطح فعالیت", value: activity },
        { label: "چالش تغذیه", value: nutrition },
        { label: "پتانسیل رشد", value: "بالا" },
      ],
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
      closing: `برای ثبت این تحلیل در پرونده ورزشی شما و ارسال آن مستقیماً روی میز استاد ${coachName}، اطلاعات تماس خود را وارد کنید.`,
    };
  }

  return {
    scenario,
    title: "گزارش بالانس استایل و تناسب اندام شما آماده شد!",
    subtitle: "برنامه انعطاف‌پذیر برای یک تغییر ماندگار",
    meta,
    highlights: [
      { label: "هدف", value: "بدن کات و پرانرژی" },
      { label: "سطح فعالیت", value: activity },
      { label: "حلقه مفقوده", value: obstacle },
      { label: "آمادگی", value: "کامل" },
    ],
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
    closing: `برای ثبت این تحلیل در پرونده ورزشی شما و ارسال آن مستقیماً روی میز استاد ${coachName}، اطلاعات تماس خود را وارد کنید.`,
  };
}

export const ANALYZING_MESSAGES = [
  "در حال بررسی ۷ پاسخ تخصصی شما...",
  "تحلیل متابولیسم و تیپ بدنی...",
  "تطبیق با پروفایل و متد استاد...",
  "آماده‌سازی گزارش اختصاصی شما...",
];

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

// Admin-facing answer label maps.
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
