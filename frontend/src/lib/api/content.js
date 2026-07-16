import { api } from "@/lib/axios/client";

/** @returns {Promise<{ items: import('./content').AcademyItem[] }>} */
export async function getAcademy() {
  const res = await api.get("/academy");
  return res.data;
}

/** @returns {Promise<{ groups: import('./content').FaqGroup[] }>} */
export async function getFaq() {
  const res = await api.get("/faq");
  return res.data;
}

/** @returns {Promise<{ items: import('./content').AcademyItem[] }>} */
export async function getAdminAcademy() {
  const res = await api.get("/admin/academy");
  return res.data;
}

/** @param {import('./content').AcademyItem[]} items */
export async function updateAdminAcademy(items) {
  const res = await api.put("/admin/academy", { items });
  return res.data;
}

/** @returns {Promise<{ groups: import('./content').FaqGroup[] }>} */
export async function getAdminFaq() {
  const res = await api.get("/admin/faq");
  return res.data;
}

/** @param {import('./content').FaqGroup[]} groups */
export async function updateAdminFaq(groups) {
  const res = await api.put("/admin/faq", { groups });
  return res.data;
}

/** @param {File} file */
export async function uploadContentMedia(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/admin/content-media", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
