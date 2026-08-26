export const REGISTRATION_COUNTDOWN = {
  days: 21,
  hours: 0,
  minutes: 0,
  seconds: 0,
} as const;

export const padCountdown = (value: number) => String(value).padStart(2, '0');
