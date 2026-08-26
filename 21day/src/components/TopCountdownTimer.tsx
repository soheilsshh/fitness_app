import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function TopCountdownTimer() {
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
      className="w-full bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 py-3 px-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm md:text-base font-medium">
            از الان ۷۲ ساعت فرصت داری تا کل این پروژه رایگان رو کامل کنی
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Clock className="w-5 h-5 text-red-500" />
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-lg font-bold bg-red-500/10 rounded-lg px-3 py-1 min-w-[40px]">
                {timeLeft.days}
              </div>
              <div className="text-xs mt-1">روز</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold bg-red-500/10 rounded-lg px-3 py-1 min-w-[40px]">
                {timeLeft.hours}
              </div>
              <div className="text-xs mt-1">ساعت</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold bg-red-500/10 rounded-lg px-3 py-1 min-w-[40px]">
                {timeLeft.minutes}
              </div>
              <div className="text-xs mt-1">دقیقه</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold bg-red-500/10 rounded-lg px-3 py-1 min-w-[40px]">
                {timeLeft.seconds}
              </div>
              <div className="text-xs mt-1">ثانیه</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 