import { apiAssetUrl } from "@/lib/api/assets";

export function resolveMediaUrl(src) {
  if (!src) return "";
  return apiAssetUrl(src);
}

export function isGradientCover(cover) {
  if (!cover) return true;
  return (
    cover.includes("gradient") ||
    cover.includes("linear-") ||
    cover.includes("radial-")
  );
}

export function coverStyle(cover) {
  if (!cover || isGradientCover(cover)) {
    return {
      background:
        cover ||
        "linear-gradient(155deg, rgba(42,156,150,0.9), rgba(24,114,114,0.95))",
    };
  }
  const url = apiAssetUrl(cover);
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function sortAcademyItems(items = []) {
  return [...items].sort((a, b) => {
    const ao = a.sortOrder ?? 0;
    const bo = b.sortOrder ?? 0;
    if (ao !== bo) return ao - bo;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function newAcademyId(type) {
  const prefix = type === "podcast" ? "p" : type === "video" ? "v" : "a";
  return `${prefix}-${Date.now()}`;
}

export function newFaqGroupId() {
  return `g-${Date.now()}`;
}
