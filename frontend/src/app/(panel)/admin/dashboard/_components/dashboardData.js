import { mockStudents } from "../../students/_components/studentsMock";

function countPurchasedCoursesFromLocalStorage() {
  if (typeof window === "undefined") return null;

  try {
    const prefixes = ["studentPlan:", "student_plan_", "plan:", "student-plan:"];
    let count = 0;

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (prefixes.some((p) => key.startsWith(p))) count += 1;
    }

    return count;
  } catch {
    return null;
  }
}

// --- NEW: stable seeded random (deterministic) ---
function seeded01(seed) {
  // deterministic [0..1)
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const MONTHS_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function getAvailableYears() {
  const now = new Date().getFullYear();
  return [now, now - 1, now - 2];
}

export function getDashboardStats({ year }) {
  const totalUsers = Array.isArray(mockStudents) ? mockStudents.length : 0;
  const activeUsers = Array.isArray(mockStudents)
    ? mockStudents.filter((s) => s.status === "active").length
    : 0;

  const lsCount = countPurchasedCoursesFromLocalStorage();
  const purchasedCourses = typeof lsCount === "number" ? lsCount : totalUsers;

  return {
    year,
    totalUsers,
    activeUsers,
    purchasedCourses,
  };
}

// --- NEW: monthly sales data by year ---
export function getMonthlySales({ year }) {
  const stats = getDashboardStats({ year });

  // baseline factors (feel free to tweak)
  const baseCourses = Math.max(5, Number(stats.purchasedCourses) || 0);
  const baseSales = baseCourses * 120; // فرضی: هر خرید ~120 واحد

  return MONTHS_FA.map((m, idx) => {
    // deterministic seasonality + noise
    const season = 0.65 + 0.5 * Math.sin((idx / 12) * Math.PI * 2); // موج سالانه
    const noise = 0.85 + seeded01(year * 100 + idx) * 0.4; // 0.85..1.25

    const courses = Math.round(baseCourses * season * noise);
    const sales = Math.round(baseSales * season * noise);

    return {
      month: m,
      courses,
      sales,
    };
  });
}
