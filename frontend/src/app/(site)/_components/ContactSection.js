"use client";

import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";
import InlineSocialIcons from "./InlineSocialIcons";

export default function ContactSection() {

  const siteSettings = {
    socialLinks: {
      instagram: "https://instagram.com/",
      telegram: "https://t.me/",
      whatsapp: "https://wa.me/989000000000",
    },
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
                <FiPhone className="text-emerald-300 text-lg" />
                <div className="text-sm text-zinc-200">0912 000 0000</div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
                <FiMail className="text-emerald-300 text-lg" />
                <div className="text-sm text-zinc-200">support@fitpro.ir</div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
                <FiMapPin className="text-emerald-300 text-lg" />
                <div className="text-sm text-zinc-200">تهران، ایران</div>
              </div>
              <InlineSocialIcons links={siteSettings.socialLinks} />
            </div>
          </motion.div>

          {/* form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 md:p-7"
          >
            <div className="text-sm font-extrabold text-white">فرم تماس</div>
            <div className="mt-1 text-sm text-zinc-300">
              تمام فیلد ها ضروری هستند. ما در اسرع وقت پاسخ می‌دهیم.
            </div>

            <form className="mt-5 space-y-3">
              <input
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                placeholder="نام و نام خانوادگی"
              />
              <input
                className="w-full rounded-2xl border border-white/10 bg-zinc-950/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                placeholder="شماره موبایل یا ایمیل"
              />
              <textarea
                rows={5}
                className="w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/35 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
                placeholder="پیام شما..."
              />
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 hover:bg-zinc-200"
              >
                ارسال پیام <FiSend />
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
