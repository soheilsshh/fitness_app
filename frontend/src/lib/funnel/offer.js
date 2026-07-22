/** Ali Funnel 1 — entry for unpaid students (dedicated to علی رشیدآبادی). */
export const FUNNEL_PATH = "/ali-rashidabadi";
export const GET_PROGRAM_LABEL = "تهیه برنامه از علی رشیدآبادی";
export const FUNNEL_LABEL = "فانل ۱ · علی رشیدآبادی";

export function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}
