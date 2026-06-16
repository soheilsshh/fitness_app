"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiInstagram, FiPhone, FiGlobe, FiCheck } from "react-icons/fi";
import { FaTelegram, FaWhatsapp } from "react-icons/fa";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addToCart, selectCartCoach, selectCartItems } from "@/store/slices/cartSlice";
import { toastError, toastSuccess } from "@/app/(site)/auth/_components/helpers";
import { getAuthSession } from "@/lib/auth/session";
import BorderGlow from "@/components/ui/BorderGlow";
import ContainerTextFlip from "@/components/ui/ContainerTextFlip";

function formatToman(amount) {
  return new Intl.NumberFormat("fa-IR").format(Number(amount)) + " تومان";
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
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-zinc-400">
        در حال بارگذاری پروفایل مربی...
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
          className="mt-6 inline-block rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-950"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const cover = apiAssetUrl(coach.coverImageUrl);
  const avatar = apiAssetUrl(coach.avatarUrl);
  const plansExist = plans.length > 0;
  const minPrice = plansExist
    ? Math.min(...plans.map((p) => (p.discountPrice > 0 ? p.discountPrice : p.price)))
    : 0;
  const showHeroCta = plansExist && canPurchase;
  const specialtyParts = (coach.specialty || "")
    .split(/[،,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const socialLinks = (
    <>
      {coach.social?.phone && (
        <a
          href={`tel:${coach.social.phone}`}
          aria-label={`تماس: ${coach.social.phone}`}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 text-sm text-zinc-100 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <FiPhone /> {coach.social.phone}
        </a>
      )}
      {coach.social?.instagram && (
        <a
          href={coach.social.instagram}
          target="_blank"
          rel="noreferrer"
          aria-label="اینستاگرام"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-zinc-100 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <FiInstagram />
        </a>
      )}
      {coach.social?.telegram && (
        <a
          href={coach.social.telegram.startsWith("http") ? coach.social.telegram : `https://t.me/${coach.social.telegram}`}
          target="_blank"
          rel="noreferrer"
          aria-label="تلگرام"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-zinc-100 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <FaTelegram />
        </a>
      )}
      {coach.social?.whatsapp && (
        <a
          href={`https://wa.me/${coach.social.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="واتساپ"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-zinc-100 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <FaWhatsapp />
        </a>
      )}
      {coach.social?.website && (
        <a
          href={coach.social.website}
          target="_blank"
          rel="noreferrer"
          aria-label="وب‌سایت"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-zinc-100 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <FiGlobe />
        </a>
      )}
    </>
  );

  return (
    <div className="pb-28 md:pb-16">
      {/* HERO — full-bleed, hero-centric */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
        <div className="absolute inset-0 -z-10">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-500/25 via-zinc-900 to-cyan-500/10" />
          )}
          <div className="absolute inset-0 bg-zinc-950/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/20" />
        </div>

        <div className="mx-auto h-32 w-32 overflow-hidden rounded-[28px] border border-white/15 bg-zinc-900 shadow-2xl ring-4 ring-emerald-400/20 md:h-36 md:w-36">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={coach.displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-emerald-300">
              {coach.displayName?.[0] || "?"}
            </div>
          )}
        </div>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
          {coach.displayName}
        </h1>
        {coach.title && (
          <p className="mt-3 text-base font-semibold text-emerald-300 md:text-lg">{coach.title}</p>
        )}
        {specialtyParts.length > 1 ? (
          <div className="mt-4 flex items-center justify-center">
            <ContainerTextFlip words={specialtyParts} />
          </div>
        ) : coach.specialty ? (
          <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-300 md:text-base">
            {coach.specialty}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">{socialLinks}</div>
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
              <p className="text-xl font-extrabold text-emerald-300 md:text-2xl">
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
          <section className="space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-6">
            {coach.bio && (
              <p className="text-sm leading-7 text-zinc-200">{coach.bio}</p>
            )}
            {coach.aboutCoach && (
              <div>
                <h2 className="mb-2 text-lg font-bold text-white">درباره مربی</h2>
                <p className="text-sm leading-7 text-zinc-300 whitespace-pre-line">
                  {coach.aboutCoach}
                </p>
              </div>
            )}
          </section>
        )}

        <section id="plans" className="mt-10 scroll-mt-20">
          <h2 className="mb-4 text-xl font-extrabold text-white md:text-2xl">پلن‌های قابل خرید</h2>
          {hasOtherCoach ? (
            <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
              شما قبلاً زیر نظر مربی{" "}
              <span className="font-bold text-white">{assignedCoach.name}</span> هستید و
              نمی‌توانید از مربی دیگر خرید کنید.
              {assignedCoach.slug ? (
                <>
                  {" "}
                  <Link href={`/coach/${assignedCoach.slug}`} className="underline text-emerald-200">
                    مشاهده لندینگ مربی شما
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-400">
              فعلاً پلن فعالی برای این مربی ثبت نشده است.
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
                          ? "bg-zinc-900 ring-1 ring-emerald-400/20 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.25)]"
                          : "bg-zinc-950 ring-1 ring-white/5 shadow-[0_8px_8px_-3px_rgba(0,0,0,0.4)]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xl font-bold text-white md:text-2xl">{plan.title}</p>
                        {popular && (
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
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
                        <span className={["text-sm", popular ? "text-emerald-50/90" : "text-zinc-400"].join(" ")}>تومان</span>
                        <span className={["text-sm", popular ? "text-emerald-100/80" : "text-zinc-500"].join(" ")}>/ {plan.durationDays} روز</span>
                      </div>
                      {hasDiscount && (
                        <p className={[
                          "mt-1 text-sm line-through",
                          popular ? "text-emerald-100/70" : "text-zinc-500",
                        ].join(" ")}>
                          {formatToman(plan.price)}
                        </p>
                      )}

                      {canPurchase ? (() => {
                        const hasOtherPlan = cartItems.length > 0 && !inCart;
                        return (
                          <button
                            type="button"
                            disabled={inCart}
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
                            className={[
                              "mt-5 w-full rounded-full px-4 py-3.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                              inCart
                                ? popular
                                  ? "cursor-not-allowed bg-emerald-950/40 text-emerald-50 ring-1 ring-white/30 focus-visible:ring-white"
                                  : "cursor-not-allowed bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/30 focus-visible:ring-emerald-400"
                                : popular
                                  ? "cursor-pointer bg-white text-emerald-700 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.25)] hover:bg-emerald-50 focus-visible:ring-white"
                                  : "cursor-pointer bg-zinc-950 text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-800 focus-visible:ring-emerald-400",
                            ].join(" ")}
                          >
                            {inCart ? "در سبد خرید است" : "انتخاب این پلن"}
                          </button>
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
                            popular ? "text-emerald-300/80" : "text-zinc-500",
                          ].join(" ")}>
                            {plan.title} — شامل
                          </p>
                          <div className="mt-4 flex flex-col gap-4">
                            {features.map((feature, i) => (
                              <div key={i} className="flex items-start justify-start gap-2.5">
                                <span
                                  className={[
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                                    popular ? "bg-emerald-500/20" : "bg-zinc-800",
                                  ].join(" ")}
                                >
                                  <FiCheck
                                    aria-hidden="true"
                                    className={[
                                      "size-3 stroke-[3]",
                                      popular ? "text-emerald-300" : "text-emerald-400",
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
            className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-950 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            مشاهده پلن‌ها · از {new Intl.NumberFormat("fa-IR").format(minPrice)} تومان
          </a>
        </div>
      )}
    </div>
  );
}
