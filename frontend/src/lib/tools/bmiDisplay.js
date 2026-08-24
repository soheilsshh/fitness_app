import { BMI_CATEGORIES } from "./bmiCalculator";

export const BMI_BADGE_CLASSES = {
  underweight: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  normal: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  overweight: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  obese: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export function getBmiStatusLabel(statusId) {
  if (!statusId) return null;
  return BMI_CATEGORIES.find((c) => c.id === statusId)?.label ?? statusId;
}

export function getBmiBadgeClass(statusId) {
  return BMI_BADGE_CLASSES[statusId] || "border-border bg-muted text-muted-foreground";
}
