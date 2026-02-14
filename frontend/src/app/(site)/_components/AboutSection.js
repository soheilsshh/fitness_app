"use client";

import { motion } from "framer-motion";
import { FiShield, FiTarget, FiHeart } from "react-icons/fi";

const VALUES = [
  { icon: FiTarget, title: "هدف‌محور", desc: "پلن‌ها بر اساس هدف، سطح و سبک زندگی طراحی می‌شن." },
  { icon: FiHeart, title: "واقع‌بینانه", desc: "نه سختِ غیرقابل انجام، نه ساده و بی‌اثر؛ تعادل حرفه‌ای." },
  { icon: FiShield, title: "قابل اعتماد", desc: "روش‌های اصولی، برنامه‌ریزی مرحله‌ای و پیگیری." },
];

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">
              درباره ما
              <span className="h-1 w-1 rounded-full bg-white/30" />
              تیم فیتنس و تناسب اندام
            </div>

            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
              چرا <span className="text-emerald-300">FitPro</span>؟
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-300 md:text-base">
              ما برنامه‌های تمرینی و تغذیه‌ای رو با تمرکز روی نتیجه‌ی واقعی طراحی می‌کنیم.
              مسیرت باید قابل اجرا، قابل پیگیری و قابل اندازه‌گیری باشه.
            </p>

            <div className="mt-6 space-y-3">
              {VALUES.map((v, idx) => {
                const Icon = v.icon;
                return (
                  <motion.div
                    key={v.title}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.55, delay: idx * 0.05 }}
                    className="flex gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/40">
                      <Icon className="text-emerald-300 text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-white">{v.title}</div>
                      <div className="mt-1 text-sm leading-6 text-zinc-300">{v.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Visual / card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6">
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="text-sm text-zinc-300">وعده‌ی ما</div>
              <div className="mt-2 text-2xl font-extrabold text-white">
                برنامه‌ای که «واقعاً» انجام می‌دی
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                تمرین‌ها واضح، زمان‌بندی‌شده و بر اساس سطح شماست. از شروع تا نتیجه، کنار شما هستیم.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/35 p-4">
                  <div className="text-xs text-zinc-400">میانگین زمان تمرین</div>
                  <div className="mt-1 text-xl font-extrabold text-white">۳۰–۴۵ دقیقه</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-zinc-950/35 p-4">
                  <div className="text-xs text-zinc-400">سطح پلن‌ها</div>
                  <div className="mt-1 text-xl font-extrabold text-white">از مبتدی تا حرفه‌ای</div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/35 p-4 text-sm text-zinc-300">
                شروع کن، ۷ روز اول بیشترین تغییر «حس» میشه.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
