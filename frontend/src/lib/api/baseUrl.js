/** Production API — used when no NEXT_PUBLIC_API_BASE_URL is set (no .env needed). */
export const DEFAULT_API_BASE_URL = "https://api.fitinoo.ir";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
