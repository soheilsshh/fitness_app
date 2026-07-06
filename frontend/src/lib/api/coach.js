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

/**
 * @typedef {{
 *   id: number;
 *   type: "certificate" | "honor" | "medal" | "qualification";
 *   title: string;
 *   issuer?: string;
 *   year?: number;
 *   description?: string;
 *   imageUrl?: string;
 *   sortOrder?: number;
 *   isVisible?: boolean;
 * }} CoachAchievement
 */

export async function getAchievements() {
  const res = await api.get("/coach/profile/achievements");
  return res.data?.items || [];
}

export async function createAchievement(data) {
  const res = await api.post("/coach/profile/achievements", data);
  return res.data;
}

export async function updateAchievement(id, data) {
  const res = await api.put(`/coach/profile/achievements/${id}`, data);
  return res.data;
}

export async function deleteAchievement(id) {
  return api.delete(`/coach/profile/achievements/${id}`);
}

export async function uploadAchievementImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post("/coach/profile/achievements/image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.url || "";
}

/**
 * @typedef {{
 *   slug?: string;
 *   displayName?: string;
 *   title?: string;
 *   bio?: string;
 *   aboutCoach?: string;
 *   specialty?: string;
 *   nationalId?: string;
 *   city?: string;
 *   status?: "pending" | "reviewing" | "approved";
 *   isPublished?: boolean;
 *   avatarUrl?: string;
 *   coverImageUrl?: string;
 *   publicUrl?: string;
 *   social?: {
 *     phone?: string;
 *     instagram?: string;
 *     telegram?: string;
 *     whatsapp?: string;
 *     website?: string;
 *   };
 * }} CoachProfile
 */

export async function getCoachProfile() {
  const res = await api.get("/coach/profile");
  return res.data;
}

export async function updateCoachProfile(data) {
  const res = await api.put("/coach/profile", data);
  return res.data;
}

/** @returns {Promise<{ status: string; message?: string }>} */
export async function submitProfileRequest() {
  const res = await api.post("/coach/profile/submit-request");
  return res.data;
}
