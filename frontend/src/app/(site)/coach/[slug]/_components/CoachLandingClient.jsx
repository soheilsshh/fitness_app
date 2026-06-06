"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiInstagram, FiPhone, FiGlobe } from "react-icons/fi";
import { FaTelegram, FaWhatsapp } from "react-icons/fa";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";

function formatToman(amount) {
  return new Intl.NumberFormat("fa-IR").format(Number(amount)) + " تومان";
}

export default function CoachLandingClient({ slug }) {
  const [coach, setCoach] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [profileRes, plansRes] = await Promise.all([
          api.get(`/coaches/${slug}`),
          api.get(`/coaches/${slug}/plans`),
        ]);
        if (cancelled) return;
        setCoach(profileRes.data);
        setPlans(plansRes.data?.plans || []);
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

  return (
    <div className="pb-16">
      <div className="relative h-56 md:h-72">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="mx-auto -mt-16 max-w-5xl px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-zinc-950 bg-zinc-900 ring-2 ring-white/10">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={coach.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-emerald-300">
                  {coach.displayName?.[0] || "?"}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{coach.displayName}</h1>
              {coach.title && <p className="mt-1 text-sm text-emerald-300">{coach.title}</p>}
              {coach.specialty && (
                <p className="mt-1 text-sm text-zinc-400">{coach.specialty}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {coach.social?.phone && (
              <a
                href={`tel:${coach.social.phone}`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100"
              >
                <FiPhone /> {coach.social.phone}
              </a>
            )}
            {coach.social?.instagram && (
              <a
                href={coach.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-100"
              >
                <FiInstagram />
              </a>
            )}
            {coach.social?.telegram && (
              <a
                href={coach.social.telegram.startsWith("http") ? coach.social.telegram : `https://t.me/${coach.social.telegram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-100"
              >
                <FaTelegram />
              </a>
            )}
            {coach.social?.whatsapp && (
              <a
                href={`https://wa.me/${coach.social.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-100"
              >
                <FaWhatsapp />
              </a>
            )}
            {coach.social?.website && (
              <a
                href={coach.social.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-100"
              >
                <FiGlobe />
              </a>
            )}
          </div>
        </div>

        {(coach.bio || coach.aboutCoach) && (
          <section className="mt-10 space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-6">
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

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-white">پلن‌های قابل خرید</h2>
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-zinc-400">
              فعلاً پلن فعالی برای این مربی ثبت نشده است.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => {
                const price =
                  plan.discountPrice > 0 ? plan.discountPrice : plan.price;
                return (
                  <article
                    key={plan.id}
                    className="rounded-[22px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-white">{plan.title}</h3>
                        {plan.subtitle && (
                          <p className="mt-1 text-sm text-zinc-400">{plan.subtitle}</p>
                        )}
                      </div>
                      {plan.isPopular && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">
                          محبوب
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-lg font-extrabold text-emerald-300">
                      {formatToman(price)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      مدت: {plan.durationDays} روز
                    </p>
                    {plan.featuresText && (
                      <p className="mt-3 whitespace-pre-line text-sm text-zinc-300">
                        {plan.featuresText}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
