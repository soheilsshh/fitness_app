"use client";

import { useState } from "react";
import {
  Ban,
  CalendarDays,
  Check,
  Clock,
  Dumbbell,
  Heart,
  Layers,
  ListChecks,
  MapPin,
  MessageSquareText,
  Plus,
  Repeat,
  ShoppingBasket,
  Shuffle,
  Target,
  Utensils,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AVAILABLE_OPTIONS,
  AVOID_NONE,
  AVOID_OPTIONS,
  BUDGET_OPTIONS,
  CHECKIN_TOTAL,
  EATING_PLACE_OPTIONS,
  INDIFFERENT,
  LIKED_FOOD_OPTIONS,
  MEAL_COUNT_OPTIONS,
  PREP_TIME_OPTIONS,
  REPEAT_OPTIONS,
  RULES_TOTAL,
  SPECIAL_NONE,
  STYLE_OPTIONS,
  TRAINING_ALL,
  TRAINING_DAY_OPTIONS,
  TRAINING_INTENSITY_OPTIONS,
  TRAINING_NONE,
  WEEKLY_GOAL_OPTIONS,
  addCustomItem,
  checkInAnsweredCount,
  rulesAnsweredCount,
  toggleExclusive,
} from "./weeklyCheckIn";

const EXCLUSIVE_INDIFFERENT = [INDIFFERENT];
const EXCLUSIVE_AVOID = [AVOID_NONE, INDIFFERENT];
const EXCLUSIVE_TRAINING_DAYS = [TRAINING_ALL, TRAINING_NONE];

const STYLE_ICONS = {
  "دقیق و منظم": ListChecks,
  متنوع: Shuffle,
  "ساده و سریع": Zap,
  اقتصادی: Wallet,
  "تمرکز روی پروتئین": Dumbbell,
  ترکیبی: Layers,
};

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3.5 text-sm font-iranianSansMedium transition-colors duration-200",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {selected ? <Check className="size-3.5" aria-hidden /> : null}
      {children}
    </button>
  );
}

function ChipRow({ options, value, onSelect, multi = false }) {
  const selected = multi ? value : [value];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip
          key={opt}
          selected={selected.includes(opt)}
          onClick={() => onSelect(opt)}
        >
          {opt}
        </Chip>
      ))}
    </div>
  );
}

function CustomList({ items, onRemove, label }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 text-sm font-iranianSansMedium text-primary"
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full hover:bg-primary/15"
            aria-label={`حذف ${item}`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}

function AddItemRow({ id, placeholder, onAdd }) {
  const [text, setText] = useState("");
  const submit = () => {
    onAdd(text);
    setText("");
  };
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="h-11 min-h-11"
      />
      <Button
        type="button"
        variant="outline"
        onClick={submit}
        disabled={!text.trim()}
        className="h-11 shrink-0 cursor-pointer gap-1.5 px-3"
      >
        <Plus className="size-4" aria-hidden />
        افزودن
      </Button>
    </div>
  );
}

