"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCopy, FiExternalLink, FiSave } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";

function ImageUploadBox({ label, url, onUpload, uploading }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-bold text-white">{label}</div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apiAssetUrl(url)} alt={label} className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
            تصویری انتخاب نشده
          </div>
        )}
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 hover:bg-white/10">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
      </label>
    </div>
  );
}

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null);

  const [form, setForm] = useState({
    slug: "",
    displayName: "",
    title: "",
    bio: "",
    aboutCoach: "",
    specialty: "",
    contactPhone: "",
    instagram: "",
    telegram: "",
    whatsapp: "",
    website: "",
    isPublished: false,
    avatarUrl: "",
    coverImageUrl: "",
    publicUrl: "",
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/coach/profile");
      const p = res.data;
      setForm({
        slug: p.slug || "",
        displayName: p.displayName || "",
        title: p.title || "",
        bio: p.bio || "",
        aboutCoach: p.aboutCoach || "",
        specialty: p.specialty || "",
        contactPhone: p.social?.phone || "",
        instagram: p.social?.instagram || "",
        telegram: p.social?.telegram || "",
        whatsapp: p.social?.whatsapp || "",
        website: p.social?.website || "",
        isPublished: !!p.isPublished,
        avatarUrl: p.avatarUrl || "",
        coverImageUrl: p.coverImageUrl || "",
        publicUrl: p.publicUrl || "",
      });
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "بارگذاری پروفایل ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!form.slug || form.slug.length < 3) {
      setSlugStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/coach/profile/slug/check", {
          params: { slug: form.slug },
        });
        setSlugStatus(res.data?.available ? "available" : "taken");
      } catch {
        setSlugStatus(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.slug]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadImage = async (file, endpoint, setUploading, urlKey) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        updateField(urlKey, res.data.url);
      }
      toastSuccess("آپلود شد", "تصویر با موفقیت ذخیره شد");
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "آپلود ناموفق بود");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/coach/profile", {
        slug: form.slug,
        displayName: form.displayName,
        title: form.title,
        bio: form.bio,
        aboutCoach: form.aboutCoach,
        specialty: form.specialty,
        contactPhone: form.contactPhone,
        instagram: form.instagram,
        telegram: form.telegram,
        whatsapp: form.whatsapp,
        website: form.website,
        isPublished: form.isPublished,
      });
      const p = res.data;
      setForm((prev) => ({
        ...prev,
        publicUrl: p.publicUrl || prev.publicUrl,
        isPublished: !!p.isPublished,
      }));
      toastSuccess("ذخیره شد", "پروفایل با موفقیت به‌روزرسانی شد");
    } catch (error) {
      toastError("خطا", error?.response?.data?.error || "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const copyPublicLink = async () => {
    const path = form.publicUrl || `/coach/${form.slug}`;
    const full = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(full);
      toastSuccess("کپی شد", "لینک پروفایل کپی شد");
    } catch {
      toastError("خطا", "کپی لینک ناموفق بود");
    }
  };

  if (loading) {
    return <div className="text-sm text-zinc-400">در حال بارگذاری پروفایل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white">پروفایل مربی</h1>
          <p className="mt-1 text-sm text-zinc-400">
            اطلاعات لندینگ عمومی و راه‌های ارتباطی خود را مدیریت کنید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyPublicLink}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 hover:bg-white/10"
          >
            <FiCopy />
            کپی لینک
          </button>
          <a
            href={form.publicUrl || `/coach/${form.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 hover:bg-white/10"
          >
            <FiExternalLink />
            پیش‌نمایش
          </a>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || slugStatus === "taken"}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            <FiSave />
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImageUploadBox
          label="تصویر کاور"
          url={form.coverImageUrl}
          uploading={uploadingCover}
          onUpload={(file) =>
            uploadImage(file, "/coach/profile/cover", setUploadingCover, "coverImageUrl")
          }
        />
        <ImageUploadBox
          label="آواتار"
          url={form.avatarUrl}
          uploading={uploadingAvatar}
          onUpload={(file) =>
            uploadImage(file, "/coach/profile/avatar", setUploadingAvatar, "avatarUrl")
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">نام نمایشی</span>
          <input
            value={form.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">شناسه لینک (slug)</span>
          <input
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
            dir="ltr"
          />
          {slugStatus === "available" && (
            <span className="text-xs text-emerald-400">شناسه در دسترس است</span>
          )}
          {slugStatus === "taken" && (
            <span className="text-xs text-rose-400">شناسه قبلاً استفاده شده</span>
          )}
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-sm text-zinc-300">عنوان / تخصص کوتاه</span>
          <input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="مثلاً مربی بدنسازی"
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-sm text-zinc-300">معرفی کوتاه</span>
          <textarea
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-sm text-zinc-300">درباره مربی</span>
          <textarea
            value={form.aboutCoach}
            onChange={(e) => updateField("aboutCoach", e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">تخصص</span>
          <input
            value={form.specialty}
            onChange={(e) => updateField("specialty", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">شماره تماس</span>
          <input
            value={form.contactPhone}
            onChange={(e) => updateField("contactPhone", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
            dir="ltr"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">اینستاگرام</span>
          <input
            value={form.instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
            dir="ltr"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">تلگرام</span>
          <input
            value={form.telegram}
            onChange={(e) => updateField("telegram", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
            dir="ltr"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">واتساپ</span>
          <input
            value={form.whatsapp}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
            dir="ltr"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">وب‌سایت</span>
          <input
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40"
            dir="ltr"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => updateField("isPublished", e.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
        <div>
          <div className="text-sm font-bold text-white">انتشار پروفایل عمومی</div>
          <div className="text-xs text-zinc-400">
            با فعال‌سازی، لندینگ شما در آدرس عمومی قابل مشاهده خواهد بود.
          </div>
        </div>
      </label>
    </div>
  );
}
