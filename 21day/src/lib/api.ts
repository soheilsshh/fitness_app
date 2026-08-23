export const API_BASE_URL = 'http://localhost:8081/api';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface Video {
  id: number;
  title: string;
  description: string;
  duration: string;
  code: string;
  points: number;
}

export interface Progress {
  id: number;
  user_id: number;
  video_id: number;
  unlocked: boolean;
  completed: boolean;
}

export interface UserProgress {
  progress: Progress[];
  total_points: number;
  level: number;
  progress_percent: number;
  completed_videos: number;
  total_videos: number;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
  existing: boolean;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User registration - now handles existing users gracefully
  async registerUser(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get all videos
  async getVideos(): Promise<{ videos: Video[] }> {
    return this.request<{ videos: Video[] }>('/videos');
  }

  // Complete a video
  async completeVideo(videoId: number, phone: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/videos/${videoId}/complete?phone=${encodeURIComponent(phone)}`, {
      method: 'POST',
    });
  }

  // Unlock a video
  async unlockVideo(videoId: number, phone: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/videos/${videoId}/unlock?phone=${encodeURIComponent(phone)}`, {
      method: 'POST',
    });
  }

  // Get user progress
  async getUserProgress(phone: string): Promise<UserProgress> {
    return this.request<UserProgress>(`/progress?phone=${encodeURIComponent(phone)}`);
  }
}

export const apiService = new ApiService(); 