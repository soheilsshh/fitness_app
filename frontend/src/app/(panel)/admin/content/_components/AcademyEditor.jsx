"use client";

import { useMemo } from "react";
import {
  BookOpenText,
  Headphones,
  Plus,
  Trash2,
  Upload,
  VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { uploadContentMedia } from "@/lib/api/content";
import { apiAssetUrl } from "@/lib/api/assets";
import { newAcademyId, sortAcademyItems } from "@/lib/api/contentHelpers";

const typeMeta = {
  podcast: { label: "پادکست", icon: Headphones },
  video: { label: "ویدیو", icon: VideoIcon },
  text: { label: "متن", icon: BookOpenText },
};

export default function AcademyEditor({ value, onChange }) {
  const items = useMemo(() => sortAcademyItems(value || []), [value]);

  const updateItem = (id, patch) => {
    onChange?.(
      (value || []).map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (id) => {
    onChange?.((value || []).filter((item) => item.id !== id));
  };

  const addItem = (type) => {
    const next = {
      id: newAcademyId(type),
      type,
      title: "",
      description: "",
      body: "",
      category: "عمومی",
      featured: false,
      duration: type === "text" ? "" : "00:00",
      src: "",
      cover: "linear-gradient(155deg,#2a9c96,#145e5a)",
      sortOrder: (value?.length || 0) + 1,
    };
    onChange?.([...(value || []), next]);
  };

  const uploadFile = async (id, field, file) => {
    if (!file) return;
    try {
      const res = await uploadContentMedia(file);
      if (res?.url) updateItem(id, { [field]: res.url });
    } catch {
      // parent save bar handles global errors; silent here
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {items.length.toLocaleString("fa-IR")} آموزش ثبت‌شده
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => addItem("podcast")}>
            <Plus className="size-4" />
            پادکست
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => addItem("video")}>
            <Plus className="size-4" />
            ویدیو
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => addItem("text")}>
            <Plus className="size-4" />
            متن
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            هنوز آموزشی اضافه نشده. از دکمه‌های بالا یک نوع محتوا بسازید.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {items.map((item) => {
            const meta = typeMeta[item.type] || typeMeta.text;
            const Icon = meta.icon;
            return (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="rounded-xl border px-3"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-start">
                    <Badge variant="secondary" className="gap-1">
                      <Icon className="size-3.5" />
                      {meta.label}
                    </Badge>
                    <span className="truncate font-iranianSansDemiBold text-sm">
                      {item.title || "بدون عنوان"}
                    </span>
                    {item.featured ? (
                      <Badge className="ms-auto shrink-0">ویژه</Badge>
                    ) : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>نوع</Label>
                      <Select
                        value={item.type}
                        onValueChange={(v) => updateItem(item.id, { type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="podcast">پادکست</SelectItem>
                          <SelectItem value="video">ویدیو</SelectItem>
                          <SelectItem value="text">متن</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>دسته‌بندی</Label>
                      <Input
                        value={item.category || ""}
                        onChange={(e) =>
                          updateItem(item.id, { category: e.target.value })
                        }
                        placeholder="مثال: شروع مسیر"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>عنوان</Label>
                    <Input
                      value={item.title || ""}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>توضیح کوتاه</Label>
                    <Textarea
                      rows={3}
                      value={item.description || ""}
                      onChange={(e) =>
                        updateItem(item.id, { description: e.target.value })
                      }
                    />
                  </div>

                  {item.type === "text" ? (
                    <div className="space-y-2">
                      <Label>متن کامل آموزش</Label>
                      <Textarea
                        rows={6}
                        value={item.body || ""}
                        onChange={(e) => updateItem(item.id, { body: e.target.value })}
                        placeholder="محتوای کامل که کاربر هنگام مطالعه می‌بیند"
                      />
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    {item.type !== "text" ? (
                      <>
                        <div className="space-y-2">
                          <Label>مدت زمان نمایشی</Label>
                          <Input
                            value={item.duration || ""}
                            onChange={(e) =>
                              updateItem(item.id, { duration: e.target.value })
                            }
                            placeholder="12:40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>آدرس فایل (URL یا آپلود)</Label>
                          <Input
                            value={item.src || ""}
                            onChange={(e) =>
                              updateItem(item.id, { src: e.target.value })
                            }
                            placeholder="https://... یا /uploads/content/..."
                            dir="ltr"
                          />
                          <Label className="cursor-pointer">
                            <Button type="button" variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="size-4" />
                                آپلود فایل رسانه
                                <input
                                  type="file"
                                  accept={
                                    item.type === "podcast"
                                      ? "audio/*"
                                      : "video/*"
                                  }
                                  className="hidden"
                                  onChange={(e) =>
                                    uploadFile(
                                      item.id,
                                      "src",
                                      e.target.files?.[0]
                                    )
                                  }
                                />
                              </span>
                            </Button>
                          </Label>
                        </div>
                      </>
                    ) : null}

                    <div className="space-y-2 md:col-span-2">
                      <Label>کاور (گرادیان CSS یا URL تصویر)</Label>
                      <Input
                        value={item.cover || ""}
                        onChange={(e) =>
                          updateItem(item.id, { cover: e.target.value })
                        }
                        placeholder="linear-gradient(...) یا /uploads/content/..."
                      />
                      <Label className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            <Upload className="size-4" />
                            آپلود تصویر کاور
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                uploadFile(
                                  item.id,
                                  "cover",
                                  e.target.files?.[0]
                                )
                              }
                            />
                          </span>
                        </Button>
                      </Label>
                      {item.cover ? (
                        <div
                          className="mt-2 h-24 rounded-xl border"
                          style={
                            item.cover.includes("gradient")
                              ? { background: item.cover }
                              : {
                                  backgroundImage: `url(${apiAssetUrl(item.cover)})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                          }
                        />
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label>ترتیب نمایش</Label>
                      <Input
                        type="number"
                        value={item.sortOrder ?? 0}
                        onChange={(e) =>
                          updateItem(item.id, {
                            sortOrder: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`featured-${item.id}`}
                      checked={!!item.featured}
                      onCheckedChange={(v) =>
                        updateItem(item.id, { featured: !!v })
                      }
                    />
                    <Label htmlFor={`featured-${item.id}`}>نمایش در بخش ویژه</Label>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-4" />
                    حذف این آموزش
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
