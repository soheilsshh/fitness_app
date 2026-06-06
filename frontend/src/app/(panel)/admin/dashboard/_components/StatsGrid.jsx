// app/admin/dashboard/_components/StatsGrid.jsx
import StatCard from "./StatCard";

export default function StatsGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((it) => (
        <StatCard key={it.title} title={it.title} value={it.value} hint={it.hint} />
      ))}
    </div>
  );
}
