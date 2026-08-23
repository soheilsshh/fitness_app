import React from 'react';
import { Brain, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const AboutAISection = () => {
  const steps = [
    {
      icon: <Brain className="h-6 w-6 text-primary" />,
      title: "دریافت برنامه تمرینی",
      text: "برنامه‌ای شخصی‌سازی و تایید شده توسط مربی",
    },
    {
      icon: <Zap className="h-6 w-6 text-[#26fce3]" />,
      title: "شروع تمرین",
      text: "توی تمام این مسیر ما کنارتیم، تا بهترین نتایج رو کسب کنی",
    },
    {
      icon: <Target className="h-6 w-6 text-[#58cac0]" />,
      title: "نتیجه مطمئن",
      text: "به صورت هفتگی و ماهانه نتایجت رو پله به پله تا رسیدن به بدن ایده‌آلت می‌بینی",
    },
  ];

  return (
    <section id="about" className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-start"
          >
            <h2 className="text-3xl font-bold md:text-5xl">
              این فقط یه دوره رایگان نیست،
              <br />
              <span className="gradient-text">این شروع یه تمرین منظمه</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              فیتینو طراحی شده تا بتونی بدنتو به صورت کاملاً حرفه‌ای آنالیز کنی. این سیستم قراره بهت
              کمک کنه تا نتیجه واقعی تلاشت رو ببینی.
            </p>
          </motion.div>

          <div className="relative mt-16 grid gap-6 md:grid-cols-3">
            <div
              aria-hidden
              className="absolute top-8 hidden h-px w-full bg-gradient-to-l from-transparent via-white/15 to-transparent md:block"
            />
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#0e0e0e]">
                  {step.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 divide-x divide-x-reverse divide-white/8 rounded-3xl border border-white/8 bg-white/[0.02] py-6"
          >
            {[
              { value: "1000+", label: "شرکت‌کننده" },
              { value: "21 روز", label: "زمان دوره" },
              { value: "۰ تومان", label: "هزینه ورود" },
            ].map((stat) => (
              <div key={stat.label} className="px-2 text-center">
                <div className="gradient-text text-2xl font-extrabold md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutAISection;
