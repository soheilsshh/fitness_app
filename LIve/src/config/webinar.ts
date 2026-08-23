/**
 * Webinar Configuration
 * 
 * DYNAMIC configuration loaded from API
 * This reads from /api/webinar endpoint which gets data from database
 * Falls back to defaults if API is not available
 */

import { apiService } from '@/services/api';

export interface WebinarConfig {
  // Start time in Iran/Tehran timezone
  startHour: number;    // 0-23
  startMinute: number;  // 0-59
  
  // End time in Iran/Tehran timezone
  endHour: number;      // 0-23
  endMinute: number;    // 0-59 (usually 0)
  
  // Duration in minutes (optional, for display)
  durationMinutes: number;
  
  // Timezone
  timezone: string;     // e.g., "Asia/Tehran"
}

// Default webinar configuration (fallback only)
const DEFAULT_CONFIG: WebinarConfig = {
  startHour: 19,
  startMinute: 0,
  endHour: 22,
  endMinute: 0,
  durationMinutes: 123,
  timezone: "Asia/Tehran"
};

// Cache for webinar config loaded from API
let cachedConfig: WebinarConfig | null = null;
let configLoadPromise: Promise<WebinarConfig> | null = null;

/**
 * Load webinar config from API
 * Uses cache to avoid multiple API calls
 */
async function loadWebinarConfigFromAPI(): Promise<WebinarConfig> {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // If already loading, return the existing promise
  if (configLoadPromise) {
    return configLoadPromise;
  }

  // Start loading from API
  configLoadPromise = (async () => {
    try {
      const info = await apiService.getWebinarInfo();
      console.log('[WebinarConfig] Raw API response:', {
        start_time: info.start_time,
        end_time: info.end_time,
        scheduling_mode: (info as any).scheduling_mode,
        timezone: info.timezone
      });
      
      const startTime = new Date(info.start_time);
      const endTime = new Date(info.end_time);
      
      // IMPORTANT: Extract hour and minute in Iran timezone
      // The API returns RFC3339 format which includes timezone info
      // We need to parse it correctly in Iran timezone
      const iranStartParts = startTime.toLocaleString("en-US", { 
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).split(':');
      const startHour = parseInt(iranStartParts[0], 10);
      const startMinute = parseInt(iranStartParts[1], 10);
      
      const iranEndParts = endTime.toLocaleString("en-US", { 
        timeZone: "Asia/Tehran",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).split(':');
      const endHour = parseInt(iranEndParts[0], 10);
      const endMinute = parseInt(iranEndParts[1], 10);
      
      // Calculate duration
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      
      cachedConfig = {
        startHour,
        startMinute,
        endHour,
        endMinute,
        durationMinutes,
        timezone: info.timezone || "Asia/Tehran"
      };
      
      console.log('[WebinarConfig] Loaded from API:', {
        ...cachedConfig,
        raw_start_time: info.start_time,
        parsed_start_time: startTime.toISOString(),
        scheduling_mode: (info as any).scheduling_mode || 'unknown'
      });
      return cachedConfig;
    } catch (error) {
      console.warn('[WebinarConfig] Failed to load from API, using defaults:', error);
      configLoadPromise = null; // Reset promise on error
      return DEFAULT_CONFIG;
    }
  })();

  return configLoadPromise;
}

/**
 * Get webinar config (from API or cache)
 * This is the main function to use - it loads from API dynamically
 */
export async function getWebinarConfig(): Promise<WebinarConfig> {
  return loadWebinarConfigFromAPI();
}

/**
 * Get webinar config synchronously (from cache or defaults)
 * Use this only if you're sure config is already loaded
 * Otherwise use getWebinarConfig() which is async
 */
export function getWebinarConfigSync(): WebinarConfig {
  return cachedConfig || DEFAULT_CONFIG;
}

/**
 * Clear cache to force reload from API
 */
export function clearWebinarConfigCache() {
  cachedConfig = null;
  configLoadPromise = null;
}

// For backward compatibility, export a reactive config object
// This will be updated when API loads
export const webinarConfig: WebinarConfig = {
  get startHour() { return getWebinarConfigSync().startHour; },
  get startMinute() { return getWebinarConfigSync().startMinute; },
  get endHour() { return getWebinarConfigSync().endHour; },
  get endMinute() { return getWebinarConfigSync().endMinute; },
  get durationMinutes() { return getWebinarConfigSync().durationMinutes; },
  get timezone() { return getWebinarConfigSync().timezone; },
};

/**
 * Convert Iran/Tehran time to UTC
 * Iran timezone: UTC+3:30
 */
export function iranTimeToUTC(hour: number, minute: number): { utcHour: number; utcMinute: number } {
  // Iran is UTC+3:30
  let utcHour = hour - 3;
  let utcMinute = minute - 30;
  
  // Handle minute overflow/underflow
  if (utcMinute < 0) {
    utcMinute += 60;
    utcHour -= 1;
  }
  
  // Handle hour overflow/underflow
  if (utcHour < 0) {
    utcHour += 24;
  } else if (utcHour >= 24) {
    utcHour -= 24;
  }
  
  return { utcHour, utcMinute };
}

/**
 * Get webinar start time in UTC (for calculations)
 * Returns Date object for today at the configured start time in UTC
 */
export function getWebinarStartTimeUTC(date?: Date): Date {
  const targetDate = date || new Date();
  const { utcHour, utcMinute } = iranTimeToUTC(webinarConfig.startHour, webinarConfig.startMinute);
  
  const startTime = new Date(targetDate);
  startTime.setUTCHours(utcHour, utcMinute, 0, 0);
  startTime.setUTCMilliseconds(0);
  
  return startTime;
}

/**
 * Get webinar end time in UTC
 */
export function getWebinarEndTimeUTC(date?: Date): Date {
  const targetDate = date || new Date();
  const { utcHour, utcMinute } = iranTimeToUTC(webinarConfig.endHour, webinarConfig.endMinute);
  
  const endTime = new Date(targetDate);
  endTime.setUTCHours(utcHour, utcMinute, 0, 0);
  endTime.setUTCMilliseconds(0);
  
  return endTime;
}

/**
 * Get webinar start time in Iran/Tehran timezone
 */
export function getWebinarStartTimeIran(date?: Date): Date {
  const targetDate = date || new Date();
  
  // Create date in Iran timezone
  const startTime = new Date(targetDate.toLocaleString("en-US", { timeZone: webinarConfig.timezone }));
  startTime.setHours(webinarConfig.startHour, webinarConfig.startMinute, 0, 0);
  
  return startTime;
}

/**
 * Format time for display (Iran time)
 */
export function formatWebinarTime(hour: number, minute: number): string {
  const hourStr = hour.toString().padStart(2, '0');
  const minuteStr = minute.toString().padStart(2, '0');
  return `${hourStr}:${minuteStr}`;
}

/**
 * Get formatted start time string
 */
export function getFormattedStartTime(): string {
  return formatWebinarTime(webinarConfig.startHour, webinarConfig.startMinute);
}

/**
 * Get formatted end time string
 */
export function getFormattedEndTime(): string {
  return formatWebinarTime(webinarConfig.endHour, webinarConfig.endMinute);
}

// Log configuration on load (only in development)
if (import.meta.env.DEV) {
  console.log('[WebinarConfig] Loaded configuration:', {
    start: getFormattedStartTime(),
    end: getFormattedEndTime(),
    duration: webinarConfig.durationMinutes,
    timezone: webinarConfig.timezone,
    utcStart: iranTimeToUTC(webinarConfig.startHour, webinarConfig.startMinute)
  });
}

