import { api } from "@/lib/axios/client";

/**
 * @typedef {{
 *   id: number;
 *   displayName?: string;
 *   title?: string;
 *   slug?: string;
 *   status?: string;
 *   phone?: string;
 *   city?: string;
 *   nationalId?: string;
 *   bio?: string;
 *   aboutCoach?: string;
 *   specialty?: string;
 *   avatarUrl?: string;
 *   coverImageUrl?: string;
 *   instagram?: string;
 *   telegram?: string;
 *   whatsapp?: string;
 *   website?: string;
 *   achievements?: Array<{
 *     id: number;
 *     type: string;
 *     title: string;
 *     issuer?: string;
 *     year?: number;
 *     description?: string;
 *     imageUrl?: string;
 *     sortOrder?: number;
 *   }>;
 * }} AdminCoachReview
 */

/** @returns {Promise<{ items: AdminCoachReview[]; total: number; page: number; pageSize: number }>} */
export async function getPendingCoaches(params = {}) {
  const [reviewing, pending] = await Promise.all([
    api.get("/admin/coaches", {
      params: { status: "reviewing", pageSize: 100, ...params },
    }),
    api.get("/admin/coaches", {
      params: { status: "pending", pageSize: 100, ...params },
    }),
  ]);
  const seen = new Set();
  const items = [];
  for (const row of [...(reviewing.data?.items || []), ...(pending.data?.items || [])]) {
    if (!row?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    items.push(row);
  }
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length,
  };
}

/** @returns {Promise<AdminCoachReview>} */
export async function getCoachForReview(id) {
  const res = await api.get(`/admin/coaches/${id}`);
  return res.data;
}

/** @returns {Promise<AdminCoachReview>} */
export async function approveCoach(id) {
  const res = await api.patch(`/admin/coaches/${id}`, { status: "approved" });
  return res.data;
}
