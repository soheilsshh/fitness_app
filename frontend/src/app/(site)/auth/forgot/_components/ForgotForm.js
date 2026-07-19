"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Phone,
  RefreshCw,
} from "lucide-react";
import {
  isValidIranPhone,
  isValidOtp,
  normalizeIranPhone,
  toEnglishDigits,
  toastError,
  toastSuccess,
} from "../../_components/helpers";
import { useOtpResendCooldown } from "../../_components/useOtpResendCooldown";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 rounded-xl border-border/80 bg-background/60 ps-10 text-base transition-[box-shadow,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/40";

export default function ForgotForm() {
  const formId = useId();
  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");

  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { secondsLeft, canResend, startCooldown, syncFromResponse, resetCooldown } =
    useOtpResendCooldown();

  const busy = isSendingOtp || isResetting;

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setPhoneLocked(false);
    setNewPass("");
    setNewPass2("");
    resetCooldown();
  };

  const sendOtp = async () => {
    const normalizedPhone = normalizeIranPhone(phone);
    if (!isValidIranPhone(normalizedPhone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }
    setPhone(normalizedPhone);

    setIsSendingOtp(true);
    try {
      await api.post("/auth/forgot/send-otp", { phone: normalizedPhone });
      setOtpSent(true);
      setPhoneLocked(true);
      setOtp("");
      startCooldown();
      toastSuccess("ارسال شد", "کد بازیابی ارسال شد.");
    } catch (error) {
      syncFromResponse(error);
      const msg =
        error?.response?.data?.error ||
        "خطا در ارسال کد. لطفاً چند لحظه دیگر دوباره تلاش کنید.";
      toastError("ارسال پیامک", msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpSent) return toastError("کد ارسال نشده", "ابتدا کد را دریافت کنید.");
    const code = toEnglishDigits(otp).trim();
    if (!isValidOtp(code)) return toastError("کد نامعتبر", "کد را صحیح وارد کنید.");
    setOtp(code);
    setOtpVerified(true);
    toastSuccess("تایید شد", "حالا رمز جدید را تعیین کنید.");
  };

  const resetPassword = async (e) => {
    e?.preventDefault?.();
    if (!otpVerified) return toastError("تایید نشده", "ابتدا OTP را تایید کنید.");
    if (newPass.length < 6) return toastError("رمز کوتاه است", "رمز باید حداقل ۶ کاراکتر باشد.");
    if (newPass !== newPass2) return toastError("عدم تطابق", "رمزها یکسان نیستند.");

    setIsResetting(true);
    try {
      await api.post("/auth/reset-password", {
        phone: normalizeIranPhone(phone),
        code: toEnglishDigits(otp).trim(),
        new_password: newPass,
      });
      toastSuccess("موفق", "رمز عبور با موفقیت تغییر کرد.");
      resetOtpFlow();
    } catch (error) {
      const msg = error?.response?.data?.error || "تغییر رمز ناموفق بود.";
      toastError("خطا در تغییر رمز", msg);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-0 bg-card/90 shadow-lg shadow-black/5 ring-1 ring-border/60 backdrop-blur-sm">
      <CardHeader className="space-y-1.5">
        <CardTitle className="font-iranianSansBlack text-xl sm:text-2xl">
          فراموشی رمز عبور
        </CardTitle>
        <CardDescription className="text-pretty text-sm leading-relaxed">
          با شماره موبایل کد بازیابی بگیرید و رمز جدید بسازید.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor={`${formId}-phone`}>شماره موبایل</FieldLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${formId}-phone`}
                  value={phone}
                  onChange={(e) => setPhone(normalizeIranPhone(e.target.value))}
                  placeholder="09xxxxxxxxx"
                  className={cn(inputClass, "tracking-wide")}
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  disabled={phoneLocked || busy}
                />
              </div>
              {phoneLocked && !otpVerified && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 shrink-0 cursor-pointer gap-1.5 px-3"
                  onClick={resetOtpFlow}
                  disabled={busy}
                >
                  <Pencil className="size-4" />
                  ویرایش
                </Button>
              )}
            </div>
          </Field>

          {!otpSent && !otpVerified && (
            <Button
              type="button"
              size="lg"
              className="h-12 w-full cursor-pointer gap-2 rounded-xl text-base font-iranianSansDemiBold"
              onClick={sendOtp}
              disabled={busy}
            >
              {isSendingOtp ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              {isSendingOtp ? "در حال ارسال..." : "ارسال کد بازیابی"}
            </Button>
          )}

          {otpSent && !otpVerified && (
            <>
              <Field>
                <FieldLabel htmlFor={`${formId}-otp`}>کد تایید</FieldLabel>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={`${formId}-otp`}
                    value={otp}
                    onChange={(e) => setOtp(toEnglishDigits(e.target.value).trim())}
                    placeholder="کد پیامک‌شده"
                    className={cn(inputClass, "tracking-[0.25em]")}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    dir="ltr"
                    disabled={busy}
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full cursor-pointer gap-2"
                  onClick={sendOtp}
                  disabled={busy || !canResend}
                >
                  {isSendingOtp ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {secondsLeft > 0 ? `ارسال مجدد (${secondsLeft})` : "ارسال مجدد"}
                </Button>
                <Button
                  type="button"
                  className="h-11 w-full cursor-pointer gap-2"
                  onClick={verifyOtp}
                  disabled={busy}
                >
                  تایید کد
                </Button>
              </div>
            </>
          )}

          {otpVerified && (
            <form onSubmit={resetPassword}>
              <FieldGroup className="gap-5">
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                  شماره تایید شد. رمز جدید را وارد کنید.
                </div>

                <Field>
                  <FieldLabel htmlFor={`${formId}-pass`}>رمز جدید</FieldLabel>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`${formId}-pass`}
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                      disabled={busy}
                    />
                  </div>
                  <FieldDescription>حداقل ۶ کاراکتر</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${formId}-pass2`}>تکرار رمز جدید</FieldLabel>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`${formId}-pass2`}
                      type="password"
                      value={newPass2}
                      onChange={(e) => setNewPass2(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                      disabled={busy}
                    />
                  </div>
                </Field>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full cursor-pointer gap-2 rounded-xl text-base font-iranianSansDemiBold"
                  disabled={busy}
                >
                  {isResetting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowLeft className="size-4" />
                  )}
                  {isResetting ? "در حال تغییر..." : "تغییر رمز عبور"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full cursor-pointer"
                  onClick={resetOtpFlow}
                  disabled={busy}
                >
                  شروع مجدد با شماره دیگر
                </Button>
              </FieldGroup>
            </form>
          )}
        </FieldGroup>
      </CardContent>

      <CardFooter className="flex-col gap-3 border-t border-border/50 pt-4">
        <Button variant="outline" className="h-11 w-full cursor-pointer" asChild>
          <Link href="/auth">برگشت به ورود / ثبت‌نام</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
