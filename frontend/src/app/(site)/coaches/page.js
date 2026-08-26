import { API_BASE_URL } from "@/lib/api/baseUrl";
import { absoluteUrl } from "@/lib/seo/siteUrl";
import CoachesListClient from "./_components/CoachesListClient";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

const title = "مربی‌های فیتینو | انتخاب مربی تناسب اندام";
const description =
  "لیست مربیان حرفه‌ای فیتینو را ببینید و از صفحه اختصاصی هر مربی، برنامه تمرینی و تغذیه متناسب با خودتان را بخرید.";

export const metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/coaches/") },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/coaches/"),
    siteName: "فیتینو",
    locale: "fa_IR",
    type: "website",
  },
};

async function fetchFirstPage() {
  try {
    const res = await fetch(`${API_BASE}/coaches?page=1&pageSize=12`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { items: [], total: 0 };
    const data = await res.json();
    return { items: data?.items || [], total: data?.total || 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function CoachesPage() {
  const { items, total } = await fetchFirstPage();
  return <CoachesListClient initialItems={items} initialTotal={total} />;
}
