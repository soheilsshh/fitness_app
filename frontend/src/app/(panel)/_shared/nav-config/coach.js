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
