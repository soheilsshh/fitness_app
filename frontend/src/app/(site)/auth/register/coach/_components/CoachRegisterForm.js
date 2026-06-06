"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiUser, FiSmartphone, FiMail, FiLock, FiLink } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { persistAuthSession } from "@/lib/auth/session";
import { toastError, toastSuccess } from "../../../_components/helpers";

export default function CoachRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    slug: "",
    phone: "",
    email: "",
    password: "",
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.password.trim()) {
      return toastError("اطلاعات ناقص", "فیلدهای ضروری را پر کنید");
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/register/coach", {
        name: form.name.trim(),
        displayName: form.displayName.trim() || form.name.trim(),
        slug: form.slug.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      persistAuthSession(res.data);
      toastSuccess("ثبت‌نام موفق", "حساب مربی ساخته شد");
      router.replace("/coach/profile");
    } catch (error) {
      const msg = error?.response?.data?.error || "ثبت‌نام ناموفق بود";
      toastError("خطا", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm text-zinc-300">نام کامل</span>
        <div className="relative">
          <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-10 pl-3 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </div>
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-300">نام نمایشی (اختیاری)</span>
        <input
          value={form.displayName}
          onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-3 text-sm text-white outline-none focus:border-emerald-400/40"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-300">شناسه لینک (اختیاری)</span>
        <div className="relative">
          <FiLink className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            placeholder="ali-rezaei"
            dir="ltr"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-10 pl-3 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </div>
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-300">موبایل</span>
        <div className="relative">
          <FiSmartphone className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            dir="ltr"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-10 pl-3 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </div>
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-300">ایمیل</span>
        <div className="relative">
          <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            dir="ltr"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-10 pl-3 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </div>
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-300">رمز عبور</span>
        <div className="relative">
          <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-10 pl-3 text-sm text-white outline-none focus:border-emerald-400/40"
          />
        </div>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-extrabold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {loading ? "در حال ثبت‌نام..." : "ثبت‌نام به عنوان مربی"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        دانشجو هستید؟{" "}
        <Link href="/auth/register" className="text-emerald-300 hover:underline">
          ثبت‌نام دانشجو
        </Link>
      </p>
    </form>
  );
}
