"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "../../../_components/ui/PageHeader";
import PreviewStep from "./PreviewStep";
import ProfileSummaryCard from "./ProfileSummaryCard";
import WizardProgress from "./WizardProgress";
import WizardSlide from "./WizardSlide";
import {
  emptyAnswers,
  isSlideComplete,
  SLIDE_COUNT,
  SLIDES,
  toGeneratePayload,
} from "./workoutWizard";

export default function AIProgramNewClient() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [slide, setSlide] = useState(0);
  const [answers, setAnswers] = useState(() => emptyAnswers());
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/me");
        if (!cancelled) setProfile(res.data);
      } catch {
        /* profile is optional context */
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = SLIDES[slide];
  const canNext = current ? isSlideComplete(current, answers) : false;

  const goNext = () => {
    if (slide >= SLIDE_COUNT - 1) {
      setPreview(true);
      return;
    }
    setSlide((s) => s + 1);
  };

  const goBack = () => {
    if (preview) {
      setPreview(false);
      return;
    }
    setSlide((s) => Math.max(0, s - 1));
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="ساخت برنامه با هوش مصنوعی"
        description="سن، قد و وزن از پروفایل خوانده می‌شود. اینجا فقط هدف، سطح، امکانات و ترجیح‌های تمرینی‌ات را می‌پرسیم."
      />

      {!preview ? <WizardProgress index={slide} total={SLIDE_COUNT} title={current?.title || ""} /> : (
        <p className="text-sm text-muted-foreground">پیش‌نمایش برنامه بر اساس پاسخ‌هایت</p>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-6">
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="space-y-6 pt-6">
            {preview ? (
              <PreviewStep
                answers={answers}
                payload={toGeneratePayload(answers)}
                onBack={goBack}
              />
            ) : (
              <>
                <WizardSlide slide={current} answers={answers} onChange={setAnswers} />
                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 cursor-pointer gap-2"
                    disabled={slide === 0}
                    onClick={goBack}
                  >
                    <ArrowRight data-icon="inline-start" />
                    قبلی
                  </Button>
                  <Button
                    type="button"
                    className="h-11 cursor-pointer gap-2"
                    disabled={!canNext}
                    onClick={goNext}
                  >
                    {slide >= SLIDE_COUNT - 1 ? "ساخت پیش‌نمایش" : "ادامه"}
                    <ArrowLeft data-icon="inline-end" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <ProfileSummaryCard profile={profile} loading={loadingProfile} />
        </div>
      </div>
    </div>
  );
}
