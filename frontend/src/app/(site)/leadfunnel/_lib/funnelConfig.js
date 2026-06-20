export const QUESTIONS = [
  {
    key: "primaryGoal",
    title: "هدف اصلی شما از تمرین چیست؟",
    subtitle: "مسیر اختصاصی شما بر اساس این پاسخ طراحی می‌شود",
    options: [
      {
        value: "weight_loss",
        label: "چربی‌سوزی، کاهش وزن و سایز",
        emoji: "🔥",
        scenario: "A",
      },
      {
        value: "muscle_gain",
        label: "ساخت عضله، افزایش حجم و وزن",
        emoji: "💪",
        scenario: "B",
      },
      {
        value: "fitness",
        label: "فرم‌دهی، فیتنس و لایف‌استایل سالم",
        emoji: "⚡",
        scenario: "C",
      },
    ],
  },
  {
    key: "activityLevel",
    title: "وضعیت فعالیت روزانه شما چگونه است؟",
    subtitle: "سطح متابولیسم و کالری مورد نیاز شما از اینجا محاسبه می‌شود",
    options: [
      {
        value: "sedentary",
        label: "کارمندی / پشت‌میزنشین (تحرک بسیار کم)",
        emoji: "🪑",
      },
      {
        value: "moderate",
        label: "تحرک متوسط (پیاده‌روی روزانه یا کار سرپا)",
        emoji: "🚶",
      },
      {
        value: "active",
        label: "پرتحرک و ورزشکار",
        emoji: "🏃",
      },
    ],
  },
  {
    key: "mainObstacle",
    title: "بزرگ‌ترین چالش شما در مسیرهای قبلی چه بوده؟",
    subtitle: "شناسایی مانع اصلی، کلید طراحی برنامه پایدار برای شماست",
    options: [
      {
        value: "motivation",
        label: "نداشتن اراده و رها کردن تمرین بعد از چند هفته",
        emoji: "🎯",
      },
      {
        value: "plateau",
        label: "استپ وزنی و نتیجه نگرفتن از رژیم‌ها",
        emoji: "📉",
      },
      {
        value: "knowledge",
        label: "بلد نبودن حرکات و نداشتن برنامه اصولی",
        emoji: "📋",
      },
    ],
  },
];

const ACTIVITY_LABELS = {
  sedentary: "کم‌تحرک (پشت‌میزنشین)",
  moderate: "تحرک متوسط",
  active: "پرتحرک و ورزشکار",
};

const OBSTACLE_LABELS = {
  motivation: "رها کردن مسیر و کمبود انگیزه",
  plateau: "استپ وزنی و نتیجه نگرفتن",
  knowledge: "نداشتن برنامه و دانش تمرینی",
};

const SCENARIO_META = {
  A: {
    color: "rose",
    badge: "مسیر کاهش وزن",
    method: "Metabolic Shifting (چربی‌سوزی نوسانی)",
  },
  B: {
    color: "emerald",
    badge: "مسیر افزایش حجم",
    method: "Progressive Overload (بارگذاری تدریجی)",
  },
  C: {
    color: "sky",
    badge: "مسیر فیتنس و فرم‌دهی",
    method: "Accountability System (پیگیری هوشمند)",
  },
};

function getScenario(primaryGoal) {
  const q = QUESTIONS[0].options.find((o) => o.value === primaryGoal);
  return q?.scenario || "A";
}

