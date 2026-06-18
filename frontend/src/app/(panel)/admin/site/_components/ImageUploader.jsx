"use client";

import { useEffect, useMemo, useState } from "react";
import { FiImage, FiTrash2, FiUpload } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ImageUploader({ value, onChange }) {
  const [file, setFile] = useState(value?.file || null);

  // Create preview url
  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return value?.url || null;
  }, [file, value?.url]);

  // Revoke object url to avoid leaks
  useEffect(() => {
    if (!file) return;
    const url = previewUrl;
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const onPick = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setFile(f);
    onChange?.({ file: f, url: null }); // later: upload to API and store url
  };

  const onRemove = () => {
    setFile(null);
    onChange?.(null);
  };

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>آپلود تصویر</CardTitle>
          <p className="text-sm text-muted-foreground">تصویر بخش اصلی/بنر صفحه اصلی</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="cursor-pointer">
            <Button type="button" variant="outline" asChild>
              <span>
                <FiUpload />
                انتخاب تصویر
                <input type="file" accept="image/*" onChange={onPick} className="hidden" />
              </span>
            </Button>
          </Label>
          <Button type="button" variant="destructive" onClick={onRemove} disabled={!previewUrl}>
            <FiTrash2 />
            حذف
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="rounded-xl border bg-muted/30 p-4">
        {!previewUrl ? (
          <div className="flex h-[220px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <FiImage />
            هنوز تصویری انتخاب نشده
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="preview"
            className="h-[220px] w-full rounded-lg object-cover"
          />
        )}
        </div>
      </CardContent>
    </Card>
  );
}
