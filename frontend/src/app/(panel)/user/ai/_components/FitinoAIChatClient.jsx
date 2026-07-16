"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, RotateCcw, SendHorizontal, Sparkles } from "lucide-react";
import { api } from "@/lib/axios/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearChatMessages,
  defaultChatMessages,
  loadChatMessages,
  saveChatMessages,
} from "@/app/(panel)/user/_components/ai/chatStorage";

const QUICK_PROMPTS = [
  "پروفایلم کجاست؟",
  "چطور با مربی تیکت بزنم؟",
  "تاریخچه تمرینات کجاست؟",
  "پایش وزن چطور کار می‌کند؟",
];

/**
 * Single Fitino AI conversation page (panel chrome stays from UserPanelShell).
 */
export default function FitinoAIChatClient() {
  const pathname = usePathname();
  const [messages, setMessages] = useState(defaultChatMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const listRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    setMessages(loadChatMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveChatMessages(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function sendText(text) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextHistory = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      const history = nextHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(0, -1)
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post("/me/ai/chat", {
        message: trimmed,
        history,
        pagePath: pathname || "/user/ai",
      });
      const reply =
        res.data?.reply ||
        "الان نتونستم پاسخ بدم. از بخش ارتباط با مربی تیکت بزن.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        "ارتباط با دستیار برقرار نشد. کمی بعد دوباره تلاش کن.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e) {
    e?.preventDefault?.();
    sendText(input);
  }

  function resetChat() {
    clearChatMessages();
    setMessages(defaultChatMessages());
  }

  return (
    <div
      dir="rtl"
      className={cn(
        "relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem]",
        "border border-[#187272]/18 bg-background/80 shadow-[0_24px_50px_-22px_rgba(24,114,114,0.35)]",
        "backdrop-blur-xl dark:border-[#26fce3]/18 dark:bg-[#101818]/75",
        "min-h-[calc(100dvh-var(--header-height,3.5rem)-8.5rem)] md:min-h-[calc(100dvh-var(--header-height,3.5rem)-4rem)]"
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(90%_100%_at_50%_0%,rgba(38,252,227,0.18),transparent_70%)]"
      />

      <header className="relative z-[1] flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#6ceade,#187272)] text-white shadow-[0_10px_24px_-12px_rgba(24,114,114,0.7)]">
            <Sparkles className="size-5" />
            <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-[#26fce3] ring-2 ring-background" />
          </span>
          <div className="min-w-0 text-start">
            <h2 className="font-iranianSansBlack text-lg tracking-tight text-foreground">
              دستیار فیتینو
            </h2>
            <p className="mt-0.5 text-xs font-iranianSansMedium text-muted-foreground">
              یک گفت‌وگو · راهنمای امکانات اپ (نه برنامه تمرین/تغذیه)
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetChat}
          className="shrink-0 gap-1.5 rounded-full"
          aria-label="شروع دوباره گفتگو"
        >
          <RotateCcw className="size-3.5" />
          گفتگوی تازه
        </Button>
      </header>

      <div
        ref={listRef}
        className="relative z-[1] flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5"
      >
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}-${m.content.slice(0, 12)}`}
            className={cn(
              "max-w-[92%] rounded-[1.25rem] px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%]",
              m.role === "user"
                ? "ms-auto bg-[linear-gradient(165deg,#58cac0,#187272)] text-white shadow-[0_10px_22px_-14px_rgba(24,114,114,0.55)]"
                : "me-auto border border-border/60 bg-muted/45 text-foreground dark:bg-white/[0.04]"
            )}
          >
            {m.content}
          </div>
        ))}
        {sending ? (
          <div className="me-auto inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            در حال فکر کردن…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {messages.length <= 2 ? (
        <div className="relative z-[1] flex flex-wrap gap-2 border-t border-border/40 px-3 py-2.5 sm:px-5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={sending}
              onClick={() => sendText(q)}
              className={cn(
                "rounded-full border border-[#187272]/20 bg-background/80 px-3 py-1.5",
                "text-[11px] font-iranianSansMedium text-foreground transition hover:border-[#187272]/35 hover:bg-[#187272]/6",
                "dark:border-[#26fce3]/20 dark:hover:bg-[#26fce3]/10"
              )}
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="relative z-[1] flex items-end gap-2 border-t border-border/60 p-3 sm:p-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          maxLength={1200}
          placeholder="سوالت درباره فیتینو را بنویس…"
          className={cn(
            "max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border/70 bg-background px-3.5 py-2.5",
            "text-sm font-iranianSansMedium outline-none focus-visible:ring-2 focus-visible:ring-[#26fce3]/55"
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !input.trim()}
          aria-label="ارسال"
          className="size-11 shrink-0 rounded-2xl"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
