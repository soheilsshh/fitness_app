"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Phone,
  User,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { persistAuthSession } from "@/lib/auth/session";
import {
  isValidIranPhone,
  normalizeIranPhone,
  toastError,
  toastSuccess,
} from "../../../_components/helpers";
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

export default function CoachRegisterForm() {
  const router = useRouter();
  const formId = useId();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
      return toastError("اطلاعات ناقص", "نام، موبایل و رمز عبور را پر کنید");
    }
    const phone = normalizeIranPhone(form.phone);
    if (!isValidIranPhone(phone)) {
      return toastError("شماره نامعتبر", "شماره موبایل را با فرمت 09xxxxxxxxx وارد کنید.");
    }
    if (form.password.length < 6) {
      return toastError("رمز عبور کوتاه است", "رمز عبور باید حداقل ۶ کاراکتر باشد.");
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register/coach", {
        name: form.name.trim(),
        phone,
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
    <Card className="rounded-2xl border-0 bg-card/90 shadow-lg shadow-black/5 ring-1 ring-border/60 backdrop-blur-sm">
      <CardHeader className="space-y-1.5">
        <CardTitle className="font-iranianSansBlack text-xl sm:text-2xl">
          ثبت‌نام مربی
        </CardTitle>
        <CardDescription className="text-pretty text-sm leading-relaxed">
          حساب مربی بسازید و پروفایل عمومی خود را تکمیل کنید.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor={`${formId}-name`}>نام کامل</FieldLabel>
              <div className="relative">
                <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${formId}-name`}
                  value={form.name}
                  onChange={setField("name")}
                  className={inputClass}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
              <FieldDescription>
                نام نمایشی و آدرس لندینگ پس از بررسی توسط ادمین تنظیم می‌شود.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor={`${formId}-phone`}>شماره موبایل</FieldLabel>
              <div className="relative">
                <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${formId}-phone`}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      phone: normalizeIranPhone(e.target.value),
                    }))
                  }
                  placeholder="09xxxxxxxxx"
                  className={cn(inputClass, "tracking-wide")}
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  disabled={loading}
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor={`${formId}-password`}>رمز عبور</FieldLabel>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`${formId}-password`}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={setField("password")}
                  className={cn(inputClass, "pe-12")}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1/2 size-10 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <FieldDescription>حداقل ۶ کاراکتر</FieldDescription>
            </Field>

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full cursor-pointer gap-2 rounded-xl text-base font-iranianSansDemiBold transition-transform duration-200 active:scale-[0.98] motion-reduce:active:scale-100"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowLeft className="size-4" />
              )}
              {loading ? "در حال ثبت‌نام..." : "ثبت‌نام به‌عنوان مربی"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-3 border-t border-border/50 pt-4">
        <p className="text-center text-sm text-muted-foreground">دانشجو هستید؟</p>
        <Button variant="outline" className="h-11 w-full cursor-pointer" asChild>
          <Link href="/auth">ورود / ثبت‌نام دانشجو</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
