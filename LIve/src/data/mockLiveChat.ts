/** Demo chat lines for preview/dev — ~60s timeline on each page load. */
export const MOCK_LIVE_CHAT_SCRIPT: Array<{
  atMs: number;
  username: string;
  message: string;
  isAdmin?: boolean;
}> = [
  { atMs: 1500, username: "سارا", message: "سلام به همه 👋" },
  { atMs: 4000, username: "رضا", message: "صدا و تصویر عالیه" },
  { atMs: 7000, username: "مربی فیتینو", message: "به کارگاه آنالیز بدنی خوش اومدید!", isAdmin: true },
  { atMs: 11000, username: "نیلوفر", message: "از کجا باید شروع کنیم؟" },
  { atMs: 15000, username: "امیر", message: "من دیروز ثبت‌نام کردم، خیلی مفید بود" },
  { atMs: 20000, username: "مریم", message: "برنامه تمرین شخصی‌سازی شده داره؟" },
  { atMs: 25000, username: "مربی فیتینو", message: "بله، بر اساس آنالیز بدنی هر نفر جداگانه", isAdmin: true },
  { atMs: 30000, username: "پارسا", message: "عالیه 🔥" },
  { atMs: 35000, username: "الهام", message: "رژیم غذایی هم شامل میشه؟" },
  { atMs: 40000, username: "کامران", message: "من ۳ کیلو کم کردم با فیتینو" },
  { atMs: 45000, username: "زهرا", message: "پشتیبانی خیلی سریع جواب میده" },
  { atMs: 50000, username: "مربی فیتینو", message: "سوال‌ها رو بپرسید، در خدمتیم", isAdmin: true },
  { atMs: 55000, username: "آرین", message: "ممنون از کارگاه خوبتون 🙏" },
  { atMs: 58000, username: "لیلا", message: "لینک ثبت‌نام کجاست؟" },
];
