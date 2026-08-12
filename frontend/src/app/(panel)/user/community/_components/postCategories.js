import {
  Dumbbell,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Salad,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

/**
 * Ready-made post templates shown above the composer (roadmap: فید UX pass #1).
 * Selecting one tags the post's `category` and, if the composer is still
 * empty, seeds a starter line the user can edit before publishing.
 */
export const POST_TEMPLATES = [
  {
    value: "workout",
    label: "تمرین",
    emoji: "📸",
    icon: Dumbbell,
    starter: "امروز تمرین کردم 💪\n",
    badgeClass:
      "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    value: "nutrition",
    label: "تغذیه",
    emoji: "🍽️",
    icon: Salad,
    starter: "وعده امروزم 🍽️\n",
    badgeClass:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    value: "progress",
    label: "پیشرفت",
    emoji: "📈",
    icon: TrendingUp,
    starter: "پیشرفتم رو با شما به اشتراک می‌ذارم 📈\n",
    badgeClass:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  {
    value: "record",
    label: "رکورد",
    emoji: "🏆",
    icon: Trophy,
    starter: "رکورد جدید زدم 🏆\n",
    badgeClass:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    value: "question",
    label: "سوال",
    emoji: "❓",
    icon: HelpCircle,
    starter: "یه سوال از مربی‌ها دارم ❓\n",
    badgeClass:
      "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  {
    value: "tip",
    label: "نکته",
    emoji: "💡",
    icon: Lightbulb,
    starter: "یه نکته و تجربه شخصی 💡\n",
    badgeClass:
      "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
];

export function categoryMeta(value) {
  return POST_TEMPLATES.find((t) => t.value === value) || null;
}

/**
 * Feed filter tabs (roadmap: فید UX pass #3 — شخصی‌سازی فید).
 * `forYou` has no query params (unfiltered / newest-first).
 * `following` has no backend support yet (no follow graph) — shown disabled.
 */
export const FEED_FILTERS = [
  { value: "forYou", label: "برای شما", emoji: "✨", icon: Sparkles },
  {
    value: "following",
    label: "دنبال می‌کنید",
    emoji: "👥",
    icon: Users,
    comingSoon: true,
  },
  { value: "coaches", label: "مربی‌ها", emoji: "🎓", icon: GraduationCap, authorRole: "coach" },
  { value: "workout", label: "تمرین", emoji: "💪", icon: Dumbbell, category: "workout" },
  { value: "nutrition", label: "تغذیه", emoji: "🥗", icon: Salad, category: "nutrition" },
  { value: "progress", label: "پیشرفت", emoji: "📈", icon: TrendingUp, category: "progress" },
  { value: "question", label: "سوال‌ها", emoji: "❓", icon: HelpCircle, category: "question" },
];
