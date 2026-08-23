import { config } from '@/config/environment';
import { normalizePhoneNumber } from '@/utils/phoneUtils';

const API_BASE_URL = config.API_BASE_URL;

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  registered_at: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone: string;
  promoter_id?: number;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface WebinarInfo {
  title: string;
  start_time: string;
  end_time: string;
  video_url: string;
  capacity: number;
  registered_count: number;
  is_live: boolean;
  is_manually_stopped?: boolean; // Flag indicating manual stop by admin
  timezone?: string; // Optional timezone info from backend
  comment_offset_seconds?: number; // Unified offset for all devices (seconds)
  thankyou_display_time?: string; // Custom time for ThankYou page display (format: "HH:MM")
}

export interface ActiveWebinarResponse {
  streamStartTime: number;      // Timestamp in milliseconds (actual or scheduled)
  serverNow: number;            // Timestamp in milliseconds
  isStreamRunning: boolean;     // Whether stream is currently active
  streamEndTime: number;        // Expected stream end time (ms, 0 if not set)
  scheduledStartTime: number;   // Scheduled start time (ms)
  scheduledEndTime: number;     // Scheduled end time (ms)
}

export interface ChatMessage {
  Username: string;
  Message: string;
  Timestamp: string;
  IsAdmin: boolean;
}

export interface ChatRequest {
  username: string;
  message: string;
}

export interface ChatResponse {
  messages: ChatMessage[];
}

export interface PostChatResponse {
  message: ChatMessage;
}

export interface PaymentRequest {
  first_name: string;
  last_name: string;
  phone: string;
  amount: number;
  type: 'subscription' | 'roadmap';
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_url?: string;
  authority?: string;
  message?: string;
  error?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Find user by phone number (for login without registration)
  async findUserByPhone(phone: string): Promise<{ found: boolean; user?: User; error?: string }> {
    const normalizedPhone = normalizePhoneNumber(phone);
    try {
      const response = await fetch(`${API_BASE_URL}/find-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      if (response.status === 404) {
        const data = await response.json();
        return { found: false, error: data.error || 'با شماره ای ثبت نام کرده اید وارد شوید' };
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return { found: data.found, user: data.user };
    } catch (error) {
      console.error('Failed to find user by phone:', error);
      return { found: false, error: 'خطا در جستجوی کاربر' };
    }
  }

  // User registration
  async registerUser(data: RegisterRequest, skipSMS: boolean = false): Promise<RegisterResponse> {
    // Get promoter from URL query parameter if exists
    const urlParams = new URLSearchParams(window.location.search);
    const promoterFromUrl = urlParams.get('promoter');
    
    // If promoter is in URL, use it (priority over body)
    const requestData = promoterFromUrl 
      ? { ...data, promoter_id: parseInt(promoterFromUrl, 10) }
      : data;
    
    // Also append promoter to URL if exists, and skip_sms flag
    let endpoint = '/register';
    const params = new URLSearchParams();
    if (promoterFromUrl) {
      params.append('promoter', promoterFromUrl);
    }
    if (skipSMS) {
      params.append('skip_sms', 'true');
    }
    if (params.toString()) {
      endpoint = `/register?${params.toString()}`;
    }
    
    return this.request<RegisterResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // Get webinar information
  async getWebinarInfo(): Promise<WebinarInfo> {
    return this.request<WebinarInfo>('/webinar');
  }

  // Get active webinar timing (streamStartTime and serverNow)
  // This is the ONLY source of truth for comment synchronization
  async getActiveWebinar(): Promise<ActiveWebinarResponse> {
    return this.request<ActiveWebinarResponse>('/webinar/active');
  }

  // Get chat messages
  // WARNING: This endpoint now always returns empty messages.
  // Chat messages are managed entirely by the timed comment system (CommentScheduler).
  // DO NOT use this method - it will always return an empty array.
  async getChatMessages(): Promise<ChatResponse> {
    // This endpoint now always returns empty messages to ensure clean start for each webinar
    return this.request<ChatResponse>('/chat');
  }

  // Post a chat message
  async postChatMessage(data: ChatRequest): Promise<PostChatResponse> {
    return this.request<PostChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Track click on webinar link
  async trackClick(phone: string): Promise<void> {
    try {
      await this.request('/track/click', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
      // Don't throw - tracking should not break the app
    }
  }

  // Track landing activity
  async trackLandingActivity(phone: string, status: string, firstName?: string, lastName?: string, metadata?: any): Promise<void> {
    try {
      await this.request('/landing/track', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          status,
          first_name: firstName,
          last_name: lastName,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to track landing activity:', error);
      // Don't throw - tracking should not break the app
    }
  }

  // Update landing duration
  async updateLandingDuration(phone: string): Promise<void> {
    try {
      await this.request('/landing/update-duration', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    } catch (error) {
      console.error('Failed to update landing duration:', error);
      // Don't throw - tracking should not break the app
    }
  }

  // Track view start
  async trackView(phone: string, viewStartTime?: Date): Promise<void> {
    try {
      const body: any = { phone };
      if (viewStartTime) {
        body.view_start_time = viewStartTime.toISOString();
      }
      await this.request('/track/view', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Failed to track view:', error);
      // Don't throw - tracking should not break the app
    }
  }

  // Update view time
  async updateViewTime(phone: string, viewMinutes: number, activeWatchMinutes: number = 0): Promise<void> {
    try {
      await this.request('/track/view-time', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          view_minutes: viewMinutes,
          active_watch_minutes: activeWatchMinutes,
        }),
      });
    } catch (error) {
      console.error('Failed to update view time:', error);
      // Don't throw - tracking should not break the app
    }
  }

  // Heartbeat - updates last_updated timestamp for online status tracking
  // Should be called frequently (every 5 seconds) ONLY when page is visible
  async heartbeat(phone: string): Promise<void> {
    try {
      await this.request('/track/heartbeat', {
        method: 'POST',
        body: JSON.stringify({
          phone,
        }),
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      // Don't throw - heartbeat should not break the app
    }
  }

  // End session - marks user as offline immediately
  // Should be called when page goes to background or is closed
  async endSession(phone: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/track/end-session`;
      const data = JSON.stringify({ phone });
      
      // Use sendBeacon for reliable delivery even when page is unloading
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback to fetch if sendBeacon is not available
        // Use keepalive flag for better reliability during unload
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
          keepalive: true, // Keep request alive even after page unloads
        });
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      // Don't throw - end session should not break the app
    }
  }

  // Get payment config (subscription price)
  async getPaymentConfig(): Promise<{ subscription_price: number }> {
    // Add cache busting to ensure we get latest price
    const timestamp = new Date().getTime();
    return this.request<{ subscription_price: number }>(`/payment/config?t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
  }

  // Verify payment by Authority
  async verifyPayment(authority: string): Promise<{
    success: boolean;
    status: 'success' | 'failed' | 'pending';
    ref_id?: string;
    amount?: number;
    type?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    license_key?: string;
    error?: string;
    code?: string;
  }> {
    return this.request(`/payment/verify?authority=${encodeURIComponent(authority)}`);
  }

  // Create payment request
  async createPaymentRequest(data: PaymentRequest): Promise<PaymentResponse> {
    return this.request<PaymentResponse>('/payment/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Assign license to user after successful payment
  async assignLicense(authority: string, phone: string): Promise<{
    success: boolean;
    license_code?: string;
    message?: string;
    error?: string;
  }> {
    return this.request('/license/assign', {
      method: 'POST',
      body: JSON.stringify({
        authority: authority,
        phone: phone,
      }),
    });
  }
}

export const apiService = new ApiService(); 