"use client";

import Link from "next/link";
import { FiInstagram } from "react-icons/fi";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { cn } from "@/lib/utils";

export default function InlineSocialIcons({ links }) {
  const items = [
    { key: "ig", href: links?.instagram || "", label: "Instagram", Icon: FiInstagram },
    { key: "tg", href: links?.telegram || "", label: "Telegram", Icon: FaTelegramPlane },
    { key: "wa", href: links?.whatsapp || "", label: "WhatsApp", Icon: FaWhatsapp },
  ].filter((x) => Boolean(x.href));

  if (items.length === 0) return null;

  return (
    <div className="flex items-center justify-start gap-2">
      {items.map(({ key, href, label, Icon }) => (
        <Link
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl",
            "border border-border/70 bg-background/60 text-foreground/80",
            "transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          )}
          aria-label={label}
          title={label}
        >
          <Icon className="size-4" />
        </Link>
      ))}
    </div>
  );
}
