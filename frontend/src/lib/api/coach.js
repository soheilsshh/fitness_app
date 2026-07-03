import { api } from "@/lib/axios/client";

/** Coach panel API paths (relative to NEXT_PUBLIC_API_BASE_URL). */
export const COACH_FOODS_PATH = "/coach/foods";
export const COACH_EXERCISES_PATH = "/coach/exercises";
export const COACH_WORKOUT_TEMPLATES_PATH = "/coach/workout-templates";
export const COACH_NUTRITION_TEMPLATES_PATH = "/coach/nutrition-templates";

/**
 * @typedef {{
 *   id: number;
 *   title: string;
 *   type?: string;
 *   gender?: string;
 *   location?: string;
 *   level?: string;
 *   target?: string;
 *   dayCount?: number;
 * }} WorkoutTemplateSummary
 */

/**
 * @typedef {{
 *   id: number;
 *   title: string;
 *   type?: string;
 *   gender?: string;
 *   target?: string;
 *   calorie?: number;
 * }} NutritionTemplateSummary
 */

function extractTemplateList(data) {
  const payload = data || {};
  return (
    payload.items ||
    payload.templates ||
    payload.data?.items ||
    payload.data?.templates ||
    []
  );
}

export async function listWorkoutTemplates(params = {}) {
  const res = await api.get(COACH_WORKOUT_TEMPLATES_PATH, { params });
  return extractTemplateList(res.data);
}

export async function listNutritionTemplates(params = {}) {
  const res = await api.get(COACH_NUTRITION_TEMPLATES_PATH, { params });
  return extractTemplateList(res.data);
}

export async function assignWorkoutTemplateToStudent(studentId, templateId) {
  return api.post(
    `/coach/students/${studentId}/workout-programs/templates/${templateId}`,
  );
}

export async function assignNutritionTemplateToStudent(studentId, templateId) {
  return api.post(
    `/coach/students/${studentId}/nutrition-programs/templates/${templateId}`,
  );
}
