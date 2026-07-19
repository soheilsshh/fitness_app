import { API_BASE_URL } from "@/lib/api/baseUrl";

const API_BASE = API_BASE_URL;

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isVideoMedia(pathOrUrl) {
  if (!pathOrUrl) return false;
  return VIDEO_EXT.test(String(pathOrUrl));
}

export function exercisePreviewUrl(exercise) {
  if (!exercise) return null;
  return mediaUrl(exercise.gifUrl) || mediaUrl(exercise.imageUrl);
}
