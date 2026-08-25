/** Smart body analysis funnel — public entry for unpaid students. */
export const FUNNEL_PATH = "/analysis";
export const GET_PROGRAM_LABEL = "تهیه برنامه از فیتینو";
export const FUNNEL_LABEL = "فانل ۱ · آنالیز هوشمند بدن";

export function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(Number(n || 0)) + " تومان";
}
