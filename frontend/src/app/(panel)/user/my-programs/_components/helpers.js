export function formatDateFa(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Returns { totalDays, passedDays, remainingDays, percent, isActive, isExpired }
export function computeTimeline(startISO, durationDays) {
  const start = new Date(startISO).getTime();
  const now = Date.now();

  const total = Number(durationDays) || 0;

  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const passedDays = clamp(diffDays, 0, total);

  const remainingDays = clamp(total - passedDays, 0, total);

  const percent = total === 0 ? 0 : Math.round((passedDays / total) * 100);

  const isExpired = total > 0 && now >= start + total * (1000 * 60 * 60 * 24);
  const isActive = now >= start && !isExpired;

  return {
    totalDays: total,
    passedDays,
    remainingDays,
    percent,
    isActive,
    isExpired,
  };
}

export function shortRemaining(remainingDays) {
  const r = Number(remainingDays) || 0;
  if (r <= 0) return "اتمام دوره";
  if (r === 1) return "۱ روز باقی‌مانده";
  return `${r} روز باقی‌مانده`;
}
