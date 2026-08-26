/**
 * AdaptiveCommentEngine - Deterministic timeline-based comment synchronization
 *
 * 100% deterministic, purely streamTime-driven (viewer-aligned timeline seconds)
 * NO intervals, NO timeouts, NO wall-clock time
 * ONLY processes comments based on externally provided streamTime (never video.currentTime)
 */

import { TimedComment, TimeRange } from "@/data/timedComments";

export interface DisplayComment {
  id: string;
  username: string;
  message: string;
  displayAt: number; // Absolute time in seconds when comment should appear
  isAdmin?: boolean;
  replyToUsername?: string;
  replyToMessage?: string;
}

/**
 * User message input for merging into unified comment stream
 * Uses globalTime (currentVideoTime + deviceOffset) as the timing base
 */
export interface UserMessageInput {
  id: string;
  username: string;
  message: string;
  globalTime: number; // Global time (currentVideoTime + deviceOffset) when message was sent
  timestamp: Date;
  isUser?: boolean;
  replyToUsername?: string;
  replyToMessage?: string;
}

/**
 * Convert time string to seconds using a unified parser.
 * Supported formats:
 * - HH:MM:SS:FF -> h*3600 + m*60 + s + FF/100
 * - HH:MM:SS    -> h*3600 + m*60 + s
 * - MM:SS       -> m*60 + s
 */
export function parseTimecodeToSeconds(timeStr: string): number {
  const raw = typeof timeStr === "string" ? timeStr.trim() : "";
  if (!raw) return 0;

  const parts = raw.split(":").map((p) => p.trim());

  const toNumber = (value: string): number => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  if (parts.length === 4) {
    const [h, m, s, ff] = parts;
    const total =
      toNumber(h) * 3600 +
      toNumber(m) * 60 +
      toNumber(s) +
      toNumber(ff) / 100;
    return Number.isFinite(total) && total >= 0 ? total : 0;
  }

  if (parts.length === 3) {
    const [h, m, s] = parts;
    const total = toNumber(h) * 3600 + toNumber(m) * 60 + toNumber(s);
    return Number.isFinite(total) && total >= 0 ? total : 0;
  }

  if (parts.length === 2) {
    const [m, s] = parts;
    const total = toNumber(m) * 60 + toNumber(s);
    return Number.isFinite(total) && total >= 0 ? total : 0;
  }

  return 0;
}

/**
 * Map user message to DisplayComment format using globalTime as displayAt
 * This ensures user messages use the same timing system as marketing comments
 */
export function mapUserMessageToDisplayComment(userMessage: UserMessageInput): DisplayComment {
  return {
    id: userMessage.id,
    username: userMessage.username,
    message: userMessage.message,
    displayAt: userMessage.globalTime, // Use globalTime directly as displayAt (same time base as marketing comments)
    isAdmin: false,
    replyToUsername: userMessage.replyToUsername,
    replyToMessage: userMessage.replyToMessage,
  };
}

/**
 * Map TimeRange blocks to absolute timestamps (DisplayComment[])
 * Optionally merges user messages into the unified comment stream
 * 
 * @param timeRanges - Marketing comments from timedComments.ts
 * @param userMessages - Optional array of user messages to merge (default: [])
 * @returns Unified array of DisplayComment sorted by displayAt (globalTime)
 */
