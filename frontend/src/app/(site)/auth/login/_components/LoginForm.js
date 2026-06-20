"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSmartphone, FiKey, FiArrowLeft, FiEdit3 } from "react-icons/fi";
import {
  isValidIranPhone,
  isValidOtp,
  toastError,
  toastSuccess,
} from "../../_components/helpers";
import { api } from "@/lib/axios/client";
import { getPostLoginPath } from "@/lib/auth/roles";
import { persistAuthSession } from "@/lib/auth/session";
import { Eye, EyeClosed, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const router = useRouter();

  const [mode, setMode] = useState("password"); // "password" | "otp"

  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);

  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const canSendOtp = useMemo(() => !otpSent && !phoneLocked, [otpSent, phoneLocked]);

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp("");
    setPhoneLocked(false);
  };

  const handleAuthSuccess = (data) => {
    persistAuthSession(data);
    router.replace(getPostLoginPath(data?.user?.role, data?.user?.isProfileComplete));
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
        <Button
        variant="ghost"
        asChild
        >
        <Link
          href="/auth/register"
        >
          ثبت نام
        </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="site-segmented mt-5">
        <button
          onClick={() => switchMode("password")}
          className={[
            "site-segmented-item",
            mode === "password" ? "site-segmented-item-active" : "",
          ].join(" ")}
        >
          ورود با رمز
        </button>
        <button
          onClick={() => switchMode("otp")}
          className={[
            "site-segmented-item",
            mode === "otp" ? "site-segmented-item-active" : "",
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
            <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              placeholder="شماره موبایل (09xxxxxxxxx)"
              className="w-full site-input py-3 pl-4 placeholder:pr-6 disabled:opacity-70 "
              inputMode="numeric"
              disabled={phoneLocked}
            />
          </div>

          {phoneLocked && (
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

        {mode === "password" ? (
          <>
            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                className="w-full site-input py-3 pl-4 pr-11 placeholder:pr-6 "
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeClosed /> : <Eye />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot" className="text-xs text-on-surface-variant hover:text-on-surface">
                فراموشی رمز عبور؟
              </Link>
            </div>

            <button
              onClick={onLoginPassword}
              className="site-btn-primary"
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
                className="site-btn-secondary w-full font-extrabold"
              >
                ارسال رمز <FiKey />
              </button>
            )}

            {/* OTP input (shown after sending) */}
            {otpSent && (
              <div className="relative">
                <FiKey className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="کد OTP"
                  className="w-full site-input py-3 pl-4 pr-11"
                  inputMode="numeric"
                />
                <div className="mt-2 text-[11px] site-muted">
                  Demo OTP: <span className="text-on-surface-variant">12345</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot" className="text-xs text-on-surface-variant hover:text-on-surface">
                فراموشی رمز عبور؟
              </Link>

              {otpSent && (
                <button
                  onClick={onSendOtp}
                  className="text-xs text-surface-tint hover:opacity-80"
                >
                  ارسال مجدد
                </button>
              )}
            </div>

            <button
              onClick={onLoginOtp}
              className="site-btn-primary"
            >
              ورود با OTP <FiArrowLeft />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
