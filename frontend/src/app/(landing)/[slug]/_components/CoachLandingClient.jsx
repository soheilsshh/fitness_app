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
import ContainerTextFlip from "@/components/ui/ContainerTextFlip";
import AuroraBackground from "@/components/ui/aurora-background";
import BlurTextAnimation from "@/components/ui/blur-text-animation";
import { useRouter } from "next/navigation";

const HERO_PIXEL_COLORS = ["#34d399", "#6ee7b7", "#a7f3d0", "#ecfdf5", "#ffffff"];

function formatToman(amount) {
  return new Intl.NumberFormat("fa-IR").format(Number(amount)) + " تومان";
}

export default function CoachLandingClient({ slug }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartCoach = useAppSelector(selectCartCoach);
  const cartItems = useAppSelector(selectCartItems);
  const [coach, setCoach] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [assignedCoach, setAssignedCoach] = useState(null);

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

  if (loading) {
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
  const aboutLines = (coach.aboutCoach || coach.bio || "")
    .split(/\r?\n/)
    .map((s) => s.replace(/^[•\-•]\s*/, "").trim())
    .filter(Boolean);
  const plansExist = plans.length > 0;
  const minPrice = plansExist
    ? Math.min(...plans.map((p) => (p.discountPrice > 0 ? p.discountPrice : p.price)))
    : 0;
  const showHeroCta = plansExist && canPurchase;
  const specialtyParts = (coach.specialty || "")
    .split(/[،,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const socialLinks = coach.social?.phone ? (
    <a
      href={`tel:${coach.social.phone}`}
      aria-label={`تماس: ${coach.social.phone}`}
      dir="rtl"
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-800/60 px-3.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-zinc-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <FiPhone /> {coach.social.phone}
    </a>
  ) : null;

  return (
    <div className="pb-28 md:pb-16">
      {/* HERO — split: big portrait (left) + green info panel (right) */}
      <section className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
        <div className="grid overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-white/10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Portrait — left column in RTL */}
          <div className="relative min-h-[340px] bg-zinc-900 md:min-h-[540px]">
            {portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portrait}
                alt={`عکس ${coach.displayName}`}
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-fill"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl font-bold text-teal-300">
                {coach.displayName?.[0] || "?"}
              </div>
            )}
          </div>

          {/* Info panel — right column in RTL */}
          <AuroraBackground>
            <div className="relative z-10 flex h-full w-full flex-col justify-center gap-5 p-7 text-right md:p-10">
              <div className="relative">
              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                {coach.displayName}
              </h1>
              {coach.title && (
                <p className="mt-2 text-base font-semibold text-amber-100/90 md:text-lg">
                  {coach.title}
                </p>
              )}
            </div>

            {specialtyParts.length > 1 ? (
              <div className="relative flex justify-start">
                <ContainerTextFlip words={specialtyParts} />
              </div>
            ) : coach.specialty ? (
              <p className="relative text-sm leading-7 text-amber-100/90">{coach.specialty}</p>
            ) : null}

            {aboutLines.length > 0 && (
              <div className="relative">
                <h2 className="mb-3 text-lg font-bold text-white md:text-xl">سوابق حرفه‌ای</h2>
                <ul className="space-y-2">
                  {aboutLines.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-start gap-2 text-sm leading-7 text-zinc-300 md:text-base"
                    >
                      <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="relative flex flex-wrap items-center justify-start gap-2">{socialLinks}</div>

            <a
              href="#about"
              dir="rtl"
              className="relative self-start inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-800/65 px-6 py-3.5 text-base font-bold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <FiChevronDown className="text-lg" />
              آشنایی بیشتر با مربی
            </a>
            </div>
          </AuroraBackground>
        </div>
      </section>

      {/* VALUE / PROOF STRIP */}
      {plansExist && (
        <div className="mx-auto -mt-10 max-w-3xl px-4">
          <div className="grid grid-cols-3 gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur md:gap-4 md:p-6">
            <div>
              <p className="text-xl font-extrabold text-white md:text-2xl">{plans.length}</p>
              <p className="mt-1 text-xs text-zinc-400 md:text-sm">پلن آماده</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-xl font-extrabold text-teal-300 md:text-2xl">
                {new Intl.NumberFormat("fa-IR").format(minPrice)}
              </p>
              <p className="mt-1 text-xs text-zinc-400 md:text-sm">شروع از (تومان)</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-white md:text-2xl">۱۰۰٪</p>
              <p className="mt-1 text-xs text-zinc-400 md:text-sm">اختصاصی</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-5xl px-4">
        {(coach.bio || coach.aboutCoach) && (
          <section id="about" className="scroll-mt-20 space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-6">
            {coach.bio && (
              <BlurTextAnimation
                text={coach.bio}
                textColor="text-zinc-200"
                fontSize="text-sm"
                className="leading-7"
              />
            )}
            {coach.aboutCoach && (
              <div>
                <h2 className="mb-2 text-lg font-bold text-white">
                  <BlurTextAnimation
                    text="درباره مربی"
                    textColor="text-white"
                    fontSize="text-lg"
                    className="font-bold"
                  />
                </h2>
                <BlurTextAnimation
                  text={coach.aboutCoach}
                  textColor="text-zinc-300"
                  fontSize="text-sm"
                  className="leading-7 whitespace-pre-line mt-2"
                />
              </div>
            )}
          </section>
        )}

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
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
                  <BorderGlow
                    key={plan.id}
                    className="h-full"
                    borderRadius={26}
                    glowRadius={popular ? 44 : 30}
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
                    <div className="flex h-full w-full flex-col p-2">
                    {/* header */}
                    <div
                      className={[
                        "rounded-[18px] px-6 py-8",
                        popular
                          ? "bg-zinc-900 ring-1 ring-teal-400/20 shadow-[0_8px_24px_-6px_rgba(38,252,227,0.25)]"
                          : "bg-zinc-950 ring-1 ring-white/5 shadow-[0_8px_8px_-3px_rgba(0,0,0,0.4)]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xl font-bold text-white md:text-2xl">{plan.title}</p>
                        {popular && (
                          <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-bold text-teal-300">
                            محبوب‌ترین
                          </span>
                        )}
                      </div>
                      {plan.subtitle && (
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{plan.subtitle}</p>
                      )}
                    </div>

                    {/* body */}
                    <div className="mt-2 p-6">
                      <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                        <span className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
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
                                  "text-sm font-medium leading-6",
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
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* STICKY MOBILE CTA */}
      {showHeroCta && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/90 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <a
            href="#plans"
            className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            مشاهده پلن‌ها و خرید برنامه · از{" "}
            {new Intl.NumberFormat("fa-IR").format(minPrice)} تومان
          </a>
        </div>
      )}
    </div>
  );
}
