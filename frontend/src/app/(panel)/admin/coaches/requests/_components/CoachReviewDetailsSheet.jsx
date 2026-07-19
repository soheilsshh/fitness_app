"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Medal,
  User,
  ZoomIn,
} from "lucide-react";
import { apiAssetUrl } from "@/lib/api/assets";
import { approveCoach, getCoachForReview } from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/translateError";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_TYPE_META = {
  certificate: { label: "گواهینامه", icon: FileText, badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  honor: { label: "افتخار", icon: Award, badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  medal: { label: "مدال", icon: Medal, badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  qualification: { label: "مدرک", icon: GraduationCap, badge: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300" },
};

function getTypeMeta(type) {
  return ACHIEVEMENT_TYPE_META[type] || ACHIEVEMENT_TYPE_META.certificate;
}

function DetailItem({ label, value, dir, className }) {
  return (
    <div className={cn("rounded-lg border bg-muted/20 px-3 py-2.5", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-medium wrap-break-word", dir === "ltr" && "font-mono")} dir={dir}>
        {value || "—"}
      </p>
    </div>
  );
}

function AchievementThumb({ item, onImageClick }) {
  const meta = getTypeMeta(item.type);
  const TypeIcon = meta.icon;
  const imageSrc = item.imageUrl ? apiAssetUrl(item.imageUrl) : "";

  return (
    <article className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
      {imageSrc ? (
        <button
          type="button"
          onClick={() => onImageClick({ src: imageSrc, title: item.title })}
          className="group relative block w-full overflow-hidden border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`بزرگ‌نمایی ${item.title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={item.title} className="h-28 w-full object-cover transition group-hover:scale-[1.02]" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
            <ZoomIn className="size-5 text-white" />
          </span>
        </button>
      ) : (
        <div className="flex h-28 items-center justify-center border-b bg-muted/30 text-muted-foreground">
          <TypeIcon className="size-8 opacity-60" />
        </div>
      )}
      <div className="space-y-2 p-3 text-start">
        <Badge variant="outline" className={meta.badge}>
          {meta.label}
        </Badge>
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.issuer ? (
          <p className="text-xs text-muted-foreground">{item.issuer}</p>
        ) : null}
        {item.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
    </article>
  );
}

export default function CoachReviewDetailsSheet({
  coachId,
  open,
  onOpenChange,
  onApproved,
}) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const loadCoach = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    try {
      const data = await getCoachForReview(coachId);
      setCoach(data);
    } catch (error) {
      setCoach(null);
      toastError("خطا", getApiErrorMessage(error, "بارگذاری جزئیات مربی ناموفق بود"));
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    if (open && coachId) {
      loadCoach();
    } else if (!open) {
      setCoach(null);
      setLightbox(null);
    }
  }, [open, coachId, loadCoach]);

  const handleApprove = async () => {
    if (!coachId) return;
    setApproving(true);
    try {
      await approveCoach(coachId);
      toastSuccess("تأیید شد", "مربی با موفقیت تأیید شد و به پنل دسترسی پیدا می‌کند.");
      onOpenChange(false);
      onApproved?.();
    } catch (error) {
      toastError("خطا", getApiErrorMessage(error, "تأیید مربی ناموفق بود"));
    } finally {
      setApproving(false);
    }
  };

  const achievements = [...(coach?.achievements || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-full gap-0 overflow-y-auto border-e p-0 sm:max-w-xl md:max-w-2xl"
          dir="rtl"
        >
          <SheetHeader className="border-b px-4 py-4 text-start sm:px-6">
            <div className="flex items-start gap-3 pe-10">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
                {coach?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apiAssetUrl(coach.avatarUrl)}
                    alt={coach.displayName || "avatar"}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base sm:text-lg">
                  {loading ? "در حال بارگذاری..." : coach?.displayName || "جزئیات مربی"}
                </SheetTitle>
                <SheetDescription className="mt-1">
                  {coach?.title || "بررسی درخواست ثبت‌نام مربی"}
                </SheetDescription>
                {coach?.status === "reviewing" ? (
                  <Badge
                    variant="outline"
                    className="mt-2 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  >
                    <Clock className="size-3" data-icon="inline-start" />
                    در انتظار تأیید
                  </Badge>
                ) : null}
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6 px-4 py-5 sm:px-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full rounded-xl" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : !coach ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                اطلاعات مربی یافت نشد.
              </p>
            ) : (
              <>
                {coach.coverImageUrl ? (
                  <div className="overflow-hidden rounded-xl border bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={apiAssetUrl(coach.coverImageUrl)}
                      alt="کاور"
                      className="h-36 w-full object-cover sm:h-44"
                    />
                  </div>
                ) : null}

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">اطلاعات پایه</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem label="نام نمایشی" value={coach.displayName} />
                    <DetailItem label="عنوان / تخصص" value={coach.title} />
                    <DetailItem label="کد ملی" value={coach.nationalId} dir="ltr" />
                    <DetailItem label="شماره تماس" value={coach.phone} dir="ltr" />
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="size-4 text-primary" />
                    اطلاعات مکانی و تخصص
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem label="شهر" value={coach.city} />
                    <DetailItem label="تخصص" value={coach.specialty} />
                  </div>
                  {coach.bio ? (
                    <div className="rounded-lg border bg-muted/20 px-3 py-2.5 text-start">
                      <p className="text-xs text-muted-foreground">معرفی کوتاه</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{coach.bio}</p>
                    </div>
                  ) : null}
                  {coach.aboutCoach ? (
                    <div className="rounded-lg border bg-muted/20 px-3 py-2.5 text-start">
                      <p className="text-xs text-muted-foreground">درباره مربی</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{coach.aboutCoach}</p>
                    </div>
                  ) : null}
                </section>

                {(coach.instagram || coach.telegram || coach.whatsapp || coach.website) ? (
                  <>
                    <Separator />
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold">شبکه‌های اجتماعی</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailItem label="اینستاگرام" value={coach.instagram} dir="ltr" />
                        <DetailItem label="تلگرام" value={coach.telegram} dir="ltr" />
                        <DetailItem label="واتساپ" value={coach.whatsapp} dir="ltr" />
                        <DetailItem label="وب‌سایت" value={coach.website} dir="ltr" />
                      </div>
                    </section>
                  </>
                ) : null}

                <Separator />

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">مدارک و افتخارات</h3>
                  {achievements.length === 0 ? (
                    <p className="rounded-lg border border-dashed bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                      مدرک یا افتخاری ثبت نشده است.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {achievements.map((item) => (
                        <AchievementThumb
                          key={item.id}
                          item={item}
                          onImageClick={setLightbox}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <SheetFooter className="sticky bottom-0 border-t bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleApprove}
              disabled={loading || approving || !coach || coach.status !== "reviewing"}
            >
              {approving ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                <CheckCircle2 data-icon="inline-start" />
              )}
              {approving ? "در حال تأیید..." : "تأیید مربی"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!lightbox} onOpenChange={(next) => !next && setLightbox(null)}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0" dir="rtl">
          <DialogHeader className="border-b px-4 py-3 text-start">
            <DialogTitle className="text-sm">{lightbox?.title || "پیش‌نمایش تصویر"}</DialogTitle>
          </DialogHeader>
          {lightbox?.src ? (
            <div className="bg-muted/20 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.src}
                alt={lightbox.title || "تصویر"}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
