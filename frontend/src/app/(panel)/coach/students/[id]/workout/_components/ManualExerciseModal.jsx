"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PenLine, Upload, X } from "lucide-react";
import { api } from "@/lib/axios/client";
import { toastError } from "@/app/(site)/auth/_components/helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function isVideoFile(file) {
  return file?.type?.startsWith("video/");
}

export default function ManualExerciseModal({ open, onClose, onAdd, dayLabel }) {
  const categoriesListId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api.get("/coach/exercises/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data?.categories || []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setCategory("");
      setBodyPart("");
      setEquipment("");
      setSets("3");
      setReps("12");
      setMediaFile(null);
      setMediaPreview("");
      setError("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(mediaFile);
    setMediaPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];
    if (!allowed.includes(file.type)) {
      setError("فرمت فایل پشتیبانی نمی‌شود. تصویر، GIF یا ویدیو انتخاب کنید.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("حداکثر حجم فایل ۲۵ مگابایت است.");
      return;
    }
    setError("");
    setMediaFile(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetFormFields = () => {
    setName("");
    setDescription("");
    setCategory("");
    setBodyPart("");
    setEquipment("");
    setSets("3");
    setReps("12");
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (andContinue) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("نام حرکت الزامی است.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", trimmedName);
      if (description.trim()) fd.append("description", description.trim());
      if (category.trim()) fd.append("category", category.trim());
      if (bodyPart.trim()) fd.append("bodyPart", bodyPart.trim());
      if (equipment.trim()) fd.append("equipment", equipment.trim());
      if (mediaFile) fd.append("media", mediaFile);

      const res = await api.post("/coach/exercises", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = res.data || {};
      const imageUrl = created.gifUrl || created.imageUrl || "";

      onAdd?.({
        exerciseId: created.id,
        name: created.name || trimmedName,
        imageUrl,
        sets,
        reps,
      });

      if (andContinue) {
        resetFormFields();
      } else {
        onClose?.();
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "ثبت حرکت ناموفق بود.";
      setError(msg);
      toastError("خطا", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !submitting) onClose?.();
      }}
    >
      <DialogContent
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden px-0 sm:max-w-lg"
        dir="rtl"
      >
        <DialogHeader className="border-b px-5 py-4 text-start">
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="size-4 text-primary" />
            افزودن حرکت دستی
          </DialogTitle>
          {dayLabel ? <DialogDescription>برنامه {dayLabel}</DialogDescription> : null}
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="manual-exercise-name">
              نام حرکت <span className="text-destructive">*</span>
            </Label>
            <Input
              id="manual-exercise-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: پرس سینه با دمبل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-exercise-description">توضیحات حرکت</Label>
            <Textarea
              id="manual-exercise-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="نحوه اجرا، نکات ایمنی و..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-exercise-sets">تعداد ست</Label>
              <Input
                id="manual-exercise-sets"
                type="number"
                min="1"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-exercise-reps">تعداد تکرار</Label>
              <Input
                id="manual-exercise-reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="۱۲"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-exercise-category">دسته‌بندی</Label>
            <Input
              id="manual-exercise-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list={categoriesListId}
              placeholder="مثلاً: سینه"
            />
            <datalist id={categoriesListId}>
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-exercise-body-part">عضله هدف</Label>
              <Input
                id="manual-exercise-body-part"
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                placeholder="مثلاً: سینه"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-exercise-equipment">تجهیزات</Label>
              <Input
                id="manual-exercise-equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="مثلاً: دمبل"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>انیمیشن یا ویدیو</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />
            {mediaPreview ? (
              <div className="relative overflow-hidden rounded-xl border bg-muted">
                {isVideoFile(mediaFile) ? (
                  <video
                    src={mediaPreview}
                    className="max-h-48 w-full object-contain"
                    controls
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreview}
                    alt="پیش‌نمایش"
                    className="max-h-48 w-full object-contain"
                  />
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="absolute start-2 top-2 bg-background/80 backdrop-blur-sm"
                  onClick={clearMedia}
                  aria-label="حذف فایل"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="flex h-auto w-full flex-col gap-2 border-dashed py-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-5 text-muted-foreground" />
                <span>انتخاب تصویر، GIF یا ویدیو</span>
                <span className="text-xs text-muted-foreground">حداکثر ۲۵ مگابایت</span>
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t px-5 py-4 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            {submitting ? "در حال ثبت..." : "ثبت و ادامه"}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? "در حال ثبت..." : "ثبت و افزودن به برنامه"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
