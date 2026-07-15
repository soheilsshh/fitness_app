"use client";

import Link from "next/link";
import Footer from "../../_components/Footer";
import { Logo } from "@/components/Logo";

export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface touch-manipulation">
      <div className="relative flex flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-[40%] right-[-120px] h-[280px] w-[280px] rounded-full bg-secondary-container/12 blur-3xl" />
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:py-10">
          <header className="mx-auto mb-6 flex w-full max-w-md flex-col items-center sm:mb-8">
            <Link
              href="/"
              className="flex flex-col items-center gap-3 rounded-2xl outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="فیتینو — صفحه اصلی"
            >
              <Logo className="h-14 w-14 object-contain" />
              <div className="text-center leading-tight">
                <div className="font-iranianSansBlack text-2xl tracking-tight text-on-surface">
                  فیتینو
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  مسیر تناسب اندام شما
                </p>
              </div>
            </Link>
          </header>

          <main className="mx-auto w-full max-w-md flex-1 pb-8">{children}</main>
        </div>
      </div>

      <div className="relative z-10 bg-surface">
        <Footer />
      </div>
    </div>
  );
}