export function mapCommentsToAbsoluteTime(
  timeRanges: TimeRange[],
  userMessages: UserMessageInput[] = []
): DisplayComment[] {
  const comments: DisplayComment[] = [];

  (timeRanges || []).forEach((timeRange, rangeIndex) => {
    const startRaw =
      (timeRange as any).startTimeVideo ??
      (timeRange as any).start ??
      "";
    const endRaw =
      (timeRange as any).endTimeVideo ??
      (timeRange as any).end ??
      "";

    const rangeStartSeconds = Math.max(0, parseTimecodeToSeconds(startRaw));
    const rangeEndSeconds = Math.max(0, parseTimecodeToSeconds(endRaw));
    const rangeComments = Array.isArray(timeRange.comments) ? timeRange.comments : [];

    // Count comments with undefined timeOffset in this range
    let undefinedOffsetCount = 0;
    rangeComments.forEach((comment) => {
      const offsetRaw =
        (comment as any).offsetSeconds ??
        (comment as TimedComment)?.timeOffset ??
        (comment as any).offset;
      if (offsetRaw === undefined || offsetRaw === null) {
        undefinedOffsetCount++;
      }
    });

    // Track current undefined offset index for this range
    let undefinedOffsetIndex = 0;

    rangeComments.forEach((comment, commentIndex) => {
      const offsetRaw =
        (comment as any).offsetSeconds ??
        (comment as TimedComment)?.timeOffset ??
        (comment as any).offset;
      
      let displayAt: number;
      
      // Handle undefined timeOffset: place at end of range with gradual offset
      if (offsetRaw === undefined || offsetRaw === null) {
        // Place undefined comments at the end of the range with 0.5 second intervals
        // This ensures they don't all have the same displayAt
        const gradualOffset = undefinedOffsetIndex * 0.5; // 0.5 seconds between each undefined comment
        displayAt = rangeEndSeconds - (undefinedOffsetCount - undefinedOffsetIndex - 1) * 0.5;
        // Ensure displayAt is not before rangeStartSeconds
        displayAt = Math.max(rangeStartSeconds, displayAt);
        undefinedOffsetIndex++;
      } else {
        // Normal case: use the provided offset
        const offsetSeconds = Number.isFinite(offsetRaw as number) ? Number(offsetRaw) : 0;
        const displayAtCandidate = rangeStartSeconds + offsetSeconds;
        displayAt =
          Number.isFinite(displayAtCandidate) && displayAtCandidate >= 0
            ? displayAtCandidate
            : rangeStartSeconds;
      }

      comments.push({
        id: String((comment as any).id ?? `c-${rangeIndex}-${commentIndex}`),
        username: comment.username || "",
        message: comment.message || "",
        displayAt,
        isAdmin: !!comment.isAdmin,
        replyToUsername: comment.replyToUsername,
        replyToMessage: comment.replyToMessage,
      });
    });
  });

  // Map user messages to DisplayComment format and merge into comments array
  // User messages use globalTime as displayAt (same time base as marketing comments)
  if (Array.isArray(userMessages) && userMessages.length > 0) {
    const mappedUserMessages = userMessages.map(mapUserMessageToDisplayComment);
    comments.push(...mappedUserMessages);
  }

  // Sort all comments (marketing + user) by displayAt ascending
  // This ensures perfect interweaving based on timeline position
  comments.sort((a, b) => {
    if (a.displayAt === b.displayAt) {
      return a.id.localeCompare(b.id);
    }
    return a.displayAt - b.displayAt;
  });

  return comments;
}

/**
 * AdaptiveCommentEngine - Purely streamTime-driven (viewer timeline) comment display
 *
 * NO intervals, NO timeouts, NO wall-clock dependencies
 * Processes comments ONLY when update(streamTime) is called
 */
export class AdaptiveCommentEngine {
  private comments: DisplayComment[] = [];
  private displayedIds = new Set<string>();
  private cursor = 0; // Index of next comment to check for emission
  private onDisplay: (comment: DisplayComment) => void;
  private lastStreamTime = 0;

  constructor(comments: DisplayComment[], onDisplay: (comment: DisplayComment) => void) {
    this.comments = [...comments].sort((a, b) => a.displayAt - b.displayAt);
    this.onDisplay = onDisplay;
  }

  /**
   * Update engine with current stream time (forward-only emission).
   * Emits comments whose displayAt <= streamTime and not yet displayed.
   * streamTime is the viewer-aligned webinar timeline (seconds since start).
   */
  update(streamTime: number): void {
    const normalized = this.normalizeStreamTime(streamTime);
    
    // Allow small backward adjustments (up to 1 second) to handle timing corrections
    // This prevents comments from getting stuck when there are minor timing fluctuations
    if (normalized < this.lastStreamTime - 1.0) {
      // Significant backward jump - let LiveChat handle it
      console.warn(`[AdaptiveCommentEngine] ⚠️ Significant backward jump detected: ${this.lastStreamTime.toFixed(2)}s → ${normalized.toFixed(2)}s`);
      return;
    }
    
    // If normalized is slightly behind lastStreamTime (within 1 second), allow it
    // This handles minor timing corrections without blocking comments
    if (normalized < this.lastStreamTime) {
      // Small backward adjustment - just update cursor position if needed
      const adjustedTime = Math.max(normalized, this.lastStreamTime - 1.0);
      console.log(`[AdaptiveCommentEngine] 🔄 Small backward adjustment: ${this.lastStreamTime.toFixed(2)}s → ${normalized.toFixed(2)}s, using ${adjustedTime.toFixed(2)}s`);
      // Continue processing with adjusted time to ensure comments aren't blocked
    }

    this.lastStreamTime = Math.max(normalized, this.lastStreamTime);
    console.log(`[AdaptiveCommentEngine] UPDATE to t = ${this.lastStreamTime.toFixed(2)}s (timeline) startCursor=${this.cursor}`);
    console.log(
      "%c[ENGINE UPDATE]",
      "background:#550;color:#fff;padding:3px",
      {
        streamTime: this.lastStreamTime,
        cursor: this.cursor,
        nextCommentAt: this.comments[this.cursor]?.displayAt,
      }
    );

    // Process all comments up to current time
    while (this.cursor < this.comments.length) {
      const comment = this.comments[this.cursor];
      if (comment.displayAt > this.lastStreamTime) {
        break;
      }
      if (!this.displayedIds.has(comment.id)) {
        this.displayedIds.add(comment.id);
        this.onDisplay(comment);
      }
      this.cursor++;
    }
  }

