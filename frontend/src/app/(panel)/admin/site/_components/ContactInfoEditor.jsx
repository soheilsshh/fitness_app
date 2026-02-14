"use client";

import { FiInstagram, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ContactInfoEditor({ value, onChange }) {
  const v = value || {
    address: "",
    phone: "",
    email: "",
    instagram: "",
    telegram: "",
    whatsapp: "",
  };

  const setField = (key, val) => onChange?.({ ...v, [key]: val });

  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-white">اطلاعات تماس (تماس با ما)</div>
          <div className="mt-1 text-sm text-zinc-300">
            آدرس + ایمیل + شماره تماس + لینک شبکه‌های اجتماعی 
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/30 px-3 py-2 text-xs text-zinc-200">
          <span className="inline-flex items-center gap-1">
            <FiMapPin className="text-[14px]" />
            <FiPhone className="text-[14px]" />
            <FiMail className="text-[14px]" />
          </span>
          Contact
        </div>
      </div>

      {/* Address / Phone / Email */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Field
          label="آدرس"
          value={v.address}
          onChange={(x) => setField("address", x)}
          placeholder="مثال: تهران، خیابان ..."
          icon={<FiMapPin />}
        />

        <Field
          label="شماره تماس"
          value={v.phone}
          onChange={(x) => setField("phone", x)}
          placeholder="مثال: 09123456789"
          icon={<FiPhone />}
        />

        <Field
          label="ایمیل"
          value={v.email}
          onChange={(x) => setField("email", x)}
          placeholder="مثال: support@example.com"
          icon={<FiMail />}
        />
      </div>

      {/* Social links */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field
          label="لینک اینستاگرام"
          value={v.instagram}
          onChange={(x) => setField("instagram", x)}
          placeholder="https://instagram.com/yourpage"
          icon={<FiInstagram />}
        />

        <Field
          label="لینک تلگرام"
          value={v.telegram}
          onChange={(x) => setField("telegram", x)}
          placeholder="https://t.me/yourchannel"
          icon={<FaTelegramPlane />}
        />

        <Field
          label="لینک واتساپ"
          value={v.whatsapp}
          onChange={(x) => setField("whatsapp", x)}
          placeholder="https://wa.me/989xxxxxxxxx"
          icon={<FaWhatsapp />}
        />
      </div>

      <div className="mt-3 text-[11px] text-zinc-500">
        {/* English comment: This section is only for static contact info and social icons under address. */}
        این بخش فقط برای اطلاعات تماس ثابت و آیکون‌های زیر آدرس است، نه فرم ارسال پیام.
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, icon }) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-bold text-zinc-400">{label}</div>
      <div className="relative">
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
          {icon}
        </span>
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-2xl border border-white/10 bg-zinc-950/30 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-400/40"
          )}
        />
      </div>
    </label>
  );
}
