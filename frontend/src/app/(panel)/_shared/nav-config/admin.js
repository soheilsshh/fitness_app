import {
  ActivityIcon,
  AppleIcon,
  AwardIcon,
  BookOpenIcon,
  ClipboardListIcon,
  FilterIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
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
    href: "/admin/templates",
    label: "تمپلیت تمرین",
    icon: LayoutTemplateIcon,
  },
  {
    href: "/admin/nutrition-templates",
    label: "تمپلیت تغذیه",
    icon: AppleIcon,
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

/**
 * Same items as `adminNav`, sectioned for the sidebar so 14 links aren't
 * dumped as one flat scrolling list (desktop sidebar + mobile offcanvas
 * sheet both render this).
 */
export const adminNavGroups = [
  {
    id: "overview",
    label: "نمای کلی",
    items: [adminNav[0], adminNav[1]],
  },
  {
    id: "people",
    label: "افراد",
    items: [adminNav[2], adminNav[3], adminNav[4], adminNav[5], adminNav[6]],
  },
  {
    id: "content",
    label: "محتوای برنامه",
    items: [adminNav[7], adminNav[8], adminNav[9], adminNav[10]],
  },
  {
    id: "site",
    label: "سایت و پشتیبانی",
    items: [adminNav[11], adminNav[12], adminNav[13]],
  },
];

export const adminHeader = {
  title: "پنل مدیر",
  subtitle: "مدیریت برنامه‌ها، سفارش‌ها و اپ موبایل",
};
