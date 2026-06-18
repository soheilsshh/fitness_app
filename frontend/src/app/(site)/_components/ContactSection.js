"use client";

import { useState } from "react";
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
              <form className="space-y-6 text-start" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="contact-fullName">نام و نام خانوادگی</Label>
                  <Input
                    id="contact-fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثلا: علی محمدی"
                    className="h-11 text-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-info">شماره موبایل یا ایمیل</Label>
                  <Input
                    id="contact-info"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="h-11 text-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">پیغام شما</Label>
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="چطور می‌توانیم به شما کمک کنیم؟"
                    rows={4}
                    className="min-h-28 text-start leading-7"
                  />
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
