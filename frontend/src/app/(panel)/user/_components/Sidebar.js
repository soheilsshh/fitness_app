"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiX,
  FiClipboard,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import { FaDumbbell } from "react-icons/fa";
import NavItem from "./NavItem";

const NAV = [
  { href: "/user/my-programs", label: "برنامه‌های من", icon: FiClipboard },
  { href: "/user/orders", label: "سفارش‌های من", icon: FiShoppingBag },
  { href: "/user/profile", label: "پروفایل", icon: FiUser },
];

function SidebarContent({
  collapsed,
  isMobile,
  setMobileOpen,
  setCollapsed,
}) {
  return (
    <div className="relative flex h-full flex-col border-l border-white/10 bg-zinc-950">
      {/* Edge toggle button (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:inline-flex absolute -left-5 top-4.5 z-[60] items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/90 p-2 text-zinc-100 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.9)] hover:bg-zinc-900"
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

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 ring-1 ring-white/10">
            <FaDumbbell className="text-emerald-300 text-[18px]" />
          </span>

          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-white">FitPro</div>
              <div className="text-[11px] text-zinc-400">User Panel</div>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
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

      {/* Status card */}
      <div className="px-3">
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 py-2">
          <div
            className={[
              "w-full px-2 text-[11px] text-zinc-400",
              collapsed ? "text-center" : "",
            ].join(" ")}
          >
            وضعیت
          </div>

          {!collapsed ? (
            <div className="mt-1 px-3 text-sm font-bold text-white">عضویت فعال</div>
          ) : (
            <div className="mt-2 flex justify-center">
              <div className="mx-2 h-2 w-12 rounded-full bg-emerald-400/70" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          {NAV.map((item) => (
            <NavItem
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

      {/* Logout pinned to bottom */}
      <div className="px-3 pb-4">
        <button
          onClick={() => {
            // TODO: clear auth state + redirect
            alert("Logout (demo)");
          }}
          className={[
            "flex w-full items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-zinc-100 hover:bg-white/10",
            collapsed ? "justify-center px-1 py-1 " : "gap-3 px-2 py-2 ",
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

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const expandedWidth = 288; // w-72
  const collapsedWidth = 80; // w-20

  return (
    <>
      {/* Desktop: animated width + high z-index */}
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

      {/* Mobile drawer */}
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
