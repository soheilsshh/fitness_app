
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Shield, Users } from 'lucide-react';

const FinalCTASection = () => {
  const handleRegistration = () => {
    // Simulate registration process
    console.log('Registration initiated');
    // In a real app, this would redirect to a registration form or process
    window.location.href = '/register/thank-you';
  };

  return (
    <section id="final-cta" className="py-20 relative">
      <div className="absolute inset-0 hero-gradient opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-4xl mx-auto glow-card rounded-3xl border-0 bg-transparent animate-fade-in">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              وقتشه وارد مسیر واقعی
              <br />
              <span className="gradient-text">
                درآمد دلاری بشی
              </span>
            </h2>

            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
              هزاران نفر قبل از تو این مسیر رو رفتن و موفق شدن. 
              حالا نوبت توئه که تجربه‌ی کسب درآمد با AI رو داشته باشی.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">۱۰۰٪ ریسک‌فری</h3>
                <p className="text-muted-foreground text-sm">کاملاً رایگان و بدون تعهد</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">پشتیبانی کامل</h3>
                <p className="text-muted-foreground text-sm">در تمام مراحل کنارت هستیم</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#2a9c96]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8 text-[#26fce3]" />
                </div>
                <h3 className="font-semibold mb-2">شروع سریع</h3>
                <p className="text-muted-foreground text-sm">همین امروز شروع کن</p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="btn-cta mx-auto max-w-md hover:bg-transparent"
              variant="ghost"
              onClick={handleRegistration}
            >
              <Rocket className="w-6 h-6 ml-3" />
              شروع رایگان پروژه ۳ روزه
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              ثبت‌نام رایگان • بدون نیاز به کارت اعتباری • شروع فوری
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FinalCTASection;
