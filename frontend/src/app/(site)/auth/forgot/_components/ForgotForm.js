"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiSmartphone, FiKey, FiLock, FiArrowLeft, FiEdit3 } from "react-icons/fi";
import {
  isValidIranPhone,
  isValidOtp,
  toastError,
  toastSuccess,
} from "../../_components/helpers";

const DEMO_OTP = "12345"; // demo only

export default function ForgotForm() {
  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");

  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setPhoneLocked(false);
    setNewPass("");
    setNewPass2("");
  };

  const sendOtp = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }

    // TODO: axios.post('/auth/forgot/send-otp', { phone })
    setOtpSent(true);
    setPhoneLocked(true);
    setOtp("");

    return toastSuccess("ارسال شد", "کد بازیابی ارسال شد (دمو: 12345).");
  };

  const verifyOtp = async () => {
    if (!otpSent) return toastError("کد ارسال نشده", "ابتدا روی «ارسال رمز» بزنید.");
    if (!isValidOtp(otp)) return toastError("کد نامعتبر", "کد را صحیح وارد کنید.");
    if (otp !== DEMO_OTP) return toastError("کد اشتباه است", "کد وارد شده صحیح نیست (دمو: 12345).");

    // TODO: axios.post('/auth/forgot/verify-otp', { phone, otp })
    setOtpVerified(true);
    return toastSuccess("تایید شد", "حالا رمز جدید را تعیین کنید.");
  };

  const resetPassword = async () => {
    if (!otpVerified) return toastError("تایید نشده", "ابتدا OTP را تایید کنید.");
    if (newPass.length < 6) return toastError("رمز کوتاه است", "رمز باید حداقل ۶ کاراکتر باشد.");
    if (newPass !== newPass2) return toastError("عدم تطابق", "رمزها یکسان نیستند.");

    // TODO: axios.post('/auth/reset-password', { phone, otp, newPassword: newPass })
    return toastSuccess("موفق", "رمز عبور با موفقیت تغییر کرد (دمو).");
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">فراموشی رمز عبور</h1>
        <Link href="/auth/login" className="text-sm text-emerald-200 hover:text-emerald-100">
          برگشت به ورود
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
            <FiSmartphone className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              placeholder="شماره موبایل (09xxxxxxxxx)"
              className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 py-3 pl-4 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40 disabled:opacity-70"
              inputMode="numeric"
              disabled={phoneLocked}
            />
          </div>

          {phoneLocked && !otpVerified && (
            <button
              onClick={resetOtpFlow}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-zinc-100 hover:bg-white/10"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/10"
          >
            ارسال رمز <FiKey />
          </button>
        )}

        {/* OTP input (shown after sending, before verification) */}
        {otpSent && !otpVerified && (
          <>
            <div className="relative">
              <FiKey className="pointer-events-none absolute right-4 top-0 bottom-0 my-auto -translate-y-3 text-zinc-400" />
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                placeholder="کد OTP"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 py-3 pl-4 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                inputMode="numeric"
              />
              <div className="mt-2 text-[11px] text-zinc-500">
                Demo OTP: <span className="text-zinc-300">12345</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={sendOtp} className="text-xs text-emerald-200 hover:text-emerald-100">
                ارسال مجدد
              </button>
              <button onClick={verifyOtp} className="text-xs text-zinc-200 hover:text-white">
                تایید کد
              </button>
            </div>
          </>
        )}

        {/* After OTP verified: show new password fields */}
        {otpVerified && (
          <>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              کد تایید شد ✅
            </div>

            <div className="relative">
              <FiLock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="رمز جدید"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 py-3 pl-4 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
              />
            </div>

            <input
              type="password"
              value={newPass2}
              onChange={(e) => setNewPass2(e.target.value)}
              placeholder="تکرار رمز جدید"
              className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
            />

            <button
              onClick={resetPassword}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
            >
              تغییر رمز <FiArrowLeft />
            </button>

            <button
              onClick={resetOtpFlow}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/10"
            >
              تغییر شماره موبایل / شروع مجدد
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
