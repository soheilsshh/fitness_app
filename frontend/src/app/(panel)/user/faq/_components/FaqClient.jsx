"use client";

import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FAQ_GROUPS = [
  {
    id: "start",
    title: "شروع و حساب کاربری",
    items: [
      {
        q: "چطور وارد پنل می‌شوم؟",
        a: "با شماره موبایل وارد شوید. اگر حساب دارید، با رمز عبور یا کد پیامکی وارد می‌شوید. اگر شماره جدید باشد، بعد از تایید OTP و تعیین رمز، حساب ساخته می‌شود. سپس فقط نام و هدف اصلیتان را می‌پرسیم و وارد داشبورد می‌شوید.",
      },
      {
        q: "چرا دیگر همه اطلاعات را موقع ثبت‌نام نمی‌خواهید؟",
        a: "عمداً مسیر را کوتاه کردیم تا زودتر وارد پنل شوید و ارزش محصول را ببینید. قد، وزن، سوابق پزشکی و عکس بدن اختیاری‌اند و هر وقت آماده بودید از بخش «پروفایل» تکمیل می‌کنید.",
      },
      {
        q: "رمز عبورم را فراموش کرده‌ام. چه کار کنم؟",
        a: "از صفحه ورود، مسیر بازیابی با کد پیامکی را بزنید. کد به همان شماره‌ای که با آن ثبت‌نام کرده‌اید ارسال می‌شود. در محیط تست لوکال، کد در ترمینال بک‌اند چاپ می‌شود.",
      },
      {
        q: "می‌توانم شماره موبایلم را عوض کنم؟",
        a: "شماره موبایل شناسه اصلی حساب شماست. فعلاً از داخل پنل قابل تغییر نیست. برای جابه‌جایی شماره با پشتیبانی یا مربی از بخش «ارتباط با مربی» تیکت بزنید تا راهنمایی شوید.",
      },
    ],
  },
  {
    id: "programs",
    title: "برنامه تمرین و تغذیه",
    items: [
      {
        q: "برنامه تمرینی‌ام کجا نمایش داده می‌شود؟",
        a: "از تب «تمرین» → «برنامه‌های من» برنامه فعال و روزهای تمرین را می‌بینید. اگر برنامه‌ای فعال نباشد، معمولاً هنوز مربی برنامه را تخصیص نداده یا اشتراک/سفارش شما نهایی نشده است.",
      },
      {
        q: "تفاوت برنامه تمرین با کالری‌شمار چیست؟",
        a: "برنامه تمرین حرکات، ست و تکرار را مشخص می‌کند. کالری‌شمار (تب تغذیه) برای ثبت وعده‌های غذایی روزانه و پیگیری کالری/درشت‌مغذی‌هاست و مکمل برنامه تغذیه مربی است، نه جایگزین آن.",
      },
      {
        q: "اگر یک جلسه را از دست بدهم چه می‌شود؟",
        a: "جلسات از دست‌رفته معمولاً در تاریخچه به‌عنوان انجام‌نشده می‌مانند. برنامه را از روز بعد ادامه دهید و اگر چند جلسه عقب افتادید، از «ارتباط با مربی» بپرسید تا برنامه را با شرایط جدیدتان هماهنگ کند.",
      },
      {
        q: "می‌توانم خودم برنامه را ویرایش کنم؟",
        a: "دانشجو معمولاً برنامه را اجرا و گزارش می‌دهد؛ ویرایش علمی برنامه با مربی است. اگر حرکت برایتان دردناک است، فوراً متوقف کنید و از مسیر تیکت به مربی اطلاع دهید.",
      },
    ],
  },
  {
    id: "tracking",
    title: "پایش، وزن و عکس بدن",
    items: [
      {
        q: "پایش پیشرفت برای چیست؟",
        a: "بخش «پایش» روند وزن، اندازه‌ها و وضعیت چک‌این‌ها را نشان می‌دهد تا هم شما و هم مربی ببینید مسیر درست پیش می‌رود یا نه. دادهٔ خالی طبیعی است؛ با ثبت منظم، نمودار معنادار می‌شود.",
      },
      {
        q: "عکس بدن اجباری است؟",
        a: "خیر. عکس‌ها اختیاری‌اند و می‌توانید بعداً از پروفایل آپلود کنید. هدف کمک به مربی برای دیدن فرم بدن و اصلاح برنامه است، نه نمایش عمومی.",
      },
      {
        q: "چه کسی عکس‌های بدنم را می‌بیند؟",
        a: "عکس‌های بدن فقط برای مربی اختصاصی شما قابل مشاهده است و در سایت عمومی، لندینگ یا شبکه‌های اجتماعی نمایش داده نمی‌شود. این اصل حریم خصوصی فیتینو است.",
      },
      {
        q: "بهترین حالت گرفتن عکس بدن چیست؟",
        a: "لباس ورزشی یا چسبان، نور یکنواخت رو‌به‌رو، پس‌زمینه ساده، و چهار نمای جلو/راست/عقب/چپ با فاصله ثابت از دوربین. از راهنمای داخل پروفایل هم می‌توانید استفاده کنید.",
      },
    ],
  },
  {
    id: "coach",
    title: "ارتباط با مربی و پشتیبانی",
    items: [
      {
        q: "چطور با مربی‌ام حرف بزنم؟",
        a: "از تب «حساب من» → «ارتباط با مربی» تیکت بسازید یا اگر راه‌های تماس (مثل واتساپ) از طرف مربی فعال باشد، همان‌جا می‌بینید. برای مسائل برنامه‌ای و پزشکی ورزشی، تیکت واضح با عکس/توضیح بهتر جواب می‌گیرد.",
      },
      {
        q: "پاسخ تیکت چقدر طول می‌کشد؟",
        a: "بستگی به مربی و ساعت کاری‌اش دارد. معمولاً در ساعات روز پاسخ داده می‌شود. اگر موضوع اورژانسی پزشکی است، فیتینو جایگزین مراجعه به پزشک نیست—فوراً به متخصص مراجعه کنید.",
      },
      {
        q: "مربی‌ام عوض شده یا برنامه‌ای ندارم. چه کار کنم؟",
        a: "اگر اشتراک فعال دارید ولی مربی/برنامه نیست، از «ارتباط با مربی» تیکت بزنید و موضوع را «تخصیص مربی/برنامه» بگذارید. وضعیت سفارش را هم در «سفارش‌ها» چک کنید.",
      },
    ],
  },
  {
    id: "payment",
    title: "سفارش، پرداخت و اشتراک",
    items: [
      {
        q: "سفارش من کجا پیگیری می‌شود؟",
        a: "از «حساب من» → «سفارش‌ها» وضعیت پرداخت و جزئیات هر سفارش را ببینید. بعد از پرداخت موفق، معمولاً فعال‌سازی اشتراک/برنامه کمی زمان می‌برد تا مربی آن را تکمیل کند.",
      },
      {
        q: "پرداخت انجام شد ولی برنامه نیامد. چرا؟",
        a: "گاهی درگاه پرداخت تایید می‌کند ولی فعال‌سازی سمت مربی چند ساعت طول می‌کشد. اول وضعیت سفارش را چک کنید؛ اگر «موفق» است و بعد از ۲۴ ساعت هنوز برنامه‌ای نیست، تیکت بزنید و شماره/کد سفارش را بنویسید.",
      },
      {
        q: "می‌توانم چند مربی/چند پلن همزمان داشته باشم؟",
        a: "سبد خرید و قوانین فعلی معمولاً دور یک مسیر مربی متمرکز است. اگر پلن دیگری بخرید، جزئیات در سفارش‌ها ثبت می‌شود؛ درباره هم‌پوشانی برنامه‌ها از مربی بپرسید تا تداخل تمرینی ایجاد نشود.",
      },
    ],
  },
  {
    id: "privacy",
    title: "حریم خصوصی و امنیت",
    items: [
      {
        q: "چه داده‌هایی از من نگه داشته می‌شود؟",
        a: "شماره موبایل، نام، هدف و هر اطلاعاتی که خودتان در پروفایل/پایش وارد کنید، به‌علاوه لاگ تمرین و سفارش‌ها. این داده‌ها برای ارائه خدمت مربی‌گری و بهبود برنامه استفاده می‌شود.",
      },
      {
        q: "چطور حسابم را امن نگه دارم؟",
        a: "رمز قوی بگذارید، آن را با دیگران به اشتراک نگذارید، و روی دستگاه عمومی «خروج» را بزنید. اگر پیامک OTP مشکوک گرفتید و خودتان درخواست نداده بودید، سریع رمز را عوض کنید و به پشتیبانی خبر دهید.",
      },
    ],
  },
];

