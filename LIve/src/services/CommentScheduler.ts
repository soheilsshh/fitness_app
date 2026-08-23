/**
 * CommentScheduler - Server-time-based comment synchronization with drift correction
 * 
 * This scheduler uses globalTime (calculated from server time) as the source of truth.
 * Supports:
 * - Permanent base offset (manual adjustment)
 * - Automatic drift correction (hard/soft modes)
 * - Comment display based on: absoluteTime + baseOffset + dynamicOffset
 */

import { TimedComment } from "@/data/timedComments";
import { parseTimecodeToSeconds } from "./AdaptiveCommentEngine";

export interface CommentWithAbsoluteTime extends TimedComment {
  absoluteTime: number; // Absolute time in video timeline (seconds)
  commentId: string;   // Unique identifier
}

export interface DisplayedComment {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isAdmin?: boolean;
  replyToUsername?: string;
  replyToMessage?: string;
}

interface DriftCorrectionConfig {
  mode: 'hard' | 'soft';
  maxDrift: number;      // Minimum drift to trigger correction (seconds)
  correctionStep: number; // Step size for correction (seconds)
}

interface CommentHistoryEntry {
  commentId: string;
  expectedTime: number;
  actualTime: number;
}

export class CommentScheduler {
  private comments: CommentWithAbsoluteTime[] = [];
  private displayedIds = new Set<string>();
  private scheduledTimers = new Map<string, NodeJS.Timeout>();
  private onCommentDisplay: (comment: DisplayedComment) => void;
  private timeWindow = { before: 0.2, after: 0.3 }; // Show comments 0.2s before to 0.3s after their time
  
  private videoStarted = false;
  private lastSyncTime = -1;
  private lastSyncTimeRaw = -1;
  
  // Offset system
  private baseOffset = 0;        // Permanent base offset (manual, set via setFixedOffset)
  private dynamicOffset = 0;     // Dynamic offset for drift correction
  private driftConfig: DriftCorrectionConfig | null = null; // Drift correction configuration
  
  // Drift tracking
  private lastSyncCheckTime = -1;
  private syncCheckInterval = 20; // Check drift every 20 seconds
  private displayedCommentsHistory: CommentHistoryEntry[] = []; // Track when comments were actually displayed vs expected

  constructor(onCommentDisplay: (comment: DisplayedComment) => void) {
    this.onCommentDisplay = onCommentDisplay;
  }

  /**
   * Set a permanent base offset applied to all comments
   * This offset is applied once when comments are loaded
   * @param offset - Offset in seconds (negative = delay comments, positive = show earlier)
   */
  setFixedOffset(offset: number): void {
    if (!isFinite(offset)) {
      console.warn('[CommentScheduler] ⚠️ Invalid offset provided to setFixedOffset:', offset);
      return;
    }
    
    const oldOffset = this.baseOffset;
    this.baseOffset = offset;
    console.log(`[CommentScheduler] 🔧 Base offset changed: ${oldOffset.toFixed(2)}s -> ${offset.toFixed(2)}s`);
    
    // Reload comments with new offset if comments are already loaded
    if (this.comments.length > 0) {
      console.warn('[CommentScheduler] ⚠️ Base offset changed after comments loaded. Call loadComments() again to apply.');
    }
  }

  /**
   * Enable automatic drift correction
   * @param config - Drift correction configuration
   */
  enableDriftCorrection(config: DriftCorrectionConfig): void {
    if (!config || typeof config.mode !== 'string' || !isFinite(config.maxDrift) || !isFinite(config.correctionStep)) {
      console.warn('[CommentScheduler] ⚠️ Invalid drift correction config:', config);
      return;
    }
    
    if (config.mode !== 'hard' && config.mode !== 'soft') {
      console.warn('[CommentScheduler] ⚠️ Invalid drift correction mode:', config.mode);
      return;
    }
    
    this.driftConfig = config;
    console.log(`[CommentScheduler] ✅ Drift correction enabled: mode=${config.mode}, maxDrift=${config.maxDrift}s, step=${config.correctionStep}s`);
  }

  /**
   * Disable drift correction
   */
  disableDriftCorrection(): void {
    this.driftConfig = null;
    this.dynamicOffset = 0;
    console.log('[CommentScheduler] ✅ Drift correction disabled');
  }

  /**
   * Get average drift from displayed comments history
   * Positive drift = comments appearing late
   * Negative drift = comments appearing early
   */
  getDrift(): number {
    if (this.displayedCommentsHistory.length === 0) {
      return 0;
    }

    const totalDrift = this.displayedCommentsHistory.reduce((sum, entry) => {
      return sum + (entry.actualTime - entry.expectedTime);
    }, 0);

    return totalDrift / this.displayedCommentsHistory.length;
  }

