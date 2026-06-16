"use client";

import { useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import InlineSocialIcons from "./InlineSocialIcons";
import { TiltCard } from "./landingEffects";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";

const DEFAULT_CONTACT = {
  address: "تهران، سعادت آباد، برج فیت‌پرو",
  phone: "+۹۸ ۲۱ ۲۸۴۲ ۱۰۰۰",
  email: "info@fitpro.academy",
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

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 p-4 text-right outline-none transition-all focus:border-surface-tint focus:ring-2 focus:ring-surface-tint/20";
  const inputErrorClass = "border-red-400/70 focus:border-red-400 focus:ring-red-400/20";
  const labelClass = "block text-xs text-on-surface-variant";

  return (
    <section id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12 md:py-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6 }}
          className="glass space-y-10 rounded-[2rem] border border-white/5 p-10 text-right"
        >
          <div>
            <h2 className="mb-4 text-4xl font-extrabold text-primary md:text-5xl">
              راهنمایی می‌خوای؟ <span className="gradient-text">پیام بده</span>
            </h2>
            <p className="text-base leading-8 text-on-surface-variant md:text-lg">
              سوالی دارید؟ مربیان ما آماده پاسخگویی و ارائه مشاوره رایگان به شما هستند.
            </p>
          </div>

          <div className="space-y-6">
            <div className="group flex flex-row-reverse items-center gap-4">
              <FiMail className="text-xl text-surface-tint transition-transform group-hover:scale-110" />
              <span className="text-base text-on-surface" dir="ltr">{info.email}</span>
            </div>
            <div className="group flex flex-row-reverse items-center gap-4">
              <FiPhone className="text-xl text-surface-tint transition-transform group-hover:scale-110" />
              <span className="text-base text-on-surface" dir="ltr">{info.phone}</span>
            </div>
            <div className="group flex flex-row-reverse items-center gap-4">
              <FiMapPin className="text-xl text-surface-tint transition-transform group-hover:scale-110" />
              <span className="text-base text-on-surface">{info.address}</span>
            </div>
          </div>

          <div className="flex justify-end border-t border-outline-variant/10 pt-10">
            <InlineSocialIcons links={socialLinks} />
          </div>
        </motion.div>

        {/* Form card */}
        <TiltCard className="glow-card relative h-full overflow-hidden rounded-[2rem] p-10">
          <div className="gradient-bg absolute top-0 right-0 h-32 w-32 opacity-5 blur-3xl" />
          <form className="relative z-10 space-y-6 text-right" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor={nameId} className={labelClass}>
                نام و نام خانوادگی <span className="text-red-400">*</span>
              </label>
              <input
                id={nameId}
                ref={nameRef}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClass} ${errors.fullName ? inputErrorClass : ""}`}
                placeholder="مثلا: علی محمدی"
                type="text"
                name="name"
                autoComplete="name"
                required
                aria-required="true"
                aria-invalid={errors.fullName ? "true" : undefined}
                aria-describedby={errors.fullName ? `${nameId}-error` : undefined}
              />
              {errors.fullName && (
                <p id={`${nameId}-error`} role="alert" className="text-xs text-red-400">
                  {errors.fullName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor={contactId} className={labelClass}>
                شماره موبایل یا ایمیل <span className="text-red-400">*</span>
              </label>
              <input
                id={contactId}
                ref={contactRef}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className={`${inputClass} ${errors.contact ? inputErrorClass : ""}`}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
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
                <p id={`${contactId}-error`} role="alert" className="text-xs text-red-400">
                  {errors.contact}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor={messageId} className={labelClass}>
                پیغام شما <span className="text-red-400">*</span>
              </label>
              <textarea
                id={messageId}
                ref={messageRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${inputClass} resize-none ${errors.message ? inputErrorClass : ""}`}
                placeholder="چطور می‌توانیم به شما کمک کنیم؟"
                rows={4}
                name="message"
                required
                aria-required="true"
                aria-invalid={errors.message ? "true" : undefined}
                aria-describedby={errors.message ? `${messageId}-error` : undefined}
              />
              {errors.message && (
                <p id={`${messageId}-error`} role="alert" className="text-xs text-red-400">
                  {errors.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="shimmer-btn w-full rounded-lg py-5 text-xl font-extrabold text-background shadow-xl shadow-surface-tint/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "در حال ارسال..." : "ارسال درخواست مشاوره"}
            </button>
          </form>
        </TiltCard>
      </div>
    </section>
  );
}
