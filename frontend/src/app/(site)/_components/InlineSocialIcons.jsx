"use client";

import Link from "next/link";
import { FiInstagram } from "react-icons/fi";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function InlineSocialIcons({ links }) {
  const instagram = links?.instagram || "";
  const telegram = links?.telegram || "";
  const whatsapp = links?.whatsapp || "";

  const items = [
    { key: "ig", href: instagram, label: "Instagram", Icon: FiInstagram },
    { key: "tg", href: telegram, label: "Telegram", Icon: FaTelegramPlane },
    { key: "wa", href: whatsapp, label: "WhatsApp", Icon: FaWhatsapp },
  ].filter((x) => Boolean(x.href));

  if (items.length === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-2">
      {items.map(({ key, href, label, Icon }) => (
        <Link
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
            "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
          )}
          aria-label={label}
          title={label}
        >
          <Icon className="text-[18px]" />
        </Link>
      ))}
    </div>
  );
}