  /**
   * Get the currentTime of the last displayed comment
   * Returns the actualTime of the most recent comment, or lastSyncTime if no comments displayed
   */
  getLastCommentTime(): number {
    if (this.displayedCommentsHistory.length > 0) {
      const lastEntry = this.displayedCommentsHistory[this.displayedCommentsHistory.length - 1];
      return lastEntry.actualTime;
    }
    
    return this.lastSyncTime >= 0 ? this.lastSyncTime : 0;
  }

  /**
   * Load comments with absolute times calculated
   * CRITICAL: This MUST be called AFTER reset() for a new stream
   * 
   * @param timeRanges - Array of time ranges with comments
   * @param forceReset - If true, reset before loading (defensive)
   */
  loadComments(
    timeRanges: Array<{ start: string; end: string; comments: TimedComment[] }>,
    forceReset = false
  ): void {
    if (forceReset || this.displayedIds.size > 0) {
      this.reset();
    }

    this.comments = [];

    timeRanges.forEach((timeRange) => {
      const rangeStartSeconds = Math.max(0, parseTimecodeToSeconds(timeRange.start));

      timeRange.comments.forEach((comment, index) => {
        const offset = Number.isFinite((comment as TimedComment).timeOffset as number)
          ? (comment.timeOffset || 0)
          : 0;
        // Calculate absolute time: base time + comment offset + base offset
        const absoluteTimeCandidate = rangeStartSeconds + offset + this.baseOffset;
        const absoluteTime = Number.isFinite(absoluteTimeCandidate) && absoluteTimeCandidate >= 0
          ? absoluteTimeCandidate
          : rangeStartSeconds;
        const commentId = `timed-${timeRange.start}-${offset}-${index}`;

        this.comments.push({
          ...comment,
          timeOffset: offset,
          absoluteTime,
          commentId,
        });
      });
    });

    // Sort by absolute time
    this.comments.sort((a, b) => a.absoluteTime - b.absoluteTime);

    console.log(`[CommentScheduler] ✅ Loaded ${this.comments.length} comments (baseOffset=${this.baseOffset.toFixed(2)}s)`);
  }

  /**
   * Sync comments to current video playback time
   * This is the core method that should be called on every timeupdate event
   * 
   * CRITICAL: Only call this AFTER reset() and loadComments() have been called
   */
  syncTo(currentTime: number): void {
    if (!isFinite(currentTime) || currentTime < 0) {
      return;
    }

    const previousRaw = this.lastSyncTimeRaw;
    this.lastSyncTimeRaw = currentTime;

    // Detect seek backwards → clear timers & reset dynamic offset
    if (this.lastSyncTime >= 0 && currentTime + 0.05 < this.lastSyncTime) {
      console.log(`[CommentScheduler] 🔄 Seek detected (from ${this.lastSyncTime.toFixed(3)} -> ${currentTime.toFixed(3)}), clearing timers`);
      this.clearScheduledTimers();
      this.dynamicOffset = 0;
      this.displayedCommentsHistory = [];
    }
    this.lastSyncTime = currentTime;

    if (!this.videoStarted) {
      if (currentTime <= 0) {
        return;
      }
      this.videoStarted = true;
    }

    // Defensive check: If scheduler not ready, don't sync
    if (this.comments.length === 0) {
      return;
    }

    // Check drift and apply correction if enabled
    if (this.driftConfig && (this.lastSyncCheckTime < 0 || currentTime - this.lastSyncCheckTime >= this.syncCheckInterval)) {
      this.checkAndAdjustDrift(currentTime);
      this.lastSyncCheckTime = currentTime;
    }

    // Apply offsets: currentTime + dynamicOffset (baseOffset already applied in loadComments)
    const adjustedCurrentTime = currentTime + this.dynamicOffset;

    let displayedCount = 0;
    let scheduledCount = 0;

    this.comments.forEach((comment) => {
      if (this.displayedIds.has(comment.commentId)) {
        return;
      }

      const timeDiff = comment.absoluteTime - adjustedCurrentTime;

      // Past or now: display immediately
      if (comment.absoluteTime <= adjustedCurrentTime) {
        const isCatchUp = timeDiff < -this.timeWindow.before;
        this.displayComment(comment, adjustedCurrentTime, isCatchUp);
        
        // Track when comment was actually displayed for drift analysis
        this.displayedCommentsHistory.push({
          commentId: comment.commentId,
          expectedTime: comment.absoluteTime,
          actualTime: currentTime,
        });
        
        // Keep only last 50 entries for sync analysis
        if (this.displayedCommentsHistory.length > 50) {
          this.displayedCommentsHistory.shift();
        }
        
        displayedCount++;
        return;
      }

      // Future within 15s: schedule
      if (timeDiff > 0 && timeDiff <= 15) {
        this.scheduleComment(comment, timeDiff);
        scheduledCount++;
        return;
      }
    });
  }

