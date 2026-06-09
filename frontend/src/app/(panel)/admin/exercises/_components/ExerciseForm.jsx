"use client";

import { useState } from "react";
import { apiAssetUrl } from "@/lib/api/assets";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function linesToArray(text) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToLines(items) {
  return (items || []).join("\n");
}

export function buildEmptyExercise() {
  return {
    externalId: "",
    name: "",
    category: "",
    bodyPart: "",
    equipment: "",
    description: "",
    instructionStepsText: "",
    muscleGroup: "",
    target: "",
    secondaryMusclesText: "",
    imagePath: "",
    gifPath: "",
    isActive: true,
  };
}

export function exerciseToForm(exercise) {
  return {
    externalId: exercise.externalId || "",
    name: exercise.name || "",
    category: exercise.category || "",
    bodyPart: exercise.bodyPart || "",
    equipment: exercise.equipment || "",
    description: exercise.description || "",
    instructionStepsText: arrayToLines(exercise.instructionSteps),
    muscleGroup: exercise.muscleGroup || "",
    target: exercise.target || "",
    secondaryMusclesText: arrayToLines(exercise.secondaryMuscles),
    imagePath: exercise.imagePath || "",
    gifPath: exercise.gifPath || "",
    isActive: exercise.isActive !== false,
    imageUrl: exercise.imageUrl || "",
    gifUrl: exercise.gifUrl || "",
  };
}

export function formToPayload(form, { isEdit = false } = {}) {
  const payload = {
    name: form.name.trim(),
    category: form.category.trim(),
    bodyPart: form.bodyPart.trim(),
    equipment: form.equipment.trim(),
    description: form.description.trim(),
    instructionSteps: linesToArray(form.instructionStepsText),
    muscleGroup: form.muscleGroup.trim(),
    target: form.target.trim(),
    secondaryMuscles: linesToArray(form.secondaryMusclesText),
    imagePath: form.imagePath.trim(),
    gifPath: form.gifPath.trim(),
    isActive: form.isActive,
  };

  if (!isEdit) {
    payload.externalId = form.externalId.trim();
  }

  return payload;
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40";

const labelClass = "mb-1.5 block text-xs font-bold text-zinc-400";

export default function ExerciseForm({
  form,
  setForm,
  onSubmit,
  submitting,
  submitLabel,
  isEdit = false,
}) {
  const previewImage = form.imageUrl || apiAssetUrl(form.imagePath);
  const previewGif = form.gifUrl || apiAssetUrl(form.gifPath);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {!isEdit ? (
          <div>
            <label className={labelClass}>شناسه خارجی (externalId) *</label>
            <input
              className={inputClass}
              value={form.externalId}
              onChange={(e) => setForm((f) => ({ ...f, externalId: e.target.value }))}
              placeholder="مثلاً 0001"
              required
            />
          </div>
        ) : (
          <div>
            <label className={labelClass}>شناسه خارجی</label>
            <div className="rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 text-sm text-zinc-300">
              {form.externalId}
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>نام تمرین *</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className={labelClass}>دسته‌بندی</label>
          <input
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelClass}>ناحیه بدن</label>
          <input
            className={inputClass}
            value={form.bodyPart}
            onChange={(e) => setForm((f) => ({ ...f, bodyPart: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelClass}>تجهیزات</label>
          <input
            className={inputClass}
            value={form.equipment}
            onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelClass}>عضله هدف</label>
          <input
            className={inputClass}
            value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelClass}>گروه عضلانی</label>
          <input
            className={inputClass}
            value={form.muscleGroup}
            onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))}
          />
        </div>

        <div>
          <label className={labelClass}>مسیر تصویر</label>
          <input
            className={inputClass}
            dir="ltr"
            value={form.imagePath}
            onChange={(e) => setForm((f) => ({ ...f, imagePath: e.target.value, imageUrl: "" }))}
            placeholder="images/0001-xxx.jpg"
          />
        </div>

        <div>
          <label className={labelClass}>مسیر GIF</label>
          <input
            className={inputClass}
            dir="ltr"
            value={form.gifPath}
            onChange={(e) => setForm((f) => ({ ...f, gifPath: e.target.value, gifUrl: "" }))}
            placeholder="videos/0001-xxx.gif"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>توضیحات</label>
        <textarea
          className={cn(inputClass, "min-h-[100px] resize-y")}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelClass}>مراحل اجرا (هر خط یک مرحله)</label>
        <textarea
          className={cn(inputClass, "min-h-[120px] resize-y")}
          value={form.instructionStepsText}
          onChange={(e) => setForm((f) => ({ ...f, instructionStepsText: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelClass}>عضلات ثانویه (هر خط یک مورد)</label>
        <textarea
          className={cn(inputClass, "min-h-[80px] resize-y")}
          value={form.secondaryMusclesText}
          onChange={(e) => setForm((f) => ({ ...f, secondaryMusclesText: e.target.value }))}
        />
      </div>

      {(previewImage || previewGif) && (
        <div className="grid gap-4 md:grid-cols-2">
          {previewImage ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
              <div className="mb-2 text-xs font-bold text-zinc-400">پیش‌نمایش تصویر</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt={form.name || "exercise"}
                className="max-h-48 w-full rounded-2xl object-contain bg-zinc-900"
              />
            </div>
          ) : null}
          {previewGif ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
              <div className="mb-2 text-xs font-bold text-zinc-400">پیش‌نمایش GIF</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewGif}
                alt={form.name || "exercise gif"}
                className="max-h-48 w-full rounded-2xl object-contain bg-zinc-900"
              />
            </div>
          ) : null}
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-3">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-white/20 bg-zinc-900"
        />
        <span className="text-sm font-bold text-white">فعال در سیستم</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-2xl bg-emerald-500/90 px-6 py-3 text-sm font-extrabold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {submitting ? "در حال ذخیره..." : submitLabel}
      </button>
    </form>
  );
}
