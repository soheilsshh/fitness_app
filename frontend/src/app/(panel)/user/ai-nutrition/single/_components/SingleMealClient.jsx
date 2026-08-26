"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios/client";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "../../../_components/ui/PageHeader";
import IngredientsQuickPick from "./IngredientsQuickPick";
import FreeTextInput from "./FreeTextInput";
import SummaryStep from "./SummaryStep";
import ResultCard from "./ResultCard";

const STEP_INPUT = "input";
const STEP_SUMMARY = "summary";
const STEP_RESULT = "result";

export default function SingleMealClient() {
  const [step, setStep] = useState(STEP_INPUT);
  const [goal, setGoal] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [freeText, setFreeText] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const ingredients = Object.keys(selectedIngredients).filter((k) => selectedIngredients[k]);

  const toggleIngredient = (name) => {
    setSelectedIngredients((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const canContinue = ingredients.length > 0 || freeText.trim().length > 0;

  const goalLabel =
    { weight_loss: "کاهش وزن", muscle_gain: "عضله‌سازی", maintain: "حفظ وزن" }[goal] || "";

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/me/nutrition/suggest-from-ingredients", {
        ingredients: ingredients.join("، "),
        goal: goalLabel,
        preferences: freeText.trim(),
      });
      setSuggestion(res.data);
      setStep(STEP_RESULT);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "تولید پیشنهاد ناموفق بود"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="🍳 امروز چی درست کنم؟"
        description="بگو چه مواد غذایی در دسترس داری یا نداری تا یک غذای مناسب برایت بسازیم."
      />

      {step === STEP_INPUT ? (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <IngredientsQuickPick
              goal={goal}
              onGoalChange={setGoal}
              selected={selectedIngredients}
              onToggle={toggleIngredient}
            />
            <FreeTextInput value={freeText} onChange={setFreeText} />
            <div className="flex justify-start">
              <Button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep(STEP_SUMMARY)}
              >
                ادامه
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === STEP_SUMMARY ? (
        <Card>
          <CardContent className="pt-6">
            <SummaryStep
              goal={goal}
              ingredients={ingredients}
              freeText={freeText}
              onBack={() => setStep(STEP_INPUT)}
              onGenerate={generate}
              generating={loading}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === STEP_RESULT ? (
        <ResultCard suggestion={suggestion} onRegenerate={generate} regenerating={loading} />
      ) : null}
    </div>
  );
}
