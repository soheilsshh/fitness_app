// Webinar localStorage utility functions

export interface WebinarStorage {
  videoTime: number;
  startTime: number;
  chatHistory: any[];
  savedAt: number;
}

// Save video time to localStorage
export const saveVideoTime = (time: number): void => {
  console.log('[webinarStorage] ⚠️ saveVideoTime is disabled (no persistence allowed). Ignored time:', time);
};

// Load video time from localStorage
export const loadVideoTime = (): number => {
  const error = new Error('ILLEGAL CALL TO loadVideoTime() - video time persistence is disabled.');
  console.error('[webinarStorage] ❌', error.message);
  console.error('[webinarStorage] Stack trace:', new Error().stack);
  return 0;
};

// Save chat history to localStorage
export const saveChatHistory = (messages: any[]): void => {
  try {
    const chatHistory = {
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })),
      savedAt: Date.now()
    };
    localStorage.setItem('webinar_chat_history', JSON.stringify(chatHistory));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

// Load chat history from localStorage
// CRITICAL: This function is BLOCKED - it would bypass CommentScheduler
export const loadChatHistory = (): any[] => {
  const error = new Error('ILLEGAL CALL TO loadChatHistory() from webinarStorage - This function is BLOCKED. All messages must come from CommentScheduler.');
  console.error('[webinarStorage] ❌', error.message);
  console.error('[webinarStorage] Stack trace:', new Error().stack);
  throw error;
};

// Clear all webinar data from localStorage
export const clearWebinarData = (): void => {
  try {
    localStorage.removeItem('webinar_chat_history');
    localStorage.removeItem('webinar_video_time');
    localStorage.removeItem('webinar_start_time');
    console.log('Cleared webinar localStorage data');
  } catch (error) {
    console.error('Failed to clear webinar data:', error);
  }
};

// Check if webinar data exists in localStorage
export const hasWebinarData = (): boolean => {
  console.log('[webinarStorage] hasWebinarData is disabled (always false)');
  return false;
}; 
