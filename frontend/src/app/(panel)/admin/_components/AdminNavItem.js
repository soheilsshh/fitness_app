"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavItem({ href, icon: Icon, label, collapsed, onClick }) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "group flex items-center  rounded-2xl py-1.5 text-sm transition",
        collapsed ? "justify-center " : "gap-3 px-3",
        active
          ? "bg-white text-zinc-950 "
          : "text-zinc-200 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex items-center justify-center rounded-xl border transition",
          collapsed ? "h-11 w-11" : "h-10 w-10",
          active
            ? "border-white/0 bg-zinc-950/10"
            : "border-white/10 bg-white/5 group-hover:bg-white/10",
        ].join(" ")}
      >
        {/* Bigger icon in collapsed mode */}
        <Icon className={collapsed ? "text-[22px]" : "text-[20px]"} />
      </span>

      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
