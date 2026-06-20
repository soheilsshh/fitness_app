"use client";

import Link from "next/link";
import { FaDumbbell } from "react-icons/fa";
import Footer from "../../_components/Footer";

export default function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen bg-surface text-on-surface">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-surface-tint/10 blur-3xl" />
        <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-secondary-container/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-on-surface-variant transition hover:text-on-surface"
            >
              بازگشت به سایت
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-surface-tint/25 to-secondary-container/15 ring-1 ring-outline-variant/30">
                <FaDumbbell className="text-surface-tint" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold">Fitino</div>
                <div className="text-[11px] text-on-surface-variant">Auth</div>
              </div>
            </div>
          </div>

          <div className="site-panel rounded-[28px] p-6 shadow-lg">
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
