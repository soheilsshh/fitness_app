export const PROFILE_UPDATED_EVENT = "fitino:profile-updated";

export function emitProfileUpdated(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail }));
}
