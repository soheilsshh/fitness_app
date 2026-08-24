import React from 'react';
import WhatYouGetSection from '@/components/WhatYouGetSection';
import AboutAISection from '@/components/AboutAISection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CountdownSection from '@/components/CountdownSection';
import RegistrationForm from '@/components/RegistrationForm';
import IncomeCalculator from '@/components/IncomeCalculator';
import FAQSection from '@/components/FAQSection';
import FitinoPageShell from '@/components/FitinoPageShell';
import { useUser } from '@/hooks/useUser';
import { Play, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RAIL_STEPS = [
  { id: 'registration', label: 'ثبت‌نام' },
  { id: 'what-you-get', label: 'چی می‌گیری' },
  { id: 'about', label: 'چرا فرق داره' },
  { id: 'calculator', label: 'محاسبه‌گر درآمد' },
  { id: 'testimonials', label: 'تجربه دیگران' },
  { id: 'countdown', label: 'زمان محدود' },
  { id: 'faq', label: 'سوالات' },
];

const Index = () => {
  const { isLoggedIn } = useUser();
  const navigate = useNavigate();

  const handleContinueLearning = () => {
    navigate('/videos');
  };

  return (
    <FitinoPageShell railSteps={RAIL_STEPS}>
      {isLoggedIn && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:bottom-auto sm:end-4 sm:top-24">
          <button
            type="button"
            onClick={handleContinueLearning}
            aria-label="ادامه یادگیری؛ رفتن به جلسات ویدیویی"
            className="learning-dock pointer-events-auto mx-auto flex min-h-[72px] max-w-sm cursor-pointer items-center gap-3 px-3 py-3 sm:mx-0"
          >
            <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl bg-[#26fce3] text-[#0e0e0e] shadow-[0_0_24px_-6px_rgba(38,252,227,0.8)]">
              <Play className="size-5 fill-current" aria-hidden />
            </span>
            <span className="relative z-10 min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-white">ادامه یادگیری</span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-white/60">
                جلسات ویدیویی چالش ۲۱ روزه منتظرته
              </span>
            </span>
            <ChevronLeft className="relative z-10 size-5 shrink-0 text-[#26fce3]" aria-hidden />
          </button>
        </div>
      )}

      <RegistrationForm />
      <WhatYouGetSection />
      <AboutAISection />
      <IncomeCalculator />
      <TestimonialsSection />
      <CountdownSection />
      <FAQSection />
    </FitinoPageShell>
  );
};

export default Index;
