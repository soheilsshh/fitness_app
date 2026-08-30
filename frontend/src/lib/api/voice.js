/** Whisper + optional Gemini JSON refine can exceed the default axios timeout. */
export const VOICE_API_TIMEOUT_MS = 120_000;

export function voiceApiErrorMessage(err, fallback = "پردازش صدا ناموفق بود") {
  const code = err?.code;
  const msg = String(err?.message || "");
  if (code === "ECONNABORTED" || /timeout/i.test(msg)) {
    return "پردازش صدا طولانی شد — چند ثانیه صبر کنید و دوباره تلاش کنید";
  }
  if (!err?.response) {
    return "ارتباط با سرور برقرار نشد — بک‌اند را بررسی کنید";
  }
  return err?.response?.data?.error || fallback;
}
