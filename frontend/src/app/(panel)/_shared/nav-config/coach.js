import {
  AppleIcon,
  CalculatorIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  LineChartIcon,
  MessageSquareIcon,
  ScaleIcon,
  UserCheckIcon,
  UserIcon,
} from "lucide-react";

export const coachBrand = {
  title: "فیتینو",
  subtitle: "پنل مربی",
  href: "/coach",
};

export const coachNav = [
  {
    href: "/coach/dashboard",
    label: "داشبورد",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/coach/students",
    label: "دانشجویان من",
    icon: UserCheckIcon,
  },
  {
    href: "/coach/tracking",
    label: "پایش دانشجوها",
    icon: LineChartIcon,
  },
  {
    href: "/coach/tickets",
    label: "تیکت‌ها",
    icon: MessageSquareIcon,
  },
  {
    href: "/coach/plans",
    label: "پلن‌ها",
    icon: ClipboardListIcon,
  },
  {
    href: "/coach/templates",
    label: "تمپلیت تمرین",
    icon: LayoutTemplateIcon,
  },
  {
    href: "/coach/nutrition-templates",
    label: "تمپلیت تغذیه",
    icon: AppleIcon,
  },
  {
    href: "/coach/profile",
    label: "پروفایل من",
    icon: UserIcon,
  },
];

/**
 * Sections the sidebar into labeled groups, referenced by href so the
 * approval-gated filter (pending coaches only see "پروفایل") still works —
 * groups end up empty and are simply skipped when items are filtered out.
 */
export const coachNavGroups = [
  { id: "overview", label: "نمای کلی", hrefs: ["/coach/dashboard"] },
  {
    id: "students",
    label: "دانشجویان",
    hrefs: ["/coach/students", "/coach/tracking", "/coach/tickets"],
  },
  {
    id: "content",
    label: "محتوا",
    hrefs: ["/coach/plans", "/coach/templates", "/coach/nutrition-templates"],
  },
  { id: "profile", label: "پروفایل", hrefs: ["/coach/profile"] },
];

export const coachToolsNav = [
  {
    href: "/coach/tools/calorie-calculator",
    label: "محاسبه‌گر کالری",
    icon: CalculatorIcon,
  },
  {
    href: "/coach/tools/bmi-calculator",
    label: "محاسبه‌گر BMI",
    icon: ScaleIcon,
  },
];

export const coachHeader = {
  title: "پنل مربی",
  subtitle: "مدیریت دانشجویان، برنامه‌ها و تمپلیت‌های آماده",
};
