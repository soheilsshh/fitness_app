import axios from "axios";
import { toast } from "sonner";
import { clearAuthSession } from "@/lib/auth/session";
import { translateApiError } from "@/lib/api/translateError";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.fitinoo.ir";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Attach Authorization header from localStorage if available (client-side only).
if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem("access_token");
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // On 401 (expired/invalid session): clear the session, notify the user, and
  // send them to login. Guarded so a burst of failing requests only triggers a
  // single toast + redirect.
  let handlingSessionExpiry = false;
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const data = error?.response?.data;
      if (data && typeof data.error === "string" && data.error.trim()) {
        data.error = translateApiError(data.error);
      }
      if (data && typeof data.message === "string" && data.message.trim()) {
        data.message = translateApiError(data.message);
      }

      const status = error?.response?.status;
      const url = error?.config?.url || "";
      const isAuthEndpoint = url.includes("/auth/");
      const onAuthPage = window.location.pathname.startsWith("/auth");

      if (status === 401 && !isAuthEndpoint && !onAuthPage && !handlingSessionExpiry) {
        handlingSessionExpiry = true;
        clearAuthSession();
        toast.error("نشست شما منقضی شده است. لطفاً دوباره وارد شوید.");
        const next = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        // Brief delay so the toast is visible before the navigation.
        setTimeout(() => {
          window.location.href = `/auth?redirect=${next}`;
        }, 1200);
      }

      return Promise.reject(error);
    }
  );
}
