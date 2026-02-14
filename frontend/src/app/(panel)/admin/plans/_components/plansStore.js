const KEY = "fitpro_admin_plans_v1";

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

const defaultPlans = [
  {
    id: "pl_1",
    title: "پلن پایه",
    subtitle: "برای شروع و آشنایی",
    courseName: "دوره مقدماتی",
    featuresText: "• دسترسی کامل\n• پشتیبانی پایه\n• برنامه استاندارد",
    price: 1200000,
    discountPrice: 990000,
    discountPercent: 18,
    isPopular: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pl_2",
    title: "پلن حرفه‌ای",
    subtitle: "بهترین انتخاب برای نتیجه سریع‌تر",
    courseName: "دوره حرفه‌ای",
    featuresText: "• دسترسی کامل\n• پشتیبانی ویژه\n• آپدیت‌های ماهانه",
    price: 2400000,
    discountPrice: 0,
    discountPercent: 0,
    isPopular: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// cache
let cachedRaw = null;
let cachedSnapshot = [];
let hasSeeded = false;

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (hasSeeded) return;

  const raw = window.localStorage.getItem(KEY);
  if (raw == null) {
    window.localStorage.setItem(KEY, JSON.stringify(defaultPlans));
  }
  hasSeeded = true;
}

export function listPlansSnapshot() {
  if (typeof window === "undefined") return [];
  ensureSeeded();

  const raw = window.localStorage.getItem(KEY) || "[]";
  if (raw === cachedRaw) return cachedSnapshot;

  const parsed = safeParse(raw);
  const next = Array.isArray(parsed) ? parsed : [];

  cachedRaw = raw;
  cachedSnapshot = next;
  return cachedSnapshot;
}

// pub/sub
const listeners = new Set();

export function subscribePlans(cb) {
  listeners.add(cb);

  const onStorage = (e) => {
    if (e?.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function notifyPlansChanged() {
  for (const cb of listeners) cb();
}

export function writePlans(next) {
  if (typeof window === "undefined") return;
  ensureSeeded();

  const arr = Array.isArray(next) ? next : [];
  const raw = JSON.stringify(arr);

  window.localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = arr;

  notifyPlansChanged();
}
