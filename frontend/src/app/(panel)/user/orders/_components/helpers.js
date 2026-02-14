export function formatDateTimeFa(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatToman(n) {
  const num = Number(n) || 0;
  return `${num.toLocaleString("fa-IR")} تومان`;
}

export function calcTotals(items, discountPercent) {
  const subtotal = (items || []).reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
  const discount = Math.round((subtotal * (Number(discountPercent) || 0)) / 100);
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

export function statusMeta(status) {
  switch (status) {
    case "paid":
      return { label: "پرداخت موفق", badge: "bg-emerald-400/10 text-emerald-100 border-emerald-400/20" };
    case "pending":
      return { label: "در انتظار پرداخت", badge: "bg-cyan-400/10 text-cyan-100 border-cyan-400/20" };
    case "failed":
      return { label: "ناموفق", badge: "bg-rose-400/10 text-rose-100 border-rose-400/20" };
    default:
      return { label: "نامشخص", badge: "bg-white/5 text-zinc-200 border-white/10" };
  }
}
