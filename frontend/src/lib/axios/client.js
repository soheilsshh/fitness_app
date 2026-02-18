import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
}
