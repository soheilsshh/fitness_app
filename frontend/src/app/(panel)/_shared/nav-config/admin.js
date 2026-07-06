import {
  ActivityIcon,
  AwardIcon,
  ClipboardListIcon,
  FilterIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

export const adminBrand = {
  title: "Fitino",
  subtitle: "پنل مدیر",
  href: "/admin",
};

export const adminNav = [
  {
    href: "/admin/dashboard",
    label: "داشبورد",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/admin/students",
    label: "همه شاگردان",
    icon: UserCheckIcon,
  },
  {
    href: "/admin/funnel-leads",
    label: "قیف فروش",
    icon: FilterIcon,
  },
  {
    href: "/admin/coaches",
    label: "مربی‌ها",
    icon: AwardIcon,
  },
  {
    href: "/admin/coaches/requests",
    label: "درخواست‌های مربی",
    icon: UserPlusIcon,
  },
  {
    href: "/admin/users",
    label: "کاربران",
    icon: UsersIcon,
  },
  {
    href: "/admin/plans",
    label: "پلن‌ها",
    icon: ClipboardListIcon,
  },
  {
    href: "/admin/exercises",
    label: "تمرین‌ها",
    icon: ActivityIcon,
  },
  {
    href: "/admin/site",
    label: "سایت",
    icon: GlobeIcon,
  },
  {
    href: "/admin/feedback",
    label: "فیدبک",
    icon: MessageCircleIcon,
  },
];

export const adminHeader = {
  title: "پنل مدیر",
  subtitle: "مدیریت برنامه‌ها و سفارش‌ها",
};
