
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, BookOpen, Award, MessageSquare, ShoppingCart } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: <Play className="w-8 h-8 text-primary" />,
      title: "دیدن ویدیوهای آموزشی رایگان",
      description: "محتوای عملی و کاربردی برای شروع سریع"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-[#58cac0]" />,
      title: "تمرین و تکمیل مراحل",
      description: "اجرای پروژه‌های عملی و یادگیری در عمل"
    },
    {
      icon: <Award className="w-8 h-8 text-green-400" />,
      title: "شرکت در آزمون ارزیابی جدی بودن",
      description: "تست مهارت‌ها و آمادگی برای مرحله بعد"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-yellow-400" />,
      title: "دیدن پیام تبریک و معرفی هوش مصنوعی فیتینو",
      description: "دسترسی به ابزارهای پیشرفته‌تر"
    },
    {
      icon: <ShoppingCart className="w-8 h-8 text-[#26fce3]" />,
      title: "پیشنهاد خرید محدود + پشتیبانی اختصاصی",
      description: "فرصت ویژه برای ورود به سیستم کامل"
    }
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            مسیر تو توی این قیف فروش
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            هر قدم طوری طراحی شده که تو رو به سمت موفقیت هدایت کنه
          </p>
          <div className="section-rule mt-6"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative mb-8 animate-slide-in-right" style={{ animationDelay: `${index * 0.2}s` }}>
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute right-8 top-20 w-0.5 h-16 bg-gradient-to-b from-primary to-transparent opacity-30 z-0"></div>
              )}
              
              <Card className="card-hover bg-card/50 backdrop-blur-sm border-primary/20 relative">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        {step.icon}
                      </div>
                      <div className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
