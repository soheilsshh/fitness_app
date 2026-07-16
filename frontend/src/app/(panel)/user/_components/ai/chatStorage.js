const CHAT_STORAGE_KEY = "fitino-ai-chat-v1";
const FAB_POS_KEY = "fitino-ai-fab-pos";

export const FITINO_AI_WELCOME =
  "سلام! من دستیار فیتینو هستم. درباره امکانات اپ، حساب، سفارش‌ها، پایش و مسیر استفاده بپرس. برای برنامه تمرین یا تغذیه باید از مربی‌های فیتینو کمک بگیری.";

export function defaultChatMessages() {
  return [{ role: "assistant", content: FITINO_AI_WELCOME }];
}

export function loadChatMessages() {
  if (typeof window === "undefined") return defaultChatMessages();
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return defaultChatMessages();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultChatMessages();
    const cleaned = parsed.filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    );
    return cleaned.length ? cleaned : defaultChatMessages();
  } catch {
    return defaultChatMessages();
  }
}

export function saveChatMessages(messages) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-80)));
  } catch {
    /* ignore quota */
  }
}

export function clearChatMessages() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { FAB_POS_KEY, CHAT_STORAGE_KEY };
