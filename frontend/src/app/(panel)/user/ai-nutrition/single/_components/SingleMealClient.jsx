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
import OptionalCalorieTarget, { parseOptionalCalories } from "../../_components/OptionalCalorieTarget";
import ReplaceMealSlotDialog from "../../_components/ReplaceMealSlotDialog";
import GenerationHistory from "../../_components/GenerationHistory";
import {
  cloneJSON,
  HISTORY_KEYS,
  loadHistory,
  newHistoryId,
  recordHistory,
  singleHistorySummary,
} from "../../_components/generationHistory";

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
  const [calorieTarget, setCalorieTarget] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [history, setHistory] = useState(() => loadHistory(HISTORY_KEYS.single));
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

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
        targetCalories: parseOptionalCalories(calorieTarget),
      });
      const next = res.data;
      const entry = {
        id: newHistoryId(),
        at: Date.now(),
        summary: singleHistorySummary(next),
        suggestion: cloneJSON(next),
      };
      setHistory((prev) => recordHistory(prev, entry, HISTORY_KEYS.single));
      setCurrentHistoryId(entry.id);
      setSuggestion(next);
      setApplied(false);
      setStep(STEP_RESULT);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "تولید پیشنهاد ناموفق بود"));
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (replaceSlot) => {
    if (!suggestion || !replaceSlot) return;
    setApplying(true);
    try {
      await api.post("/me/nutrition/apply-suggestion", {
        suggestion,
        replaceSlot,
      });
      setApplied(true);
      setPickerOpen(false);
      toast.success("این غذا جایگزین وعده انتخاب‌شده شد");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "اعمال وعده ناموفق بود"));
    } finally {
      setApplying(false);
    }
  };

  const restoreHistory = (entry) => {
    setSuggestion(cloneJSON(entry.suggestion));
    setCurrentHistoryId(entry.id);
    setApplied(false);
    setStep(STEP_RESULT);
    toast.success("این نسخه برگردانده شد");
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6" dir="rtl">
      <PageHeader
        title="امروز چی درست کنم؟"
        description="بگو چه مواد غذایی در دسترس داری تا یک غذای مناسب برایت بسازیم. اگر دوست داشتی، همان غذا را به‌جای یکی از وعده‌های برنامه امروز می‌گذاری."
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
                className="h-11 cursor-pointer"
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
              calorieTarget={calorieTarget}
              onCalorieTargetChange={setCalorieTarget}
              onBack={() => setStep(STEP_INPUT)}
              onGenerate={generate}
              generating={loading}
            />
          </CardContent>
        </Card>
      ) : null}

      {step === STEP_RESULT ? (
        <>
        <ResultCard
          suggestion={suggestion}
          onRegenerate={generate}
          regenerating={loading}
          onApply={() => setPickerOpen(true)}
          applying={applying}
          applied={applied}
        />
        <ReplaceMealSlotDialog
          open={pickerOpen}
          recipeName={suggestion?.recipe_name}
          confirming={applying}
          onClose={() => setPickerOpen(false)}
          onConfirm={applySuggestion}
        />
        </>
      ) : null}

      <GenerationHistory items={history} currentId={currentHistoryId} onRestore={restoreHistory} />
    </div>
  );
}
