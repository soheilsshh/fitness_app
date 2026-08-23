import React, { useRef, useState } from 'react';
import { Star, Quote, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "علی رضایی",
      role: "کارمند اداری",
      content: "تو ۲۱ روز اول با برنامه فیتینو بالاخره فهمیدم چی باید تمرین کنم. آنالیز بدنم دقیق بود و نتیجه رو تو آینه دیدم.",
      rating: 5
    },
    {
      name: "مریم احمدی",
      role: "مادر دو فرزند",
      content: "قبلاً هی برنامه عوض می‌کردم و نتیجه نمی‌گرفتم. با فیتینو مسیر مشخص شد و هفتگی پیشرفت وزن و فرم بدنم رو می‌بینم.",
      rating: 5
    },
    {
      name: "حسین کریمی",
      role: "ورزشکار نیمه حرفه‌ای",
      content: "برنامه تمرینی و تغذیه شخصی‌سازی‌شده واقعاً فرق داشت. مربی تایید کرد و دیگه سردرگم نیستم.",
      rating: 5
    }
  ];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToCard = (index: number) => {
    const clamped = Math.max(0, Math.min(testimonials.length - 1, index));
    cardRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setActiveIndex(clamped);
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const containerCenter = el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2;
    let closest = 0;
    let closestDistance = Infinity;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });
    setActiveIndex(closest);
  };

  return (
    <section id="testimonials" className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div className="text-start">
            <h2 className="text-3xl font-bold md:text-5xl">تجربه‌ی بقیه شرکت‌کننده‌ها</h2>
            <p className="mt-3 text-lg text-muted-foreground md:text-xl">ببین چی درباره این برنامه می‌گن</p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goToCard(activeIndex - 1)}
              disabled={activeIndex <= 0}
              aria-label="قبلی"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goToCard(activeIndex + 1)}
              disabled={activeIndex >= testimonials.length - 1}
              aria-label="بعدی"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4"
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              ref={(el) => (cardRefs.current[index] = el)}
              data-card
              className="glow-card w-[85%] shrink-0 snap-center rounded-3xl p-7 sm:w-[380px]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary/30" />
              </div>

              <p className="mb-6 leading-relaxed text-muted-foreground">"{testimonial.content}"</p>

              <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#187272] to-[#26fce3] text-sm font-bold text-black">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {testimonials.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-6 bg-[#26fce3]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
