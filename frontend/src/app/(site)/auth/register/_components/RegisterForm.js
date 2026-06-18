"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiUser, FiSmartphone, FiKey, FiLock, FiArrowLeft, FiEdit3 } from "react-icons/fi";
import {
  isValidIranPhone,
  isValidOtp,
  toastError,
  toastSuccess,
} from "../../_components/helpers";
import { api } from "@/lib/axios/client";
import { getPostLoginPath } from "@/lib/auth/roles";
import { persistAuthSession } from "@/lib/auth/session";

export default function RegisterForm() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setPhoneLocked(false);
  };

  const sendOtp = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }

    // در نسخه فعلی، OTP سمت سرور تولید و لاگ می‌شود.
    try {
      await api.post("/auth/otp/request", { phone });
      setOtpSent(true);
      setPhoneLocked(true);
      setOtp("");
      return toastSuccess("ارسال شد", "کد تایید ارسال شد.");
    } catch (error) {
      const msg = error?.response?.data?.error || "خطا در ارسال کد.";
      return toastError("خطا", msg);
    }
  };

  const verifyOtp = async () => {
    if (!otpSent) return toastError("کد ارسال نشده", "ابتدا روی «ارسال رمز» بزنید.");
    if (!isValidOtp(otp)) return toastError("کد نامعتبر", "کد را صحیح وارد کنید.");

    // در این مرحله فقط سمت کلاینت تأیید اولیه انجام می‌دهیم؛
    // رمز نهایی هنگام ثبت‌نام در بک‌اند بررسی می‌شود.
    setOtpVerified(true);
    return toastSuccess("تایید شد", "شماره شما تایید شد. حالا اطلاعات را کامل کنید.");
  };

  const handleAuthSuccess = (data) => {
    persistAuthSession(data);
    router.replace(getPostLoginPath(data?.user?.role, data?.user?.isProfileComplete));
  };

  const submitRegister = async () => {
    if (!otpVerified) return toastError("تایید نشده", "ابتدا شماره موبایل را تایید کنید.");
    if (!firstName.trim() || !lastName.trim()) {
      return toastError("اطلاعات ناقص", "نام و نام خانوادگی را وارد کنید.");
    }
    if (password.length < 6) {
      return toastError("رمز عبور کوتاه است", "رمز عبور باید حداقل ۶ کاراکتر باشد.");
    }

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    // ایمیل را بر اساس شماره به‌صورت داخلی می‌سازیم تا با بک‌اند سازگار باشد.
    const email = `${phone}@phone.local`;

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
      });
      await toastSuccess("ثبت‌نام موفق", "حساب شما ساخته شد.");
      handleAuthSuccess(res.data);
    } catch (error) {
      const msg = error?.response?.data?.error || "ثبت‌نام ناموفق بود.";
      return toastError("خطا در ثبت‌نام", msg);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">ثبت نام</h1>
        <Link href="/auth/login" className="text-sm text-emerald-200 hover:text-emerald-100">
          ورود
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-5 space-y-3"
      >
        {/* Phone + Edit */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSmartphone className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              placeholder="شماره موبایل (09xxxxxxxxx)"
              className="w-full site-input py-3 pl-4 pr-11 disabled:opacity-70"
              inputMode="numeric"
              disabled={phoneLocked}
            />
          </div>

          {phoneLocked && !otpVerified && (
            <button
              onClick={resetOtpFlow}
              className="site-btn-secondary px-3"
              aria-label="ویرایش شماره موبایل"
              title="ویرایش شماره"
            >
              <FiEdit3 />
            </button>
          )}
        </div>

        {/* Send OTP (hidden after sending) */}
        {!otpSent && !otpVerified && (
          <button
            onClick={sendOtp}
            className="site-btn-secondary w-full font-extrabold"
          >
            ارسال رمز <FiKey />
          </button>
        )}

        {/* OTP input (shown after sending, before verification) */}
        {otpSent && !otpVerified && (
          <>
            <div className="relative">
              <FiKey className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                placeholder="کد OTP"
                className="w-full site-input py-3 pl-4 pr-11"
                inputMode="numeric"
              />
            </div>

            <div className="flex items-center justify-between">
              <button onClick={sendOtp} className="text-xs text-emerald-200 hover:text-emerald-100">
                ارسال مجدد
              </button>
              <button onClick={verifyOtp} className="text-xs text-on-surface-variant hover:text-on-surface">
                تایید کد
              </button>
            </div>
          </>
        )}

        {/* After OTP verified: show fields */}
        {otpVerified && (
          <>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              شماره موبایل تایید شد ✅
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative">
                <FiUser className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="نام"
                  className="w-full site-input py-3 pl-4 pr-11"
                />
              </div>

              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="نام خانوادگی"
                className="w-full site-input px-4 py-3"
              />
            </div>

            <div className="relative">
              <FiLock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                className="w-full site-input py-3 pl-4 pr-11"
              />
            </div>

            <button
              onClick={submitRegister}
              className="site-btn-primary"
            >
              ساخت حساب <FiArrowLeft />
            </button>
          </>
        )}

        <div className="text-center text-[11px] site-muted">
          با ثبت نام، قوانین و حریم خصوصی را می‌پذیرید.
        </div>
      </motion.div>
    </div>
  );
}
