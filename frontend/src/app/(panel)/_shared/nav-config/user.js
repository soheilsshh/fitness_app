import {
  Apple,
  Award,
  Bell,
  CalendarClock,
  ClipboardListIcon,
  Contact,
  Dumbbell,
  HistoryIcon,
  Home,
  LineChartIcon,
  PencilLineIcon,
  SaladIcon,
  ShieldCheck,
  ShoppingBagIcon,
  UserIcon,
  Users,
  WandSparklesIcon,
} from "lucide-react";

export const userBrand = {
  title: "فیتینو",
  subtitle: "پنل کاربر",
  href: "/user/dashboard",
};

/**
 * Five primary IA groups for student panel.
 * - Bottom nav (mobile): one tab per group → group.href
 * - Sidebar (desktop): group label + child items
 *
 * AI-assisted workout/nutrition builders live as sub-items inside "training"
 * and "nutrition" (not their own top-level groups), and community/social
 * features live inside "account" — this keeps the bottom dock at exactly
 * five tabs, which is the mobile navigation best-practice ceiling.
 */
export const userNavGroups = [
  {
    id: "home",
    label: "خانه",
    href: "/user/dashboard",
    icon: Home,
    items: [
      {
        href: "/user/dashboard",
        label: "داشبورد",
        icon: Home,
        description: "نمای کلی پیشرفت و فعالیت‌ها",
      },
    ],
  },
  {
    id: "training",
    label: "تمرین",
    href: "/user/my-programs",
    icon: Dumbbell,
    items: [
      {
        href: "/user/my-programs",
        label: "برنامه‌های من",
        icon: ClipboardListIcon,
        description: "برنامه تمرین فعال و جلسات",
      },
      {
        href: "/user/workout-history",
        label: "تاریخچه تمرینات",
        icon: HistoryIcon,
        description: "رکورد تمرین‌های انجام‌شده",
      },
      {
        href: "/user/ai-programs/new",
        label: "ساخت برنامه تمرینی با AI",
        icon: WandSparklesIcon,
        description: "ساخت برنامه تمرینی جدید با هوش مصنوعی",
      },
      {
        href: "/user/ai-programs/edit",
        label: "ویرایش برنامه تمرینی با AI",
        icon: PencilLineIcon,
        description: "درخواست ویرایش هوشمند برای برنامه تمرینی‌ای که دارید",
      },
    ],
  },
  {
    id: "nutrition",
    label: "تغذیه",
    href: "/user/food-diary",
    icon: Apple,
    items: [
      {
        href: "/user/food-diary",
        label: "کالری‌شمار من",
        icon: Apple,
        description: "ثبت وعده‌ها و کالری روزانه",
      },
      {
        href: "/user/ai-nutrition/single",
        label: "تک‌غذا با AI",
        icon: SaladIcon,
        description: "یک پیشنهاد غذا از مواد موجودت بساز",
      },
      {
        href: "/user/ai-nutrition/daily",
        label: "برنامه روزانه با AI",
        icon: WandSparklesIcon,
        description: "برنامه کامل غذایی امروز",
      },
      {
        href: "/user/ai-nutrition/weekly",
        label: "برنامه هفتگی با AI",
        icon: CalendarClock,
        description: "برنامه غذایی ۷ روز آینده",
      },
    ],
  },
  {
    id: "tracking",
    label: "پایش",
    href: "/user/tracking",
    icon: LineChartIcon,
    items: [
      {
        href: "/user/tracking",
        label: "پایش پیشرفت",
        icon: LineChartIcon,
        description: "وزن، اندازه‌ها و گزارش‌ها",
      },
    ],
  },
  {
    id: "account",
    label: "حساب من",
    href: "/user/profile",
    icon: UserIcon,
    items: [
      {
        href: "/user/profile",
        label: "پروفایل",
        icon: UserIcon,
        description: "اطلاعات و تکمیل پروفایل",
      },
      {
        href: "/user/achievements",
        label: "دستاوردها و امتیاز",
        icon: Award,
        description: "مدال‌ها و امتیاز کسب‌شده",
      },
      {
        href: "/user/community",
        label: "اجتماع",
        icon: Users,
        description: "پست‌ها، لایک و کامنت",
      },
      {
        href: "/user/sessions",
        label: "جلسات با مربی",
        icon: CalendarClock,
        description: "تقویم جلسات برنامه‌ریزی‌شده",
      },
      {
        href: "/user/guarantee",
        label: "وضعیت تضمین من",
        icon: ShieldCheck,
        description: "درصد پایبندی و درخواست‌های تضمین",
      },
      {
        href: "/user/orders",
        label: "سفارش‌ها",
        icon: ShoppingBagIcon,
        description: "خریدها و وضعیت سفارش",
      },
      {
        href: "/user/notifications",
        label: "اعلان‌ها",
        icon: Bell,
        description: "روشن/خاموش کردن یادآوری‌ها",
      },
      {
        href: "/user/contact",
        label: "ارتباط با مربی",
        icon: Contact,
        description: "تیکت و راه‌های تماس",
      },
    ],
  },
];

/** Flat list (compat) — primary leaf of each group */
export const userNav = userNavGroups.flatMap((group) => group.items);

export const userHeader = {
  title: "پنل کاربر",
  subtitle: "خانه · تمرین · تغذیه · پایش · حساب",
};

export function isNavPathActive(pathname, href) {
  if (!pathname || !href) return false;
  const path = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;
  const target = href.endsWith("/") && href.length > 1 ? href.slice(0, -1) : href;
  if (path === target) return true;
  return path.startsWith(`${target}/`);
}

/** Longest-matching group for the current route */
export function findActiveUserNavGroup(pathname) {
  let best = null;
  let bestLen = -1;
  for (const group of userNavGroups) {
    for (const item of group.items) {
      if (!isNavPathActive(pathname, item.href)) continue;
      const len = item.href.length;
      if (len > bestLen) {
        best = group;
        bestLen = len;
      }
    }
  }
  return best;
}

export function findActiveUserNavItem(pathname) {
  let best = null;
  let bestLen = -1;
  for (const group of userNavGroups) {
    for (const item of group.items) {
      if (!isNavPathActive(pathname, item.href)) continue;
      const len = item.href.length;
      if (len > bestLen) {
        best = item;
        bestLen = len;
      }
    }
  }
  return best;
}
