import { api } from "@/lib/axios/client";

const ROLE_COOKIE = "user_role";
const TOKEN_COOKIE = "access_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function setCookie(name, value) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function persistAuthSession(data) {
  if (typeof window === "undefined") return;

  const { access_token, refresh_token, user } = data || {};

  if (access_token) {
    window.localStorage.setItem("access_token", access_token);
    setCookie(TOKEN_COOKIE, access_token);
  }
  if (refresh_token) {
    window.localStorage.setItem("refresh_token", refresh_token);
  }
  if (user?.role) {
    window.localStorage.setItem("user_role", user.role);
    setCookie(ROLE_COOKIE, user.role);
  }
  if (user?.name) {
    window.localStorage.setItem("user_name", user.name);
  }
  if (user?.isProfileComplete !== undefined) {
    window.localStorage.setItem(
      "profile_complete",
      user.isProfileComplete ? "1" : "0"
    );
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
  window.localStorage.removeItem("user_role");
  window.localStorage.removeItem("user_name");
  window.localStorage.removeItem("profile_complete");
  clearCookie(ROLE_COOKIE);
  clearCookie(TOKEN_COOKIE);
}

export function getAuthSession() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("access_token");
  if (!token) return null;
  return {
    token,
    role: window.localStorage.getItem("user_role") || "",
    name: window.localStorage.getItem("user_name") || "",
  };
}

export function isLoggedIn() {
  return !!getAuthSession()?.token;
}

export async function logout() {
  const refreshToken = window.localStorage.getItem("refresh_token");
  try {
    await api.post("/auth/logout", { refresh_token: refreshToken || undefined });
  } catch {
    // proceed with local cleanup even if API fails
  }
  clearAuthSession();
  window.location.href = "/auth";
}
