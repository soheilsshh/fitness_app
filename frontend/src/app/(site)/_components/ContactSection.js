"use client";

import { useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import InlineSocialIcons from "./InlineSocialIcons";
import { TiltCard } from "./landingEffects";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_CONTACT = {
  address: "تهران، سعادت آباد، برج فیتینو",
  phone: "+۹۸ ۲۱ ۲۸۴۲ ۱۰۰۰",
  email: "info@fitino.academy",
  instagram: "https://instagram.com/",
  telegram: "https://t.me/",
  whatsapp: "https://wa.me/989000000000",
};

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
    if (!contact.trim()) next.contact = "شماره موبایل یا ایمیل را وارد کنید.";
    if (!message.trim()) next.message = "متن پیام نمی‌تواند خالی باشد.";
    return next;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      // Move focus to the first invalid field so keyboard/screen-reader users land on it.
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
    <section id="contact" dir="rtl" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12 md:py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="h-full bg-card/60 backdrop-blur-sm">
            <CardHeader className="text-start">
              <CardTitle className="text-4xl font-extrabold tracking-tight md:text-5xl">
                راهنمایی می‌خوای؟{" "}
                <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                  پیام بده
                </span>
              </CardTitle>
              <CardDescription className="text-base leading-8 md:text-lg">
                سوالی دارید؟ مربیان ما آماده پاسخگویی و ارائه مشاوره رایگان به شما هستند.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 text-start">
              <div className="group flex flex-row-reverse items-center gap-4">
                <Mail className="size-5 text-primary transition-transform group-hover:scale-110" />
                <span className="text-base text-foreground" dir="ltr">
                  {info.email}
                </span>
              </div>
              <div className="group flex flex-row-reverse items-center gap-4">
                <Phone className="size-5 text-primary transition-transform group-hover:scale-110" />
                <span className="text-base text-foreground" dir="ltr">
                  {info.phone}
                </span>
              </div>
              <div className="group flex flex-row-reverse items-center gap-4">
                <MapPin className="size-5 text-primary transition-transform group-hover:scale-110" />
                <span className="text-base text-foreground">{info.address}</span>
              </div>

              <Separator />

              <div className="flex justify-end pt-2">
                <InlineSocialIcons links={socialLinks} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <TiltCard className="h-full">
          <Card className="relative h-full overflow-hidden bg-linear-to-t from-primary/5 to-card shadow-xs">
            <div className="pointer-events-none absolute top-0 end-0 size-32 rounded-full bg-primary/10 blur-3xl" />
            <CardContent className="relative z-10 pt-6">
              <form className="space-y-6 text-start" onSubmit={onSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor={nameId}>
                    نام و نام خانوادگی <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={nameId}
                    ref={nameRef}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثلا: علی محمدی"
                    className="h-11 text-start"
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
                <div className="space-y-2">
                  <Label htmlFor={contactId}>
                    شماره موبایل یا ایمیل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={contactId}
                    ref={contactRef}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="h-11 text-start"
                    name="contact"
                    inputMode="email"
                    autoComplete="email"
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
                <div className="space-y-2">
                  <Label htmlFor={messageId}>
                    پیغام شما <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id={messageId}
                    ref={messageRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="چطور می‌توانیم به شما کمک کنیم؟"
                    rows={4}
                    className="min-h-28 text-start leading-7"
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
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "در حال ارسال..." : "ارسال درخواست مشاوره"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TiltCard>
      </div>
    </section>
  );
}
