"use client";

import { motion } from "framer-motion";
import { Cpu, Shield, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const VALUES = [
  {
    icon: Target,
    iconClass: "text-primary",
    title: "هدف‌محور",
    desc: "هر برنامه با یک هدف شفاف و قابل اندازه‌گیری شروع می‌شود.",
  },
  {
    icon: Cpu,
    iconClass: "text-chart-2",
    title: "واقع‌بینانه",
    desc: "ما به دنبال معجزه نیستیم، بلکه روی تلاش مستمر و علمی حساب می‌کنیم.",
  },
  {
    icon: Shield,
    iconClass: "text-primary",
    title: "قابل اعتماد",
    desc: "تمام برنامه‌ها زیر نظر متخصصین تایید شده طراحی می‌شوند.",
  },
];

export default function AboutSection({ steps }) {
  const stepItems = steps?.length ? steps : null;

  return (
    <section id="about" dir="rtl" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12 md:py-16">
      <div className="flex flex-col items-center gap-12 md:flex-row-reverse">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-8"
        >
          <h2 className="text-start text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            چرا{" "}
            <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              FitPro؟
            </span>
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
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50 transition-transform group-hover:scale-105">
                    <Icon className={cn("size-8", v.iconClass)} />
                  </div>
                  <div className="text-start">
                    <h3 className="text-2xl font-semibold text-foreground">{v.title}</h3>
                    <p className="text-muted-foreground">{v.desc}</p>
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
              >
                <Card className="bg-card/60 backdrop-blur-sm">
                  <CardContent className="pt-6 text-start">
                    <div className="font-bold text-foreground">{s.title}</div>
                    <div className="mt-1 text-muted-foreground">{s.text}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
