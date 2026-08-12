"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "../../../_components/ui/PageHeader";
import Stepper from "./Stepper";
import GoalStep, { GOAL_OPTIONS } from "./GoalStep";
import InfoStep from "./InfoStep";
import DetailsStep, { EQUIPMENT_OPTIONS, LIMITATION_OPTIONS } from "./DetailsStep";
import PreviewStep from "./PreviewStep";
import ProfileSummaryCard from "./ProfileSummaryCard";

const STEPS = [
  { id: "goal", label: "هدف" },
  { id: "info", label: "اطلاعات" },
  { id: "details", label: "جزئیات" },
  { id: "preview", label: "پیش‌نمایش" },
];

const labelsFor = (options, values) =>
  values.map((v) => options.find((o) => o.value === v)?.label || v).filter(Boolean);

export default function AIProgramNewClient() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState({
    equipment: [],
    daysPerWeek: null,
    sessionMinutes: null,
    limitations: [],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/me");
        if (cancelled) return;
        setProfile(res.data);
        const goalFromTags = Array.isArray(res.data?.goals) ? res.data.goals[0] : "";
        if (GOAL_OPTIONS.some((g) => g.value === goalFromTags)) setGoal(goalFromTags);
      } catch {
        /* profile is optional context, wizard still works without it */
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveGoal = async () => {
    const label = GOAL_OPTIONS.find((g) => g.value === goal)?.label || goal;
    setSaving(true);
    try {
      const res = await api.patch("/me", { goals: [goal], primaryGoal: label });
      setProfile(res.data);
      setStep(1);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره هدف ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  const saveInfo = async (payload) => {
    setSaving(true);
    try {
      const res = await api.patch("/me", payload);
      setProfile(res.data);
      setStep(2);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره اطلاعات ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async () => {
    const limitationLabels = labelsFor(LIMITATION_OPTIONS, details.limitations);
    setSaving(true);
    try {
      const res = await api.patch("/me", {
        physicalLimitations: limitationLabels.includes("بدون محدودیت")
          ? ""
          : limitationLabels.join("، "),
      });
      setProfile(res.data);
      setStep(3);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "ذخیره جزئیات ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="ساخت برنامه با هوش مصنوعی"
        description="هدف، اطلاعات و جزئیات را مشخص کنید تا هوش مصنوعی یک برنامهٔ پیش‌نویس برایتان بسازد."
      />

      <Card>
        <CardContent className="pt-6">
          <Stepper steps={STEPS} activeIndex={step} onStepClick={setStep} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[1fr_18rem] md:gap-6">
        <Card>
          <CardContent className="pt-6">
            {step === 0 ? (
              <GoalStep value={goal} onChange={setGoal} onNext={saveGoal} saving={saving} />
            ) : null}
            {step === 1 ? (
              <InfoStep
                key={loadingProfile ? "loading" : "loaded"}
                profile={profile}
                onNext={saveInfo}
                onBack={() => setStep(0)}
                saving={saving}
              />
            ) : null}
            {step === 2 ? (
              <DetailsStep
                value={details}
                onChange={setDetails}
                onNext={saveDetails}
                onBack={() => setStep(1)}
                saving={saving}
              />
            ) : null}
            {step === 3 ? (
              <PreviewStep
                goal={goal}
                details={{
                  equipmentLabels: labelsFor(EQUIPMENT_OPTIONS, details.equipment),
                  daysPerWeek: details.daysPerWeek,
                  sessionMinutes: details.sessionMinutes,
                }}
                onBack={() => setStep(2)}
              />
            ) : null}
          </CardContent>
        </Card>

        <div className="md:sticky md:top-4 md:self-start">
          <ProfileSummaryCard profile={profile} loading={loadingProfile} />
        </div>
      </div>
    </div>
  );
}
