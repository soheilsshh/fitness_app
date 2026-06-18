"use client";

import Link from "next/link";
import { FaDumbbell } from "react-icons/fa";
import Navbar from "../../_components/Navbar";
import Footer from "../../_components/Footer";

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <Link href="/" className="text-sm text-zinc-300 hover:text-white">
              بازگشت به سایت
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 ring-1 ring-white/10">
                <FaDumbbell className="text-emerald-300" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold">FitPro</div>
                <div className="text-[11px] text-zinc-400">Auth</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)]">
            {children}
          </div>

          <div className="mt-4 text-center text-[11px] text-zinc-500">
            ورود امن • OTP • مدیریت حساب
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
