"use client";

import { useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import InlineSocialIcons from "./InlineSocialIcons";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DEFAULT_CONTACT = {
  address: "",
  phone: "09921906934",
  email: "fitinoo.ir@gmail.com",
  instagram: "https://instagram.com/fiti.noo",
  telegram: "https://t.me/fiti_noo",
  whatsapp: "https://wa.me/989921906934",
};

function ContactRow({ icon: Icon, label, value, dir }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 px-3.5 py-3 transition-colors hover:border-primary/30 hover:bg-background/80">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 text-start">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-iranianSansDemiBold text-foreground" dir={dir}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function ContactSection({ contactInfo }) {
  const info = { ...DEFAULT_CONTACT, ...(contactInfo || {}) };
  const socialLinks = {
    instagram: info.instagram,
    telegram: info.telegram,
    whatsapp: info.whatsapp,
  };

  const fieldId = useId();
  const nameId = `${fieldId}-name`;
  const contactId = `${fieldId}-contact`;
  const messageId = `${fieldId}-message`;

  const nameRef = useRef(null);
  const contactRef = useRef(null);
  const messageRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!fullName.trim()) next.fullName = "نام و نام خانوادگی را وارد کنید.";
    if (!contact.trim()) next.contact = "شماره موبایل را وارد کنید.";
    if (!message.trim()) next.message = "متن پیام نمی‌تواند خالی باشد.";
    return next;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      if (found.fullName) nameRef.current?.focus();
      else if (found.contact) contactRef.current?.focus();
      else messageRef.current?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const isEmail = contact.includes("@");
      await api.post("/feedbacks", {
        fullName: fullName.trim(),
        email: isEmail ? contact.trim() : "",
        phone: isEmail ? "" : contact.trim(),
        message: message.trim(),
      });
      toastSuccess("ارسال شد", "پیام شما ثبت شد. به زودی پاسخ می‌دهیم.");
      setFullName("");
      setContact("");
      setMessage("");
    } catch (err) {
      toastError("خطا", err?.response?.data?.error || "ارسال پیام ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" dir="rtl" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:px-6 md:py-16">
      <div className="mb-8 space-y-2 text-center md:mb-10">
        <p className="text-xs font-iranianSansDemiBold tracking-wide text-primary">
          ⚡️ ارتباط با آکادمی فیتینو
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          نیاز به مشاوره و{" "}
          <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
            راهنمایی
          </span>{" "}
          دارید؟
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-7 text-foreground/85 md:text-base">
          چنانچه پیش از شروع دوره نیاز به اطلاعات بیشتری دارید، سوال خود را مطرح کنید؛ تیم
          کارشناسان فیتینو آماده پاسخگویی به شما هستند.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {/* Info — visually right in RTL */}
        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="pointer-events-none absolute -start-16 top-0 size-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -end-10 bottom-0 size-36 rounded-full bg-chart-2/10 blur-3xl" />

          <div className="relative space-y-5">
            <div className="space-y-1.5 text-start">
              <h3 className="text-lg font-iranianSansBlack text-foreground">
                کانال‌های ارتباط مستقیم
              </h3>
              <p className="text-sm leading-7 text-foreground/80">
                از طریق بسترهای زیر می‌توانید به‌صورت مستقیم با آکادمی فیتینو در ارتباط باشید:
              </p>
            </div>

            <div className="space-y-2.5">
              <ContactRow
                icon={Mail}
                label="✉️ پست الکترونیک (ایمیل)"
                value={info.email}
                dir="ltr"
              />
              <ContactRow
                icon={Phone}
                label="📞 شماره تماس پشتیبانی"
                value={info.phone}
                dir="ltr"
              />
              {info.address ? (
                <ContactRow icon={MapPin} label="📍 آدرس مرکزی آکادمی" value={info.address} />
              ) : null}
            </div>

            <div className="border-t border-border/60 pt-4">
              <div className="mb-2.5 text-start text-[11px] text-muted-foreground">
                📱 شبکه‌های اجتماعی
              </div>
              <InlineSocialIcons links={socialLinks} />
            </div>
          </div>
        </motion.aside>

        {/* Form — visually left in RTL */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.06 }}
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="pointer-events-none absolute end-0 top-0 size-40 rounded-full bg-primary/8 blur-3xl" />

          <form className="relative space-y-4 text-start" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5 pb-1">
              <h3 className="text-lg font-iranianSansBlack text-foreground">
                درخواست مشاوره اختصاصی
              </h3>
              <p className="text-sm leading-7 text-foreground/80">
                فرم زیر را تکمیل کنید؛ کمتر از ۲۴ ساعت کاری با شما تماس می‌گیریم.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={nameId} className="text-xs text-foreground/90">
                  نام و نام خانوادگی <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={nameId}
                  ref={nameRef}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی محمدی"
                  className={cn(
                    "h-11 rounded-xl border-border/70 bg-background/60 text-start",
                    errors.fullName && "border-destructive/50"
                  )}
                  name="name"
                  autoComplete="name"
                  required
                  aria-required="true"
                  aria-invalid={errors.fullName ? "true" : undefined}
                  aria-describedby={errors.fullName ? `${nameId}-error` : undefined}
                />
                {errors.fullName && (
                  <p id={`${nameId}-error`} role="alert" className="text-xs text-destructive">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={contactId} className="text-xs text-foreground/90">
                  شماره موبایل <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={contactId}
                  ref={contactRef}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className={cn(
                    "h-11 rounded-xl border-border/70 bg-background/60 text-start",
                    errors.contact && "border-destructive/50"
                  )}
                  name="contact"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  required
                  aria-required="true"
                  aria-invalid={errors.contact ? "true" : undefined}
                  aria-describedby={errors.contact ? `${contactId}-error` : undefined}
                />
                {errors.contact && (
                  <p id={`${contactId}-error`} role="alert" className="text-xs text-destructive">
                    {errors.contact}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={messageId} className="text-xs text-foreground/90">
                پیام شما <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={messageId}
                ref={messageRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="هدف ورزشی یا سوال خود را به‌طور خلاصه بنویسید..."
                rows={4}
                className={cn(
                  "min-h-28 rounded-xl border-border/70 bg-background/60 text-start leading-7",
                  errors.message && "border-destructive/50"
                )}
                name="message"
                required
                aria-required="true"
                aria-invalid={errors.message ? "true" : undefined}
                aria-describedby={errors.message ? `${messageId}-error` : undefined}
              />
              {errors.message && (
                <p id={`${messageId}-error`} role="alert" className="text-xs text-destructive">
                  {errors.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="gradient-bg h-11 w-full rounded-xl font-iranianSansBlack text-primary-foreground hover:opacity-90"
              disabled={submitting}
            >
              {submitting ? (
                "در حال ارسال..."
              ) : (
                <>
                  ثبت و ارسال درخواست مشاوره 📨
                  <Send className="size-4" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
