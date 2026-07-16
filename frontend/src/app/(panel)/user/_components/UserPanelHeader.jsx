"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, GraduationCap, HelpCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PROFILE_UPDATED_EVENT } from "@/app/(panel)/user/_components/profileEvents";
import { api } from "@/lib/axios/client";
import { apiAssetUrl } from "@/lib/api/assets";
import { getAuthSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function ProfileProgressAvatar({
  percent = 0,
  photoUrl,
  name,
  href = "/user/profile",
}) {
  const size = 44;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const complete = clamped >= 100;
  const offset = circumference - (clamped / 100) * circumference;
  const title = complete
    ? "پروفایل تکمیل شده"
    : `تکمیل پروفایل ${clamped.toLocaleString("fa-IR")}٪`;

  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-transform duration-200 active:scale-[0.97]"
      )}
      aria-label={title}
      title={title}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/70"
        />
        {!complete ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-[stroke-dashoffset] duration-500 ease-out"
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-emerald-500"
          />
        )}
      </svg>

      <span
        className={cn(
          "absolute inset-[3px] overflow-hidden rounded-full bg-muted ring-2 ring-background",
          "flex items-center justify-center"
        )}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name ? `تصویر ${name}` : "پروفایل"}
            className="size-full object-cover"
          />
        ) : (
          <Logo className="h-7 w-7 object-contain" />
        )}
      </span>

      {complete ? (
        <span
          className="absolute -bottom-0.5 -start-0.5 inline-flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-background"
          aria-hidden
        >
          <Check className="size-2.5 stroke-[3]" />
        </span>
      ) : null}
    </Link>
  );
}

export default function UserPanelHeader() {
  const [profile, setProfile] = useState({
    name: "",
    percent: 0,
    photoUrl: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = getAuthSession();
      try {
        const res = await api.get("/me");
        if (cancelled) return;
        const data = res.data || {};
        const fullName = [data.firstName, data.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const avatar =
          data.avatarUrl || data.avatar || data.profilePhotoUrl || "";
        setProfile({
          name: fullName || session?.name || "ورزشکار",
          percent: Number(data.profileProgress?.percent ?? 0),
          photoUrl: avatar ? apiAssetUrl(avatar) : "",
        });
      } catch {
        if (!cancelled) {
          setProfile((prev) => ({
            ...prev,
            name: session?.name || prev.name || "ورزشکار",
          }));
        }
      }
    }

    load();

    const onUpdated = (event) => {
      const detail = event?.detail || {};
      setProfile((prev) => ({
        name: detail.name || prev.name,
        percent:
          detail.percent != null ? Number(detail.percent) : prev.percent,
        photoUrl:
          detail.avatarUrl !== undefined ? detail.avatarUrl : prev.photoUrl,
      }));
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdated);
    };
  }, []);

  const greetingName = useMemo(() => {
    const n = (profile.name || "").trim();
    if (!n || n === "کاربر جدید") return "ورزشکار";
    return n.split(/\s+/)[0] || n;
  }, [profile.name]);

  return (
    <header
      dir="rtl"
      className="fitino-subnav-shell sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center"
    >
      <div className="flex w-full items-center gap-2.5 px-3 sm:gap-3 sm:px-4 lg:px-6">
        {/* Right (RTL start): avatar + welcome — no section labels */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SidebarTrigger className="-ms-0.5 hidden md:inline-flex" />
          <Separator
            orientation="vertical"
            className="hidden h-6 data-[orientation=vertical]:h-6 md:block"
          />
          <ProfileProgressAvatar
            percent={profile.percent}
            photoUrl={profile.photoUrl}
            name={profile.name}
          />
          <div className="min-w-0 text-start">
            <p className="truncate text-sm font-iranianSansDemiBold tracking-tight text-foreground">
              {greetingName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
              به مسیر اهدافت خوش آمدی
            </p>
          </div>
        </div>

        {/* Left: learning + FAQ + theme */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/user/academy"
            className={cn(
              "fitino-meta-badge inline-flex size-10 shrink-0 items-center justify-center rounded-full !p-0",
              "!h-10 !min-h-10 !w-10",
              "transition-[transform,box-shadow] duration-200 hover:brightness-[1.03] active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26fce3]/65"
            )}
            aria-label="آموزش"
            title="آموزش"
          >
            <GraduationCap className="size-4 shrink-0 opacity-90" />
          </Link>
          <Link
            href="/user/faq"
            className={cn(
              "fitino-meta-badge inline-flex size-10 shrink-0 items-center justify-center rounded-full !p-0",
              "!h-10 !min-h-10 !w-10",
              "transition-[transform,box-shadow] duration-200 hover:brightness-[1.03] active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26fce3]/65"
            )}
            aria-label="سوالات متداول"
            title="سوالات متداول"
          >
            <HelpCircle className="size-4 shrink-0 opacity-90" />
          </Link>
          <ThemeToggle buttonClassName="size-10 h-10 w-10 rounded-full" />
        </div>
      </div>
    </header>
  );
}
