import {
  ClipboardListIcon,
  Contact,
  HistoryIcon,
  ShoppingBagIcon,
  UserIcon,
} from "lucide-react";

export const userBrand = {
  title: "FitPro",
  subtitle: "پنل کاربر",
  href: "/user",
};

export const userNav = [
  {
    href: "/user/my-programs",
    label: "برنامه‌های من",
    icon: ClipboardListIcon,
  },
  {
    href: "/user/workout-history",
    label: "تاریخچه تمرینات",
    icon: HistoryIcon,
  },
  {
    href: "/user/orders",
    label: "سفارش‌های من",
    icon: ShoppingBagIcon,
  },
  {
    href: "/user/contact",
    label: "ارتباط با مربی",
    icon: Contact
  },
  {
    href: "/user/profile",
    label: "پروفایل",
    icon: UserIcon,
  },
];

export const userHeader = {
  title: "پنل کاربر",
  subtitle: "مدیریت برنامه‌ها و سفارش‌ها",
};
