"use client";

import Link from "next/link";
import { FaDumbbell } from "react-icons/fa";
import Footer from "../../_components/Footer";

export default function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              بازگشت به سایت
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-border">
                <FaDumbbell className="text-primary" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold">FitPro</div>
                <div className="text-[11px] text-muted-foreground">Auth</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border bg-card p-6 text-card-foreground shadow-lg">
            {children}
          </div>

          <div className="mt-4 text-center text-[11px] text-muted-foreground">
            ورود امن • OTP • مدیریت حساب
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
