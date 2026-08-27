import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { useUser } from '@/hooks/useUser';

// Same VIP plan Fitinoo's main funnel (Ali Rashidabadi, funnel_1) sells —
// price and feature copy kept identical on purpose so this challenge's
// upsell and Fitinoo's own main plan never quote two different numbers.
const PLAN_PRICE_TOMAN = 1_490_000;
const PLAN_FEATURES = [
  'برنامه تمرین و تغذیه اختصاصی (بیومکانیک + سفره ایرانی)',
  'پایش پیشرفت با هوش‌مصنوعی',
  'گزارش جامع آنالیز بدنی و پیش‌بینی ۱۲ هفته‌ای',
  'پشتیبانی و رفع اشکال از طریق تیکت پنل',
  'دسترسی کامل به اپلیکیشن و امکانات داشبورد',
];

const Upgrade = () => {
  const reduceMotion = useReducedMotion();
  const { phone } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!phone) navigate('/');
  }, [phone, navigate]);

  const handleBuy = async () => {
    if (!phone || paying) return;
    try {
      setPaying(true);
      const { payment_url } = await apiService.createPayment(phone);
      window.location.href = payment_url;
    } catch (error) {
      console.error('Error starting payment:', error);
      toast({
        title: 'شروع پرداخت ناموفق بود',
        description: 'دوباره امتحان کن',
        variant: 'destructive',
      });
      setPaying(false);
    }
  };

  if (!phone) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0e0e0e] pb-16 text-foreground" dir="rtl">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#26fce3]/35 to-transparent" />
        <div className="absolute -end-24 top-32 h-80 w-80 rounded-full bg-[#187272]/25 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-lg px-4 pt-8">
        <button
          type="button"
          onClick={() => navigate('/videos')}
          className="mb-6 flex items-center gap-1 text-sm text-white/50 hover:text-white/80"
        >
          <ChevronRight className="h-4 w-4" />
          برگشت به مسیر
        </button>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center"
        >
          <p className="text-3xl">🎉</p>
          <h1 className="mt-3 text-2xl font-bold text-white">
            به آخر مسیر ۲۱ روزه رسیدی
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            برای ادامه، دسترسی کامل فیتینو رو فعال کن — همون پلن VIP که مربی‌های
            فیتینو استفاده می‌کنن.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mt-8 border border-[#26fce3]/30 bg-[#26fce3]/[0.06] p-5"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-white">پلن VIP</h2>
            <span className="text-xs text-white/50">دوره ۳ ماهه</span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            تمرین + تغذیه + پایش ۲۴ ساعته AI
          </p>

          <ul className="mt-4 space-y-2.5">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-xs leading-relaxed text-white/70">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#26fce3]" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-white/50">قیمت دوره</span>
            <span className="text-xl font-bold text-white">
              {PLAN_PRICE_TOMAN.toLocaleString('fa-IR')} تومان
            </span>
          </div>

          <Button
            type="button"
            onClick={handleBuy}
            disabled={paying}
            className="mt-4 min-h-[48px] w-full cursor-pointer rounded-none border-0 bg-[#26fce3] font-bold text-[#0a1a18] hover:bg-[#7dffe8]"
          >
            {paying ? 'در حال انتقال به درگاه…' : 'فعال‌سازی دسترسی کامل'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Upgrade;
