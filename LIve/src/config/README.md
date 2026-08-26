# Webinar Configuration

This directory contains centralized configuration for the webinar system.

## Files

### `webinar.ts`

Centralized configuration for webinar timing. This config should match the backend `config.yaml` settings.

**Usage:**

```typescript
import { webinarConfig, getWebinarStartTimeUTC, getFormattedStartTime } from '@/config/webinar';

// Get start time in UTC
const startTime = getWebinarStartTimeUTC();

// Get formatted time string
const timeStr = getFormattedStartTime(); // "19:30"
```

## Environment Variables

You can override the default values using environment variables in `.env` file:

```env
# Webinar start time (Iran/Tehran timezone)
VITE_WEBINAR_START_HOUR=19
VITE_WEBINAR_START_MINUTE=30

# Webinar end time (Iran/Tehran timezone)
VITE_WEBINAR_END_HOUR=22
VITE_WEBINAR_END_MINUTE=0

# Webinar duration in minutes
VITE_WEBINAR_DURATION_MINUTES=150

# Timezone (usually "Asia/Tehran")
VITE_WEBINAR_TIMEZONE=Asia/Tehran
```

## Default Values

The default configuration matches the backend `config.yaml`:

- **Start time:** 19:30 (Iran time) / 16:00 (UTC)
- **End time:** 22:00 (Iran time) / 18:30 (UTC)
- **Duration:** 150 minutes (2.5 hours)
- **Timezone:** Asia/Tehran

## Important Notes

1. **CRITICAL:** Frontend config must match backend `config.yaml` exactly!
2. The frontend primarily uses the webinar start time from the API (`/api/webinar/info`)
3. This config is used as a fallback or for initial calculations
4. All time calculations are converted to UTC for consistency

## Functions

- `getWebinarStartTimeUTC(date?)` - Get webinar start time in UTC
- `getWebinarEndTimeUTC(date?)` - Get webinar end time in UTC
- `getWebinarStartTimeIran(date?)` - Get webinar start time in Iran timezone
- `getFormattedStartTime()` - Get formatted start time string (e.g., "19:30")
- `getFormattedEndTime()` - Get formatted end time string (e.g., "22:00")
- `iranTimeToUTC(hour, minute)` - Convert Iran time to UTC

