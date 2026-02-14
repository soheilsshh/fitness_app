// app/admin/dashboard/_components/StatCard.jsx
export default function StatCard({ title, value, hint }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-bold text-zinc-300">{title}</div>
      <div className="mt-3 text-3xl font-extrabold text-white">{String(value)}</div>
      {hint ? <div className="mt-2 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}
