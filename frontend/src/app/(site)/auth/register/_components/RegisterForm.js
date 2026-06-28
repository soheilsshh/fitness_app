"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, Pencil, Phone, User } from "lucide-react";
import {
  isValidIranPhone,
  isValidOtp,
  toastError,
  toastSuccess,
} from "../../_components/helpers";
import { useOtpResendCooldown } from "../../_components/useOtpResendCooldown";
import { api } from "@/lib/axios/client";
import { persistAuthSession } from "@/lib/auth/session";
import {
  buildAuthUrl,
  readRedirectParam,
  resolvePostAuthPath,
} from "@/lib/auth/postAuthRedirect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = readRedirectParam(searchParams);
  const loginHref = buildAuthUrl("/auth/login", returnPath);

  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { secondsLeft, canResend, startCooldown, syncFromResponse, resetCooldown } =
    useOtpResendCooldown();

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setPhoneLocked(false);
    resetCooldown();
  };

  const sendOtp = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }

    setIsSendingOtp(true);
    try {
      await api.post("/auth/otp/request", { phone });
      setOtpSent(true);
      setPhoneLocked(true);
      setOtp("");
      startCooldown();
      return toastSuccess("ارسال شد", "کد تایید ارسال شد.");
    } catch (error) {
      syncFromResponse(error);
      const msg =
        error?.response?.data?.error ||
        "خطا در ارسال کد. لطفاً چند لحظه دیگر دوباره تلاش کنید.";
      return toastError("ارسال پیامک", msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpSent) return toastError("کد ارسال نشده", "ابتدا روی «ارسال رمز» بزنید.");
    if (!isValidOtp(otp)) return toastError("کد نامعتبر", "کد را صحیح وارد کنید.");

    setOtpVerified(true);
    return toastSuccess("تایید شد", "شماره شما تایید شد. حالا اطلاعات را کامل کنید.");
  };

  const handleAuthSuccess = (data) => {
    persistAuthSession(data);
    const target = resolvePostAuthPath({
      role: data?.user?.role,
      isProfileComplete: data?.user?.isProfileComplete,
      nextPath: returnPath,
    });
    router.replace(target);
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
    const email = `${phone}@phone.local`;

    setIsRegistering(true);
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
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ثبت نام</CardTitle>
        <CardDescription>برای ساخت حساب جدید شماره موبایل خود را وارد کنید</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={loginHref}>ورود</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="register-phone">شماره موبایل</FieldLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.trim())}
                  placeholder="09xxxxxxxxx"
                  className="ps-9"
                  inputMode="numeric"
                  disabled={phoneLocked || isRegistering}
                />
              </div>
              {phoneLocked && !otpVerified && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={resetOtpFlow}
                  disabled={isSendingOtp || isRegistering}
                  aria-label="ویرایش شماره موبایل"
                  title="ویرایش شماره"
                >
                  <Pencil />
                </Button>
              )}
            </div>
          </Field>

          {!otpSent && !otpVerified && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={sendOtp}
              disabled={isSendingOtp || isRegistering}
            >
              {isSendingOtp ? "در حال ارسال..." : "ارسال رمز"}
              {!isSendingOtp && <KeyRound />}
            </Button>
          )}

          {otpSent && !otpVerified && (
            <>
              <Field>
                <FieldLabel htmlFor="register-otp">کد OTP</FieldLabel>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    placeholder="کد OTP"
                    className="ps-9"
                    inputMode="numeric"
                  />
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={sendOtp}
                  disabled={isSendingOtp || isRegistering || !canResend}
                >
                  {isSendingOtp
                    ? "در حال ارسال..."
                    : secondsLeft > 0
                      ? `ارسال مجدد (${secondsLeft})`
                      : "ارسال مجدد"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={verifyOtp}
                >
                  تایید کد
                </Button>
              </div>
            </>
          )}

          {otpVerified && (
            <>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                شماره موبایل تایید شد.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="register-first-name">نام</FieldLabel>
                  <div className="relative">
                    <User className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="نام"
                      className="ps-9"
                      disabled={isRegistering}
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="register-last-name">نام خانوادگی</FieldLabel>
                  <Input
                    id="register-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="نام خانوادگی"
                    disabled={isRegistering}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="register-password">رمز عبور</FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="ps-9"
                    disabled={isRegistering}
                  />
                </div>
                <FieldDescription>رمز عبور باید حداقل ۶ کاراکتر باشد.</FieldDescription>
              </Field>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={submitRegister}
                disabled={isRegistering}
              >
                {isRegistering ? "در حال ساخت حساب..." : "ساخت حساب"}
                {!isRegistering && <ArrowLeft />}
              </Button>
            </>
          )}

          <FieldDescription className="text-center">
            با ثبت نام، قوانین و حریم خصوصی را می‌پذیرید.
          </FieldDescription>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