  /**
   * Check drift and adjust dynamic offset if needed
   * Called periodically based on syncCheckInterval
   */
  private checkAndAdjustDrift(currentTime: number): void {
    if (!this.driftConfig || this.displayedCommentsHistory.length < 3) {
      return; // Need at least 3 comments to analyze
    }

    const recentComments = this.displayedCommentsHistory.slice(-10); // Last 10 comments
    let totalDrift = 0;
    let validSamples = 0;

    recentComments.forEach((entry) => {
      const drift = entry.actualTime - entry.expectedTime;
      totalDrift += drift;
      validSamples++;
    });

    if (validSamples === 0) {
      return;
    }

    const averageDrift = totalDrift / validSamples;

    // Only apply correction if drift exceeds threshold
    if (Math.abs(averageDrift) <= this.driftConfig.maxDrift) {
      return; // Drift is acceptable
    }

    // Apply correction based on mode
    if (this.driftConfig.mode === 'hard') {
      // Hard mode: immediate step correction
      const sign = averageDrift > 0 ? 1 : -1;
      const adjustment = -sign * this.driftConfig.correctionStep;
      const oldOffset = this.dynamicOffset;
      this.dynamicOffset += adjustment;
      
      // Clamp to reasonable range
      this.dynamicOffset = Math.max(-30, Math.min(30, this.dynamicOffset));
      
      console.log(`[CommentScheduler] 🔧 HARD drift correction: drift=${averageDrift.toFixed(2)}s, offset ${oldOffset.toFixed(2)}s -> ${this.dynamicOffset.toFixed(2)}s`);
      
      // Clear scheduled timers to reschedule with new offset
      this.clearScheduledTimers();
    } else {
      // Soft mode: gradual correction (50% of drift)
      const adjustment = -averageDrift * 0.5;
      const oldOffset = this.dynamicOffset;
      this.dynamicOffset += adjustment;
      
      // Clamp to reasonable range
      this.dynamicOffset = Math.max(-30, Math.min(30, this.dynamicOffset));
      
      console.log(`[CommentScheduler] 🔧 SOFT drift correction: drift=${averageDrift.toFixed(2)}s, offset ${oldOffset.toFixed(2)}s -> ${this.dynamicOffset.toFixed(2)}s`);
      
      // Clear scheduled timers to reschedule with new offset
      this.clearScheduledTimers();
    }
  }

  /**
   * Flush all past comments (when user joins late or scrubs backward)
   * CRITICAL: This should ONLY be called when video is actually playing (currentTime > 0)
   */
  flushPast(currentTime: number): DisplayedComment[] {
    if (!isFinite(currentTime) || currentTime <= 0) {
      return [];
    }

    const pastComments: DisplayedComment[] = [];
    const adjustedCurrentTime = currentTime + this.dynamicOffset;

    this.comments.forEach((comment) => {
      if (comment.absoluteTime <= adjustedCurrentTime) {
        if (!this.displayedIds.has(comment.commentId)) {
          const displayed = this.createDisplayedComment(comment, adjustedCurrentTime, true);
          pastComments.push(displayed);
          this.displayedIds.add(comment.commentId);
        }
      }
    });

    // Sort by absolute time
    pastComments.sort((a, b) => {
      const timeA = this.extractTimeFromId(a.id);
      const timeB = this.extractTimeFromId(b.id);
      return timeA - timeB;
    });

    // Keep only the latest 100 comments to avoid flooding
    const limited = pastComments.length > 100 ? pastComments.slice(-100) : pastComments;

    console.log(`[CommentScheduler] Flushed ${limited.length} past comments (currentTime: ${currentTime.toFixed(2)}s)`);
    return limited;
  }

  /**
   * Display a comment immediately
   */
  private displayComment(
    comment: CommentWithAbsoluteTime,
    currentTime: number,
    isCatchUp = false
  ): void {
    if (this.displayedIds.has(comment.commentId)) {
      return;
    }

    this.displayedIds.add(comment.commentId);
    const displayed = this.createDisplayedComment(comment, currentTime, isCatchUp);

    try {
      if (!this.onCommentDisplay) {
        console.error('[CommentScheduler] ❌ CRITICAL: onCommentDisplay callback is null/undefined!');
        return;
      }

      this.onCommentDisplay(displayed);
    } catch (error) {
      console.error(`[CommentScheduler] ❌ Error in callback for id=${comment.commentId}:`, error);
    }
  }

