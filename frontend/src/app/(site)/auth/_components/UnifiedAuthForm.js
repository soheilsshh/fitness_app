"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Phone,
  RefreshCw,
  User,
  UserRound,
} from "lucide-react";
import {
  isValidIranPhone,
  isValidOtp,
  normalizeIranPhone,
  toEnglishDigits,
  toastError,
  toastSuccess,
} from "./helpers";
import { useOtpResendCooldown } from "./useOtpResendCooldown";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** @typedef {"phone" | "login" | "register"} AuthStep */

const inputClass =
  "h-12 rounded-xl border-border/80 bg-background/60 ps-10 text-base transition-[box-shadow,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-ring/40";

export default function UnifiedAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = readRedirectParam(searchParams);
  const forgotHref = buildAuthUrl("/auth/forgot", returnPath);
  const formId = useId();

  /** @type {[AuthStep, Function]} */
  const [step, setStep] = useState("phone");
  const [loginMode, setLoginMode] = useState("password");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isChecking, setIsChecking] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { secondsLeft, canResend, startCooldown, syncFromResponse, resetCooldown } =
    useOtpResendCooldown();

  const busy = isChecking || isSendingOtp || isSubmitting;

  const resetBranchState = () => {
    setPassword("");
    setShowPassword(false);
    setOtpSent(false);
    setOtp("");
    setFirstName("");
    setLastName("");
    setLoginMode("password");
    resetCooldown();
  };

  const goBackToPhone = () => {
    resetBranchState();
    setStep("phone");
  };

  const handleAuthSuccess = (data, message) => {
    persistAuthSession(data);
    toastSuccess(message, "خوش آمدید.");
    const target = resolvePostAuthPath({
      role: data?.user?.role,
      isProfileComplete: data?.user?.isProfileComplete,
      nextPath: returnPath,
    });
    router.replace(target);
  };

  const onContinueWithPhone = async (e) => {
    e?.preventDefault?.();
    const normalizedPhone = normalizeIranPhone(phone);
    if (!isValidIranPhone(normalizedPhone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }
    setPhone(normalizedPhone);

    setIsChecking(true);
    try {
      const res = await api.post("/auth/check-phone", { phone: normalizedPhone });
      const exists = Boolean(res.data?.exists);
      resetBranchState();
      setStep(exists ? "login" : "register");
    } catch (error) {
      const msg =
        error?.response?.data?.error || "بررسی شماره ناموفق بود. دوباره تلاش کنید.";
      toastError("خطا", msg);
    } finally {
      setIsChecking(false);
    }
  };

  const onSendOtp = async () => {
    const normalizedPhone = normalizeIranPhone(phone);
    if (!isValidIranPhone(normalizedPhone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را درست وارد کنید.");
    }
    setPhone(normalizedPhone);

    setIsSendingOtp(true);
    try {
      await api.post("/auth/otp/request", { phone: normalizedPhone });
      setOtpSent(true);
      setOtp("");
      startCooldown();
      toastSuccess("ارسال شد", "کد یکبار مصرف پیامک شد.");
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

  const onLoginPassword = async (e) => {
    e?.preventDefault?.();
    if (password.length < 6) {
      return toastError("رمز عبور کوتاه است", "رمز عبور باید حداقل ۶ کاراکتر باشد.");
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/login/password", {
        identifier: normalizeIranPhone(phone),
        password,
      });
      handleAuthSuccess(res.data, "ورود موفق");
    } catch (error) {
      const msg = error?.response?.data?.error || "ورود ناموفق بود.";
      toastError("خطا در ورود", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLoginOtp = async (e) => {
    e?.preventDefault?.();
    if (!otpSent) {
      return toastError("کد ارسال نشده", "ابتدا کد را دریافت کنید.");
    }
    const code = toEnglishDigits(otp).trim();
    if (!isValidOtp(code)) {
      return toastError("کد نامعتبر", "کد را به صورت عددی وارد کنید.");
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/otp/verify", {
        phone: normalizeIranPhone(phone),
        code,
      });
      handleAuthSuccess(res.data, "ورود موفق");
    } catch (error) {
      const msg =
        error?.response?.data?.error || "کد وارد شده صحیح نیست یا منقضی شده است.";
      toastError("OTP نامعتبر", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegister = async (e) => {
    e?.preventDefault?.();
    if (!otpSent) {
      return toastError("کد ارسال نشده", "ابتدا کد تایید را دریافت کنید.");
    }
    const code = toEnglishDigits(otp).trim();
    if (!isValidOtp(code)) {
      return toastError("کد نامعتبر", "کد تایید را صحیح وارد کنید.");
    }
    if (!firstName.trim() || !lastName.trim()) {
      return toastError("اطلاعات ناقص", "نام و نام خانوادگی را وارد کنید.");
    }
    if (password.length < 6) {
      return toastError("رمز عبور کوتاه است", "رمز عبور باید حداقل ۶ کاراکتر باشد.");
    }

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();

    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/register", {
        name,
        phone: normalizeIranPhone(phone),
        password,
        code,
      });
      handleAuthSuccess(res.data, "ثبت‌نام موفق");
    } catch (error) {
      const msg = error?.response?.data?.error || "ثبت‌نام ناموفق بود.";
      toastError("خطا در ثبت‌نام", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles = {
    phone: {
      title: "ورود یا ثبت‌نام",
      description: "فقط شماره موبایل کافی است؛ بقیه مسیر خودکار تنظیم می‌شود.",
    },
    login: {
      title: "خوش برگشتید",
      description: "با رمز عبور یا کد پیامکی وارد حساب شوید.",
    },
    register: {
      title: "ساخت حساب جدید",
      description: "کد تایید را بگیرید، سپس اطلاعات حساب را کامل کنید.",
    },
  };

  const current = titles[step];

  return (
    <Card className="rounded-2xl border-0 bg-card/90 shadow-lg shadow-black/5 ring-1 ring-border/60 backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-2 text-center">
        <StepIndicator step={step} />
        <div className="space-y-1.5">
          <CardTitle className="font-iranianSansBlack text-xl sm:text-2xl">
            {current.title}
          </CardTitle>
          <CardDescription className="mx-auto max-w-sm text-pretty text-sm leading-relaxed">
            {current.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {step === "phone" && (
          <form
            onSubmit={onContinueWithPhone}
            className="animate-in fade-in duration-200 motion-reduce:animate-none"
          >
            <FieldGroup className="gap-5">
              <PhoneField
                id={`${formId}-phone`}
                phone={phone}
                onChange={setPhone}
                disabled={busy}
                autoFocus
              />

              <PrimaryButton type="submit" disabled={busy} loading={isChecking}>
                {isChecking ? "در حال بررسی..." : "ادامه"}
              </PrimaryButton>
            </FieldGroup>
          </form>
        )}

        {step === "login" && (
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
            <LockedPhoneBar phone={phone} onEdit={goBackToPhone} disabled={busy} />

            <Tabs
              value={loginMode}
              onValueChange={(next) => {
                setLoginMode(next);
                setPassword("");
                setOtp("");
                setOtpSent(false);
                resetCooldown();
              }}
              className="mt-5"
            >
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl p-1">
                <TabsTrigger value="password" className="h-10 cursor-pointer rounded-lg">
                  با رمز عبور
                </TabsTrigger>
                <TabsTrigger value="otp" className="h-10 cursor-pointer rounded-lg">
                  با کد پیامکی
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="mt-5">
                <form onSubmit={onLoginPassword}>
                  <FieldGroup className="gap-5">
                    <PasswordField
                      id={`${formId}-login-password`}
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggleShow={() => setShowPassword((v) => !v)}
                      disabled={busy}
                      autoComplete="current-password"
                      autoFocus
                    />

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full cursor-pointer"
                      asChild
                    >
                      <Link href={forgotHref}>فراموشی رمز عبور</Link>
                    </Button>

                    <PrimaryButton type="submit" disabled={busy} loading={isSubmitting}>
                      {isSubmitting ? "در حال ورود..." : "ورود به حساب"}
                    </PrimaryButton>
                  </FieldGroup>
                </form>
              </TabsContent>

              <TabsContent value="otp" className="mt-5">
                <form onSubmit={onLoginOtp}>
                  <FieldGroup className="gap-5">
                    {!otpSent ? (
                      <PrimaryButton
                        type="button"
                        disabled={busy}
                        loading={isSendingOtp}
                        onClick={onSendOtp}
                        icon={!isSendingOtp ? <KeyRound /> : null}
                      >
                        {isSendingOtp ? "در حال ارسال..." : "ارسال کد تایید"}
                      </PrimaryButton>
                    ) : (
                      <>
                        <OtpField
                          id={`${formId}-login-otp`}
                          value={otp}
                          onChange={setOtp}
                          disabled={busy}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full cursor-pointer gap-2"
                          onClick={onSendOtp}
                          disabled={busy || !canResend}
                        >
                          {isSendingOtp ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <RefreshCw className="size-4" />
                          )}
                          {isSendingOtp
                            ? "در حال ارسال..."
                            : secondsLeft > 0
                              ? `ارسال مجدد (${secondsLeft})`
                              : "ارسال مجدد کد"}
                        </Button>
                        <PrimaryButton type="submit" disabled={busy} loading={isSubmitting}>
                          {isSubmitting ? "در حال ورود..." : "ورود با کد"}
                        </PrimaryButton>
                      </>
                    )}
                  </FieldGroup>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === "register" && (
          <form
            onSubmit={onRegister}
            className="animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
          >
            <FieldGroup className="gap-5">
              <LockedPhoneBar phone={phone} onEdit={goBackToPhone} disabled={busy} />

              {!otpSent ? (
                <PrimaryButton
                  type="button"
                  disabled={busy}
                  loading={isSendingOtp}
                  onClick={onSendOtp}
                  icon={!isSendingOtp ? <KeyRound /> : null}
                >
                  {isSendingOtp ? "در حال ارسال..." : "ارسال کد تایید"}
                </PrimaryButton>
              ) : (
                <>
                  <OtpField
                    id={`${formId}-register-otp`}
                    value={otp}
                    onChange={setOtp}
                    disabled={busy}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full cursor-pointer gap-2"
                    onClick={onSendOtp}
                    disabled={busy || !canResend}
                  >
                    {isSendingOtp ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    {isSendingOtp
                      ? "در حال ارسال..."
                      : secondsLeft > 0
                        ? `ارسال مجدد (${secondsLeft})`
                        : "ارسال مجدد کد"}
                  </Button>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor={`${formId}-first-name`}>نام</FieldLabel>
                      <div className="relative">
                        <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={`${formId}-first-name`}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="نام"
                          className={inputClass}
                          autoComplete="given-name"
                          disabled={busy}
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`${formId}-last-name`}>نام خانوادگی</FieldLabel>
                      <Input
                        id={`${formId}-last-name`}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="نام خانوادگی"
                        className="h-12 rounded-xl border-border/80 bg-background/60 text-base"
                        autoComplete="family-name"
                        disabled={busy}
                      />
                    </Field>
                  </div>

                  <PasswordField
                    id={`${formId}-register-password`}
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggleShow={() => setShowPassword((v) => !v)}
                    disabled={busy}
                    autoComplete="new-password"
                    description="حداقل ۶ کاراکتر"
                  />

                  <PrimaryButton type="submit" disabled={busy} loading={isSubmitting}>
                    {isSubmitting ? "در حال ساخت حساب..." : "ساخت حساب"}
                  </PrimaryButton>

                  <FieldDescription className="text-center">
                    با ادامه، قوانین و حریم خصوصی را می‌پذیرید.
                  </FieldDescription>
                </>
              )}
            </FieldGroup>
          </form>
        )}
      </CardContent>

      {step === "phone" && (
        <CardFooter className="flex-col gap-3 border-t border-border/50 pt-4">
          <p className="text-center text-sm text-muted-foreground">مربی هستید؟</p>
          <Button
            variant="outline"
            className="h-11 w-full cursor-pointer gap-2"
            asChild
          >
            <Link href="/auth/register/coach">
              <UserRound className="size-4" />
              ثبت‌نام به‌عنوان مربی
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function PrimaryButton({
  children,
  loading,
  icon,
  className,
  type = "button",
  disabled,
  ...props
}) {
  return (
    <Button
      type={type}
      size="lg"
      className={cn(
        "h-12 w-full cursor-pointer gap-2 rounded-xl text-base font-iranianSansDemiBold transition-transform duration-200 active:scale-[0.98] motion-reduce:active:scale-100",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        icon || <ArrowLeft className="size-4" />
      )}
      {children}
    </Button>
  );
}

function StepIndicator({ step }) {
  const steps = [
    { id: "phone", label: "شماره" },
    { id: "auth", label: step === "register" ? "ثبت‌نام" : "ورود" },
  ];
  const activeIndex = step === "phone" ? 0 : 1;

  return (
    <nav
      aria-label="مراحل احراز هویت"
      className="flex items-center justify-center gap-2"
    >
      {steps.map((s, index) => {
        const active = index === activeIndex;
        const done = index < activeIndex;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-iranianSansMedium transition-colors duration-200",
                active && "bg-primary text-primary-foreground",
                done && "bg-primary/15 text-primary",
                !active && !done && "bg-muted text-muted-foreground"
              )}
              aria-current={active ? "step" : undefined}
            >
              {s.label}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-10 transition-colors duration-200 sm:w-14",
                  done ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

function LockedPhoneBar({ phone, onEdit, disabled }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/50 px-3 py-2.5">
      <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">شماره موبایل</div>
        <div className="truncate text-sm font-iranianSansMedium tracking-wide" dir="ltr">
          {phone}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 shrink-0 cursor-pointer gap-1.5 px-3"
        onClick={onEdit}
        disabled={disabled}
      >
        <Pencil className="size-3.5" />
        ویرایش
      </Button>
    </div>
  );
}

function PhoneField({ id, phone, onChange, disabled, autoFocus }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>شماره موبایل</FieldLabel>
      <div className="relative">
        <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={phone}
          onChange={(e) => onChange(normalizeIranPhone(e.target.value))}
          placeholder="09xxxxxxxxx"
          className={cn(inputClass, "tracking-wide")}
          inputMode="numeric"
          autoComplete="tel"
          autoFocus={autoFocus}
          disabled={disabled}
          dir="ltr"
        />
      </div>
      <FieldDescription>مثلاً ۰۹۱۲۳۴۵۶۷۸۹</FieldDescription>
    </Field>
  );
}

function OtpField({ id, value, onChange, disabled, autoFocus }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>کد تایید</FieldLabel>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(toEnglishDigits(e.target.value).trim())}
          placeholder="کد پیامک‌شده"
          className={cn(inputClass, "tracking-[0.25em]")}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          disabled={disabled}
          dir="ltr"
        />
      </div>
    </Field>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  show,
  onToggleShow,
  disabled,
  autoFocus,
  autoComplete = "current-password",
  description,
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>رمز عبور</FieldLabel>
      <div className="relative">
        <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="رمز عبور"
          className={cn(inputClass, "pe-12")}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 size-10 -translate-y-1/2 cursor-pointer"
          onClick={onToggleShow}
          aria-label={show ? "مخفی کردن رمز" : "نمایش رمز"}
          disabled={disabled}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
