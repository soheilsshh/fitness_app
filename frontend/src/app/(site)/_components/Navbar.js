"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiMenu, FiUser } from "react-icons/fi";
import { FaDumbbell } from "react-icons/fa";
import MobileDrawer from "./MobileDrawer";
import CartButton from "./CartButton";

const NAV_ITEMS = [
  { id: "programs", label: "برنامه‌ها" },
  { id: "about", label: "درباره ما" },
  { id: "contact", label: "تماس با ما" },
  { id: "records", label: "سوابق" },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 backdrop-blur",
          scrolled ? "bg-zinc-950/70" : "bg-zinc-950/40",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Right: menu + logo + nav */}
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-100 hover:bg-white/10 md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="باز کردن منو"
            >
              <FiMenu className="text-xl" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 ring-1 ring-white/10">
                <FaDumbbell className="text-emerald-300" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">FitPro</div>
                <div className="text-[11px] text-zinc-400">Fitness Programs</div>
              </div>
            </Link>

            <nav className="hidden md:flex md:items-center md:gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToSection(item.id)}
                  className="rounded-xl px-3 py-2 text-sm text-zinc-200 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Left: auth */}
          <div className="flex items-center gap-2">
            <CartButton />

            {/* Desktop */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/auth/login"
                className="rounded-xl px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
              >
                وارد شوید
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
              >
                ثبت نام کنید
              </Link>
            </div>

            {/* Mobile */}
            <Link
              href="/auth/login"
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-100 hover:bg-white/10"
              aria-label="ورود یا ثبت نام"
            >
              <FiUser className="text-xl" />
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer so content doesn't go under fixed navbar */}
      <div className="h-[64px]" />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={NAV_ITEMS}
        onItemClick={(id) => {
          setDrawerOpen(false);
          setTimeout(() => goToSection(id), 60);
        }}
      />
    </>
  );
}