  /**
   * Prime engine state to a specific time WITHOUT emitting past comments.
   * استفاده برای late-join: state می‌ره جلو، UI رو LiveChat با preload پر می‌کنه.
   * streamTime is the viewer-aligned webinar timeline (seconds since start).
   */
  primeToTime(streamTime: number): void {
    const normalized = this.normalizeStreamTime(streamTime);
    this.displayedIds.clear();
    this.cursor = this.findCursor(normalized);
    this.lastStreamTime = normalized;
    console.log(`[AdaptiveCommentEngine] PRIME at t = ${normalized.toFixed(2)}s (timeline) cursor=${this.cursor}`);
    console.log(
      "%c[ENGINE PRIME]",
      "background:#0a0;color:#fff;padding:3px",
      {
        streamTime: normalized,
        firstCommentAt: this.comments[0]?.displayAt,
        lastCommentAt: this.comments.at(-1)?.displayAt,
        cursorAfterPrime: this.cursor,
      }
    );
  }

  /**
   * Reset engine state to a specific time WITHOUT emitting comments.
   *
   * برای جهش‌های بزرگ (seek / resync):
   * - LiveChat خودش UI رو با setTimedMessages([]) خالی می‌کند.
   * - این متد فقط state داخلی رو می‌برد به t و past رو "مصرف‌شده" مارک می‌کند.
   * - نمایش گذشته بر عهده preloadComments است، نه این متد.
   * streamTime is the viewer-aligned webinar timeline (seconds since start).
   */
  resetToTime(streamTime: number): void {
    const normalized = this.normalizeStreamTime(streamTime);
    this.displayedIds.clear();
    this.cursor = this.findCursor(normalized);
    this.lastStreamTime = normalized;
    console.log(`[AdaptiveCommentEngine] RESET to t = ${normalized.toFixed(2)}s (timeline) cursor=${this.cursor}`);
    console.log(
      "%c[ENGINE RESET]",
      "background:#a00;color:#fff;padding:3px",
      {
        streamTime: normalized,
        newCursor: this.cursor,
      }
    );
  }

  /**
   * Reset engine (for brand-new stream)
   */
  reset(): void {
    this.displayedIds.clear();
    this.cursor = 0;
    this.lastStreamTime = 0;
  }

  /**
   * Reload comments (for stream reset with new script)
   */
  reloadComments(comments: DisplayComment[]): void {
    this.comments = [...comments].sort((a, b) => a.displayAt - b.displayAt);
    this.reset();
  }

  /**
   * Destroy engine (cleanup on unmount)
   */
  destroy(): void {
    this.comments = [];
    this.displayedIds.clear();
    this.cursor = 0;
    this.lastStreamTime = 0;
  }

  getCursor(): number {
    return this.cursor;
  }

  getComments(): DisplayComment[] {
    return this.comments;
  }

  private normalizeStreamTime(streamTime: number): number {
    if (!Number.isFinite(streamTime)) return 0;
    return streamTime >= 0 ? streamTime : 0;
  }

  // Binary search for first comment with displayAt > timeSeconds
  private findCursor(timeSeconds: number): number {
    let low = 0;
    let high = this.comments.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.comments[mid].displayAt <= timeSeconds) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  }
}
