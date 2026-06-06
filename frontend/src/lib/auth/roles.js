export const ROLES = {
  ADMIN: "admin",
  COACH: "coach",
  STUDENT: "student",
};

const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.COACH]: "/coach/dashboard",
  [ROLES.STUDENT]: "/user/my-programs",
};

/** Returns the post-login dashboard path for a given role. */
export function getDashboardPath(role) {
  return DASHBOARD_PATHS[role] ?? DASHBOARD_PATHS[ROLES.STUDENT];
}

/** Panel route prefixes guarded by role. */
export const PANEL_PREFIXES = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.COACH]: "/coach",
  [ROLES.STUDENT]: "/user",
};
