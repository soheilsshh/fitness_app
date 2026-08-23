import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Phone, User, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { apiService } from '@/lib/api';

const NEXT_STEPS = [
  'ثبت‌نام رایگان',
  'پیام خوش‌آمد و دسترسی',
  'شروع مسیر ۲۱ روزه',
];

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const totalCapacity = 100;
  const currentCapacity = 87;
  const spotsLeft = totalCapacity - currentCapacity;
  const capacityPercentage = (currentCapacity / totalCapacity) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let formattedPhone = formData.phone;
      if (formData.phone.startsWith('0')) {
        formattedPhone = '+98' + formData.phone.substring(1);
      } else if (!formData.phone.startsWith('+98')) {
        formattedPhone = '+98' + formData.phone;
      }

      const response = await apiService.registerUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formattedPhone,
      });

      localStorage.setItem('userPhone', formattedPhone);

      if (response.existing) {
        toast({
          title: "خوش برگشتی!",
          description: "اطلاعات شما از قبل ثبت شده است. به ادامه یادگیری بپردازید!",
        });
      } else {
        toast({
          title: "ثبت‌نام با موفقیت انجام شد!",
          description: "اطلاعات دسترسی به شماره شما ارسال شد",
        });
      }

      navigate('/register/thank-you');
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.";
      if (error.message?.includes('User already exists')) {
        errorMessage = "این شماره قبلاً ثبت شده است.";
      }

      toast({
        title: "خطا در ثبت‌نام",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="registration" className="relative py-14 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              شروع ساختن بدن ایده‌آل‌ات
              <br />
              <span className="gradient-text">به همراه فیتینو در ۲۱ روز</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              فقط تا پایان این مدت زمان داری
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="fitino-chip">کاملاً رایگان</span>
              <span className="fitino-chip">شروع در کمتر از ۲ دقیقه</span>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bento-tile mt-10 p-6 md:p-10"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">ظرفیت این دوره</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">
                  {spotsLeft}
                  <span className="ms-1.5 text-sm font-medium text-muted-foreground">
                    جای خالی از {totalCapacity}
                  </span>
                </p>
                {capacityPercentage > 80 && (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Flame className="h-3.5 w-3.5" />
                    در حال تکمیل شدن است!
                  </span>
                )}
              </div>
              <div className="w-16 shrink-0">
                <div
                  className="ring-donut"
                  style={{ ['--pct' as string]: `${capacityPercentage}%` }}
                >
                  <span className="text-xs font-extrabold tabular-nums">
                    {Math.round(capacityPercentage)}٪
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground">
                    نام
                  </Label>
                  <div className="mt-2 flex items-center gap-2.5 border-b-2 border-white/10 pb-2.5 transition-colors focus-within:border-[#26fce3]">
                    <User className="h-4 w-4 shrink-0 text-[#58cac0]" />
                    <input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="نام خود را وارد کنید"
                      required
                      className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground">
                    نام خانوادگی
                  </Label>
                  <div className="mt-2 flex items-center gap-2.5 border-b-2 border-white/10 pb-2.5 transition-colors focus-within:border-[#26fce3]">
                    <User className="h-4 w-4 shrink-0 text-[#58cac0]" />
                    <input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="نام خانوادگی"
                      required
                      className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground">
                  شماره تماس
                </Label>
                <div className="mt-2 flex items-center gap-2.5 border-b-2 border-white/10 pb-2.5 transition-colors focus-within:border-[#26fce3]">
                  <Phone className="h-4 w-4 shrink-0 text-[#58cac0]" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09xxxxxxxxx"
                    required
                    dir="ltr"
                    className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="ghost"
                className="btn-cta h-auto hover:bg-transparent"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    در حال ثبت‌نام...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    شروع رایگان پروژه
                  </span>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                با ثبت‌نام، شرایط استفاده را می‌پذیرید
              </p>
            </form>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex items-start justify-between gap-1"
          >
            {NEXT_STEPS.map((step, index) => (
              <div key={step} className="contents">
                <div className="flex max-w-[6.5rem] flex-col items-center gap-2 text-center">
                  <span className={`rail-dot ${index === 0 ? 'is-active' : ''}`} />
                  <span className="text-xs font-semibold text-muted-foreground">{step}</span>
                </div>
                {index < NEXT_STEPS.length - 1 && (
                  <span className="mt-[4px] h-0.5 flex-1 shrink bg-gradient-to-l from-white/5 via-white/15 to-white/5" />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationForm;
