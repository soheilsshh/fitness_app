export default function CoachDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-white">داشبورد مربی</h1>
      <p className="text-sm text-zinc-400 leading-7">
        پنل مربی با موفقیت راه‌اندازی شد. در فازهای بعدی آمار دانشجویان،
        پلن‌ها و برنامه‌ها از API بارگذاری می‌شوند.
      </p>
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-zinc-300">
        مسیرهای فعال: <code className="text-emerald-300">/coach/dashboard</code>
        ، <code className="text-emerald-300">/coach/profile</code> (فاز ۲)
      </div>
    </div>
  );
}
