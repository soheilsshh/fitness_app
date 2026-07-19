import {
  ActivityIcon,
  AwardIcon,
  BookOpenIcon,
  ClipboardListIcon,
  FilterIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  SmartphoneIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

export const adminBrand = {
  title: "فیتینو",
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
    href: "/admin/mobile",
    label: "اپ موبایل",
    icon: SmartphoneIcon,
  },
  {
    href: "/admin/students",
    label: "همه شاگردان",
    icon: UserCheckIcon,
  },
  {
    href: "/admin/funnel-leads",
    label: "لید و فانل",
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
    href: "/admin/content",
    label: "آموزش و FAQ",
    icon: BookOpenIcon,
  },
  {
    href: "/admin/feedback",
    label: "فیدبک",
    icon: MessageCircleIcon,
  },
];

export const adminHeader = {
  title: "پنل مدیر",
  subtitle: "مدیریت برنامه‌ها، سفارش‌ها و اپ موبایل",
};
