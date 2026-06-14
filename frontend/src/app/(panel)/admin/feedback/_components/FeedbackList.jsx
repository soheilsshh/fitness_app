"use client";

import { FiMail, FiPhone, FiUser } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatDateFa(iso) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return "—";
  }
}

export default function FeedbackList({ items, onSelect }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/5">
      <div className="border-b border-white/10 bg-zinc-950/40 px-4 py-3 text-[11px] text-zinc-400">
        لیست پیام‌ها
      </div>

      <div className="divide-y divide-white/10">
        {items.length === 0 ? (
          <div className="p-5 text-sm text-zinc-300">پیامی وجود ندارد.</div>
        ) : (
          items.map((x) => (
            <button
              key={x.id}
              onClick={() => onSelect?.(x.id)}
              className={cn("block w-full text-right px-4 py-4 transition hover:bg-white/10")}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
                      <FiUser />
                      {x.fullName}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
                      <FiPhone />
                      {x.phone}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] text-zinc-200">
                      <FiMail />
                      <span className="max-w-[220px] truncate">{x.email}</span>
                    </span>
                  </div>

                  <div className="mt-2 line-clamp-2 text-sm text-zinc-200">
                    {x.message}
                  </div>
                </div>

                <div className="shrink-0 text-[11px] text-zinc-400">
                  {formatDateFa(x.createdAt)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
