import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 3,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(now + 72 * 60 * 60 * 1000).getTime();
      const distance = endTime - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      if (distance < 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full gradient-bg text-white py-8 px-6 shadow-lg"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-4" style={{ lineHeight: '0.85' }}>
            <span className="text-white block">ساخت سیستم</span>
            <span className="text-[#eafffb] block">درآمد دلاری</span>
            <span className="text-white block">با AI در ۳ روز</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90">
            دوره جامع و کاربردی برای ساخت سیستم‌های هوشمند درآمد‌زایی
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-3xl font-bold bg-white/10 rounded-lg px-6 py-3 min-w-[80px]">
                {timeLeft.days}
              </div>
              <div className="text-sm mt-2">روز</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-white/10 rounded-lg px-6 py-3 min-w-[80px]">
                {timeLeft.hours}
              </div>
              <div className="text-sm mt-2">ساعت</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-white/10 rounded-lg px-6 py-3 min-w-[80px]">
                {timeLeft.minutes}
              </div>
              <div className="text-sm mt-2">دقیقه</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-white/10 rounded-lg px-6 py-3 min-w-[80px]">
                {timeLeft.seconds}
              </div>
              <div className="text-sm mt-2">ثانیه</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 