"use client";

import Link from "next/link";
import { FaDumbbell } from "react-icons/fa";
import { FiInstagram, FiTwitter, FiLinkedin } from "react-icons/fi";

const SECTION_LINKS = [
  { id: "programs", label: "برنامه‌ها" },
  { id: "records", label: "سوابق" },
  { id: "about", label: "درباره ما" },
  { id: "contact", label: "تماس با ما" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 ring-1 ring-white/10">
                <FaDumbbell className="text-emerald-300" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-white">FitPro</div>
                <div className="text-[11px] text-zinc-400">Fitness Programs</div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-zinc-300">
              برنامه‌های تمرینی و تغذیه‌ای برای تناسب اندام، با طراحی مدرن و قابل پیگیری.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-sm font-extrabold text-white">لینک‌ها</div>
              <div className="mt-3 space-y-2 text-zinc-300">
                {SECTION_LINKS.map((x) => (
                  <Link
                    key={x.id}
                    href={`/#${x.id}`}
                    className="block hover:text-white"
                  >
                    {x.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-extrabold text-white">پشتیبانی</div>
              <div className="mt-3 space-y-2 text-zinc-300">
                <Link className="block hover:text-white" href="#">
                  سوالات متداول
                </Link>
                <Link className="block hover:text-white" href="#">
                  قوانین و مقررات
                </Link>
                <Link className="block hover:text-white" href="#">
                  حریم خصوصی
                </Link>
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <div className="text-sm font-extrabold text-white">شبکه‌های اجتماعی</div>

            <div className="mt-3 flex items-center gap-2">
              {[
                { Icon: FiInstagram, label: "Instagram" },
                { Icon: FiTwitter, label: "Twitter" },
                { Icon: FiLinkedin, label: "LinkedIn" },
              ].map(({ Icon, label }) => (
                <Link
                  key={label}
                  href="#"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
                  aria-label={label}
                >
                  <Icon className="text-xl" />
                </Link>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              ساعت پاسخ‌گویی: ۹ تا ۱۸
              <div className="mt-1 text-xs text-zinc-400">شنبه تا پنجشنبه</div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-center text-xs text-zinc-500 md:flex-row md:items-center md:justify-between md:text-right">
          <div>© {new Date().getFullYear()} FitPro. All rights reserved.</div>
          <div>ساخته‌شده با ❤ برای مسیر تناسب اندام</div>
        </div>
      </div>
    </footer>
  );
}
