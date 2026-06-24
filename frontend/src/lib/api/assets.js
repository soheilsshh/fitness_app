const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.fitinoo.ir";

export function apiAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
