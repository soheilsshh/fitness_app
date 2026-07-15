"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiMenu, FiLogOut } from "react-icons/fi";
import MobileDrawer from "./MobileDrawer";
import CartButton from "./CartButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuthSession, logout } from "@/lib/auth/session";
import { getDashboardPath } from "@/lib/auth/roles";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/axios/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "programs", label: "برنامه‌ها", type: "section" },
  { id: "about", label: "درباره ما", type: "section" },
  { id: "records", label: "سوابق", type: "section" },
  { href: "/coaches", label: "مربی‌ها", type: "link" },
  { id: "contact", label: "تماس با ما", type: "section" },
];

const iconBtn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState(null);
  const [showCoachesSection, setShowCoachesSection] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const refresh = () => setSession(getAuthSession());
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/site-settings")
      .then((res) => {
        if (!cancelled) {
          setShowCoachesSection(Boolean(res.data?.showCoachesSection));
        }
      })
      .catch(() => {
        if (!cancelled) setShowCoachesSection(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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

  const panelHref = session?.role
    ? getDashboardPath(session.role)
    : "/user/my-programs";
  const displayName = session?.name || "حساب من";
  const isAuthed = Boolean(session?.token);
  const navItems = showCoachesSection
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.id !== "programs");

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-100 transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-b border-border/70 bg-background/85 shadow-sm backdrop-blur-xl dark:bg-background/80"
            : "border-b border-transparent bg-background/55 backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10" />
            <span className="font-iranianSansBlack text-xl tracking-tight text-foreground sm:text-2xl">
              فیتینو
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="ms-2 hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
            aria-label="منوی اصلی"
          >
            {navItems.map((item) => {
              const active =
                item.type === "link" && item.href === pathname;
              const className = cn(
                "rounded-full px-3.5 py-2 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary/10 font-iranianSansDemiBold text-primary"
                  : "font-iranianSansMedium text-muted-foreground hover:bg-muted hover:text-foreground"
              );

              if (item.type === "link") {
                return (
                  <Link key={item.href} href={item.href} className={className}>
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSection(item.id)}
                  className={className}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <ThemeToggle buttonClassName="h-11 w-11 rounded-full border-0 bg-transparent shadow-none hover:bg-muted" />

            <CartButton />

            {isAuthed ? (
              <div className="hidden items-center gap-1 lg:flex">
                <Link
                  href={panelHref}
                  className={cn(
                    "ms-1 inline-flex max-w-[10rem] items-center gap-2 rounded-full bg-muted/80 px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-muted",
                    "font-iranianSansMedium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <span className="truncate">{displayName}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className={iconBtn}
                  aria-label="خروج"
                  title="خروج"
                >
                  <FiLogOut className="text-lg" />
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  href="/auth"
                  className="rounded-full px-3.5 py-2 text-sm font-iranianSansMedium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  ورود / ثبت‌نام
                </Link>
                <Link
                  href="/auth/register/coach"
                  className="gradient-bg ms-0.5 rounded-full px-4 py-2.5 text-sm font-iranianSansBlack text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  مربی شو
                </Link>
              </div>
            )}

            <button
              type="button"
              className={cn(iconBtn, "lg:hidden")}
              onClick={() => setDrawerOpen(true)}
              aria-label="باز کردن منو"
              aria-expanded={drawerOpen}
              aria-controls="site-mobile-drawer"
            >
              <FiMenu className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      <div className="h-16 sm:h-[4.25rem]" aria-hidden />

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={navItems}
        pathname={pathname}
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
