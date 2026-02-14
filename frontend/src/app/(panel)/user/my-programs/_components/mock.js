export const mockPrograms = [
  {
    id: "p1",
    title: "چربی‌سوزی ۴ هفته‌ای",
    goal: "کاهش وزن + افزایش استقامت",
    level: "شروع تا متوسط",
    startDate: "2026-02-01T10:00:00.000Z",
    durationDays: 28,
    coach: "مربی: تیم FitPro",
    tags: ["HIIT", "Core", "Cardio"],

    // Days of week keys: sat, sun, mon, tue, wed, thu, fri
    schedule: {
      weekly: ["sat", "sun", "tue", "wed"], // training/active days
      restDays: ["mon", "thu", "fri"],      // disabled days
    },

    // Plan per day (some days only workout / only nutrition / both)
    planByDay: {
      sat: {
        workout: {
          title: "HIIT + Core",
          durationMin: 35,
          calories: 420,
          steps: ["گرم کردن ۵ دقیقه", "HIIT (۲۰ دقیقه)", "Core (۱۰ دقیقه)", "سرد کردن ۵ دقیقه"],
        },
        nutrition: {
          caloriesTarget: 1850,
          proteinTarget: "120g",
          meals: [
            { title: "صبحانه", detail: "اُملت + نان سبوس‌دار + سبزیجات" },
            { title: "ناهار", detail: "مرغ گریل + برنج قهوه‌ای + سالاد" },
            { title: "میان‌وعده", detail: "ماست یونانی + میوه" },
            { title: "شام", detail: "ماهی + سبزیجات بخارپز" },
          ],
        },
      },
      sun: {
        workout: {
          title: "Cardio Intervals",
          durationMin: 30,
          calories: 360,
          steps: ["گرم کردن", "اینترفال ۲۰ دقیقه", "کشش"],
        },
        // nutrition only sometimes – keep it optional
      },
      tue: {
        // only nutrition day (no workout)
        nutrition: {
          caloriesTarget: 1750,
          proteinTarget: "115g",
          meals: [
            { title: "صبحانه", detail: "ماست یونانی + جو + توت" },
            { title: "ناهار", detail: "تن ماهی + سالاد + نان سبوس‌دار" },
            { title: "میان‌وعده", detail: "میوه + بادام" },
            { title: "شام", detail: "مرغ + سبزیجات" },
          ],
        },
      },
      wed: {
        workout: {
          title: "Full Body Circuit",
          durationMin: 40,
          calories: 460,
          steps: ["اسکات", "شنا", "لانج", "پلانک", "کشش"],
        },
        nutrition: {
          caloriesTarget: 1900,
          proteinTarget: "125g",
          meals: [{ title: "برنامه", detail: "متعادل + پروتئین کافی" }],
        },
      },
    },
  },

  {
    id: "p2",
    title: "عضله‌سازی ۸ هفته‌ای",
    goal: "افزایش حجم + قدرت",
    level: "متوسط تا حرفه‌ای",
    startDate: "2026-01-10T10:00:00.000Z",
    durationDays: 56,
    coach: "مربی: Strength Lab",
    tags: ["Push/Pull/Legs", "Hypertrophy"],

    schedule: {
      weekly: ["sat", "sun", "mon", "wed", "thu"],
      restDays: ["tue", "fri"],
    },

    planByDay: {
      sat: {
        workout: {
          title: "Push (سینه/سرشانه/تری)",
          durationMin: 55,
          calories: 520,
          steps: ["پرس سینه ۴×۸", "سرشانه دمبل ۴×۱۰", "پرس بالا سینه ۳×۱۰", "دیپ ۳×حداکثر"],
        },
        nutrition: {
          caloriesTarget: 2600,
          proteinTarget: "160g",
          meals: [{ title: "برنامه", detail: "کالری بالا + پروتئین بالا" }],
        },
      },
      sun: {
        workout: {
          title: "Pull (پشت/بای)",
          durationMin: 55,
          calories: 510,
          steps: ["لت ۴×۱۰", "بارفیکس ۳×حداکثر", "زیربغل دمبل ۴×۱۰", "جلو بازو ۳×۱۲"],
        },
      },
      mon: {
        workout: {
          title: "Legs (پا)",
          durationMin: 60,
          calories: 560,
          steps: ["اسکوات ۴×۸", "ددلیفت ۳×۶", "لانج ۳×۱۲", "ساق ۴×۱۵"],
        },
        nutrition: {
          caloriesTarget: 2700,
          proteinTarget: "170g",
          meals: [{ title: "برنامه", detail: "کربوهیدرات بیشتر برای تمرین پا" }],
        },
      },
      wed: {
        // only nutrition day (recovery nutrition)
        nutrition: {
          caloriesTarget: 2400,
          proteinTarget: "160g",
          meals: [{ title: "ریکاوری", detail: "پروتئین ثابت + آب زیاد + سبزیجات" }],
        },
      },
      thu: {
        workout: {
          title: "Upper Mix",
          durationMin: 50,
          calories: 480,
          steps: ["پرس بالا سینه", "لت", "سرشانه", "کرانچ"],
        },
      },
    },
  },

  {
    id: "p3",
    title: "تغذیه اختصاصی ۳۰ روزه",
    goal: "فقط برنامه غذایی (بدون تمرین)",
    level: "همه سطوح",
    startDate: "2026-02-03T10:00:00.000Z",
    durationDays: 30,
    coach: "مربی: Nutrition Team",
    tags: ["Nutrition", "Macro"],

    schedule: {
      weekly: ["sat", "sun", "mon", "tue", "wed", "thu"],
      restDays: ["fri"],
    },

    planByDay: {
      sat: {
        nutrition: {
          caloriesTarget: 2100,
          proteinTarget: "130g",
          meals: [{ title: "پلن", detail: "متعادل + فیبر بالا" }],
        },
      },
      sun: {
        nutrition: {
          caloriesTarget: 2100,
          proteinTarget: "130g",
          meals: [{ title: "پلن", detail: "کربوهیدرات کنترل‌شده" }],
        },
      },
      mon: {
        nutrition: {
          caloriesTarget: 2000,
          proteinTarget: "125g",
          meals: [{ title: "پلن", detail: "پروتئین بالا + چربی سالم" }],
        },
      },
      tue: { nutrition: { caloriesTarget: 2050, proteinTarget: "128g", meals: [{ title: "پلن", detail: "سبزیجات بیشتر" }] } },
      wed: { nutrition: { caloriesTarget: 2100, proteinTarget: "130g", meals: [{ title: "پلن", detail: "متعادل" }] } },
      thu: { nutrition: { caloriesTarget: 2000, proteinTarget: "125g", meals: [{ title: "پلن", detail: "کم‌نمک + آب بیشتر" }] } },
    },
  },

  // TODO: Convert p4..p10 to the same structure (schedule + planByDay)
];