  /**
   * Schedule a comment for future display
   */
  private scheduleComment(comment: CommentWithAbsoluteTime, delaySeconds: number): void {
    if (this.scheduledTimers.has(comment.commentId)) {
      return; // Already scheduled
    }

    const timer = setTimeout(() => {
      this.scheduledTimers.delete(comment.commentId);
      if (!this.displayedIds.has(comment.commentId)) {
        this.displayComment(comment, comment.absoluteTime);
      }
    }, delaySeconds * 1000);

    this.scheduledTimers.set(comment.commentId, timer);
  }

  /**
   * Create a DisplayedComment from CommentWithAbsoluteTime
   */
  private createDisplayedComment(
    comment: CommentWithAbsoluteTime,
    currentTime: number,
    isCatchUp = false
  ): DisplayedComment {
    const timeDiff = comment.absoluteTime - currentTime;
    const timestamp =
      isCatchUp || timeDiff < 0
        ? new Date(Date.now() - Math.abs(timeDiff) * 1000)
        : new Date();

    return {
      id: comment.commentId,
      username: (comment as TimedComment).username || '',
      message: (comment as TimedComment).message || '',
      timestamp,
      isAdmin: (comment as TimedComment).isAdmin || false,
      replyToUsername: (comment as TimedComment).replyToUsername,
      replyToMessage: (comment as TimedComment).replyToMessage,
    };
  }

  /**
   * Clear all scheduled timers
   */
  private clearScheduledTimers(): void {
    this.scheduledTimers.forEach((timer) => clearTimeout(timer));
    this.scheduledTimers.clear();
  }

  /**
   * Reset the scheduler (clear displayed comments, timers, etc.)
   * Call this when video is reset or user seeks
   * 
   * CRITICAL: This MUST be called BEFORE loadComments() for a new stream
   */
  reset(): void {
    this.videoStarted = false;
    this.lastSyncTime = -1;
    this.lastSyncTimeRaw = -1;
    this.dynamicOffset = 0; // Reset dynamic offset, but keep baseOffset
    this.lastSyncCheckTime = -1;
    this.displayedCommentsHistory = []; // Clear history

    this.clearScheduledTimers();
    this.displayedIds.clear();

    console.log('[CommentScheduler] ✅ Reset complete - cleared all displayed comments and timers');
  }

  /**
   * Get current dynamic sync offset (for debugging)
   */
  getSyncOffset(): number {
    return this.dynamicOffset;
  }

  /**
   * Get current base offset (for debugging)
   */
  getBaseOffset(): number {
    return this.baseOffset;
  }

  /**
   * Check if scheduler is ready (has comments loaded and is reset)
   */
  isReady(): boolean {
    return this.comments.length > 0 && this.displayedIds.size === 0;
  }

  /**
   * Mark a comment as shown (useful for manual control)
   */
  markShown(commentId: string): void {
    this.displayedIds.add(commentId);
  }

  /**
   * Check if a comment has been displayed
   */
  isShown(commentId: string): boolean {
    return this.displayedIds.has(commentId);
  }

  /**
   * Get all comments that should be displayed at a given time
   */
  getCommentsForTime(currentTime: number): CommentWithAbsoluteTime[] {
    const adjustedCurrentTime = currentTime + this.dynamicOffset;
    return this.comments.filter((comment) => {
      if (this.displayedIds.has(comment.commentId)) {
        return false;
      }
      const timeDiff = comment.absoluteTime - adjustedCurrentTime;
      return (
        timeDiff <= this.timeWindow.after &&
        timeDiff >= -this.timeWindow.before
      );
    });
  }

  /**
   * Convert time string to seconds.
   * Delegates to unified parser used across the app.
   */
  private timeStringToSeconds(timeStr: string): number {
    return parseTimecodeToSeconds(timeStr);
  }

  /**
   * Extract time from comment ID (for sorting)
   */
  private extractTimeFromId(commentId: string): number {
    // Format: "timed-HH:MM:SS:MS-offset"
    const match = commentId.match(/^timed-(.+)-(.+)$/);
    if (match) {
      const rangeStart = this.timeStringToSeconds(match[1]);
      const offset = parseFloat(match[2] || '0');
      return rangeStart + offset + this.baseOffset;
    }
    return 0;
  }

  /**
   * Cleanup - call this when component unmounts
   */
  destroy(): void {
    this.clearScheduledTimers();
    this.displayedIds.clear();
    this.comments = [];
    this.driftConfig = null;
    this.baseOffset = 0;
    this.dynamicOffset = 0;
  }
}
