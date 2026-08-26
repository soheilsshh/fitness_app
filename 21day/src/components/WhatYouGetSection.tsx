import React from 'react';
import { ScanLine, Dumbbell, Apple, LineChart, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const WhatYouGetSection = () => {
  const benefits = [
    {
      icon: <ScanLine className="h-7 w-7 text-primary" />,
      title: "آنالیز حرفه‌ای بدن",
      text: "وضعیت فعلی بدنت رو دقیق بررسی می‌کنیم تا بدونی از کجا باید شروع کنی و به کجا برسی",
      span: "big" as const,
    },
    {
      icon: <Dumbbell className="h-6 w-6 text-[#58cac0]" />,
      title: "برنامه تمرینی شخصی",
      text: "برنامه‌ای مخصوص خودت، شخصی‌سازی‌شده و تاییدشده توسط مربی",
      span: "wide" as const,
    },
    {
      icon: <Apple className="h-6 w-6 text-[#26fce3]" />,
      title: "راهنمای تغذیه",
      text: "تغذیه هماهنگ با هدفت تا تمرین‌ها نتیجه‌ی واقعی بده",
      span: "small" as const,
    },
    {
      icon: <LineChart className="h-6 w-6 text-yellow-400" />,
      title: "پیگیری پیشرفت",
      text: "هفتگی و ماهانه نتایجت رو پله‌به‌پله تا بدن ایده‌آل می‌بینی",
      span: "small" as const,
    },
  ];

  return (
    <section id="what-you-get" className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-start"
        >
          <h2 className="text-3xl font-bold md:text-5xl">
            توی این ۲۱ روز قراره چه اتفاقی بیفته؟
          </h2>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            یک مسیر مهندسی شده برای رسیدن به بدت ایده‌آل‌ات
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="mx-auto grid max-w-5xl auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2"
        >
          {benefits.map((benefit, index) => {
            const spanClass =
              benefit.span === "big"
                ? "md:col-span-2 md:row-span-2"
                : benefit.span === "wide"
                ? "md:col-span-2"
                : "md:col-span-1";
            return (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5 }}
                className={`bento-tile flex flex-col justify-between p-6 md:p-7 ${spanClass}`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#187272]/25">
                  {benefit.icon}
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-foreground md:text-xl">{benefit.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{benefit.text}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex justify-center"
        >
          <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium">بیش از ۱۰۰۰ نفر در این مسیر موفق شدن</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatYouGetSection;
