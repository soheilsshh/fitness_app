"use client";

import Image from "next/image";
import Link from "next/link";
import coachStatue from "@/assets/landing-page/coach_section_statue.png";

export default function ProgramsSection() {
  return (
    <section id="programs" className="relative scroll-mt-24 overflow-hidden pb-12 pt-6 md:pb-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface via-surface-tint/5 to-surface" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center space-y-6 text-center">
          <h2 className="text-4xl font-extrabold leading-tight text-primary md:text-6xl">
            با مربی <span className="gradient-text">خودت</span> شروع کن
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-8 text-on-surface-variant md:text-lg">
            فیت‌پرو پلتفرم چندمربی است. ما بهترین مربیان ایران را در یک‌جا جمع
            کرده‌ایم تا شما بر اساس سلیقه و نیاز خود، راهبر مسیرتان را انتخاب کنید.
          </p>

          <div className="glass mx-auto mt-4 max-w-xl rounded-[2rem] border border-surface-tint/20 p-6">
            <h3 className="text-center text-2xl font-semibold text-primary">استاندارد طلایی تناسب</h3>
            <p className="mt-1 text-center text-on-surface-variant">
              ترکیبی از آناتومی کلاسیک و متدهای مدرن بیومکانیک برای دستیابی به تقارن مطلق.
            </p>
          </div>
        </div>

        {/* Big CTA card with sculptor statue */}
        <div className="group relative">
          <div className="absolute -inset-4 rounded-full bg-surface-tint/10 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />
          <div className="glass relative grid overflow-hidden rounded-[2rem] border border-surface-tint/20 shadow-[0_0_30px_rgba(0,225,171,0.2)] md:grid-cols-2">
            {/* Statue side */}
            <div className="relative h-80 sm:h-96 md:h-auto md:min-h-[480px]">
              <Image
                src={coachStatue}
                alt="پیکرتراش در حال تراشیدن مجسمه"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover object-top"
              />
              {/* Smooth fade into the content panel.
                  Mobile: fade downward. Desktop: fade leftward toward the text. */}
              <div
                aria-hidden
                className="absolute inset-0 md:hidden"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(19,19,19,0.55) 78%, #131313 100%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 hidden md:block"
                style={{
                  background:
                    "linear-gradient(to left, transparent 0%, transparent 42%, rgba(19,19,19,0.65) 80%, #131313 100%)",
                }}
              />
            </div>

            {/* Content side */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-8 text-center md:p-14">
              <h3 className="text-3xl font-extrabold text-primary md:text-4xl">آماده تغییر هستی؟</h3>
              <p className="max-w-md text-base leading-8 text-on-surface-variant md:text-lg">
                همین حالا برنامه اختصاصی خود را از مربی مورد علاقه‌تان دریافت کنید.
              </p>
              <Link
                href="/coaches"
                className="rounded-full bg-surface-tint px-12 py-5 text-xl font-bold text-on-primary shadow-2xl transition-transform hover:scale-105"
              >
                انتخاب مربی و شروع
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
