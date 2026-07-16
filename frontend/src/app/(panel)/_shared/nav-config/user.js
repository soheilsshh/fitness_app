import {
  Apple,
  ClipboardListIcon,
  Contact,
  Dumbbell,
  HelpCircle,
  HistoryIcon,
  Home,
  LineChartIcon,
  ShoppingBagIcon,
  UserIcon,
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
        href: "/user/orders",
        label: "سفارش‌ها",
        icon: ShoppingBagIcon,
        description: "خریدها و وضعیت سفارش",
      },
      {
        href: "/user/contact",
        label: "ارتباط با مربی",
        icon: Contact,
        description: "تیکت و راه‌های تماس",
      },
      {
        href: "/user/faq",
        label: "سوالات متداول",
        icon: HelpCircle,
        description: "راهنمای استفاده از پنل",
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
