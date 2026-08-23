// Environment configuration
export const config = {
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD
      ? 'https://webinar.sianacademy.com/api'
      : 'http://localhost:8083/api'),
  VIDEO_BASE_URL: import.meta.env.VITE_VIDEO_BASE_URL || 'http://localhost:8083',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  FRONTEND_URL: import.meta.env.PROD
    ? 'https://webinar.sianacademy.com'
    : 'http://localhost:8080',
};

// Debug logging to help troubleshoot
console.log('Environment Debug:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  NODE_ENV: import.meta.env.NODE_ENV,
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD
      ? 'https://webinar.sianacademy.com/api'
      : 'http://localhost:8083/api'),
});

// API endpoints
export const API_ENDPOINTS = {
  REGISTER: '/register',
  WEBINAR: '/webinar',
  CHAT: '/chat',
} as const; 