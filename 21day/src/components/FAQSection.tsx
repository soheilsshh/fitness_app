import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const FAQSection = () => {
  const faqs = [
    {
      question: "آیا این برنامه واقعاً رایگانه؟",
      answer: "بله، این برنامه ۲۱ روزه کاملاً رایگان است. هیچ هزینه‌ای برای شرکت در آن نداری. فقط در انتها اگر بخوای به برنامه تمرینی و تغذیه و آنالیزها دسترسی داشته باشی، یک پیشنهاد جذاب دریافت می‌کنی."
    },
    {
      question: "برای شروع نیاز به تجربه ورزشی دارم؟",
      answer: "خیر. برنامه فیتینو از سطح مبتدی تا حرفه‌ای تنظیم می‌شه. فقط کافیه ثبت‌نام کنی و اطلاعات بدنت رو وارد کنی تا مسیر مناسب خودت رو بگیری."
    },
    {
      question: "چقدر زمان باید بذارم؟",
      answer: "روزانه بین ۳۰ دقیقه تا ۲:۳۰ کافیه. برنامه طوری طراحی شده که بتونی کنار کار و زندگی روزمره‌ت پیش بری و همچنان پیشرفت کنی."
    },
    {
      question: "اگه کاملش کنم چه چیزی گیرم میاد؟",
      answer: "آنالیز وضعیت بدنی، برنامه تمرینی شخصی‌سازی‌شده، راهنمای تغذیه و پیگیری هفتگی/ماهانه تا بتونی نتیجه‌ی تلاشت رو قدم‌به‌قدم ببینی."
    },
    {
      question: "فیتینو چیه و چطور بهم کمک می‌کنه؟",
      answer: "فیتینو یه سیستم مربیگری هوشمند برای رسیدن به بدن ایده‌آله؛ بدنت رو آنالیز می‌کنه، برنامه‌ات رو تنظیم می‌کنه و در طول مسیر کنارت می‌مونه تا نتیجه واقعی بگیری."
    }
  ];

  return (
    <section id="faq" className="relative py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-start md:sticky md:top-28 md:self-start"
          >
            <h2 className="text-3xl font-bold md:text-4xl">سوالات پرتکرار</h2>
            <p className="mt-4 text-lg text-muted-foreground">احتمالاً جواب سوالت اینجا هست</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] px-5"
                >
                  <AccordionTrigger className="text-right text-base font-semibold transition-colors hover:text-primary hover:no-underline md:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