export default function FaqClient() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_GROUPS;
    return FAQ_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const total = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5" dir="rtl">
      <div className="text-start">
        <div className="fitino-meta-badge mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-iranianSansMedium text-[#187272] dark:text-[#6ceade]">
          <HelpCircle className="size-3.5" />
          مرکز راهنما
        </div>
        <div className="mb-2 h-1 w-10 rounded-full bg-[linear-gradient(90deg,#26fce3,#187272)]" />
        <h2 className="font-iranianSansBlack text-xl tracking-tight sm:text-2xl">
          سوالات متداول
        </h2>
        <p className="mt-1.5 text-sm font-iranianSansMedium text-muted-foreground">
          پاسخ‌های واقعی برای مسیر تمرین، تغذیه، پایش و ارتباط با مربی در فیتینو.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در سوالات… مثلاً عکس بدن، پرداخت، تیکت"
          className="h-12 rounded-2xl ps-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="tabular-nums">
          {total.toLocaleString("fa-IR")} پاسخ
        </Badge>
        {query ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setQuery("")}>
            پاک کردن جستجو
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground">
            <p>موردی با این جستجو پیدا نشد.</p>
            <Button asChild variant="outline">
              <Link href="/user/contact">پرسیدن از مربی</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        filtered.map((group) => (
          <section key={group.id} className="space-y-3">
            <h3 className="text-sm font-iranianSansDemiBold text-foreground">
              {group.title}
            </h3>
            <Accordion type="single" collapsible className="rounded-2xl border border-border/70 px-2">
              {group.items.map((item, index) => (
                <AccordionItem
                  key={`${group.id}-${index}`}
                  value={`${group.id}-${index}`}
                  className="border-border/60"
                >
                  <AccordionTrigger className="px-2 text-start text-sm font-iranianSansMedium hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-2 text-sm leading-7 text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))
      )}

      <Card className="border-primary/20 bg-primary/[0.04]">
        <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-start text-sm">
            <p className="font-iranianSansDemiBold text-foreground">
              جوابتان اینجا نبود؟
            </p>
            <p className="mt-1 text-muted-foreground">
              از بخش ارتباط با مربی سوال اختصاصی بپرسید.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/user/contact">ارتباط با مربی</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
