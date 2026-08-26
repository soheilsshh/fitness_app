/**
 * Preview mode: skip registration gate and time-window checks so the webinar
 * page stays visible for local QA. Enabled in Vite dev, or with ?preview=1.
 */
export function isWebinarPreviewMode(): boolean {
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search);
    if (q.get("preview") === "1" || q.get("preview") === "true") {
      return true;
    }
  }
  return import.meta.env.DEV;
}

export const PREVIEW_REGISTRATION_DATA = {
  firstName: "پیش‌نمایش",
  lastName: "تست",
  phone: "09120000000",
  registrationTime: new Date(0).toISOString(),
  userId: 0,
};
