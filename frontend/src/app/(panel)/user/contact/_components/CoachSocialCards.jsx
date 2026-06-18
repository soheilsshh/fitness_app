"use client";

import { Globe, Inbox, Phone, Send, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function cleanUrl(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  // allow t.me / instagram.com / etc without schema
  return `https://${v}`;
}

function SocialCard({ icon: Icon, title, value, href, hint }) {
  const has = Boolean(value && href);
  return (
    <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted/30">
          <Icon className="size-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <Badge variant={has ? "secondary" : "outline"} className="max-w-[70%] truncate">
          {value ? value : "ثبت نشده"}
        </Badge>
        <Button asChild size="sm" variant="outline" disabled={!has}>
          <a href={href || "#"} target="_blank" rel="noreferrer">
            باز کردن
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CoachSocialCards({ coach, assignedCoachName, assignedCoachSlug }) {
  const displayName = coach?.displayName || assignedCoachName || "مربی";
  const social = coach?.social || {};

  const telegram = cleanUrl(social.telegram);
  const instagram = cleanUrl(social.instagram);
  const whatsapp = cleanUrl(social.whatsapp);
  const website = cleanUrl(social.website);
  const phone = (social.contactPhone || "").trim();

  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : "";
  const waHref = whatsapp || (phone ? `https://wa.me/${phone.replace(/[^\d]/g, "")}` : "");

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="text-start">
          <CardTitle className="text-base">راه‌های ارتباطی مربی</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignedCoachSlug ? (
              <>
                مربی شما: <span className="font-medium text-foreground">{displayName}</span>
              </>
            ) : (
              "برای نمایش اطلاعات مربی، باید ابتدا مربی به شما تخصیص داده شود."
            )}
          </p>
        </div>
        {assignedCoachSlug ? (
          <Badge variant="outline" className="text-xs">
            @{assignedCoachSlug}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SocialCard
          
          icon={Send}
          title="تلگرام"
          value={social.telegram}
          href={`https://t.me/${social.telegram}`}
          hint="لینک یا آیدی"
        />
        <SocialCard
          icon={Inbox}
          title="اینستاگرام"
          value={social.instagram}
          href={`https://Instagram.com/${social.instagram}`}
          hint="لینک یا آیدی"
        />
        <SocialCard
          icon={MessageCircle}
          title="واتساپ"
          value={social.whatsapp || social.contactPhone}
          href={`https://wa.me/${social.whatsapp.replace(/[^\d]/g, "")}`}
          hint="شماره یا لینک"
        />
        <SocialCard
          icon={Globe}
          title="وب‌سایت"
          value={social.website}
          href={`https://${social.website}`}
          hint="آدرس سایت"
        />
        <SocialCard
          icon={Phone}
          title="تماس"
          value={phone}
          href={`tel:${phone.replace(/[^\d]/g, "")}`}
          hint="شماره تماس"
        />
      </CardContent>
    </Card>
  );
}

