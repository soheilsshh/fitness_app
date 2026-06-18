"use client";

import { apiAssetUrl } from "@/lib/api/assets";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function faNum(value) {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
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
      dir="rtl"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {!isEdit ? (
          <div className="space-y-2">
            <Label>شناسه خارجی (externalId) *</Label>
            <Input
              value={form.externalId}
              onChange={(e) => setForm((f) => ({ ...f, externalId: e.target.value }))}
              placeholder="مثلاً 0001"
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>شناسه خارجی</Label>
            <div className="rounded-lg border bg-muted px-3 py-2 text-sm">
              {form.externalId}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>نام تمرین *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>دسته‌بندی</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>ناحیه بدن</Label>
          <Input
            value={form.bodyPart}
            onChange={(e) => setForm((f) => ({ ...f, bodyPart: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>تجهیزات</Label>
          <Input
            value={form.equipment}
            onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>عضله هدف</Label>
          <Input
            value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>گروه عضلانی</Label>
          <Input
            value={form.muscleGroup}
            onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>مسیر تصویر</Label>
          <Input
            dir="ltr"
            value={form.imagePath}
            onChange={(e) => setForm((f) => ({ ...f, imagePath: e.target.value, imageUrl: "" }))}
            placeholder="images/0001-xxx.jpg"
          />
        </div>

        <div className="space-y-2">
          <Label>مسیر GIF</Label>
          <Input
            dir="ltr"
            value={form.gifPath}
            onChange={(e) => setForm((f) => ({ ...f, gifPath: e.target.value, gifUrl: "" }))}
            placeholder="videos/0001-xxx.gif"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>توضیحات</Label>
        <Textarea
          className="min-h-[100px] resize-y"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>مراحل اجرا (هر خط یک مرحله)</Label>
        <Textarea
          className="min-h-[120px] resize-y"
          value={form.instructionStepsText}
          onChange={(e) => setForm((f) => ({ ...f, instructionStepsText: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>عضلات ثانویه (هر خط یک مورد)</Label>
        <Textarea
          className="min-h-[80px] resize-y"
          value={form.secondaryMusclesText}
          onChange={(e) => setForm((f) => ({ ...f, secondaryMusclesText: e.target.value }))}
        />
      </div>

      {(previewImage || previewGif) && (
        <div className="grid gap-4 md:grid-cols-2">
          {previewImage ? (
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="mb-2 text-xs text-muted-foreground">پیش‌نمایش تصویر</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt={form.name || "exercise"}
                className="max-h-48 w-full rounded-lg bg-black object-contain"
              />
            </div>
          ) : null}
          {previewGif ? (
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="mb-2 text-xs text-muted-foreground">پیش‌نمایش GIF</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewGif}
                alt={form.name || "exercise gif"}
                className="max-h-48 w-full rounded-lg bg-black object-contain"
              />
            </div>
          ) : null}
        </div>
      )}

      <Label className="inline-flex w-fit cursor-pointer items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <Checkbox
          checked={form.isActive}
          onCheckedChange={(checked) =>
            setForm((f) => ({ ...f, isActive: checked === true }))
          }
        />
        <span className="text-sm">فعال در سیستم</span>
      </Label>

      <Button
        type="submit"
        disabled={submitting}
        className="min-w-36"
      >
        {submitting ? "در حال ذخیره..." : submitLabel}
      </Button>

      {isEdit ? (
        <div className="text-xs text-muted-foreground">
          شناسه خارجی در حالت ویرایش قابل تغییر نیست.
        </div>
      ) : null}
    </form>
  );
}
