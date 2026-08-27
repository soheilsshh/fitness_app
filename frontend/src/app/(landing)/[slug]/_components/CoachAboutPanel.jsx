"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import {
  Award,
  AtSign,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { limitPhraseWords } from "@/components/ui/ContainerTextFlip";
import CoachAchievementsSection from "@/app/(site)/coach/[slug]/_components/CoachAchievementsSection";
import { cn } from "@/lib/utils";

function specialtyTags(specialty) {
  return String(specialty || "")
    .split(/[،,\n|/]+/)
    .map((s) => limitPhraseWords(s.trim(), 15))
    .filter(Boolean);
}

function socialEntries(social = {}) {
  const items = [];
  if (social.phone) {
    items.push({
      key: "phone",
      label: "تماس",
      href: `tel:${social.phone}`,
      value: social.phone,
      icon: Phone,
      external: false,
    });
  }
  if (social.whatsapp) {
    const digits = String(social.whatsapp).replace(/\D/g, "");
    items.push({
      key: "whatsapp",
      label: "واتساپ",
      href: `https://wa.me/${digits}`,
      value: social.whatsapp,
      icon: MessageCircle,
      external: true,
    });
  }
  if (social.telegram) {
    const handle = String(social.telegram).replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
    items.push({
      key: "telegram",
      label: "تلگرام",
      href: handle.startsWith("http") ? handle : `https://t.me/${handle}`,
      value: social.telegram,
      icon: Send,
      external: true,
    });
  }
  if (social.instagram) {
    const handle = String(social.instagram).replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
    items.push({
      key: "instagram",
      label: "اینستاگرام",
      href: handle.startsWith("http") ? handle : `https://instagram.com/${handle}`,
      value: social.instagram,
      icon: AtSign,
      external: true,
    });
  }
  if (social.website) {
    const href = /^https?:\/\//i.test(social.website)
      ? social.website
      : `https://${social.website}`;
    items.push({
      key: "website",
      label: "وب‌سایت",
      href,
      value: social.website,
      icon: Globe,
      external: true,
    });
  }
  return items;
}

/**
 * Student-facing coach intro drawer.
 * Data comes from GET /coaches/:slug (bio, aboutCoach, specialty, city, social, achievements).
 * Closed by default; opens when CTA sets `open`.
 */
export default function CoachAboutPanel({
  coach,
  open,
  onOpenChange,
  className,
}) {
  const panelId = useId();
  const rootRef = useRef(null);

  const tags = useMemo(() => specialtyTags(coach?.specialty), [coach?.specialty]);
  const contacts = useMemo(() => socialEntries(coach?.social), [coach?.social]);
  const achievements = coach?.achievements || [];
  const hasBio = Boolean(coach?.bio?.trim());
  const hasAbout = Boolean(coach?.aboutCoach?.trim());
  const hasCity = Boolean(coach?.city?.trim());
  const hasContent =
    hasBio || hasAbout || tags.length > 0 || hasCity || contacts.length > 0 || achievements.length > 0;

  useEffect(() => {
    if (!open || !rootRef.current) return;
    const t = window.setTimeout(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [open]);

  const summaryBits = [
    coach?.title,
    hasCity ? coach.city : null,
    tags[0] || null,
  ].filter(Boolean);

  return (
    <section
      id="about"
      ref={rootRef}
      className={cn("scroll-mt-24", className)}
      dir="rtl"
      aria-labelledby={`${panelId}-heading`}
    >
      <Accordion
        type="single"
        collapsible
        value={open ? "about" : ""}
        onValueChange={(value) => onOpenChange?.(value === "about")}
        className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_16px_48px_-24px_rgba(0,0,0,0.65)]"
      >
        <AccordionItem value="about" className="border-0">
          <AccordionTrigger
            id={`${panelId}-heading`}
            className={cn(
              "cursor-pointer gap-3 px-4 py-4 hover:no-underline sm:px-6 sm:py-5",
              "rounded-none border-0 text-white",
              "hover:bg-white/[0.03] focus-visible:ring-teal-400/40",
              "**:data-[slot=accordion-trigger-icon]:text-teal-300",
            )}
          >
            <span className="flex min-w-0 flex-1 items-start gap-3 text-start">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/25">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block text-base font-extrabold text-white sm:text-lg">
                  آشنایی بیشتر با مربی
                </span>
                <span className="block text-xs leading-6 text-zinc-400 sm:text-sm">
                  {open
                    ? "برای بستن، دوباره لمس کنید"
                    : summaryBits.length
                      ? summaryBits.join(" · ")
                      : "بیو، تخصص، مدارک و راه‌های ارتباط"}
                </span>
              </span>
            </span>
          </AccordionTrigger>

          <AccordionContent className="px-0 pb-0">
            <div className="space-y-5 border-t border-white/10 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
              {!hasContent ? (
                <p className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/40 px-4 py-5 text-sm leading-7 text-zinc-400">
                  این مربی هنوز معرفی کامل خود را تکمیل نکرده است. می‌توانید از
                  بخش پلن‌ها برنامه موردنظر را ببینید.
                </p>
              ) : null}

              {(hasBio || hasAbout) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-teal-300/90">
                    <Sparkles className="size-4" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-white">معرفی برای شاگرد</h3>
                  </div>
                  {hasBio ? (
                    <p className="whitespace-pre-line text-sm leading-7 text-zinc-200">
                      {coach.bio}
                    </p>
                  ) : null}
                  {hasAbout ? (
                    <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        سوابق و رویکرد
                      </h4>
                      <p className="whitespace-pre-line text-sm leading-7 text-zinc-300">
                        {coach.aboutCoach}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {(tags.length > 0 || hasCity) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">آنچه برای انتخاب مهم است</h3>
                  <div className="flex flex-wrap gap-2">
                    {hasCity ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {coach.city}
                      </span>
                    ) : null}
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-teal-400/25 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {contacts.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">راه‌های ارتباط</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {contacts.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.key}
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noreferrer" : undefined}
                          className="group inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 px-3.5 py-3 text-sm text-zinc-200 transition-colors duration-200 hover:border-teal-400/30 hover:bg-teal-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-teal-300 ring-1 ring-white/10 transition-colors group-hover:bg-teal-500/15">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 text-start">
                            <span className="block text-[11px] text-zinc-500">{item.label}</span>
                            <span className="block truncate font-medium" dir={item.key === "phone" ? "ltr" : "rtl"}>
                              {item.value}
                            </span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {achievements.length > 0 ? (
                <div className="space-y-3 border-t border-white/10 pt-5">
                  <div className="flex items-center gap-2 text-teal-300/90">
                    <Award className="size-4" aria-hidden="true" />
                    <h3 className="text-sm font-bold text-white">مدارک و افتخارات</h3>
                  </div>
                  <CoachAchievementsSection achievements={achievements} embedded />
                </div>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
