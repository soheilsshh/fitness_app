"use client";

import Link from "next/link";
import { FiInstagram, FiSend, FiMail } from "react-icons/fi";
import Enamad from "@/components/enamad";
import { Logo } from "@/components/Logo";

const QUICK_LINKS = [
  { id: "home", label: "صفحه اصلی" },
  { id: "programs", label: "برنامه‌ها" },
  { id: "about", label: "داستان ما" },
];

const LEGAL_LINKS = [
  { href: "#", label: "حریم خصوصی" },
  { href: "#", label: "شرایط استفاده" },
  { href: "#contact", label: "تماس با ما" },
];

const SOCIALS = [
  { Icon: FiMail, label: "ایمیل" },
  { Icon: FiSend, label: "تلگرام" },
  { Icon: FiInstagram, label: "اینستاگرام" },
];

export default function Footer() {
  return (
    <footer dir="rtl" className="border-t border-border/80 bg-muted/20 touch-manipulation">
      {/* ── Mobile ── */}
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-10 text-center md:hidden">
        <Link
          href="/"
          className="inline-flex flex-col items-center gap-2.5 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo className="h-12 w-12 object-contain" />
          <span className="font-iranianSansBlack text-2xl tracking-tight text-foreground">
            فیتینو
          </span>
        </Link>

        <p className="mt-3 max-w-[16rem] text-sm leading-7 text-muted-foreground">
          مربیگری علمی، تمرین و تغذیه — مسیر فرم ایده‌آل.
        </p>

        <div className="mt-6 flex items-center gap-3">
          {SOCIALS.map(({ Icon, label }) => (
            <Link
              key={label}
              href="#"
              aria-label={label}
              className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-5" />
            </Link>
          ))}
        </div>

        <nav
          aria-label="لینک‌های فوتر"
          className="mt-8 flex w-full flex-col gap-1"
        >
          {[...QUICK_LINKS.map((l) => ({ href: `/#${l.id}`, label: l.label })), ...LEGAL_LINKS].map(
            (link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex min-h-11 items-center justify-center text-sm text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="mt-8">
          <Enamad className="h-14 w-14" />
        </div>

        <div className="mt-8 w-full border-t border-border/50 pt-5">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} فیتینو
          </p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground/80">
            توسعه فناوری Q-Tech
          </p>
        </div>
      </div>

      {/* ── Desktop (unchanged structure) ── */}
      <div className="mx-auto hidden max-w-7xl gap-6 px-6 py-9 text-right md:grid md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Logo className="h-9 w-9 object-contain" />
            <span className="font-iranianSansBlack text-xl text-foreground">
              فیتینو
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-7 text-foreground/90">
            مربیگری علمی، تمرین و تغذیه در یک پلتفرم — مسیر رسیدن به فرم ایده‌آل.
          </p>
          <div className="flex items-center gap-2 pt-1">
            {SOCIALS.map(({ Icon, label }) => (
              <Link
                key={label}
                href="#"
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Icon className="size-3.5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-iranianSansDemiBold tracking-wide text-foreground/80">
            دسترسی سریع
          </h5>
          <ul className="space-y-2">
            {QUICK_LINKS.map((x) => (
              <li key={x.id}>
                <Link
                  href={`/#${x.id}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-iranianSansDemiBold tracking-wide text-foreground/80">
            حقوقی
          </h5>
          <div className="flex items-start gap-5">
            <ul className="space-y-2">
              {LEGAL_LINKS.map((x) => (
                <li key={x.label}>
                  <Link
                    href={x.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {x.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Enamad className="h-14 w-14" />
          </div>
        </div>
      </div>

      <div className="hidden border-t border-border/60 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} فیتینو
          </p>
          <p className="text-xs text-muted-foreground/90">
            تمامی حقوق برای شرکت توسعه فناوری Q-Tech محفوظ می‌باشد.
          </p>
        </div>
      </div>
    </footer>
  );
}
