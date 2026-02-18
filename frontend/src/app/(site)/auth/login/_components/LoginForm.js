"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiLock, FiSmartphone, FiKey, FiArrowLeft, FiEdit3 } from "react-icons/fi";
import {
  isValidIranPhone,
  isValidOtp,
  toastError,
  toastSuccess,
} from "../../_components/helpers";
import { api } from "@/lib/axios/client";

export default function LoginForm() {
  const router = useRouter();

  const [mode, setMode] = useState("password"); // "password" | "otp"

  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);

  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const canSendOtp = useMemo(() => !otpSent && !phoneLocked, [otpSent, phoneLocked]);

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp("");
    setPhoneLocked(false);
  };

  const handleAuthSuccess = (data) => {
    const { access_token, refresh_token, user } = data || {};
    if (access_token) {
      window.localStorage.setItem("access_token", access_token);
    }
    if (refresh_token) {
      window.localStorage.setItem("refresh_token", refresh_token);
    }
    if (user?.role) {
      window.localStorage.setItem("user_role", user.role);
    }
    if (user?.name) {
      window.localStorage.setItem("user_name", user.name);
    }

    const target =
      user?.role === "admin"
        ? "/admin/dashboard"
        : "/user/my-programs";
    router.replace(target);
  };

  const onSendOtp = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }

    try {
      await api.post("/auth/otp/request", { phone });
      setOtpSent(true);
      setPhoneLocked(true);
      setOtp("");
      return toastSuccess("ارسال شد", "کد یکبار مصرف ارسال شد.");
    } catch (error) {
      const msg = error?.response?.data?.error || "خطا در ارسال کد.";
      return toastError("خطا", msg);
    }
  };

  const onLoginPassword = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را درست وارد کنید.");
    }
    if (password.length < 6) {
      return toastError("رمز عبور کوتاه است", "رمز عبور باید حداقل ۶ کاراکتر باشد.");
    }

    try {
      const res = await api.post("/auth/login/password", {
        identifier: phone,
        password,
      });
      await toastSuccess("ورود موفق", "با موفقیت وارد شدید.");
      handleAuthSuccess(res.data);
    } catch (error) {
      const msg = error?.response?.data?.error || "ورود ناموفق بود.";
      return toastError("خطا در ورود", msg);
    }
  };

  const onLoginOtp = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را درست وارد کنید.");
    }
    if (!otpSent) {
      return toastError("کد ارسال نشده", "ابتدا روی «ارسال رمز» بزنید.");
    }
    if (!isValidOtp(otp)) {
      return toastError("کد نامعتبر", "کد را به صورت عددی وارد کنید.");
    }

    try {
      const res = await api.post("/auth/otp/verify", {
        phone,
        code: otp,
      });
      await toastSuccess("ورود موفق", "با OTP وارد شدید.");
      handleAuthSuccess(res.data);
    } catch (error) {
      const msg = error?.response?.data?.error || "کد وارد شده صحیح نیست یا منقضی شده است.";
      return toastError("OTP نامعتبر", msg);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);

    // Reset mode-specific states
    setPassword("");
    resetOtpFlow();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">ورود</h1>
        <Link
          href="/auth/register"
          className="text-sm text-emerald-200 hover:text-emerald-100"
        >
          ثبت نام
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-zinc-950/35 p-2">
        <button
          onClick={() => switchMode("password")}
          className={[
            "rounded-xl px-3 py-2 text-sm font-semibold",
            mode === "password" ? "bg-white text-zinc-950" : "text-zinc-200 hover:bg-white/5",
          ].join(" ")}
        >
          ورود با رمز
        </button>
        <button
          onClick={() => switchMode("otp")}
          className={[
            "rounded-xl px-3 py-2 text-sm font-semibold",
            mode === "otp" ? "bg-white text-zinc-950" : "text-zinc-200 hover:bg-white/5",
          ].join(" ")}
        >
          ورود با OTP
        </button>
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

          {phoneLocked && (
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

        {mode === "password" ? (
          <>
            {/* Password */}
            <div className="relative">
              <FiLock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 py-3 pl-4 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot" className="text-xs text-zinc-300 hover:text-white">
                فراموشی رمز عبور؟
              </Link>
            </div>

            <button
              onClick={onLoginPassword}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
            >
              ورود <FiArrowLeft />
            </button>
          </>
        ) : (
          <>
            {/* Send OTP (hidden after sending) */}
            {canSendOtp && (
              <button
                onClick={onSendOtp}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/10"
              >
                ارسال رمز <FiKey />
              </button>
            )}

            {/* OTP input (shown after sending) */}
            {otpSent && (
              <div className="relative">
                <FiKey className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
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
            )}

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot" className="text-xs text-zinc-300 hover:text-white">
                فراموشی رمز عبور؟
              </Link>

              {otpSent && (
                <button
                  onClick={onSendOtp}
                  className="text-xs text-emerald-200 hover:text-emerald-100"
                >
                  ارسال مجدد
                </button>
              )}
            </div>

            <button
              onClick={onLoginOtp}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
            >
              ورود با OTP <FiArrowLeft />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
