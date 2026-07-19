import { API_BASE_URL } from "@/lib/api/baseUrl";

const API_BASE = API_BASE_URL;

export function apiAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