export function buildAnalysis(answers, coachName = "علی رشید آبادی") {
  const { primaryGoal, activityLevel, mainObstacle } = answers;
  const scenario = getScenario(primaryGoal);
  const activity = ACTIVITY_LABELS[activityLevel] || "";
  const obstacle = OBSTACLE_LABELS[mainObstacle] || "";
  const meta = SCENARIO_META[scenario];

  if (primaryGoal === "weight_loss") {
    return {
      scenario,
      title: "گزارش آنالیز متابولیک شما آماده شد!",
      subtitle: "تحلیل اختصاصی بر اساس پاسخ‌های شما",
      meta,
      highlights: [
        { label: "تیپ متابولیک", value: "مقاوم به چربی‌سوزی" },
        { label: "سطح فعالیت", value: activity },
        { label: "چالش اصلی", value: obstacle },
        { label: "پتانسیل تغییر", value: "بالا" },
      ],
      sections: [
        {
          title: "خلاصه وضعیت",
          body: `با توجه به اهداف و چالش شما (${obstacle}) و سبک زندگی ${activity}، بررسی‌های اولیه نشان می‌دهد بدن شما احتمالاً در وضعیت مقاومت به چربی‌سوزی قرار گرفته است. رژیم‌های سخت سنتی فقط متابولیسم شما را کندتر می‌کنند و دلیل اصلی ${mainObstacle === "plateau" ? "استپ‌های مکرر وزنی" : "نتایج ضعیف قبلی"} شماست.`,
        },
        {
          title: "متد پیشنهادی",
          body: `استاد ${coachName} برای شرایط شما، متد ${meta.method} را پیشنهاد می‌کنند تا بدون گرسنگی کشیدن، لایه چربی‌های مقاوم شکم و پهلو هدف قرار گیرند. این رویکرد با سطح فعالیت فعلی شما (${activity}) هماهنگ شده است.`,
        },
        {
          title: "پیش‌بینی مسیر",
          body: "با رعایت پروتکل اختصاصی، پتانسیل تغییر بدن شما در این دوره بسیار بالا ارزیابی شده است. تمرکز اصلی روی حفظ عضله در حین کاهش چربی و بازآموزی متابولیسم خواهد بود.",
        },
      ],
      recommendations: [
        "برنامه تغذیه چرخه‌ای متناسب با متابولیسم شما",
        "تمرینات ترکیبی برای چربی‌سوزی هدفمند",
        "پیگیری هفتگی توسط تیم مربی",
      ],
      closing: `برای ثبت این تحلیل در پرونده پزشکی-ورزشی شما و ارسال آن روی میز استاد ${coachName}، اطلاعات تماس خود را وارد کنید.`,
    };
  }

  if (primaryGoal === "muscle_gain") {
    return {
      scenario,
      title: "گزارش پتانسیل عضلانی شما آماده شد!",
      subtitle: "تحلیل ژنتیک و متابولیسم اختصاصی",
      meta,
      highlights: [
        { label: "تیپ بدنی", value: "اکتومورف / میکسی" },
        { label: "سطح فعالیت", value: activity },
        { label: "چالش اصلی", value: obstacle },
        { label: "پتانسیل رشد", value: "بالا" },
      ],
      sections: [
        {
          title: "خلاصه وضعیت",
          body: `با توجه به پاسخ‌های شما، شما دارای تیپ بدنی با متابولیسم سریع هستید. دلیل اینکه تا امروز سخت حجم گرفته‌اید، ${mainObstacle === "knowledge" ? "نداشتن برنامه علمی و منظم" : mainObstacle === "motivation" ? "بی‌نظمی در تمرین و تغذیه" : "عدم تطبیق کالری با ژنتیک"} است.`,
        },
        {
          title: "متد پیشنهادی",
          body: `استاد ${coachName} برای شما پروتکل ${meta.method} به همراه رژیم پرکالریِ زودهضم طراحی خواهند کرد تا بدون تجمع چربی، عضلات باکیفیتی بسازید. این برنامه با سطح فعالیت ${activity} شما تنظیم شده است.`,
        },
        {
          title: "پیش‌بینی مسیر",
          body: "چانس موفقیت شما در این مسیر پایدار و قطعی است. تمرکز روی افزایش تدریجی وزنه، ریکاوری کافی و دریافت پروتئین به‌موقع خواهد بود.",
        },
      ],
      recommendations: [
        "برنامه تمرینی ۴-۵ روزه با تمرکز ترکیبی",
        "رژیم پرکالری شخصی‌سازی‌شده",
        "مکمل‌سازی و زمان‌بندی وعده‌ها",
      ],
      closing: `برای ثبت این تحلیل در پرونده پزشکی-ورزشی شما و ارسال آن روی میز استاد ${coachName}، اطلاعات تماس خود را وارد کنید.`,
    };
  }

  return {
    scenario,
    title: "گزارش تناسب اندام و آنالیز بدنی شما آماده شد!",
    subtitle: "برنامه انعطاف‌پذیر برای زندگی پرمشغله",
    meta,
    highlights: [
      { label: "هدف", value: "بدن کات و پرانرژی" },
      { label: "سطح فعالیت", value: activity },
      { label: "چالش اصلی", value: obstacle },
      { label: "آمادگی", value: "کامل" },
    ],
    sections: [
      {
        title: "خلاصه وضعیت",
        body: `هدف شما داشتن یک بدن کات، خوش‌فرم و پرانرژی است؛ اما چالش اصلی شما (${obstacle}) نشان می‌دهد که نیاز به یک برنامه انعطاف‌پذیر و سیستم پیگیری دارید.`,
      },
      {
        title: "متد پیشنهادی",
        body: `در پکیج اختصاصی استاد ${coachName}، تمرینات شما طوری طراحی می‌شود که در کمترین زمان بیشترین بازدهی را بگیرید. ${meta.method} مانع از دلسردی شما خواهد شد.`,
      },
      {
        title: "پیش‌بینی مسیر",
        body: `با توجه به سطح فعالیت ${activity} شما، برنامه به‌گونه‌ای تنظیم می‌شود که با روزمره‌تان سازگار باشد. شما کاملاً آماده یک تغییر ماندگار هستید.`,
      },
    ],
    recommendations: [
      "تمرینات کوتاه و مؤثر (۳-۴ روز در هفته)",
      "رژیم متعادل بدون محرومیت شدید",
      "گزارش‌دهی روزانه در پنل اختصاصی",
    ],
    closing: `برای ثبت این تحلیل در پرونده پزشکی-ورزشی شما و ارسال آن روی میز استاد ${coachName}، اطلاعات تماس خود را وارد کنید.`,
  };
}

export const ANALYZING_MESSAGES = [
  "در حال بررسی پاسخ‌های شما...",
  "تحلیل متابولیسم و تیپ بدنی...",
  "تطبیق با پروفایل مربی...",
  "آماده‌سازی گزارش اختصاصی...",
];

export const GOAL_LABELS = {
  weight_loss: "کاهش وزن",
  muscle_gain: "افزایش حجم",
  fitness: "فیتنس و فرم‌دهی",
};

export const STATUS_LABELS = {
  pending_payment: "در انتظار پرداخت",
  paid: "پرداخت شده",
  contacted: "تماس گرفته شد",
  failed: "ناموفق",
};
