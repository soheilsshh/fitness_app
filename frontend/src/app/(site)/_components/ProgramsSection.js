"use client";

import { motion } from "framer-motion";
import { FiCheck, FiArrowDownRight } from "react-icons/fi";
import { useAppDispatch } from "@/store/hooks";
import { addToCart } from "@/store/slices/cartSlice";

const PLANS = [
  {
    id: "cut-4w",
    title: "چربی‌سوزی ۴ هفته‌ای",
    subtitle: "شروع سریع، نتیجه محسوس",
    desc: "برای کاهش وزن و فرم‌دهی، با شدت قابل تنظیم و تمرکز روی HIIT.",
    price: 349000,
    oldPrice: 499000,
    features: ["۴ هفته تمرین روزانه", "برنامه تغذیه پایه", "ویدئوهای آموزشی", "پشتیبانی چت"],
    highlighted: true,
  },
  {
    id: "muscle-8w",
    title: "عضله‌سازی ۸ هفته‌ای",
    subtitle: "پیشرفته و هدفمند",
    desc: "مناسب افزایش حجم و قدرت، با برنامه تمرینی تقسیم‌شده و اصولی.",
    price: 699000,
    oldPrice: null,
    features: ["۸ هفته تمرین تخصصی", "پروتکل افزایش قدرت", "تقسیم‌بندی حرفه‌ای", "گزارش پیشرفت"],
  },
  {
    id: "fit-12w",
    title: "تناسب اندام ۱۲ هفته‌ای",
    subtitle: "کامل‌ترین پلن",
    desc: "ترکیب چربی‌سوزی + عضله‌سازی با مسیر مرحله‌ای و پایدار.",
    price: 1199000,
    oldPrice: 1499000,
    features: ["۱۲ هفته پلن مرحله‌ای", "تغذیه کامل‌تر", "پیگیری پیشرفت", "آپدیت‌های دوره‌ای"],
  },
];

function formatToman(n) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

function discountPercent(oldPrice, price) {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export default function ProgramsSection() {
  const dispatch = useAppDispatch();

  return (
    <section id="programs" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
              پلن‌های آماده خرید
              <span className="h-1 w-1 rounded-full bg-white/30" />
              حرفه‌ای و قابل پیگیری
            </div>
            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
              برنامه‌ها <span className="text-emerald-300">برای هر هدف</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              پلن‌ها با تمرکز روی نتیجه، طراحی شده‌اند: مسیر واضح، تمرین اصولی، و قابلیت اندازه‌گیری پیشرفت.
            </p>
          </div>

          <a
            href="#contact"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
          >
            مشاوره برای انتخاب پلن <FiArrowDownRight />
          </a>
        </div>

        {/* Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, idx) => {
            const off = discountPercent(plan.oldPrice, plan.price);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.06 }}
                className={[
                  "relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-white/5",
                  "shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]",
                  plan.highlighted ? "ring-1 ring-emerald-400/30" : "",
                ].join(" ")}
              >
                <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

                <div className="flex h-full flex-col p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-zinc-300">{plan.subtitle}</div>
                      <div className="mt-1 text-lg font-extrabold text-white">{plan.title}</div>
                    </div>

                    {off ? (
                      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
                        %{off} تخفیف
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
                        محبوب
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-7 text-zinc-300">{plan.desc}</p>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950/35 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-xs text-zinc-400">قیمت</div>
                        <div className="mt-1 text-xl font-extrabold text-white">{formatToman(plan.price)}</div>
                      </div>

                      {plan.oldPrice ? (
                        <div className="text-left">
                          <div className="text-xs text-zinc-400">قبل</div>
                          <div className="mt-1 text-sm text-zinc-400 line-through">
                            {formatToman(plan.oldPrice)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-400">بدون تخفیف</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-semibold text-zinc-200">ویژگی‌ها</div>
                    <ul className="mt-3 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-zinc-200">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <FiCheck className="text-emerald-300" />
                          </span>
                          <span className="text-xs md:text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1" />

                  <button
                    onClick={() =>
                      dispatch(
                        addToCart({
                          id: plan.id,
                          title: plan.title,
                          price: plan.price,
                        })
                      )
                    }
                    className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
                  >
                    افزودن به سبد خرید
                  </button>

                  <div className="mt-3 text-center text-[11px] text-zinc-400">
                    پرداخت امن • دسترسی فوری • پشتیبانی
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
          اگر مطمئن نیستی کدوم پلن مناسبته، از بخش{" "}
          <span className="text-emerald-200 font-semibold">تماس با ما</span>{" "}
          پیام بده تا راهنماییت کنیم.
        </div>
      </div>
    </section>
  );
}
