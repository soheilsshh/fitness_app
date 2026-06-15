"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Home,
  Inbox,
  MessageCircle,
  Phone,
  Send,
  ShoppingCart,
  Sparkles,
  UserX,
} from "lucide-react";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getCoachPublicPath } from "@/lib/routes/coach-public";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart, selectCartCoach, selectCartItems } from "@/store/slices/cartSlice";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { getAuthSession } from "@/lib/auth/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatToman(amount) {
  return new Intl.NumberFormat("fa-IR").format(Number(amount)) + " تومان";
}

function formatDays(days) {
  return new Intl.NumberFormat("fa-IR").format(Number(days) || 0);
}

function SocialButton({ href, label, children, className }) {
  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      className={cn("shrink-0", className)}
    >
      <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
        {children}
      </a>
    </Button>
  );
}

function LoadingSkeleton() {
  return (
    <div dir="rtl" className="pb-16">
      <Skeleton className="h-56 w-full rounded-none md:h-72" />
      <div className="mx-auto -mt-16 max-w-5xl space-y-8 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <Skeleton className="size-28 rounded-2xl" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
        </div>
        <Card>
          <CardContent className="space-y-2 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div dir="rtl" className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-16">
      <Card className="w-full text-center">
        <CardHeader className="items-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted">
            <UserX className="size-7 text-muted-foreground" />
          </div>
          <CardTitle>مربی یافت نشد</CardTitle>
          <CardDescription>
            این پروفایل وجود ندارد یا هنوز منتشر نشده است.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/">
              <Home data-icon="inline-start" />
              بازگشت به صفحه اصلی
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CoachLandingClient({ slug }) {
  const dispatch = useAppDispatch();
  const cartCoach = useAppSelector(selectCartCoach);
  const cartItems = useAppSelector(selectCartItems);
  const [coach, setCoach] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [assignedCoach, setAssignedCoach] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const requests = [
          api.get(`/coaches/${slug}`),
          api.get(`/coaches/${slug}/plans`),
        ];
        if (getAuthSession()?.token) {
          requests.push(api.get("/me").catch(() => null));
        }
        const results = await Promise.all(requests);
        if (cancelled) return;
        setCoach(results[0].data);
        setPlans(results[1].data?.plans || []);
        const meRes = results[2];
        if (meRes?.data?.assignedCoachId) {
          setAssignedCoach({
            id: meRes.data.assignedCoachId,
            name: meRes.data.assignedCoachName || "",
            slug: meRes.data.assignedCoachSlug || "",
          });
        } else {
          setAssignedCoach(null);
        }
      } catch (error) {
        if (!cancelled) {
          if (error?.response?.status === 404) setNotFound(true);
          else setCoach(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const hasOtherCoach =
    assignedCoach?.id && coach?.coachId && Number(assignedCoach.id) !== Number(coach.coachId);
  const canPurchase = !hasOtherCoach;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (notFound || !coach) {
    return <NotFoundState />;
  }

  const cover = apiAssetUrl(coach.coverImageUrl);
  const avatar = apiAssetUrl(coach.avatarUrl);

  return (
    <div dir="rtl" className="pb-16 text-foreground">
      <div className="relative h-56 overflow-hidden md:h-72">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/25 via-primary/10 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="mx-auto -mt-16 max-w-5xl px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="size-28 rounded-2xl border-4 border-background shadow-lg after:rounded-2xl">
              {avatar ? (
                <AvatarImage src={avatar} alt={coach.displayName} className="rounded-2xl" />
              ) : null}
              <AvatarFallback className="rounded-2xl bg-primary/15 text-3xl font-bold text-primary">
                {coach.displayName?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {coach.displayName}
              </h1>
              {coach.title ? (
                <p className="mt-1 text-sm font-medium text-primary">{coach.title}</p>
              ) : null}
              {coach.specialty ? (
                <p className="mt-1 text-sm text-muted-foreground">{coach.specialty}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {coach.social?.phone ? (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={`tel:${coach.social.phone}`}>
                  <Phone data-icon="inline-start" />
                  {coach.social.phone}
                </a>
              </Button>
            ) : null}
            {coach.social?.instagram ? (
              <SocialButton href={coach.social.instagram} label="Instagram">
                <Inbox />
              </SocialButton>
            ) : null}
            {coach.social?.telegram ? (
              <SocialButton
                href={
                  coach.social.telegram.startsWith("http")
                    ? coach.social.telegram
                    : `https://t.me/${coach.social.telegram}`
                }
                label="Telegram"
              >
                <Send />
              </SocialButton>
            ) : null}
            {coach.social?.whatsapp ? (
              <SocialButton
                href={`https://wa.me/${coach.social.whatsapp.replace(/\D/g, "")}`}
                label="WhatsApp"
              >
                <MessageCircle />
              </SocialButton>
            ) : null}
            {coach.social?.website ? (
              <SocialButton href={coach.social.website} label="Website">
                <Globe />
              </SocialButton>
            ) : null}
          </div>
        </div>

        {(coach.bio || coach.aboutCoach) && (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle className="text-lg">درباره مربی</CardTitle>
              {coach.bio ? (
                <CardDescription className="text-start text-sm leading-7 text-foreground/90">
                  {coach.bio}
                </CardDescription>
              ) : null}
            </CardHeader>
            {coach.aboutCoach ? (
              <>
                {coach.bio ? <Separator /> : null}
                <CardContent className={coach.bio ? "pt-4" : "pt-0"}>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                    {coach.aboutCoach}
                  </p>
                </CardContent>
              </>
            ) : null}
          </Card>
        )}

        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">پلن‌های قابل خرید</h2>
          </div>

          {hasOtherCoach ? (
            <Card className="border-amber-500/30 bg-amber-500/10">
              <CardContent className="pt-4 text-sm text-amber-950 dark:text-amber-100">
                شما قبلاً زیر نظر مربی{" "}
                <span className="font-semibold">{assignedCoach.name}</span> هستید و
                نمی‌توانید از مربی دیگر خرید کنید.
                {assignedCoach.slug ? (
                  <>
                    {" "}
                    <Link
                      href={getCoachPublicPath(assignedCoach.slug)}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      مشاهده لندینگ مربی شما
                    </Link>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {plans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                فعلاً پلن فعالی برای این مربی ثبت نشده است.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => {
                const price = plan.discountPrice > 0 ? plan.discountPrice : plan.price;
                const inCart = cartItems.some((it) => String(it.planId) === String(plan.id));
                const hasOtherPlan = cartItems.length > 0 && !inCart;

                return (
                  <Card key={plan.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 text-start">
                          <CardTitle>{plan.title}</CardTitle>
                          {plan.subtitle ? (
                            <CardDescription>{plan.subtitle}</CardDescription>
                          ) : null}
                        </div>
                        {plan.isPopular ? (
                          <Badge variant="secondary" className="shrink-0 gap-1">
                            <Sparkles className="size-3" />
                            محبوب
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                      <p className="text-xl font-bold tabular-nums text-primary">
                        {formatToman(price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        مدت: {formatDays(plan.durationDays)} روز
                      </p>
                      {plan.featuresText ? (
                        <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                          {plan.featuresText}
                        </p>
                      ) : null}
                    </CardContent>

                    {canPurchase ? (
                      <CardFooter>
                        <Button
                          type="button"
                          disabled={inCart}
                          className="w-full"
                          variant={inCart ? "secondary" : "default"}
                          onClick={() => {
                            if (
                              cartCoach.coachId &&
                              String(cartCoach.coachId) !== String(coach.coachId)
                            ) {
                              return toastError(
                                "سبد خرید",
                                "فقط می‌توانید از یک مربی خرید کنید. ابتدا سبد را خالی کنید."
                              );
                            }
                            if (inCart) {
                              return toastError("سبد خرید", "این پلن قبلاً در سبد است.");
                            }
                            dispatch(
                              addToCart({
                                planId: plan.id,
                                id: String(plan.id),
                                title: plan.title,
                                price: plan.discountPrice > 0 ? plan.discountPrice : plan.price,
                                coachId: coach.coachId,
                                coachName: coach.displayName,
                                coachSlug: slug,
                              })
                            );
                            toastSuccess(
                              hasOtherPlan ? "جایگزین شد" : "افزوده شد",
                              hasOtherPlan
                                ? "پلن قبلی از سبد حذف و این پلن انتخاب شد."
                                : "پلن به سبد خرید اضافه شد."
                            );
                          }}
                        >
                          {inCart ? (
                            <>
                              <ShoppingCart data-icon="inline-start" />
                              در سبد خرید است
                            </>
                          ) : (
                            "انتخاب این پلن"
                          )}
                        </Button>
                      </CardFooter>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
