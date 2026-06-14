"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiX,
  FiGrid,
  FiUser,
  FiClipboard,
  FiUserCheck,
} from "react-icons/fi";
import { FaDumbbell } from "react-icons/fa";
import CoachNavItem from "./CoachNavItem";
import { logout } from "@/lib/auth/session";

const NAV = [
  { href: "/coach/dashboard", label: "داشبورد", icon: FiGrid },
  { href: "/coach/students", label: "دانشجویان من", icon: FiUserCheck },
  { href: "/coach/plans", label: "پلن‌ها", icon: FiClipboard },
  { href: "/coach/profile", label: "پروفایل من", icon: FiUser },
];

function SidebarContent({ collapsed, isMobile, setMobileOpen, setCollapsed }) {
  return (
    <div className="relative flex h-full flex-col border-l border-white/10 bg-zinc-950">
      {!isMobile && (
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:inline-flex absolute -left-5 top-4.5 z-60 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/90 p-2 text-zinc-100 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.9)] hover:bg-zinc-900"
          aria-label="Toggle sidebar"
          title="Toggle"
        >
          {collapsed ? (
            <FiChevronLeft className="text-xl" />
          ) : (
            <FiChevronRight className="text-xl" />
          )}
        </button>
      )}

      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link href="/coach" className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400/15 to-cyan-400/10 ring-1 ring-white/10">
            <FaDumbbell className="text-emerald-200 text-[18px]" />
          </span>

          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-white">FitPro</div>
              <div className="text-[11px] text-zinc-400">Coach Panel</div>
            </div>
          )}
        </Link>

        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-100 hover:bg-white/10"
            aria-label="Close"
          >
            <FiX className="text-xl" />
          </button>
        )}
      </div>

      <div className="px-3">
        <div className="space-y-2">
          {NAV.map((item) => (
            <CoachNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed && !isMobile}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <div className="px-3 pb-4">
        <button
          onClick={() => logout()}
          className={[
            "flex w-full items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-zinc-100 hover:bg-white/10",
            collapsed ? "justify-center px-1 py-1" : "gap-3 px-2 py-2",
          ].join(" ")}
        >
          <span
            className={[
              "inline-flex items-center justify-center rounded-xl border border-white/10 bg-zinc-950/40",
              collapsed ? "h-11 w-11" : "h-10 w-10",
            ].join(" ")}
          >
            <FiLogOut className={collapsed ? "text-[22px]" : "text-[20px]"} />
          </span>

          {!collapsed && <span>خروج</span>}
        </button>
      </div>
    </div>
  );
}

export default function CoachSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const expandedWidth = 288;
  const collapsedWidth = 80;

  return (
    <>
      <motion.aside
        className="sticky top-0 z-50 hidden h-screen overflow-visible lg:block"
        animate={{ width: collapsed ? collapsedWidth : expandedWidth }}
        initial={false}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
      >
        <SidebarContent
          collapsed={collapsed}
          isMobile={false}
          setMobileOpen={setMobileOpen}
          setCollapsed={setCollapsed}
        />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-[86vw] max-w-sm lg:hidden"
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
            >
              <SidebarContent
                collapsed={false}
                isMobile={true}
                setMobileOpen={setMobileOpen}
                setCollapsed={setCollapsed}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
