"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiMenu, FiUser, FiLogOut } from "react-icons/fi";
import { FaDumbbell } from "react-icons/fa";
import MobileDrawer from "./MobileDrawer";
import CartButton from "./CartButton";
import { getAuthSession, logout } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";

const NAV_ITEMS = [
  { id: "programs", label: "برنامه‌ها", type: "section" },
  { id: "about", label: "درباره ما", type: "section" },
  { id: "records", label: "سوابق", type: "section" },
  { href: "/coaches", label: "مربی‌ها", type: "link" },
  { id: "contact", label: "تماس با ما", type: "section" },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const refresh = () => setSession(getAuthSession());
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToSection = (id) => {
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onNavClick = (item) => {
    if (item.type === "link" && item.href) {
      router.push(item.href);
      return;
    }
    goToSection(item.id);
  };

  const panelHref = session?.role ? getDashboardPath(session.role) : "/user/my-programs";
  const displayName = session?.name || "حساب من";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] px-3 pt-3 sm:px-4 sm:pt-4">
        <div
          className={[
            "mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[22px] border px-3 py-2.5 sm:px-4 sm:py-3",
            "border-white/15 bg-white/[0.07] backdrop-blur-2xl backdrop-saturate-150",
            "shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)]",
            "transition-all duration-300",
            scrolled
              ? "bg-zinc-950/55 ring-1 ring-white/10"
              : "bg-zinc-950/35",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-100 hover:bg-white/10 md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="باز کردن منو"
            >
              <FiMenu className="text-xl" />
            </button>

            <Link href="/" className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/25 to-cyan-400/15 ring-1 ring-white/15">
                <FaDumbbell className="text-emerald-300" />
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-extrabold text-white">FitPro</div>
                <div className="text-[11px] text-zinc-400">Fitness Programs</div>
              </div>
            </Link>

            <nav className="hidden md:flex md:items-center md:gap-0.5">
              {NAV_ITEMS.map((item) =>
                item.type === "link" ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/8 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToSection(item.id)}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/8 hover:text-white"
                  >
                    {item.label}
                  </button>
                )
              )}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CartButton />

            {session?.token ? (
              <div className="hidden items-center gap-1.5 md:flex">
                <Link
                  href={panelHref}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/8"
                >
                  {displayName}
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  <FiLogOut />
                  خروج
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-1.5 md:flex">
                <Link
                  href="/auth/login"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/8"
                >
                  ورود
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
                >
                  ثبت‌نام
                </Link>
                <Link
                  href="/auth/register/coach"
                  className="rounded-xl bg-gradient-to-l from-emerald-400 to-cyan-400 px-3 py-2 text-sm font-extrabold text-zinc-950 transition hover:opacity-90"
                >
                  مربی شو
                </Link>
              </div>
            )}

            <Link
              href={session?.token ? panelHref : "/auth/login"}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-100 transition hover:bg-white/10 md:hidden"
              aria-label="ورود یا پنل"
            >
              <FiUser className="text-xl" />
            </Link>
          </div>
        </div>
      </header>

      <div className="h-[76px] sm:h-[84px]" aria-hidden />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={NAV_ITEMS}
        onItemClick={(item) => {
          setDrawerOpen(false);
          setTimeout(() => onNavClick(item), 60);
        }}
        session={session}
        panelHref={panelHref}
        onLogout={() => logout()}
      />
    </>
  );
}
