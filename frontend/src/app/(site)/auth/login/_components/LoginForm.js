"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Pencil, Phone } from "lucide-react";
import {
  isValidIranPhone,
  isValidOtp,
  toastError,
  toastSuccess,
} from "../../_components/helpers";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = readRedirectParam(searchParams);
  const registerHref = buildAuthUrl("/auth/register", returnPath);

  const [mode, setMode] = useState("password");

  const [phone, setPhone] = useState("");
  const [phoneLocked, setPhoneLocked] = useState(false);

  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const canSendOtp = useMemo(() => !otpSent && !phoneLocked, [otpSent, phoneLocked]);

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp("");
    setPhoneLocked(false);
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

  const onSendOtp = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }

    setIsSendingOtp(true);
    try {
      await api.post("/auth/otp/request", { phone });
      setOtpSent(true);
      setPhoneLocked(true);
      setOtp("");
      return toastSuccess("ارسال شد", "کد یکبار مصرف ارسال شد.");
    } catch (error) {
      const msg = error?.response?.data?.error || "خطا در ارسال کد.";
      return toastError("خطا", msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onLoginPassword = async () => {
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را درست وارد کنید.");
    }
    if (password.length < 6) {
      return toastError("رمز عبور کوتاه است", "رمز عبور باید حداقل ۶ کاراکتر باشد.");
    }

    setIsLoggingIn(true);
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
    } finally {
      setIsLoggingIn(false);
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

    setIsLoggingIn(true);
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
    } finally {
      setIsLoggingIn(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setPassword("");
    resetOtpFlow();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ورود</CardTitle>
        <CardDescription>برای ورود به حساب خود شماره موبایل را وارد کنید</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={registerHref}>ثبت نام</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Tabs value={mode} onValueChange={switchMode}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">ورود با رمز</TabsTrigger>
            <TabsTrigger value="otp">ورود با OTP</TabsTrigger>
          </TabsList>

          <FieldGroup className="mt-4 gap-4">
            <Field>
              <FieldLabel htmlFor="login-phone">شماره موبایل</FieldLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.trim())}
                    placeholder="09xxxxxxxxx"
                    className="ps-9"
                    inputMode="numeric"
                    disabled={phoneLocked || isLoggingIn}
                  />
                </div>
                {phoneLocked && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={resetOtpFlow}
                    disabled={isSendingOtp || isLoggingIn}
                    aria-label="ویرایش شماره موبایل"
                    title="ویرایش شماره"
                  >
                    <Pencil />
                  </Button>
                )}
              </div>
            </Field>

            <TabsContent value="password" className="mt-0 space-y-4">
              <Field>
                <FieldLabel htmlFor="login-password">رمز عبور</FieldLabel>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور"
                    className="pe-9"
                    disabled={isLoggingIn}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute end-1 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                  <Link href="/auth/forgot">فراموشی رمز عبور؟</Link>
                </Button>
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={onLoginPassword}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "در حال ورود..." : "ورود"}
                {!isLoggingIn && <ArrowLeft />}
              </Button>
            </TabsContent>

            <TabsContent value="otp" className="mt-0 space-y-4">
              {canSendOtp && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={onSendOtp}
                  disabled={isSendingOtp || isLoggingIn}
                >
                  {isSendingOtp ? "در حال ارسال..." : "ارسال رمز"}
                  {!isSendingOtp && <KeyRound />}
                </Button>
              )}

              {otpSent && (
                <Field>
                  <FieldLabel htmlFor="login-otp">کد OTP</FieldLabel>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.trim())}
                      placeholder="کد OTP"
                      className="ps-9"
                      inputMode="numeric"
                      disabled={isLoggingIn}
                    />
                  </div>
                  <FieldDescription>
                    Demo OTP: <span className="text-foreground">12345</span>
                  </FieldDescription>
                </Field>
              )}

              <div className="flex items-center justify-between">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                  <Link href="/auth/forgot">فراموشی رمز عبور؟</Link>
                </Button>
                {otpSent && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={onSendOtp}
                    disabled={isSendingOtp || isLoggingIn}
                  >
                    {isSendingOtp ? "در حال ارسال..." : "ارسال مجدد"}
                  </Button>
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={onLoginOtp}
                disabled={isLoggingIn || !otpSent}
              >
                {isLoggingIn ? "در حال ورود..." : "ورود با OTP"}
                {!isLoggingIn && <ArrowLeft />}
              </Button>
            </TabsContent>
          </FieldGroup>
        </Tabs>
      </CardContent>
    </Card>
  );
}
