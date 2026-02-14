"use client";

import { useEffect, useMemo, useState } from "react";
import { FiImage, FiTrash2, FiUpload } from "react-icons/fi";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

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
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">آپلود تصویر</div>
          <div className="mt-1 text-sm text-zinc-300">
            تصویر بخش اصلی/بنر صفحه اصلی 
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2 text-sm font-bold text-zinc-100 hover:bg-white/10">
            <FiUpload />
            انتخاب تصویر
            <input
              type="file"
              accept="image/*"
              onChange={onPick}
              className="hidden"
            />
          </label>

          <button
            onClick={onRemove}
            disabled={!previewUrl}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition",
              previewUrl
                ? "border-rose-400/25 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
                : "border-white/10 bg-white/5 text-zinc-500 opacity-60 pointer-events-none"
            )}
          >
            <FiTrash2 />
            حذف
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950/30 p-4">
        {!previewUrl ? (
          <div className="flex h-[220px] items-center justify-center gap-2 text-sm text-zinc-400">
            <FiImage />
            هنوز تصویری انتخاب نشده
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="preview"
            className="h-[220px] w-full rounded-2xl object-cover"
          />
        )}
      </div>

    </div>
  );
}
