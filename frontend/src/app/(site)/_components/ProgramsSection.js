"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getCoachPublicPath } from "@/lib/routes/coach-public";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import coachStatue from "@/assets/landing-page/coach_section_statue.png";

export default function ProgramsSection() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/coaches", { params: { page: 1, pageSize: 6 } });
        if (!cancelled) setCoaches(res.data?.items || []);
      } catch {
        if (!cancelled) setCoaches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="programs" dir="rtl" className="relative scroll-mt-24 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background via-primary/5 to-background" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 flex flex-col items-center space-y-8 text-center">
          <Badge variant="outline" className="gap-2 px-4 py-1.5 text-xs tracking-widest">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            مربیان تراز اول
          </Badge>

          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            با مربی{" "}
            <span className="bg-linear-to-l from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              خودت
            </span>{" "}
            شروع کن
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            فیت‌پرو پلتفرم چندمربی است. ما بهترین مربیان ایران را در یک‌جا جمع
            کرده‌ایم تا شما بر اساس سلیقه و نیاز خود، راهبر مسیرتان را انتخاب کنید.
          </p>

          <Card className="mx-auto w-100 mt-4 max-w-xl border-primary/20 bg-card/60 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">استاندارد طلایی تناسب</CardTitle>
              <CardDescription className="text-base leading-7">
                ترکیبی از آناتومی کلاسیک و متدهای مدرن بیومکانیک برای دستیابی به تقارن مطلق.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row-reverse items-start gap-3">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : coaches.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                هنوز مربی منتشرشده‌ای وجود ندارد. به‌زودی مربی‌های جدید اضافه می‌شوند.
              </CardContent>
            </Card>
          ) : (
            coaches.map((coach, idx) => (
              <motion.div
                key={coach.coachId || coach.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.06 }}
                className="h-full"
              >
                <Card className="flex h-full flex-col bg-linear-to-t from-primary/5 to-card shadow-xs transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row-reverse items-start gap-3">
                    <Avatar className="size-12 rounded-xl">
                      {coach.avatarUrl ? (
                        <AvatarImage
                          src={apiAssetUrl(coach.avatarUrl)}
                          alt={coach.displayName}
                          className="rounded-xl object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="rounded-xl">
                        <Users className="size-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-start">
                      <CardTitle className="truncate text-lg">{coach.displayName}</CardTitle>
                      <CardDescription className="text-xs">
                        {coach.title || coach.specialty || "مربی تناسب اندام"}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 text-start">
                    <p className="text-sm leading-7 text-muted-foreground">
                      {coach.specialty
                        ? `تخصص: ${coach.specialty}`
                        : "برنامه تمرین و تغذیه اختصاصی با پشتیبانی مربی."}
                    </p>
                  </CardContent>

                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={getCoachPublicPath(coach.slug)}>مشاهده صفحه و پلن‌ها</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div className="group relative mt-16">
          <div className="absolute -inset-4 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />
          <Card className="relative overflow-hidden border-primary/20 py-0 shadow-lg">
            <div className="grid md:grid-cols-2">
              <div className="relative h-72 md:h-auto md:min-h-[480px]">
                <Image
                  src={coachStatue}
                  alt="پیکرتراش در حال تراشیدن مجسمه"
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/10 to-background md:bg-linear-to-l md:from-transparent md:via-background/20 md:to-background" />
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-8 text-center md:p-14">
                <h3 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                  آماده تغییر هستی؟
                </h3>
                <p className="max-w-md text-base leading-8 text-muted-foreground md:text-lg">
                  همین حالا برنامه اختصاصی خود را از مربی مورد علاقه‌تان دریافت کنید.
                </p>
                <Button asChild size="lg" className="rounded-full px-12 text-base">
                  <Link href="/coaches">انتخاب مربی و شروع</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
