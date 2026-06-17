"use client";

import { motion } from "framer-motion";
import { FiTarget, FiCpu, FiShield } from "react-icons/fi";

const VALUES = [
  {
    icon: FiTarget,
    color: "text-surface-tint",
    title: "هدف‌محور",
    desc: "هر برنامه با یک هدف شفاف و قابل اندازه‌گیری شروع می‌شود.",
  },
  {
    icon: FiCpu,
    color: "text-secondary-container",
    title: "واقع‌بینانه",
    desc: "ما به دنبال معجزه نیستیم، بلکه روی تلاش مستمر و علمی حساب می‌کنیم.",
  },
  {
    icon: FiShield,
    color: "text-surface-tint",
    title: "قابل اعتماد",
    desc: "تمام برنامه‌ها زیر نظر متخصصین تایید شده طراحی می‌شوند.",
  },
];

export default function AboutSection({ steps }) {
  const stepItems = steps?.length ? steps : null;

  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-24 overflow-hidden px-6 py-12 md:py-16">
      <div className="flex flex-col items-center gap-12 md:flex-row-reverse">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-8"
        >
          <h2 className="text-right text-4xl font-extrabold text-primary md:text-5xl">
            چرا <span className="gradient-text">FitPro؟</span>
          </h2>

          <div className="space-y-6">
            {VALUES.map((v, idx) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.55, delay: idx * 0.05 }}
                  className="group flex flex-row-reverse items-center gap-6"
                >
                  <div className="glow-card flex h-16 w-16 items-center justify-center rounded-2xl transition-all group-hover:scale-110">
                    <Icon className={`text-3xl ${v.color}`} />
                  </div>
                  <div className="text-right">
                    <h6 className="text-2xl font-semibold text-primary">{v.title}</h6>
                    <p className="text-on-surface-variant">{v.desc}</p>
                  </div>
                </motion.div>
              );
            })}

            {stepItems?.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: (VALUES.length + idx) * 0.05 }}
                className="glass rounded-2xl border border-white/5 p-5 text-right"
              >
                <div className="font-bold text-primary">{s.title}</div>
                <div className="mt-1 text-on-surface-variant">{s.text}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
