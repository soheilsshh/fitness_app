"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";
import InlineSocialIcons from "./InlineSocialIcons";
import { api } from "@/lib/axios/client";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";

const DEFAULT_CONTACT = {
  address: "تهران، ایران",
  phone: "0912 000 0000",
  email: "support@fitpro.ir",
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

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !contact.trim() || !message.trim()) {
      toastError("خطا", "همه فیلدها الزامی هستند.");
      return;
    }
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
    <section id="contact" className="scroll-mt-24 py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            className="rounded-[32px] border border-white/10 bg-white/5 p-6 md:p-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/35 px-3 py-1 text-xs text-zinc-200">
              تماس با ما
              <span className="h-1 w-1 rounded-full bg-white/30" />
              پاسخ‌گویی سریع
            </div>

            <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
              راهنمایی می‌خوای؟{" "}
              <span className="text-emerald-300">پیام بده</span>
            </h2>

            <p className="mt-2 text-sm leading-7 text-zinc-300 md:text-base">
              اگر برای انتخاب پلن یا شروع مسیر سوال داری، همینجا پیام بده تا
              راهنماییت کنیم.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
                <FiPhone className="text-lg text-emerald-300" />
                <div className="text-sm text-zinc-200">{info.phone}</div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
                <FiMail className="text-lg text-emerald-300" />
                <div className="text-sm text-zinc-200">{info.email}</div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
                <FiMapPin className="text-lg text-emerald-300" />
                <div className="text-sm text-zinc-200">{info.address}</div>
              </div>
              <InlineSocialIcons links={socialLinks} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="rounded-[32px] border border-white/10 bg-linear-to-b from-white/10 to-white/5 p-6 md:p-7"
          >
            <div className="text-sm font-extrabold text-white">فرم تماس</div>
            <div className="mt-1 text-sm text-zinc-300">
              تمام فیلدها ضروری هستند. ما در اسرع وقت پاسخ می‌دهیم.
            </div>

            <form className="mt-5 space-y-3" onSubmit={onSubmit}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                placeholder="نام و نام خانوادگی"
              />
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                placeholder="شماره موبایل یا ایمیل"
              />
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                placeholder="پیام شما..."
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
              >
                {submitting ? "در حال ارسال..." : "ارسال پیام"} <FiSend />
              </button>
            </form>

            <div className="mt-3 text-center text-[11px] text-zinc-400">
              با ارسال پیام، قوانین و حریم خصوصی را می‌پذیرید.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}