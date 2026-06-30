const KEY = "fitpro_admin_student_plans_v1";

export function loadAllPlans() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveAllPlans(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data || {}));
}

export function loadStudentPlan(studentId) {
  const all = loadAllPlans();
  return all?.[studentId] || null;
}

export function saveStudentPlan(studentId, planData) {
  const all = loadAllPlans();
  all[studentId] = planData;
  saveAllPlans(all);
}
