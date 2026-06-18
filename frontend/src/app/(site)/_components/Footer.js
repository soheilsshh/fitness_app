"use client";

import Link from "next/link";
import { FiInstagram, FiSend, FiMail } from "react-icons/fi";

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
  { Icon: FiMail, label: "Email" },
  { Icon: FiSend, label: "Telegram" },
  { Icon: FiInstagram, label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/10 bg-surface-container-lowest px-6 py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 text-right md:grid-cols-3">
        <div className="space-y-6">
          <span className="block text-3xl font-bold text-surface-tint">FitPro</span>
          <p className="text-on-surface-variant">
            آکادمی فیت‌پرو، پیشرو در ارائه راهکارهای نوین بدنسازی و تناسب اندام بر
            پایه علم و هنر آناتومی.
          </p>
          <div className="flex items-center justify-end gap-4 pt-4">
            {SOCIALS.map(({ Icon, label }) => (
              <Link
                key={label}
                href="#"
                aria-label={label}
                className="glass flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/25 text-on-surface-variant transition-all hover:border-surface-tint hover:text-surface-tint"
              >
                <Icon className="text-sm" />
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h5 className="text-2xl font-semibold text-landing-heading">دسترسی سریع</h5>
          <ul className="space-y-4">
            {QUICK_LINKS.map((x) => (
              <li key={x.id}>
                <Link
                  href={`/#${x.id}`}
                  className="text-on-surface-variant transition-colors hover:text-surface-tint"
                >
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h5 className="text-2xl font-semibold text-landing-heading">حقوقی</h5>
          <ul className="space-y-4">
            {LEGAL_LINKS.map((x) => (
              <li key={x.label}>
                <Link
                  href={x.href}
                  className="text-on-surface-variant transition-colors hover:text-surface-tint"
                >
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-7xl border-t border-outline-variant/5 pt-20 text-center">
        <p className="text-sm text-on-surface-variant/80">
          © {new Date().getFullYear()} فیت‌پرو. تمامی حقوق برای آکادمی مجسمه‌سازی بدن محفوظ است.
        </p>
      </div>
    </footer>
  );
}
