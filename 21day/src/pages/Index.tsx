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
import { Button } from '@/components/ui/button';
import { Video, ArrowRight } from 'lucide-react';
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
        <div className="fixed bottom-6 left-4 z-50 sm:top-20 sm:bottom-auto">
          <Button
            onClick={handleContinueLearning}
            className="cursor-pointer rounded-full bg-primary text-white shadow-[0_10px_28px_-12px_rgba(24,114,114,0.7)] hover:bg-primary/90"
          >
            <Video className="w-4 h-4 ml-2" />
            ادامه یادگیری
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
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
