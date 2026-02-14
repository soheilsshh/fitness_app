export const mockStudents = [
  {
    id: "u1",
    fullName: "مریم احمدی",
    phone: "09100000008",
    status: "pending", // pending | active
    planTitle: "چربی‌سوزی ۴ هفته‌ای",
    planType: "both", // workout | nutrition | both
    weekly: ["شنبه", "یکشنبه", "سه‌شنبه", "چهارشنبه"],
    restDays: ["دوشنبه", "پنجشنبه", "جمعه"],
  },
  {
    id: "s2",
    fullName: "رضا حسینی",
    phone: "09360000007",
    status: "active",
    planTitle: "عضله‌سازی ۸ هفته‌ای",
    planType: "workout",
    weekly: ["شنبه", "یکشنبه", "دوشنبه", "چهارشنبه", "پنجشنبه"],
    restDays: ["سه‌شنبه", "جمعه"],
  },
  {
    id: "s3",
    fullName: "نسترن کریمی",
    phone: "09910000003",
    status: "pending",
    planTitle: "تغذیه اختصاصی ۳۰ روزه",
    planType: "nutrition",
    weekly: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه"],
    restDays: ["جمعه"],
  },
];
