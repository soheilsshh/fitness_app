"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiPhone, FiCheck, FiChevronDown } from "react-icons/fi";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart, selectCartCoach, selectCartItems } from "@/store/slices/cartSlice";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { getAuthSession } from "@/lib/auth/session";
import { getCoachPublicPath } from "@/lib/routes/coach-public";
import BorderGlow from "@/components/ui/BorderGlow";
import ContainerTextFlip, { limitPhraseWords } from "@/components/ui/ContainerTextFlip";
import AuroraBackground from "@/components/ui/aurora-background";
import CoachAboutPanel from "./CoachAboutPanel";
import { useRouter } from "next/navigation";

const HERO_PIXEL_COLORS = ["#34d399", "#6ee7b7", "#a7f3d0", "#ecfdf5", "#ffffff"];

function formatToman(amount) {
  return new Intl.NumberFormat("fa-IR").format(Number(amount)) + " تومان";
}

export default function CoachLandingClient({ slug, initialCoach = null, initialPlans = [] }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartCoach = useAppSelector(selectCartCoach);
  const cartItems = useAppSelector(selectCartItems);
  const [coach, setCoach] = useState(initialCoach);
  const [plans, setPlans] = useState(initialPlans);
  const [loading, setLoading] = useState(!initialCoach);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [assignedCoach, setAssignedCoach] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      setLoadError(false);
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
          else setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  const hasOtherCoach =
    assignedCoach?.id && coach?.coachId && Number(assignedCoach.id) !== Number(coach.coachId);
  const canPurchase = !hasOtherCoach;

  if (loading && !coach) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10" aria-busy="true" aria-label="در حال بارگذاری پروفایل مربی">
        <div className="grid gap-px overflow-hidden rounded-[28px] ring-1 ring-white/10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-h-[340px] animate-pulse bg-zinc-900 md:min-h-[540px]" />
          <div className="flex flex-col gap-4 bg-zinc-900 p-7 md:p-10">
            <div className="h-10 w-2/3 animate-pulse self-start rounded-lg bg-zinc-800" />
            <div className="h-5 w-1/2 animate-pulse self-start rounded bg-zinc-800" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-5/6 animate-pulse self-start rounded bg-zinc-800" />
            <div className="mt-4 h-12 w-48 animate-pulse self-start rounded-2xl bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center" role="alert">
        <h1 className="text-2xl font-extrabold text-white">خطا در بارگذاری</h1>
        <p className="mt-3 text-sm text-zinc-400">
          ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.
        </p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-6 inline-block cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (notFound || !coach) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-white">مربی یافت نشد</h1>
        <p className="mt-3 text-sm text-zinc-400">
          این پروفایل وجود ندارد یا هنوز منتشر نشده است.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const cover = apiAssetUrl(coach.coverImageUrl);
  const avatar = apiAssetUrl(coach.avatarUrl);
  // Big hero portrait uses the cover image (fallback to avatar).
  const portrait = cover || avatar;
  const plansExist = plans.length > 0;
  const minPrice = plansExist
    ? Math.min(...plans.map((p) => (p.discountPrice > 0 ? p.discountPrice : p.price)))
    : 0;
  const showHeroCta = plansExist && canPurchase;
  const specialtyParts = (coach.specialty || "")
    .split(/[،,\n|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const openAbout = (e) => {
    e?.preventDefault?.();
    setAboutOpen(true);
  };

  const socialLinks = coach.social?.phone ? (
    <a
      href={`tel:${coach.social.phone}`}
      aria-label={`تماس: ${coach.social.phone}`}
      dir="rtl"
      className="inline-flex h-11 max-w-full items-center gap-2 rounded-xl bg-zinc-800/60 px-3.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-zinc-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <FiPhone className="shrink-0" />
      <span className="min-w-0 truncate" dir="ltr">{coach.social.phone}</span>
    </a>
  ) : null;

  return (
    <div className="w-full overflow-x-hidden pb-28 md:pb-16">
      {/* HERO — split: big portrait (left) + green info panel (right) */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-3 pt-6 sm:px-4 md:pt-10">
        <div className="grid min-w-0 overflow-hidden rounded-[22px] shadow-2xl ring-1 ring-white/10 sm:rounded-[28px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Portrait — left column in RTL */}
          <div className="relative min-h-[280px] min-w-0 bg-zinc-900 sm:min-h-[340px] md:min-h-[540px]">
            {portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portrait}
                alt={`عکس ${coach.displayName}`}
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl font-bold text-teal-300">
                {coach.displayName?.[0] || "?"}
              </div>
            )}
          </div>

          {/* Info panel — right column in RTL */}
          <AuroraBackground className="min-w-0">
            <div className="relative z-10 flex h-full w-full min-w-0 flex-col justify-center gap-4 p-5 pb-8 text-right sm:gap-5 sm:p-7 md:p-10">
              <div className="relative min-w-0">
              <h1 className="break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-5xl">
                {coach.displayName}
              </h1>
              {coach.title && (
                <p className="mt-2 break-words text-sm font-semibold text-amber-100/90 sm:text-base md:text-lg">
                  {coach.title}
                </p>
              )}
            </div>

            {specialtyParts.length > 1 ? (
              <div className="relative flex w-full max-w-full justify-start">
                <ContainerTextFlip words={specialtyParts} maxWords={15} />
              </div>
            ) : coach.specialty ? (
              <p className="relative break-words text-sm leading-7 text-amber-100/90">
                {limitPhraseWords(specialtyParts[0] || coach.specialty, 15)}
              </p>
            ) : null}

            <div className="relative flex max-w-full flex-wrap items-center justify-start gap-2">{socialLinks}</div>

            <button
              type="button"
              onClick={openAbout}
              dir="rtl"
              className="relative z-20 inline-flex max-w-full cursor-pointer items-center justify-center gap-2 self-start rounded-2xl bg-zinc-800/65 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur transition-colors duration-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-6 sm:py-3.5 sm:text-base"
            >
              <FiChevronDown className="shrink-0 text-lg" />
              <span className="min-w-0">آشنایی بیشتر با مربی</span>
            </button>
            </div>
          </AuroraBackground>
        </div>
      </section>

      {/* VALUE / PROOF STRIP — no negative margin so it never covers hero CTA */}
      {plansExist && (
        <div className="relative z-0 mx-auto mt-6 w-full max-w-3xl px-3 sm:mt-8 sm:px-4">
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur sm:gap-4 sm:rounded-3xl sm:p-4 md:p-6">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white sm:text-xl md:text-2xl">{plans.length}</p>
              <p className="mt-1 text-[10px] leading-tight text-zinc-400 sm:text-xs md:text-sm">پلن آماده</p>
            </div>
            <div className="min-w-0 border-x border-white/10 px-1">
              <p className="break-all text-sm font-extrabold tabular-nums text-teal-300 sm:text-xl md:text-2xl">
                {new Intl.NumberFormat("fa-IR").format(minPrice)}
              </p>
              <p className="mt-1 text-[10px] leading-tight text-zinc-400 sm:text-xs md:text-sm">شروع از (تومان)</p>
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white sm:text-xl md:text-2xl">۱۰۰٪</p>
              <p className="mt-1 text-[10px] leading-tight text-zinc-400 sm:text-xs md:text-sm">اختصاصی</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto mt-10 w-full max-w-5xl overflow-x-clip px-3 sm:px-4">
        <CoachAboutPanel
          coach={coach}
          open={aboutOpen}
          onOpenChange={setAboutOpen}
        />

        <section id="plans" className="mt-10 scroll-mt-20">
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-white md:text-2xl">خرید برنامه</h2>
            <p className="mt-1 text-sm text-zinc-400">
              پلن را انتخاب کنید و پرداخت را تکمیل کنید — بدون فانل اختصاصی.
            </p>
          </div>
          {hasOtherCoach ? (
            <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
              شما قبلاً زیر نظر مربی{" "}
              <span className="font-bold text-white">{assignedCoach.name}</span> هستید و
              نمی‌توانید از مربی دیگر خرید کنید.
              {assignedCoach.slug ? (
                <>
                  {" "}
                  <Link href={getCoachPublicPath(assignedCoach.slug)} className="underline text-teal-200">
                    مشاهده لندینگ مربی شما
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-400">
              فعلاً پلن فعالی برای خرید ثبت نشده است. مربی می‌تواند از پنل، پلن‌های فروش را فعال کند.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const price =
                  plan.discountPrice > 0 ? plan.discountPrice : plan.price;
                const hasDiscount = plan.discountPrice > 0 && plan.discountPrice < plan.price;
                const features = (plan.featuresText || "")
                  .split(/\r?\n/)
                  .map((f) => f.trim())
                  .filter(Boolean);
                const inCart = cartItems.some(
                  (it) => String(it.planId) === String(plan.id)
                );
                const popular = !!plan.isPopular;
                return (
                  <div key={plan.id} className="min-w-0 overflow-hidden rounded-[26px]">
                  <BorderGlow
                    className="h-full max-w-full"
                    borderRadius={26}
                    glowRadius={popular ? 28 : 20}
                    edgeSensitivity={popular ? 22 : 30}
                    coneSpread={25}
                    backgroundColor="#09090b"
                    glowColor={popular ? "152 76 52" : "190 65 58"}
                    glowIntensity={popular ? 1.35 : 0.8}
                    colors={
                      popular
                        ? ["#34d399", "#10b981", "#22d3ee"]
                        : ["#34d399", "#22d3ee", "#a1a1aa"]
                    }
                  >
                    <div className="flex h-full w-full min-w-0 flex-col p-2">
                    {/* header */}
                    <div
                      className={[
                        "rounded-[18px] px-4 py-6 sm:px-6 sm:py-8",
                        popular
                          ? "bg-zinc-900 ring-1 ring-teal-400/20 shadow-[0_8px_24px_-6px_rgba(38,252,227,0.25)]"
                          : "bg-zinc-950 ring-1 ring-white/5 shadow-[0_8px_8px_-3px_rgba(0,0,0,0.4)]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 break-words text-lg font-bold text-white sm:text-xl md:text-2xl">{plan.title}</p>
                        {popular && (
                          <span className="shrink-0 rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300">
                            محبوب‌ترین
                          </span>
                        )}
                      </div>
                      {plan.subtitle && (
                        <p className="mt-2 break-words text-sm leading-6 text-zinc-400">{plan.subtitle}</p>
                      )}
                    </div>

                    {/* body */}
                    <div className="mt-2 min-w-0 p-4 sm:p-6">
                      <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                        <span className="break-all text-2xl font-extrabold tracking-tight text-white tabular-nums sm:text-4xl lg:text-5xl">
                          {new Intl.NumberFormat("fa-IR").format(price)}
                        </span>
                        <span className={["text-sm", popular ? "text-teal-50/90" : "text-zinc-400"].join(" ")}>تومان</span>
                        <span className={["text-sm", popular ? "text-teal-100/80" : "text-zinc-500"].join(" ")}>/ {plan.durationDays} روز</span>
                      </div>
                      {hasDiscount && (
                        <p className={[
                          "mt-1 text-sm line-through",
                          popular ? "text-teal-100/70" : "text-zinc-500",
                        ].join(" ")}>
                          {formatToman(plan.price)}
                        </p>
                      )}

                      {canPurchase ? (() => {
                        const hasOtherPlan = cartItems.length > 0 && !inCart;
                        const addPlan = ({ goCheckout } = {}) => {
                          if (
                            cartCoach.coachId &&
                            String(cartCoach.coachId) !== String(coach.coachId)
                          ) {
                            return toastError(
                              "سبد خرید",
                              "فقط می‌توانید از یک مربی خرید کنید. ابتدا سبد را خالی کنید."
                            );
                          }
                          if (!inCart) {
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
                          }
                          if (goCheckout) {
                            toastSuccess("آماده پرداخت", "در حال انتقال به صفحه پرداخت...");
                            router.push("/payment");
                            return;
                          }
                          if (inCart) {
                            return toastError("سبد خرید", "این پلن قبلاً در سبد است.");
                          }
                          toastSuccess(
                            hasOtherPlan ? "جایگزین شد" : "افزوده شد",
                            hasOtherPlan
                              ? "پلن قبلی از سبد حذف و این پلن انتخاب شد."
                              : "پلن به سبد خرید اضافه شد."
                          );
                        };
                        return (
                          <div className="mt-5 flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => addPlan({ goCheckout: true })}
                              className={[
                                "w-full rounded-full px-4 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                                popular
                                  ? "cursor-pointer bg-white text-teal-700 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25)] hover:bg-teal-50 focus-visible:ring-white"
                                  : "cursor-pointer bg-teal-500/90 text-zinc-950 hover:bg-teal-400 focus-visible:ring-teal-400",
                              ].join(" ")}
                            >
                              خرید برنامه
                            </button>
                            <button
                              type="button"
                              disabled={inCart}
                              onClick={() => addPlan()}
                              className={[
                                "w-full rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                                inCart
                                  ? "cursor-not-allowed bg-teal-400/10 text-teal-200 ring-1 ring-teal-400/30"
                                  : "cursor-pointer bg-transparent text-zinc-300 ring-1 ring-white/15 hover:bg-white/5 focus-visible:ring-teal-400",
                              ].join(" ")}
                            >
                              {inCart ? "در سبد خرید است" : "فقط افزودن به سبد"}
                            </button>
                          </div>
                        );
                      })() : null}

                      {/* divider */}
                      <div className={[
                        "my-7 h-px w-full bg-gradient-to-r from-transparent to-transparent",
                        popular ? "via-white/30" : "via-white/15",
                      ].join(" ")} />

                      {features.length > 0 && (
                        <>
                          <p className={[
                            "font-mono text-xs uppercase tracking-tight",
                            popular ? "text-teal-300/80" : "text-zinc-500",
                          ].join(" ")}>
                            {plan.title} — شامل
                          </p>
                          <div className="mt-4 flex flex-col gap-4">
                            {features.map((feature, i) => (
                              <div key={i} className="flex items-start justify-start gap-2.5">
                                <span
                                  className={[
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                                    popular ? "bg-teal-500/20" : "bg-zinc-800",
                                  ].join(" ")}
                                >
                                  <FiCheck
                                    aria-hidden="true"
                                    className={[
                                      "size-3 stroke-[3]",
                                      popular ? "text-teal-300" : "text-teal-400",
                                    ].join(" ")}
                                  />
                                </span>
                                <p className={[
                                  "min-w-0 break-words text-sm font-medium leading-6",
                                  popular ? "text-zinc-100" : "text-zinc-300",
                                ].join(" ")}>
                                  {feature}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    </div>
                  </BorderGlow>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* STICKY MOBILE CTA */}
      {showHeroCta && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/90 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:px-4 md:hidden">
          <a
            href="#plans"
            className="flex w-full max-w-full flex-wrap items-center justify-center gap-x-1 rounded-2xl bg-white px-3 py-3 text-center text-sm font-extrabold leading-snug text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <span>مشاهده پلن‌ها و خرید برنامه</span>
            <span className="tabular-nums">
              · از {new Intl.NumberFormat("fa-IR").format(minPrice)} تومان
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
