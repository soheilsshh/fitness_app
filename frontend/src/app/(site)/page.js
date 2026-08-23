import HomeClient from "./_components/HomeClient";
import { absoluteUrl } from "@/lib/seo/siteUrl";
import { API_BASE_URL } from "@/lib/api/baseUrl";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

const title = "فیتینو | پلتفرم مربیگری، برنامه تمرینی و تغذیه هوشمند";
const description =
  "فیتینو پلتفرم آنلاین مربیگری ورزشی و تناسب اندام است؛ برنامه تمرینی و تغذیه اختصاصی از مربیان حرفه‌ای همراه با پایش هوش مصنوعی.";

export const metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/"),
    siteName: "فیتینو",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

async function fetchJson(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [settings, coachesData] = await Promise.all([
    fetchJson("/site-settings"),
    fetchJson("/coaches?page=1&pageSize=6"),
  ]);

  return (
    <HomeClient
      initialSettings={settings}
      initialCoaches={coachesData?.items || []}
    />
  );
}
