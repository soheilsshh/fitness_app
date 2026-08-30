"use client";

import { useState } from "react";
import {
  Ban,
  Check,
  Clock,
  Dumbbell,
  Heart,
  Plus,
  ShoppingBasket,
  Target,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AVOID_NONE,
  AVOID_OPTIONS,
  CARB_OPTIONS,
  CRAVING_OPTIONS,
  INDIFFERENT,
  MEAL_COUNT_OPTIONS,
  PREP_TIME_OPTIONS,
  PRODUCE_OPTIONS,
  PROTEIN_OPTIONS,
  STYLE_OPTIONS,
  TRAINING_OPTIONS,
  addCustomItem,
  checkInAnsweredCount,
  toggleExclusive,
} from "./dailyCheckIn";

const CHECKIN_TOTAL = 7;
const EXCLUSIVE_INDIFFERENT = [INDIFFERENT];
const EXCLUSIVE_AVOID = [AVOID_NONE, INDIFFERENT];

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
    <section className="space-y-3" aria-labelledby={`checkin-q${index}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id={`checkin-q${index}`}
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

export default function DailyCheckInForm({ value, onChange }) {
  const answered = checkInAnsweredCount(value);
  const pct = Math.round((answered / CHECKIN_TOTAL) * 100);

  const setField = (key, next) => onChange({ ...value, [key]: next });

  const toggleMulti = (key, opt, exclusiveValues) => {
    setField(key, toggleExclusive(value[key], opt, exclusiveValues));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-iranianSansDemiBold text-foreground">
            چک‌این روزانه تغذیه
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {answered.toLocaleString("fa-IR")} از {CHECKIN_TOTAL.toLocaleString("fa-IR")} سؤال
          </p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={CHECKIN_TOTAL}
          aria-valuenow={answered}
          aria-label="پیشرفت چک‌این روزانه"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          این پاسخ‌ها فقط برای برنامه امروز استفاده می‌شوند.
        </p>
      </div>

      <QuestionBlock index={1} icon={Utensils} title="امروز چند وعده می‌خوای داشته باشی؟">
        <ChipRow
          options={MEAL_COUNT_OPTIONS}
          value={value.mealCount}
          onSelect={(opt) => setField("mealCount", value.mealCount === opt ? "" : opt)}
        />
      </QuestionBlock>

      <QuestionBlock
        index={2}
        icon={ShoppingBasket}
        title="امروز چه چیزهایی در دسترسته؟"
        hint="در هر گروه می‌توانی چند گزینه را همزمان انتخاب کنی."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-iranianSansDemiBold text-muted-foreground">پروتئین</p>
            <ChipRow
              multi
              options={PROTEIN_OPTIONS}
              value={value.protein}
              onSelect={(opt) => toggleMulti("protein", opt, EXCLUSIVE_INDIFFERENT)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-iranianSansDemiBold text-muted-foreground">کربوهیدرات</p>
            <ChipRow
              multi
              options={CARB_OPTIONS}
              value={value.carbs}
              onSelect={(opt) => toggleMulti("carbs", opt, EXCLUSIVE_INDIFFERENT)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-iranianSansDemiBold text-muted-foreground">سبزیجات و میوه</p>
            <ChipRow
              multi
              options={PRODUCE_OPTIONS}
              value={value.produce}
              onSelect={(opt) => toggleMulti("produce", opt, EXCLUSIVE_INDIFFERENT)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-available-extra" className="text-xs text-muted-foreground">
              افزودن ماده غذایی دیگر
            </Label>
            <AddItemRow
              id="checkin-available-extra"
              placeholder="مثلاً قارچ، عدس، ماست…"
              onAdd={(raw) => setField("availableExtra", addCustomItem(value.availableExtra, raw))}
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
        </div>
      </QuestionBlock>

      <QuestionBlock index={3} icon={Heart} title="امروز چه غذایی بیشتر هوس کردی؟">
        <ChipRow
          multi
          options={CRAVING_OPTIONS}
          value={value.craving}
          onSelect={(opt) => toggleMulti("craving", opt, EXCLUSIVE_INDIFFERENT)}
        />
        <div className="space-y-2">
          <Label htmlFor="checkin-craving-custom" className="text-xs text-muted-foreground">
            نوشتن غذای دلخواه
          </Label>
          <Input
            id="checkin-craving-custom"
            value={value.cravingCustom}
            onChange={(e) => setField("cravingCustom", e.target.value)}
            placeholder="مثلاً قیمه، املت، سالاد سزار…"
            className="h-11 min-h-11"
          />
        </div>
      </QuestionBlock>

      <QuestionBlock index={4} icon={Dumbbell} title="امروز تمرین داری؟">
        <ChipRow
          options={TRAINING_OPTIONS}
          value={value.training}
          onSelect={(opt) => setField("training", value.training === opt ? "" : opt)}
        />
      </QuestionBlock>

      <QuestionBlock index={5} icon={Clock} title="امروز چقدر برای آماده‌کردن غذا وقت داری؟">
        <ChipRow
          options={PREP_TIME_OPTIONS}
          value={value.prepTime}
          onSelect={(opt) => setField("prepTime", value.prepTime === opt ? "" : opt)}
        />
      </QuestionBlock>

      <QuestionBlock index={6} icon={Ban} title="امروز غذایی هست که نمی‌خوای بخوری؟">
        <ChipRow
          multi
          options={AVOID_OPTIONS}
          value={value.avoid}
          onSelect={(opt) => toggleMulti("avoid", opt, EXCLUSIVE_AVOID)}
        />
        <div className="space-y-2">
          <Label htmlFor="checkin-avoid-extra" className="text-xs text-muted-foreground">
            افزودن غذای دیگر
          </Label>
          <AddItemRow
            id="checkin-avoid-extra"
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

      <QuestionBlock index={7} icon={Target} title="امروز دوست داری برنامه‌ات چطور باشه؟">
        <ChipRow
          options={STYLE_OPTIONS}
          value={value.style}
          onSelect={(opt) => setField("style", value.style === opt ? "" : opt)}
        />
      </QuestionBlock>
    </div>
  );
}
