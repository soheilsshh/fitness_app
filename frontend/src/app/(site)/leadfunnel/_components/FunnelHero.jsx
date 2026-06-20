"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AtSign,
  BadgeCheck,
  Clock,
  Dumbbell,
  Flame,
  Rocket,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Golden achievements box — medal emojis are intentional per the funnel doc
// (the eye reacts strongly to 🥇🥈🥉 and instantly registers the résumé weight).
const ACHIEVEMENTS = [
  { emoji: "🥉", text: "مقام سوم جهان و دوم کشور در پرورش اندام و بدنسازی" },
  { emoji: "🏊‍♂️", text: "عضو رسمی تیم ملی شنا با ثبت ۱۳ رکورد ملی تکرارنشدنی" },
  { emoji: "🥇", text: "دارنده ۳۶ مدال طلا و ۴ مدال نقره کشوری" },
  { emoji: "🧗‍♂️", text: "قهرمان صخره‌نوردی ایران (۱ مدال طلای کشوری)" },
  { emoji: "🎯", text: "قهرمان پرتاب نیزه ایران (۴ طلا و ۲ نقره کشوری)" },
  { emoji: "👑", text: "قهرمان ورزش باستانی (۱ طلا و ۱ نقره کشوری)" },
];

const IMAGE_SRC = "/images/coach-ali.jpg";

export default function FunnelHero({ coachName = "علی رشید آبادی", onStart }) {
  const reduceMotion = useReducedMotion();
  const [imgError, setImgError] = useState(false);

  const pulse = reduceMotion
    ? {}
    : {
        animate: { scale: [1, 1.025, 1] },
        transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div dir="rtl" className="relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />
        <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-chart-2/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10 md:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ---------- IMAGE ---------- */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-sm lg:order-last"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-2xl shadow-primary/10">
              {!imgError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={IMAGE_SRC}
                  alt={`استاد ${coachName} — قهرمان پرورش اندام`}
                  className="h-full w-full object-cover"
                  loading="eager"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-muted to-card text-muted-foreground">
                  <Dumbbell className="size-14 text-primary/60" />
                  <span className="text-sm">عکس استاد {coachName}</span>
                </div>
              )}
              {/* bottom gradient for text legibility */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 start-4 end-4 text-white">
                <p className="text-lg font-extrabold drop-shadow">استاد {coachName}</p>
                <p className="text-xs opacity-90">قهرمان جهانی پرورش اندام</p>
              </div>
            </div>

            {/* famous / social proof badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-4 -start-3 flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
                <AtSign className="size-4.5 text-primary" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-extrabold tabular-nums">+۸۸ هزار</p>
                <p className="text-[11px] text-muted-foreground">دنبال‌کننده ورزشکار</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="absolute -top-3 -end-3 flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 shadow-lg backdrop-blur"
            >
              <BadgeCheck className="size-4 text-primary" />
              <span className="text-xs font-bold text-primary">قهرمان رسمی</span>
            </motion.div>
          </motion.div>

          {/* ---------- CONTENT ---------- */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Badge variant="outline" className="mb-4 gap-2 px-4 py-1.5">
              <Flame className="size-3.5 text-primary" />
              ارزیابی رایگان · زیر نظر نابغه ورزش ایران
            </Badge>

            <h1 className="text-2xl font-black leading-[1.5] text-foreground sm:text-3xl md:text-4xl md:leading-[1.4]">
              راز تغییر بدنت رو از کسی بپرس که{" "}
              <span className="text-primary">۱۳ بار</span> رکوردهای ملی رو جابه‌جا کرده!
            </h1>

            <p className="mt-4 text-sm leading-8 text-muted-foreground md:text-base">
              رژیم‌های تکراری و برنامه‌های کپی‌شدۀ باشگاهی رو فراموش کن. برای داشتن یک بدن
              فوق‌العاده، باید زیر نظر کسی تمرین کنی که خودش مسیر قهرمانی در چندین رشته مختلف
              رو فتح کرده و فرمول واقعی ساخت عضله و چربی‌سوزی رو می‌دونه.
            </p>

            {/* golden achievements box */}
            <div className="mt-6 rounded-2xl border border-amber-500/25 bg-gradient-to-bl from-amber-500/10 via-card/40 to-transparent p-5">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="size-4.5 text-amber-500" />
                <h2 className="text-sm font-extrabold text-foreground">
                  چرا دوره مربیگری اختصاصی با استاد {coachName}؟
                </h2>
              </div>
              <ul className="grid gap-2.5">
                {ACHIEVEMENTS.map((item, i) => (
                  <motion.li
                    key={item.text}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground"
                  >
                    <span className="text-base leading-7" aria-hidden>
                      {item.emoji}
                    </span>
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3 text-sm font-medium text-foreground">
                <Users className="size-4 text-primary" />
                مورد اعتماد و الگوی بیش از ۸۸ هزار ورزشکار در اینستاگرام
              </div>
            </div>

            {/* CTA */}
            <div className="mt-7">
              <motion.div {...pulse} className="rounded-full">
                <Button
                  size="lg"
                  onClick={onStart}
                  className="h-auto w-full rounded-full py-5 text-base font-extrabold shadow-lg shadow-primary/30 sm:text-lg"
                >
                  <Rocket className="size-5" />
                  شروع ارزیابی آنلاین و رزرو پکیج مربیگری
                </Button>
              </motion.div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  زمان لازم: فقط ۶۰ ثانیه
                </span>
                <span className="hidden sm:inline">·</span>
                <span>ظرفیت پذیرش این هفته محدود است</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
