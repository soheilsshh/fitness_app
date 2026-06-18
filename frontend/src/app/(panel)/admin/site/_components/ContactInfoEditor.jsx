"use client";

import { FiInstagram, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>اطلاعات تماس (تماس با ما)</CardTitle>
          <p className="text-sm text-muted-foreground">
            آدرس + ایمیل + شماره تماس + لینک شبکه‌های اجتماعی
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1">
            <FiMapPin className="text-[14px]" />
            <FiPhone className="text-[14px]" />
            <FiMail className="text-[14px]" />
          </span>
          Contact
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 md:grid-cols-3">
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
      </CardContent>

      <CardContent className="grid gap-3 md:grid-cols-3">
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
      </CardContent>

      <CardContent className="pt-0 text-xs text-muted-foreground">
        این بخش فقط برای اطلاعات تماس ثابت و آیکون‌های زیر آدرس است، نه فرم ارسال پیام.
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, placeholder, icon }) {
  return (
    <label className="block space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
      </div>
    </label>
  );
}
