"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  FileText,
  GraduationCap,
  Loader2,
  Medal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createAchievement,
  deleteAchievement,
  getAchievements,
  updateAchievement,
  uploadAchievementImage,
} from "@/lib/api/coach";
import { apiAssetUrl } from "@/lib/api/assets";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_TYPES = [
  {
    value: "certificate",
    label: "گواهینامه",
    icon: FileText,
    badgeClass:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    value: "honor",
    label: "افتخار",
    icon: Award,
    badgeClass:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    value: "medal",
    label: "مدال",
    icon: Medal,
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    value: "qualification",
    label: "مدرک",
    icon: GraduationCap,
    badgeClass:
      "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
];

const EMPTY_FORM = {
  type: "certificate",
  title: "",
  issuer: "",
  year: "",
  description: "",
  imageUrl: "",
  isVisible: true,
};

function getTypeMeta(type) {
  return (
    ACHIEVEMENT_TYPES.find((item) => item.value === type) || ACHIEVEMENT_TYPES[0]
  );
}

function AchievementImageUpload({ imageUrl, uploading, disabled, onUpload, onClear }) {
  return (
    <div className="space-y-2">
      <Label>تصویر (اختیاری)</Label>
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={apiAssetUrl(imageUrl)}
            alt="پیش‌نمایش تصویر"
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
            {uploading ? "در حال آپلود..." : "تصویری انتخاب نشده"}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-none"
            disabled={disabled || uploading}
            tabIndex={-1}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
          </Button>
        </label>
        {imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading}
            onClick={onClear}
          >
            حذف تصویر
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AchievementFormFields({ form, onChange, uploadingImage, onImageUpload, onImageClear }) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>نوع</Label>
        <Select value={form.type} onValueChange={(value) => onChange("type", value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="نوع را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            {ACHIEVEMENT_TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>عنوان</Label>
        <Input
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="مثلاً مربیگری درجه یک"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>صادرکننده / سازمان</Label>
          <Input
            value={form.issuer}
            onChange={(e) => onChange("issuer", e.target.value)}
            placeholder="مثلاً فدراسیون بدنسازی"
          />
        </div>
        <div className="space-y-2">
          <Label>سال</Label>
          <Input
            type="number"
            inputMode="numeric"
            dir="ltr"
            value={form.year}
            onChange={(e) => onChange("year", e.target.value)}
            placeholder="1402"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>توضیحات</Label>
        <Textarea
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          placeholder="جزئیات اختیاری درباره این مورد..."
        />
      </div>

      <AchievementImageUpload
        imageUrl={form.imageUrl}
        uploading={uploadingImage}
        onUpload={onImageUpload}
        onClear={onImageClear}
      />

      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
        <Checkbox
          id="achievement-visible"
          checked={form.isVisible}
          onCheckedChange={(checked) => onChange("isVisible", !!checked)}
        />
        <div className="text-start">
          <Label htmlFor="achievement-visible" className="font-medium">
            نمایش در لندینگ عمومی
          </Label>
          <CardDescription className="mt-1">
            در صورت غیرفعال بودن، این مورد فقط در پنل شما دیده می‌شود.
          </CardDescription>
        </div>
      </div>
    </div>
  );
}

export default function CoachAchievementsEditor({ readOnly = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [items],
  );

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAchievements();
      setItems(list);
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "بارگذاری افتخارات ناموفق بود"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const updateFormField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const url = await uploadAchievementImage(file);
      if (url) {
        updateFormField("imageUrl", url);
        toastSuccess("آپلود شد", "تصویر با موفقیت ذخیره شد");
      }
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "آپلود ناموفق بود"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClear = () => {
    updateFormField("imageUrl", "");
  };

  const resetDialog = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadingImage(false);
  };

  const openCreateDialog = () => {
    resetDialog();
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setUploadingImage(false);
    setEditingId(item.id);
    setForm({
      type: item.type || "certificate",
      title: item.title || "",
      issuer: item.issuer || "",
      year: item.year != null ? String(item.year) : "",
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      isVisible: item.isVisible !== false,
    });
    setDialogOpen(true);
  };

  const buildPayload = () => {
    const payload = {
      type: form.type,
      title: form.title.trim(),
      issuer: form.issuer.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      isVisible: form.isVisible,
    };
    const year = form.year.trim();
    if (year) {
      payload.year = Number(year);
    }
    return payload;
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toastError("خطا", "عنوان الزامی است.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        const updated = await updateAchievement(editingId, payload);
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item)),
        );
        toastSuccess("ذخیره شد", "افتخار با موفقیت به‌روزرسانی شد");
      } else {
        const created = await createAchievement(payload);
        setItems((prev) => [...prev, created]);
        toastSuccess("افزوده شد", "افتخار جدید با موفقیت ثبت شد");
      }
      setDialogOpen(false);
      resetDialog();
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "ذخیره ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`«${item.title}» حذف شود؟`)) return;

    setDeletingId(item.id);
    try {
      await deleteAchievement(item.id);
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      toastSuccess("حذف شد", "افتخار با موفقیت حذف شد");
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "حذف ناموفق بود"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
        <div className="text-start">
          <CardTitle className="text-base">افتخارات و مدارک</CardTitle>
          <CardDescription className="mt-1">
            گواهینامه‌ها، مدال‌ها و مدارک خود را برای نمایش در لندینگ عمومی اضافه کنید.
          </CardDescription>
        </div>
        <Button type="button" size="sm" onClick={openCreateDialog} disabled={readOnly}>
          <Plus data-icon="inline-start" />
          افزودن مورد جدید
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((key) => (
              <Skeleton key={key} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Medal className="size-6" />
            </div>
            <p className="mt-4 text-sm font-medium">هنوز موردی ثبت نشده است</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              گواهینامه‌ها، افتخارات، مدال‌ها و مدارک خود را اضافه کنید تا در صفحه
              عمومی شما نمایش داده شوند.
            </p>
            <Button type="button" size="sm" className="mt-4" onClick={openCreateDialog} disabled={readOnly}>
              <Plus data-icon="inline-start" />
              اولین مورد را اضافه کنید
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedItems.map((item) => {
              const typeMeta = getTypeMeta(item.type);
              const TypeIcon = typeMeta.icon;

              return (
                <Card key={item.id} size="sm" className="overflow-hidden">
                  {item.imageUrl ? (
                    <div className="border-b bg-muted/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={apiAssetUrl(item.imageUrl)}
                        alt={item.title}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center border-b bg-muted/20 text-muted-foreground">
                      <TypeIcon className="size-8 opacity-60" />
                    </div>
                  )}

                  <CardContent className="space-y-3 pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn("gap-1.5", typeMeta.badgeClass)}
                      >
                        <TypeIcon className="size-3.5" />
                        {typeMeta.label}
                      </Badge>
                      {item.isVisible === false ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          مخفی
                        </Badge>
                      ) : null}
                    </div>

                    <div className="text-start">
                      <h3 className="font-medium leading-snug">{item.title}</h3>
                      {item.issuer ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.issuer}</p>
                      ) : null}
                      {item.year ? (
                        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                          {item.year.toLocaleString("fa-IR")}
                        </p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {!readOnly ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil data-icon="inline-start" />
                            ویرایش
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                            ) : (
                              <Trash2 data-icon="inline-start" />
                            )}
                            حذف
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش افتخار / مدرک" : "افزودن افتخار / مدرک"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات مورد نظر را وارد کنید. موارد قابل مشاهده در لندینگ عمومی شما نمایش
              داده می‌شوند.
            </DialogDescription>
          </DialogHeader>

          <AchievementFormFields
            form={form}
            onChange={updateFormField}
            uploadingImage={uploadingImage}
            onImageUpload={handleImageUpload}
            onImageClear={handleImageClear}
          />

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || uploadingImage}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : null}
              {saving
                ? "در حال ذخیره..."
                : editingId
                  ? "ذخیره تغییرات"
                  : "افزودن"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving || uploadingImage}
              onClick={() => setDialogOpen(false)}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
