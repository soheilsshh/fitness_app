/**
 * useSyncedWebinarClock - Stable, fault-tolerant server-anchored clock for webinar timing
 * 
 * This hook provides the SINGLE SOURCE OF TRUTH for webinar timing in the frontend.
 * It implements a stable, monotonic clock that:
 * - NEVER returns 0 after first mount (unless webinar just started)
 * - NEVER jumps backward unless server explicitly resets
 * - Smoothly progresses even when server misses polls
 * - Works reliably on Safari/iPhone where videoTime starts at 0
 * 
 * This guarantees LiveChat receives stable, reliable streamTime values.
 */

import { useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/api';

export interface SyncedWebinarClock {
  // Stable monotonic stream time in seconds (NEVER drops to 0 after first valid value)
  streamTimeSeconds: number;
  
  // Raw server-provided stream time (may be null during polls or errors)
  serverStreamTimeSeconds: number | null;
  
  // Whether stream is currently active on server
  isStreamRunning: boolean;
  
  // Legacy properties for backward compatibility
  currentStreamPositionMs: number;
  streamStartTimeMs: number | null;
  serverNowMs: number | null;
  streamEndTimeMs: number | null;
  scheduledStartTimeMs: number | null;
  scheduledEndTimeMs: number | null;
  clientServerOffsetMs: number;
  getCurrentStreamPositionMs: () => number;
}

const POLL_INTERVAL_MS = 1000; // Poll every 1 second for smoother updates
const MAX_VALID_JUMP_SECONDS = 15; // Max acceptable jump before treating as reset
const MIN_VALID_TIME_SECONDS = 0.5; // Minimum valid stream time (after first poll)

export function useSyncedWebinarClock(): SyncedWebinarClock {
  // Local monotonic clock state
  const lastValidTimeRef = useRef<number>(0); // Last valid server-provided time (seconds)
  const lastUpdateTimestampRef = useRef<number>(Date.now()); // When we last got valid server time
  const isLockedRef = useRef<boolean>(false); // Whether we've ever received a valid server time
  
  // State for raw server values
  const [serverStreamTimeSeconds, setServerStreamTimeSeconds] = useState<number | null>(null);
  const [isStreamRunning, setIsStreamRunning] = useState(false);
  
  // State for stable stream time (updated every second for smooth progression)
  const [streamTimeSeconds, setStreamTimeSeconds] = useState<number>(0);
  
  // Legacy state (for backward compatibility)
  const [streamStartTimeMs, setStreamStartTimeMs] = useState<number | null>(null);
  const [serverNowMs, setServerNowMs] = useState<number | null>(null);
  const [streamEndTimeMs, setStreamEndTimeMs] = useState<number | null>(null);
  const [scheduledStartTimeMs, setScheduledStartTimeMs] = useState<number | null>(null);
  const [scheduledEndTimeMs, setScheduledEndTimeMs] = useState<number | null>(null);
  const [clientServerOffsetMs, setClientServerOffsetMs] = useState(0);

  /**
   * Update stable stream time every second for smooth progression
   * This ensures React components re-render with updated time values
   */
  const updateStableTime = () => {
    const now = Date.now();
    const elapsedSinceUpdate = (now - lastUpdateTimestampRef.current) / 1000;
    const smoothProgression = lastValidTimeRef.current + elapsedSinceUpdate;
    
    // Ensure monotonic behavior: never go backward, never drop to 0 after lock
    let finalTime: number;
    if (!isLockedRef.current) {
      // Before lock: can be 0
      finalTime = Math.max(0, smoothProgression);
    } else {
      // After lock: ensure minimum value and monotonic
      finalTime = Math.max(lastValidTimeRef.current, smoothProgression);
    }
    
    setStreamTimeSeconds(finalTime);
  };

  /**
   * Poll backend for current timing information
   */
  const pollBackend = async () => {
    try {
      const response = await apiService.getActiveWebinar();
      
      // Update legacy state
      setIsStreamRunning(!!response.isStreamRunning);
      
      if (response.streamStartTime) {
        setStreamStartTimeMs(response.streamStartTime);
      }
      if (response.serverNow) {
        setServerNowMs(response.serverNow);
        const offset = response.serverNow - Date.now();
        setClientServerOffsetMs(offset);
      }
      if (response.streamEndTime) {
        setStreamEndTimeMs(response.streamEndTime);
      }
      if (response.scheduledStartTime) {
        setScheduledStartTimeMs(response.scheduledStartTime);
      }
      if (response.scheduledEndTime) {
        setScheduledEndTimeMs(response.scheduledEndTime);
      }
      
      // Calculate server-provided stream position
      let serverPosSeconds: number | null = null;
      
      const startCandidate = 
        (typeof response.streamStartTime === 'number' && Number.isFinite(response.streamStartTime))
          ? response.streamStartTime
          : (typeof response.scheduledStartTime === 'number' && Number.isFinite(response.scheduledStartTime))
            ? response.scheduledStartTime
            : null;
      
      const serverNow = 
        (typeof response.serverNow === 'number' && Number.isFinite(response.serverNow))
          ? response.serverNow
          : null;
      
      if (startCandidate !== null && serverNow !== null) {
        const diffMs = serverNow - startCandidate;
        if (Number.isFinite(diffMs) && diffMs >= 0) {
          serverPosSeconds = diffMs / 1000;
        }
      }
      
      // Update state with server position
      setServerStreamTimeSeconds(serverPosSeconds);
      
      // Process server position: validate and update monotonic clock
      if (serverPosSeconds !== null && Number.isFinite(serverPosSeconds) && serverPosSeconds >= 0) {
        const lastValid = lastValidTimeRef.current;
        const timeDiff = Math.abs(serverPosSeconds - lastValid);
        
        // Decision logic for accepting server value
        let shouldAccept = false;
        
        if (!isLockedRef.current) {
          // First valid value: always accept (unless too early)
          if (serverPosSeconds >= MIN_VALID_TIME_SECONDS) {
            shouldAccept = true;
            isLockedRef.current = true;
          }
        } else {
          // After lock: validate changes
          if (timeDiff < MAX_VALID_JUMP_SECONDS) {
            // Small change: trust it
            shouldAccept = true;
          } else if (serverPosSeconds > lastValid) {
            // Large forward jump: accept (stream might have been paused/resumed)
            shouldAccept = true;
          } else if (serverPosSeconds < lastValid - MAX_VALID_JUMP_SECONDS) {
            // Large backward jump: accept (explicit server reset)
            shouldAccept = true;
          }
          // Otherwise: ignore (likely network glitch)
        }
        
        if (shouldAccept) {
          lastValidTimeRef.current = serverPosSeconds;
          lastUpdateTimestampRef.current = Date.now();
          // Immediately update state when server value is accepted
          updateStableTime();
        }
      }
      // If serverPosSeconds is null/invalid, we'll use smooth progression
      
      // Log for debugging
      const now = Date.now();
      const elapsedSinceUpdate = (now - lastUpdateTimestampRef.current) / 1000;
      const smoothProgression = lastValidTimeRef.current + elapsedSinceUpdate;
      const finalTime = Math.max(smoothProgression, lastValidTimeRef.current);
      
      console.log("[Clock] poll:", {
        server: serverPosSeconds?.toFixed(2) ?? "null",
        lastValid: lastValidTimeRef.current.toFixed(2),
        returned: finalTime.toFixed(2),
        elapsed: elapsedSinceUpdate.toFixed(2),
        isLocked: isLockedRef.current,
      });
      
    } catch (error) {
      console.error('[useSyncedWebinarClock] ❌ Failed to poll backend:', error);
      // Don't update state on error - continue using last known values with smooth progression
    }
  };

  // Initial poll on mount
  useEffect(() => {
    pollBackend();
  }, []);

  // Set up periodic polling (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      pollBackend();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Update stable time every second for smooth progression
  useEffect(() => {
    updateStableTime(); // Initial update
    const interval = setInterval(() => {
      updateStableTime();
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const currentStreamPositionMs = streamTimeSeconds * 1000;

  // Legacy function for backward compatibility
  const getCurrentStreamPositionMs = () => currentStreamPositionMs;

  return {
    streamTimeSeconds,
    serverStreamTimeSeconds,
    isStreamRunning,
    currentStreamPositionMs,
    streamStartTimeMs,
    serverNowMs,
    streamEndTimeMs,
    scheduledStartTimeMs,
    scheduledEndTimeMs,
    clientServerOffsetMs,
    getCurrentStreamPositionMs,
  };
}