function QuestionBlock({ index, icon: Icon, title, hint, children }) {
  return (
    <section className="space-y-3" aria-labelledby={`week-q${index}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id={`week-q${index}`}
            className="text-sm font-iranianSansDemiBold text-foreground"
          >
            <span className="tabular-nums text-muted-foreground">
              {index.toLocaleString("fa-IR")}.
            </span>{" "}
            {title}
          </h3>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      <div className="space-y-2.5 ps-0 sm:ps-10">{children}</div>
    </section>
  );
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-muted/15 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="text-sm font-iranianSansDemiBold text-foreground">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function ProgressBar({ answered, total, label }) {
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-iranianSansDemiBold text-foreground">{label}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {answered.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")}
        </p>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stepper({ step }) {
  const items = [
    { id: "rules", label: "قواعد هفته" },
    { id: "style", label: "سبک برنامه" },
  ];
  return (
    <ol className="flex items-center gap-2" aria-label="مراحل ساخت برنامه هفتگی">
      {items.map((item, i) => {
        const active = step === item.id;
        const done = step === "style" && item.id === "rules";
        return (
          <li key={item.id} className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-iranianSansMedium",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground"
              )}
            >
              <span className="tabular-nums">{(i + 1).toLocaleString("fa-IR")}</span>
              {item.label}
            </span>
            {i === 0 ? (
              <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                ←
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default function WeeklyCheckInForm({ value, onChange, step = "rules" }) {
  const rulesAnswered = rulesAnsweredCount(value);
  const answered = checkInAnsweredCount(value);
  const setField = (key, next) => onChange({ ...value, [key]: next });
  const toggleMulti = (key, opt, exclusiveValues) => {
    setField(key, toggleExclusive(value[key], opt, exclusiveValues));
  };

  const specialText =
    value.specialCircumstances === SPECIAL_NONE ? "" : value.specialCircumstances;

  if (step === "style") {
    return (
      <div className="space-y-6">
        <Stepper step="style" />
        <ProgressBar
          answered={answered}
          total={CHECKIN_TOTAL}
          label="سبک برنامه هفتگی"
        />
        <p className="max-w-xl text-sm font-iranianSansMedium leading-[22px] text-muted-foreground">
          AI از قواعد هفته‌ات الگوی ۷ روز را می‌سازد؛ تو فقط بگو برنامه چطور باشد.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STYLE_OPTIONS.map((opt) => {
            const Icon = STYLE_ICONS[opt.value];
            const selected = value.style === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setField("style", selected ? "" : opt.value)}
                className={cn(
                  "flex min-h-22 cursor-pointer touch-manipulation items-start gap-3 rounded-2xl border p-4 text-start transition-colors duration-200",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/20 text-foreground hover:border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-iranianSansDemiBold">{opt.value}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                </span>
                {selected ? <Check className="ms-auto size-4 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Stepper step="rules" />
      <ProgressBar
        answered={rulesAnswered}
        total={RULES_TOTAL}
        label="قواعد هفته"
      />
      <p className="max-w-xl text-sm font-iranianSansMedium leading-[22px] text-muted-foreground">
        وعدهٔ تک‌تک روزها را نمی‌پرسیم. این پاسخ‌ها الگوی کل هفته را می‌سازند.
      </p>

      <FormSection icon={CalendarDays} title="اطلاعات پایه هفته">
        <QuestionBlock index={1} icon={Target} title="هدفت برای این هفته چیه؟">
          <ChipRow
            options={WEEKLY_GOAL_OPTIONS}
            value={value.weeklyGoal}
            onSelect={(opt) => setField("weeklyGoal", value.weeklyGoal === opt ? "" : opt)}
          />
        </QuestionBlock>

        <QuestionBlock index={2} icon={Utensils} title="چند وعده در روز می‌خوای؟">
          <ChipRow
            options={MEAL_COUNT_OPTIONS}
            value={value.mealCount}
            onSelect={(opt) => setField("mealCount", value.mealCount === opt ? "" : opt)}
          />
        </QuestionBlock>

        <QuestionBlock
          index={3}
          icon={Dumbbell}
          title="کدوم روزها معمولاً تمرین داری؟"
          hint="می‌توانی چند روز را همزمان انتخاب کنی."
        >
          <ChipRow
            multi
            options={TRAINING_DAY_OPTIONS}
            value={value.trainingDays}
            onSelect={(opt) => toggleMulti("trainingDays", opt, EXCLUSIVE_TRAINING_DAYS)}
          />
        </QuestionBlock>

        <QuestionBlock index={4} icon={Zap} title="شدت تمرینت در طول هفته چطوره؟">
          <ChipRow
            options={TRAINING_INTENSITY_OPTIONS}
            value={value.trainingIntensity}
            onSelect={(opt) =>
              setField("trainingIntensity", value.trainingIntensity === opt ? "" : opt)
            }
          />
        </QuestionBlock>
      </FormSection>

      <FormSection icon={Utensils} title="ترجیحات غذایی">
        <QuestionBlock index={5} icon={Heart} title="چه غذاهایی رو دوست داری؟">
          <ChipRow
            multi
            options={LIKED_FOOD_OPTIONS}
            value={value.likedFoods}
            onSelect={(opt) => toggleMulti("likedFoods", opt, EXCLUSIVE_INDIFFERENT)}
          />
          <div className="space-y-2">
            <Label htmlFor="week-favorite-food" className="text-xs text-muted-foreground">
              نوشتن غذای موردعلاقه
            </Label>
            <Input
              id="week-favorite-food"
              value={value.favoriteFood}
              onChange={(e) => setField("favoriteFood", e.target.value)}
              placeholder="مثلاً قیمه، جوجه کباب، املت…"
              className="h-11 min-h-11"
            />
          </div>
        </QuestionBlock>

        <QuestionBlock index={6} icon={Ban} title="چه غذاهایی رو نمی‌خوری؟">
          <ChipRow
            multi
            options={AVOID_OPTIONS}
            value={value.avoid}
            onSelect={(opt) => toggleMulti("avoid", opt, EXCLUSIVE_AVOID)}
          />
          <div className="space-y-2">
            <Label htmlFor="week-avoid-extra" className="text-xs text-muted-foreground">
              افزودن مورد دیگر
            </Label>
            <AddItemRow
              id="week-avoid-extra"
              placeholder="مثلاً بادمجان، غذای دریایی…"
              onAdd={(raw) => setField("avoidExtra", addCustomItem(value.avoidExtra, raw))}
            />
            <CustomList
              items={value.avoidExtra}
              label="غذاهایی که نمی‌خواهی"
              onRemove={(item) =>
                setField(
                  "avoidExtra",
                  value.avoidExtra.filter((v) => v !== item)
                )
              }
            />
          </div>
        </QuestionBlock>

        <QuestionBlock
          index={7}
          icon={ShoppingBasket}
          title="چه مواد غذایی معمولاً در دسترست هست؟"
        >
          <ChipRow
            multi
            options={AVAILABLE_OPTIONS}
            value={value.available}
            onSelect={(opt) => toggleMulti("available", opt, EXCLUSIVE_INDIFFERENT)}
          />
          <div className="space-y-2">
            <Label htmlFor="week-available-extra" className="text-xs text-muted-foreground">
              افزودن ماده غذایی
            </Label>
            <AddItemRow
              id="week-available-extra"
              placeholder="مثلاً مرغ، عدس، ماست…"
              onAdd={(raw) =>
                setField("availableExtra", addCustomItem(value.availableExtra, raw))
              }
            />
            <CustomList
              items={value.availableExtra}
              label="مواد اضافه‌شده"
              onRemove={(item) =>
                setField(
                  "availableExtra",
                  value.availableExtra.filter((v) => v !== item)
                )
              }
            />
          </div>
        </QuestionBlock>
      </FormSection>

      <FormSection icon={Wallet} title="شرایط واقعی هفته">
        <QuestionBlock index={8} icon={Wallet} title="برای خرید مواد غذایی چقدر می‌خوای هزینه کنی؟">
          <ChipRow
            options={BUDGET_OPTIONS}
            value={value.budget}
            onSelect={(opt) => setField("budget", value.budget === opt ? "" : opt)}
          />
        </QuestionBlock>

        <QuestionBlock index={9} icon={MapPin} title="معمولاً کجا غذا می‌خوری؟">
          <ChipRow
            options={EATING_PLACE_OPTIONS}
            value={value.eatingPlace}
            onSelect={(opt) => setField("eatingPlace", value.eatingPlace === opt ? "" : opt)}
          />
        </QuestionBlock>

        <QuestionBlock index={10} icon={Clock} title="چقدر برای آشپزی وقت داری؟">
          <ChipRow
            options={PREP_TIME_OPTIONS}
            value={value.prepTime}
            onSelect={(opt) => setField("prepTime", value.prepTime === opt ? "" : opt)}
          />
        </QuestionBlock>

        <QuestionBlock index={11} icon={Repeat} title="دوست داری غذاها در طول هفته چقدر تکرار شوند؟">
          <ChipRow
            options={REPEAT_OPTIONS}
            value={value.repeatPreference}
            onSelect={(opt) =>
              setField("repeatPreference", value.repeatPreference === opt ? "" : opt)
            }
          />
        </QuestionBlock>
      </FormSection>

      <FormSection icon={MessageSquareText} title="شرایط خاص این هفته">
        <QuestionBlock
          index={12}
          icon={MessageSquareText}
          title="این هفته چه شرایط خاصی داری؟"
          hint="AI برنامه را حول اتفاقات واقعی هفته تنظیم می‌کند."
        >
          <ChipRow
            options={[SPECIAL_NONE]}
            value={value.specialCircumstances}
            onSelect={() =>
              setField(
                "specialCircumstances",
                value.specialCircumstances === SPECIAL_NONE ? "" : SPECIAL_NONE
              )
            }
          />
          <div className="space-y-2">
            <Label htmlFor="week-special" className="text-xs text-muted-foreground">
              توضیح آزاد
            </Label>
            <Textarea
              id="week-special"
              value={specialText}
              onChange={(e) => setField("specialCircumstances", e.target.value)}
              placeholder="مثلاً پنجشنبه مهمونی دارم، سه‌شنبه بیرون غذا می‌خورم، جمعه وقت آشپزی ندارم…"
              className="min-h-24"
            />
          </div>
        </QuestionBlock>
      </FormSection>
    </div>
  );
}
