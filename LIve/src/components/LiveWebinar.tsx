import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import VideoPlayer from "./VideoPlayer";
import LiveChat from "./LiveChat";
import CountdownTimer from "./CountdownTimer";
import StartCountdownTimer from "./StartCountdownTimer";
import AdminPanel from "./AdminPanel";
import EndWebinarModal from "./EndWebinarModal";
import ViewerCounter from "./ViewerCounter";
import { Users, Calendar, Star, MessageCircle, Radio } from "lucide-react";
import StatusChip from "@/components/StatusChip";
import { apiService } from "@/services/api";
import { webinarConfig, clearWebinarConfigCache } from "@/config/webinar";
import { useSyncedWebinarClock } from "@/hooks/useSyncedWebinarClock";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { isWebinarPreviewMode } from "@/config/webinarPreview";

const WEBINAR_BUILD_ID = "LIVEWEBINAR_BUILD_V1_STREAMTIME_FIX";
const WEBINAR_PREVIEW = isWebinarPreviewMode();

console.log("[BUILD_MARKER] LiveWebinar source loaded with BUILD_ID =", WEBINAR_BUILD_ID);

const VIDEO1_URL = "video1.mp4";

function getCurrentWebinarSlot() {
  return 0;
}

const LiveWebinar: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(70 * 60);
  const [isWebinarEnded, setIsWebinarEnded] = useState(false);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  
  const syncedClock = useSyncedWebinarClock();
  const serverTimeSeconds = syncedClock.streamTimeSeconds ?? 0;
  const serverTime = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= 0
    ? serverTimeSeconds
    : 0;
  
  const [viewers, setViewers] = useState(0);

  const [webinarInfo, setWebinarInfo] = useState({
    title: "کارگاه آنلاین آنالیز بدنی و برنامه‌ریزی هوشمند تمرین و تغذیه",
    startTime: new Date(),
    endTime: new Date(Date.now() + 75 * 60 * 1000),
    isLive: true,
    isManuallyStopped: false,
    schedulingMode: "manual" as "manual" | "appointment"
  });
  
  const [isWebinarStarted, setIsWebinarStarted] = useState(false);
  const [streamResetKey, setStreamResetKey] = useState(0);
  const previousWebinarStartedRef = useRef<boolean>(false);
  const slot = getCurrentWebinarSlot();
  // CRITICAL: videoUrl is null if manually stopped, even if other conditions are true
  const videoUrl =
    WEBINAR_PREVIEW ||
    (isWebinarStarted && webinarInfo.isLive && !isWebinarEnded && !webinarInfo.isManuallyStopped)
      ? VIDEO1_URL
      : null;
  const showVideoPlayer = WEBINAR_PREVIEW ? true : Boolean(videoUrl && !isWebinarEnded);
  const chatEnabled = WEBINAR_PREVIEW || Boolean(videoUrl && webinarInfo.isLive);
  const [videoTime, setVideoTime] = useState(0);
  const actualVideoTimeRef = useRef<number>(0); // ONLY for view tracking analytics
  const chatOffsetRef = useRef<number | null>(null);
  const offsetLockedRef = useRef(false);
  const lastGoodOffsetRef = useRef<number | null>(null);
  const offsetStabilityCounterRef = useRef(0);
  const lastTimelineLogRef = useRef<number>(0);

  const viewTimeTrackedRef = useRef(false);
  const pageVisibility = usePageVisibility();
  const activeWatchSecondsRef = useRef<number>(0);
  const lastActiveWatchUpdateRef = useRef<number>(Date.now());
  // Refs for stream/webinar end tracking
  const webinarEndedPermanentlyRef = useRef(false);
  const streamEndTimeRef = useRef<number | null>(null); // Track when stream ended
  const postStreamTimeRef = useRef<number>(0); // Track time after stream ends
  // GATING BOOLEANS - ONLY affect visibility, NOT timeline
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [userStartedStream, setUserStartedStream] = useState(false);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  const [isStreamLocked, setIsStreamLocked] = useState(false);
  const isStreamFullyReady =
    metadataLoaded &&
    userStartedStream &&
    playbackStarted &&
    isStreamLocked;

  useEffect(() => {
    if (!WEBINAR_PREVIEW) return;
    console.log("[LiveWebinar] Preview mode: webinar always open for QA");
    setIsWebinarStarted(true);
    setIsWebinarEnded(false);
    setIsStreamEnded(false);
    webinarEndedPermanentlyRef.current = false;
    setWebinarInfo((prev) => ({ ...prev, isLive: true, isManuallyStopped: false }));
  }, []);

  // ===============================================================
  // OFFSET CALCULATION & SMART LOCKING
  // ===============================================================
  useEffect(() => {
    // Server time MUST be valid and >= 5
    if (!Number.isFinite(serverTime) || serverTime < 5) return;

    // videoTime MUST be real (iOS fix)
    const videoReady = videoTime > 1.5;
    if (!videoReady) {
      console.log("[Offset] ❌ videoTime not ready yet:", videoTime);
      return;
    }

    // Proposed offset
    const rawOffset = serverTime - videoTime;

    // Ignore insane values
    if (rawOffset < 0 || rawOffset > 36000) {
      console.log("[Offset] ❌ rawOffset out of bounds:", rawOffset);
      return;
    }

    // FIRST TIME offset detection
    if (!offsetLockedRef.current) {
      // Stability check: require 3 stable measurements
      if (
        lastGoodOffsetRef.current !== null &&
        Math.abs(lastGoodOffsetRef.current - rawOffset) < 1.0
      ) {
        offsetStabilityCounterRef.current++;
      } else {
        offsetStabilityCounterRef.current = 1;
        lastGoodOffsetRef.current = rawOffset;
      }

      console.log("[Offset] stability", offsetStabilityCounterRef.current, "/ 3");

      if (offsetStabilityCounterRef.current >= 3) {
        chatOffsetRef.current = rawOffset;
        offsetLockedRef.current = true;

        console.log("[Offset] 🔒 LOCKED offset =", chatOffsetRef.current);
      }

      return;
    }

    // ===========================================================
    // RECALIBRATION LOGIC
    // ===========================================================
    const expectedServerTime = videoTime + chatOffsetRef.current!;
    const drift = Math.abs(expectedServerTime - serverTime);

    // If drift > 20s, recalibrate
    if (drift > 20) {
      console.log("[Offset] ⚠️ RECALIBRATING offset. Drift:", drift);

      // Must pass stability again
      if (Math.abs((lastGoodOffsetRef.current ?? rawOffset) - rawOffset) < 1.0) {
        offsetStabilityCounterRef.current++;
      } else {
        offsetStabilityCounterRef.current = 1;
      }

      lastGoodOffsetRef.current = rawOffset;

      if (offsetStabilityCounterRef.current >= 3) {
        chatOffsetRef.current = rawOffset;
        console.log("[Offset] 🔄 NEW LOCKED OFFSET =", rawOffset);
      }
    }

  }, [serverTime, videoTime]);

  // CRITICAL: Calculate absoluteTime with post-stream continuation
  const [absoluteTimeState, setAbsoluteTimeState] = useState<number | null>(null);
  
  let absoluteTime: number | null = null;
  if (offsetLockedRef.current && chatOffsetRef.current != null) {
    const baseAbsoluteTime = videoTime + chatOffsetRef.current;
    
    // CRITICAL: If stream has ended, continue time progression for comments
    // This allows comments to continue from stream end (103 min) to webinar end (152 min)
    if (isStreamEnded && !webinarEndedPermanentlyRef.current && postStreamTimeRef.current > 0) {
      const streamEndTimeSeconds = 103 * 60;
      absoluteTime = streamEndTimeSeconds + postStreamTimeRef.current;
    } else {
      absoluteTime = baseAbsoluteTime;
    }
    
    if (!Number.isFinite(absoluteTime) || absoluteTime < 0) {
      absoluteTime = 0;
    }
  }
  
  // Update absoluteTime state to trigger re-renders when post-stream time progresses
  useEffect(() => {
    if (absoluteTime !== null && Number.isFinite(absoluteTime)) {
      setAbsoluteTimeState(absoluteTime);
    }
  }, [absoluteTime]);
  
  // Use state value for consistency
  const effectiveAbsoluteTime = absoluteTimeState ?? absoluteTime;

  useEffect(() => {
    const now = Date.now();
    if (now - lastTimelineLogRef.current < 900) return;
    lastTimelineLogRef.current = now;
    console.log("[LiveWebinar] TIMELINE:", {
      serverTime,
      videoTime,
      chatOffset: chatOffsetRef.current,
      absoluteTime,
      offsetLocked: offsetLockedRef.current,
      stability: offsetStabilityCounterRef.current,
    });
  }, [serverTime, videoTime, absoluteTime]);

  // Reset gating booleans on stream reset
  // CRITICAL: Do NOT reset isWebinarEnded if webinar has permanently ended
  useEffect(() => {
    // Only reset if webinar hasn't permanently ended
    if (!webinarEndedPermanentlyRef.current) {
      setIsStreamEnded(false);
      setIsWebinarEnded(false);
    }
    setMetadataLoaded(false);
    setUserStartedStream(false);
    setPlaybackStarted(false);
    setIsStreamLocked(false);
    setVideoTime(0);
    actualVideoTimeRef.current = 0;
    chatOffsetRef.current = null;
    offsetLockedRef.current = false;
    lastGoodOffsetRef.current = null;
    offsetStabilityCounterRef.current = 0;
    console.log('[LiveWebinar] 🔄 Stream reset - all gating booleans reset');
  }, [streamResetKey]);

  // Fetch webinar info on component mount
  useEffect(() => {
    const fetchWebinarInfo = async () => {
      try {
        // Clear cache to ensure we get fresh data from API
        clearWebinarConfigCache();
        const info = await apiService.getWebinarInfo();
        
        // CRITICAL: Parse time correctly - backend returns RFC3339 with Iran timezone
        // The backend returns time in RFC3339 format which includes timezone offset
        // JavaScript Date.parse() will correctly parse RFC3339 with timezone
        // But we need to ensure we're comparing and displaying in Iran timezone
        const startTimeFinal = new Date(info.start_time);
        const endTimeFinal = new Date(info.end_time);
        
        // Verify the time is correct by checking Iran timezone representation
        const startTimeIranStr = startTimeFinal.toLocaleString("en-US", { 
          timeZone: "Asia/Tehran",
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        const endTimeIranStr = endTimeFinal.toLocaleString("en-US", { 
          timeZone: "Asia/Tehran",
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
        console.log('[LiveWebinar] Webinar info from API:', {
          title: info.title,
          start_time_raw: info.start_time,
          end_time_raw: info.end_time,
          timezone: info.timezone || 'not provided',
          scheduling_mode: (info as any).scheduling_mode || 'unknown',
          parsed_startTime: startTimeFinal,
          parsed_startTime_ISO: startTimeFinal.toISOString(),
          parsed_startTime_iran: startTimeIranStr,
          parsed_endTime: endTimeFinal,
          parsed_endTime_iran: endTimeIranStr,
        });
        
        const now = new Date();
        const hasStarted = now.getTime() >= startTimeFinal.getTime();
        
        // CRITICAL: Check if this is a new webinar (different start time) and reset permanent end flag
        const previousStartTime = webinarInfo.startTime?.getTime() || 0;
        const currentStartTime = startTimeFinal.getTime();
        if (previousStartTime > 0 && previousStartTime !== currentStartTime && webinarEndedPermanentlyRef.current) {
          console.log('[LiveWebinar] 🆕 NEW WEBINAR DETECTED on mount! Start time changed from', new Date(previousStartTime).toISOString(), 'to', startTimeFinal.toISOString());
          console.log('[LiveWebinar]   Resetting permanent end flag to allow new stream.');
          webinarEndedPermanentlyRef.current = false;
          setIsWebinarEnded(false);
          setIsStreamEnded(false);
          setStreamResetKey(prev => prev + 1);
        }
        
        previousWebinarStartedRef.current = hasStarted;
        setIsWebinarStarted(hasStarted);
        console.log('[LiveWebinar] Webinar has started?', hasStarted, 'Current:', now.toISOString(), 'Start:', startTimeFinal.toISOString());
        
          // CRITICAL: Do NOT set isLive to true if webinar has permanently ended
          // This prevents video from restarting after it ends
          // Also check if stream time has reached end time (from backend)
          // For appointment mode: 102 minutes, for manual mode: use endTime or 103:36
          const schedulingMode = (info as any).scheduling_mode || "manual";
          let streamTimeReachedEnd = false;
          if (schedulingMode === "appointment") {
            streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= 102 * 60;
          } else {
            // Manual mode: check against endTime or default 103:36
            if (endTimeFinal.getTime() > startTimeFinal.getTime()) {
              const durationMs = endTimeFinal.getTime() - startTimeFinal.getTime();
              const durationSeconds = Math.floor(durationMs / 1000);
              if (durationSeconds >= 60 * 60 && durationSeconds <= 180 * 60) {
                streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= durationSeconds;
              } else {
                streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= (1 * 60 * 60 + 43 * 60 + 36);
              }
            } else {
              streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= (1 * 60 * 60 + 43 * 60 + 36);
            }
          }
          const shouldBeLive = !webinarEndedPermanentlyRef.current && !streamTimeReachedEnd && (info.is_live || syncedClock.isStreamRunning);
        
        setWebinarInfo({
          title: info.title,
          startTime: startTimeFinal,
          endTime: endTimeFinal,
          isLive: shouldBeLive,
          isManuallyStopped: info.is_manually_stopped || false,
          schedulingMode: (info as any).scheduling_mode || "manual"
        });
        
        const timeLeftSeconds = Math.max(0, Math.floor((endTimeFinal.getTime() - now.getTime()) / 1000));
        setTimeLeft(timeLeftSeconds);
        
        // CRITICAL: Only reset if BOTH startTime AND endTime are in the future
        // This means it's a NEW slot that hasn't started yet, not the current slot that just ended
        const isStartTimeInFuture = startTimeFinal.getTime() > now.getTime();
        const isEndTimeInFuture = endTimeFinal.getTime() > now.getTime();
        
        if (isEndTimeInFuture && isStartTimeInFuture) {
          // This is a NEW slot that hasn't started yet - safe to reset
          if (isWebinarEnded) {
            console.log('[LiveWebinar] 🆕 NEW SLOT DETECTED (startTime and endTime in future), resetting isWebinarEnded');
            setIsWebinarEnded(false);
          }
          if (webinarEndedPermanentlyRef.current) {
            console.log('[LiveWebinar] 🆕 NEW SLOT DETECTED (startTime and endTime in future), resetting webinarEndedPermanentlyRef');
            webinarEndedPermanentlyRef.current = false;
            setIsStreamEnded(false);
            setStreamResetKey(prev => prev + 1);
          }
        } else if (isEndTimeInFuture && !isStartTimeInFuture) {
          // endTime is in future but startTime is in past
          // This means current slot has ended - DO NOT reset, keep webinar ended
          if (!isWebinarEnded && webinarEndedPermanentlyRef.current) {
            console.log('[LiveWebinar] ⚠️ Current slot ended but endTime still in future - keeping webinar ended until next slot starts');
            setIsWebinarEnded(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch webinar info:', error);
      }
    };
    
    fetchWebinarInfo();
    
    // CRITICAL: Use shorter interval (2 seconds) for faster updates when admin stops stream
    // Also check more frequently (1 second) when stream has ended to catch next slot
    const checkInterval = setInterval(async () => {
      try {
        // CRITICAL: If stream ended, fetch more frequently to get next slot info
        const info = await apiService.getWebinarInfo();
        // CRITICAL: Parse time correctly - backend returns RFC3339 with Iran timezone
        const startTime = new Date(info.start_time);
        const endTime = new Date(info.end_time);
        const now = new Date();
        const hasStarted = now.getTime() >= startTime.getTime();
        
        if (hasStarted && !previousWebinarStartedRef.current) {
          console.log('[LiveWebinar] 🆕 Webinar just started in interval check! Triggering stream reset.');
          setStreamResetKey(prev => prev + 1);
        }
        
        previousWebinarStartedRef.current = hasStarted;
        
        // CRITICAL: Do NOT set isLive to true if webinar has permanently ended
        // This prevents video from restarting after it ends
        // Also check if stream time has reached 102 minutes (from backend)
        const streamTimeReached102Minutes = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= 102 * 60;
        const shouldBeLive = !webinarEndedPermanentlyRef.current && !streamTimeReached102Minutes && (info.is_live || syncedClock.isStreamRunning);
        
        setWebinarInfo(prev => {
          // Check for changes using previous state (prev) to avoid stale closure issues
          const isManuallyStopped = info.is_manually_stopped || false;
          const schedulingMode = (info as any).scheduling_mode || "manual";
          const isManuallyStoppedChanged = isManuallyStopped !== prev.isManuallyStopped;
          const isLiveChanged = info.is_live !== prev.isLive;
          const startTimeChanged = prev.startTime.getTime() !== startTime.getTime();
          const endTimeChanged = prev.endTime.getTime() !== endTime.getTime();
          
          // CRITICAL: If startTime changed OR stream becomes live after being permanently ended,
          // it means a NEW webinar has started - reset the permanent end flag
          // This allows the new webinar stream to be displayed
          // For appointment mode: when a stream ends (webinarEndedPermanentlyRef.current = true),
          // and backend returns a new startTime (different slot), this means next slot is ready
          const newWebinarStarted = startTimeChanged || (info.is_live && webinarEndedPermanentlyRef.current && !isManuallyStopped);
          if (newWebinarStarted && webinarEndedPermanentlyRef.current) {
            console.log('[LiveWebinar] 🆕 NEW WEBINAR/SLOT DETECTED! Resetting permanent end flag.');
            console.log('[LiveWebinar]   - startTime changed:', startTimeChanged, prev.startTime.toISOString(), '->', startTime.toISOString());
            console.log('[LiveWebinar]   - stream went live:', info.is_live && webinarEndedPermanentlyRef.current);
            webinarEndedPermanentlyRef.current = false;
            setIsWebinarEnded(false);
            setIsStreamEnded(false);
            setStreamResetKey(prevKey => prevKey + 1);
          }
          
          // CRITICAL: For appointment mode, if stream ended and we got a new startTime (next slot),
          // reset the flags ONLY if BOTH startTime AND endTime are in the future
          // This ensures we don't reset if current slot just ended
          if (startTimeChanged && webinarEndedPermanentlyRef.current && prev.startTime.getTime() !== startTime.getTime()) {
            const now = new Date();
            const startTimeInFuture = startTime.getTime() > now.getTime();
            const endTimeInFuture = endTime.getTime() > now.getTime();
            
            // Only reset if BOTH are in future (new slot that hasn't started)
            if (startTimeInFuture && endTimeInFuture) {
              console.log('[LiveWebinar] 🆕 NEW WEBINAR/SLOT DETECTED (startTime and endTime in future)! New startTime:', startTime.toISOString(), 'New endTime:', endTime.toISOString());
              webinarEndedPermanentlyRef.current = false;
              setIsWebinarEnded(false);
              setIsStreamEnded(false);
              setStreamResetKey(prevKey => prevKey + 1);
            } else {
              console.log('[LiveWebinar] ⚠️ startTime changed but slot not ready yet (startTime in past or endTime in past) - keeping webinar ended');
            }
          }
          
          // CRITICAL: Also check if endTime changed to future (for both appointment and manual mode)
          // BUT only reset if startTime is also in future (new slot)
          if (endTimeChanged && webinarEndedPermanentlyRef.current) {
            const now = new Date();
            const startTimeInFuture = startTime.getTime() > now.getTime();
            const endTimeInFuture = endTime.getTime() > now.getTime();
            
            // Only reset if BOTH are in future
            if (startTimeInFuture && endTimeInFuture) {
              console.log('[LiveWebinar] 🆕 ENDTIME AND STARTTIME IN FUTURE! Resetting permanent end flag. New startTime:', startTime.toISOString(), 'New endTime:', endTime.toISOString());
              webinarEndedPermanentlyRef.current = false;
              setIsWebinarEnded(false);
              setIsStreamEnded(false);
            } else {
              console.log('[LiveWebinar] ⚠️ endTime changed but startTime not in future - keeping webinar ended');
            }
          }
          
          if (isLiveChanged) {
            console.log('[LiveWebinar] Stream status changed:', info.is_live ? 'LIVE' : 'STOPPED');
          }
          
          if (isManuallyStoppedChanged) {
            console.log('[LiveWebinar] ⚠️ Manual stop status changed:', isManuallyStopped ? 'STOPPED by admin' : 'RESUMED');
          }
          
          // CRITICAL: If manually stopped, force isLive to false regardless of backend status
          // This ensures video stops immediately when admin clicks stop button
          // Use updated webinarEndedPermanentlyRef value (may have been reset above)
          // Also check if stream time has reached end time (from backend)
          // For appointment mode: 102 minutes, for manual mode: use endTime or 103:36
          let streamTimeReachedEnd = false;
          if (schedulingMode === "appointment") {
            streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= 102 * 60;
          } else {
            // Manual mode: check against endTime or default 103:36
            if (endTime.getTime() > startTime.getTime()) {
              const durationMs = endTime.getTime() - startTime.getTime();
              const durationSeconds = Math.floor(durationMs / 1000);
              if (durationSeconds >= 60 * 60 && durationSeconds <= 180 * 60) {
                streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= durationSeconds;
              } else {
                streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= (1 * 60 * 60 + 43 * 60 + 36);
              }
            } else {
              streamTimeReachedEnd = Number.isFinite(serverTimeSeconds) && serverTimeSeconds >= (1 * 60 * 60 + 43 * 60 + 36);
            }
          }
          const currentShouldBeLive = !webinarEndedPermanentlyRef.current && !streamTimeReachedEnd && (info.is_live || syncedClock.isStreamRunning);
          const finalIsLive = isManuallyStopped ? false : currentShouldBeLive;
          
          // CRITICAL: Always update if manual stop changed, or if any other status changed
          // This ensures immediate UI update when admin stops stream
          const schedulingModeChanged = schedulingMode !== prev.schedulingMode;
          if (isManuallyStoppedChanged || isLiveChanged || startTimeChanged || endTimeChanged || finalIsLive !== prev.isLive || schedulingModeChanged) {
            return {
              ...prev,
              startTime: startTime,
              endTime: endTime,
              isLive: finalIsLive,
              isManuallyStopped: isManuallyStopped,
              schedulingMode: schedulingMode
            };
          }
          return prev;
        });
        
        // Update isWebinarStarted separately to avoid stale closure
        setIsWebinarStarted(prevStarted => {
          if (hasStarted !== prevStarted) {
            return hasStarted;
          }
          return prevStarted;
        });
      } catch (error) {
        console.error('Failed to check webinar status:', error);
      }
    }, webinarEndedPermanentlyRef.current ? 1000 : 2000); // Check every 1 second when stream ended to catch next slot, otherwise 2 seconds
    
    return () => clearInterval(checkInterval);
  }, [isWebinarStarted, syncedClock.isStreamRunning]); // Removed webinarInfo.isLive from deps to avoid unnecessary re-creation

  // Track view start when video starts playing
  const viewStartTrackedRef = useRef(false);
  useEffect(() => {
    if (!isWebinarStarted || !videoUrl || viewStartTrackedRef.current) return;

    try {
      const registrationData = localStorage.getItem('registrationData');
      if (!registrationData) return;

      const data = JSON.parse(registrationData);
      if (!data.phone) return;

      const viewStartTime = new Date();
      apiService.trackView(data.phone, viewStartTime).catch(err => {
        console.error('Failed to track view start:', err);
      });
      viewStartTrackedRef.current = true;
    } catch (error) {
      console.error('Failed to parse registration data for tracking:', error);
    }
  }, [isWebinarStarted, videoUrl]);

  // Track view end when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const registrationData = localStorage.getItem('registrationData');
        if (!registrationData) return;

        const data = JSON.parse(registrationData);
        if (!data.phone) return;

        if (actualVideoTimeRef.current > 0) {
          // Update active watch time before leaving
          if (pageVisibility.isVisible && lastActiveWatchUpdateRef.current > 0) {
            const now = Date.now();
            const elapsedSeconds = (now - lastActiveWatchUpdateRef.current) / 1000;
            activeWatchSecondsRef.current += elapsedSeconds;
          }
          
          const currentViewMinutes = Math.floor(actualVideoTimeRef.current / 60);
          const activeWatchMinutes = Math.floor(activeWatchSecondsRef.current / 60);
          if (currentViewMinutes > 0) {
            apiService.updateViewTime(data.phone, currentViewMinutes, activeWatchMinutes).catch(() => {});
          }
        }
      } catch (error) {
        console.error('Failed to track view end:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [pageVisibility.isVisible]);

  useEffect(() => {
    const validStream = Number.isFinite(serverTime) && serverTime > 1;

    // videoTime must reflect the seek-to-live position (NOT zero)
    const validVideo = Number.isFinite(videoTime) && videoTime > 0.3;

    // lock condition
    const locked = validStream && validVideo && playbackStarted;

    if (locked && !isStreamLocked) {
      console.log("%c[StreamLock] 🔒 Stream locked at:", "color: #0f0", {
        serverStreamTime: serverTime.toFixed(2) + "s",
        videoTime: videoTime.toFixed(2) + "s",
      });
      setIsStreamLocked(true);
    }
  }, [serverTime, videoTime, playbackStarted, isStreamLocked]);

  useEffect(() => {
    if (!isWebinarStarted || !videoUrl) return;

    try {
      const registrationData = localStorage.getItem('registrationData');
      if (!registrationData) return;

      const data = JSON.parse(registrationData);
      if (!data.phone) return;

      if (actualVideoTimeRef.current > 0 && !viewTimeTrackedRef.current) {
        const currentViewMinutes = Math.floor(actualVideoTimeRef.current / 60);
        const activeWatchMinutes = Math.floor(activeWatchSecondsRef.current / 60);
        if (currentViewMinutes > 0) {
          apiService.updateViewTime(data.phone, currentViewMinutes, activeWatchMinutes).catch(err => {
            console.error('Failed to track initial view time:', err);
          });
          viewTimeTrackedRef.current = true;
        }
      }

      const trackInterval = setInterval(() => {
        // Update active watch time before sending
        if (pageVisibility.isVisible && lastActiveWatchUpdateRef.current > 0) {
          const now = Date.now();
          const elapsedSeconds = (now - lastActiveWatchUpdateRef.current) / 1000;
          activeWatchSecondsRef.current += elapsedSeconds;
          lastActiveWatchUpdateRef.current = now; // Reset for next active period
        }
        
        if (actualVideoTimeRef.current > 0) {
          const currentViewMinutes = Math.floor(actualVideoTimeRef.current / 60);
          const activeWatchMinutes = Math.floor(activeWatchSecondsRef.current / 60);
          apiService.updateViewTime(data.phone, currentViewMinutes, activeWatchMinutes).catch(err => {
            console.error('Failed to update view time:', err);
          });
        }
      }, 60000);

      return () => clearInterval(trackInterval);
    } catch (error) {
      console.error('Failed to setup view time tracking:', error);
    }
  }, [isWebinarStarted, videoUrl, pageVisibility.isVisible]);

  // Track active watch time (only when page is visible)
  useEffect(() => {
    if (pageVisibility.isVisible) {
      // Page is visible - start/resume tracking
      lastActiveWatchUpdateRef.current = Date.now();
    } else {
      // Page went to background - accumulate elapsed time
      if (lastActiveWatchUpdateRef.current > 0) {
        const now = Date.now();
        const elapsedSeconds = (now - lastActiveWatchUpdateRef.current) / 1000;
        activeWatchSecondsRef.current += elapsedSeconds;
        lastActiveWatchUpdateRef.current = 0; // Reset
      }
    }
  }, [pageVisibility.isVisible]);

  // CRITICAL: Heartbeat for online status tracking
  // Only sends heartbeat when page is visible - stops when page goes to background
  // This ensures only truly active/visible users are counted as online
  // Works even before webinar starts - tracks users on landing page
  useEffect(() => {
    try {
      const registrationData = localStorage.getItem('registrationData');
      if (!registrationData) return;

      const data = JSON.parse(registrationData);
      if (!data.phone) return;

      // Only send heartbeat if page is visible
      if (!pageVisibility.isVisible) {
        // Page is in background - don't send heartbeat
        // User will be marked offline after 15 seconds (backend threshold)
        return;
      }

      // Send initial heartbeat immediately when page becomes visible
      apiService.heartbeat(data.phone).catch(err => {
        console.error('Failed to send heartbeat:', err);
      });

      // Send heartbeat every 5 seconds while page is visible for real-time tracking
      const heartbeatInterval = setInterval(() => {
        // Double-check visibility before sending (in case it changed)
        if (pageVisibility.isVisible) {
          apiService.heartbeat(data.phone).catch(err => {
            console.error('Failed to send heartbeat:', err);
          });
        }
      }, 5000); // Every 5 seconds for faster real-time updates

      return () => clearInterval(heartbeatInterval);
    } catch (error) {
      console.error('Failed to setup heartbeat:', error);
    }
  }, [pageVisibility.isVisible]); // Removed isWebinarStarted dependency - heartbeat works always

  // CRITICAL: End session when page goes to background or is closed
  // This marks user as offline immediately, not after threshold timeout
  useEffect(() => {
    try {
      const registrationData = localStorage.getItem('registrationData');
      if (!registrationData) return;

      const data = JSON.parse(registrationData);
      if (!data.phone) return;

      // When page goes to background, end session immediately
      if (!pageVisibility.isVisible) {
        apiService.endSession(data.phone).catch(err => {
          console.error('Failed to end session:', err);
        });
      }
    } catch (error) {
      console.error('Failed to setup end session:', error);
    }
  }, [pageVisibility.isVisible]);

  // CRITICAL: End session when page is unloaded (closed or navigated away)
  useEffect(() => {
    try {
      const registrationData = localStorage.getItem('registrationData');
      if (!registrationData) return;

      const data = JSON.parse(registrationData);
      if (!data.phone) return;

      const handleBeforeUnload = () => {
        // Use sendBeacon for reliable delivery when page is unloading
        apiService.endSession(data.phone).catch(() => {
          // Ignore errors during unload
        });
      };

      // Listen for page unload events
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        // Also call on cleanup (component unmount)
        handleBeforeUnload();
      };
    } catch (error) {
      console.error('Failed to setup unload handler:', error);
    }
  }, []);

  // Handle video time updates for view tracking ONLY
  const handleVideoTimeUpdate = (currentTime: number) => {
    actualVideoTimeRef.current = currentTime;
    setVideoTime(currentTime);
  };

  const handleMetadataLoaded = () => {
    console.log('[LiveWebinar] ✅✅✅ GATE 1/4: Metadata loaded');
    setMetadataLoaded(true);
  };

  const handlePlaybackStarted = () => {
    console.log('[LiveWebinar] ✅✅✅ GATE 3/4: Playback started');
    setPlaybackStarted(true);
  };

  const handleUserStartStream = () => {
    console.log('[LiveWebinar] ✅✅✅ GATE 2/4: User clicked "شروع پخش زنده"');
    setUserStartedStream(true);
  };

  // Gradually increase viewers count based on webinar start time
  useEffect(() => {
    const updateViewers = () => {
      if (!webinarInfo.startTime) {
        setViewers(0);
        return;
      }
      
      const now = new Date();
      const startTime = webinarInfo.startTime;
      const timeDiffMs = now.getTime() - startTime.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      
      let newViewers;
      
      if (timeDiffMinutes < -15) {
        newViewers = 0;
      } else if (timeDiffMinutes < 0) {
        const minutesBeforeStart = Math.abs(timeDiffMinutes);
        const oscillationPhase = (Date.now() / 1000) % 10;
        const oscillation = Math.sin(oscillationPhase * Math.PI * 2 / 10) * 50;
        const baseCount = 150 + (minutesBeforeStart / 15) * 50;
        newViewers = Math.floor(baseCount + oscillation);
        newViewers = Math.max(100, Math.min(200, newViewers));
      } else {
        const minutesSinceStart = timeDiffMinutes;
        const webinarDurationMinutes = webinarInfo.endTime 
          ? Math.max(0, (webinarInfo.endTime.getTime() - startTime.getTime()) / (1000 * 60))
          : 150;
        
        if (minutesSinceStart >= 115) {
          // بعد از 115 دقیقه: 0
          newViewers = 0;
        } else if (minutesSinceStart >= 105) {
          // 105-115 دقیقه: کاهش از 500 به 0
          const progress = (minutesSinceStart - 105) / (115 - 105); // 0 → 1
          newViewers = 500 - Math.floor(500 * progress);
          newViewers = Math.max(0, newViewers);
        } else if (minutesSinceStart >= 90) {
          // 90-105 دقیقه: کاهش از 2500 به 500
          const progress = (minutesSinceStart - 90) / (105 - 90); // 0 → 1
          const baseViewers = 2500 - Math.floor((2500 - 500) * progress);
          // اضافه کردن نوسان طبیعی
          const oscillationPhase = (Date.now() / 1000) % 15;
          const oscillation = Math.sin(oscillationPhase * Math.PI * 2 / 15) * (30 + Math.random() * 30);
          newViewers = baseViewers + Math.floor(oscillation);
          newViewers = Math.max(450, Math.min(2550, newViewers));
        } else if (minutesSinceStart >= 83) {
          // 83-90 دقیقه: رسیدن به 2500 (peak)
          const progress = (minutesSinceStart - 83) / (90 - 83); // 0 → 1
          const baseViewers = 1800 + Math.floor((2500 - 1800) * Math.pow(progress, 0.5));
          // اضافه کردن نوسان طبیعی
          const oscillationPhase = (Date.now() / 1000) % 15;
          const oscillation = Math.sin(oscillationPhase * Math.PI * 2 / 15) * (50 + Math.random() * 50);
          newViewers = baseViewers + Math.floor(oscillation);
          newViewers = Math.max(1750, Math.min(2600, newViewers));
        } else if (minutesSinceStart <= 15) {
          // 0-15 دقیقه: رشد سریع از 200 به 1800
          const progress = minutesSinceStart / 15;
          newViewers = 200 + Math.floor((1800 - 200) * Math.pow(progress, 1.2));
        } else {
          // 15-83 دقیقه: رشد آهسته از 1800 به 2500
          const growthPeriod = 83 - 15;
          const elapsedAfter15 = minutesSinceStart - 15;
          const progressAfter15 = Math.min(1, elapsedAfter15 / growthPeriod);
          const targetViewers = 1800 + Math.floor((2500 - 1800) * Math.pow(progressAfter15, 0.5));
          const oscillationPhase = (Date.now() / 1000) % 15;
          const oscillation = Math.sin(oscillationPhase * Math.PI * 2 / 15) * (50 + Math.random() * 50);
          newViewers = targetViewers + Math.floor(oscillation);
          newViewers = Math.max(1750, Math.min(2600, newViewers));
        }
      }
      
      setViewers(newViewers);
    };
    
    const interval = setInterval(updateViewers, 2000);
    updateViewers();
    
    return () => clearInterval(interval);
  }, [webinarInfo.startTime]);

  // Check stream/webinar end times based on viewer-aligned chat timeline
  // CRITICAL: Once webinar ends, it should NOT restart until next scheduled time
  // CRITICAL: Different logic for appointment mode (102 minutes) vs manual mode (103:36 or endTime)
  useEffect(() => {
    if (WEBINAR_PREVIEW) return;

    // CRITICAL: Use serverTimeSeconds from backend for accurate detection
    // This is more accurate than absoluteTime which depends on videoTime and offset
    // serverTimeSeconds is the actual stream time from backend (single source of truth)
    const streamTimeFromBackend = serverTimeSeconds;
    
    // Also check absoluteTime as fallback
    const currentAbsoluteTime = effectiveAbsoluteTime ?? absoluteTime;
    
    // Use serverTimeSeconds if available and valid, otherwise fallback to absoluteTime
    let effectiveTime: number | null = null;
    if (Number.isFinite(streamTimeFromBackend) && streamTimeFromBackend >= 0) {
      effectiveTime = streamTimeFromBackend;
    } else if (currentAbsoluteTime !== null && Number.isFinite(currentAbsoluteTime) && currentAbsoluteTime >= 0) {
      effectiveTime = currentAbsoluteTime;
    }
    
    if (effectiveTime === null) return;
    
    // Determine stream end time based on scheduling mode
    const schedulingMode = webinarInfo.schedulingMode || "manual";
    let streamEndTimeSeconds: number;
    
    if (schedulingMode === "appointment") {
      // Appointment mode: Stream ends at exactly 102 minutes (6120 seconds)
      streamEndTimeSeconds = 102 * 60;
    } else {
      // Manual mode: Stream ends at 1:43:36 (6216 seconds) OR use endTime from backend
      // Use endTime if available and valid, otherwise use default 1:43:36
      const now = new Date();
      const endTime = webinarInfo.endTime;
      if (endTime && endTime.getTime() > webinarInfo.startTime.getTime()) {
        // Calculate stream duration from start to end
        const durationMs = endTime.getTime() - webinarInfo.startTime.getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        // Use endTime-based duration if it's reasonable (between 60 and 180 minutes)
        if (durationSeconds >= 60 * 60 && durationSeconds <= 180 * 60) {
          streamEndTimeSeconds = durationSeconds;
        } else {
          // Fallback to default 1:43:36 (6216 seconds)
          streamEndTimeSeconds = 1 * 60 * 60 + 43 * 60 + 36;
        }
      } else {
        // Default for manual mode: 1:43:36 (6216 seconds)
        streamEndTimeSeconds = 1 * 60 * 60 + 43 * 60 + 36;
      }
    }
    
    // Check if stream has reached its end time
    if (effectiveTime >= streamEndTimeSeconds) {
      if (!isStreamEnded) {
        setIsStreamEnded(true);
        streamEndTimeRef.current = Date.now(); // Record when stream ended
        postStreamTimeRef.current = 0; // Reset post-stream timer
        console.log(`[LiveWebinar] ⏰ Stream ended after ${(effectiveTime / 60).toFixed(2)} minutes (${schedulingMode} mode, threshold: ${(streamEndTimeSeconds / 60).toFixed(2)} minutes) - using serverTime: ${streamTimeFromBackend.toFixed(2)}s`);
        
        // CRITICAL: When stream ends, mark webinar as ended to show "کارگاه به اتمام رسید"
        // This will trigger the UI to show countdown for next stream if within 1 hour (appointment mode)
        setIsWebinarEnded(true);
        webinarEndedPermanentlyRef.current = true;
      }
    } else if (isStreamEnded && effectiveTime < streamEndTimeSeconds && !webinarEndedPermanentlyRef.current) {
      // Only reset if webinar hasn't permanently ended
      setIsStreamEnded(false);
      streamEndTimeRef.current = null;
      postStreamTimeRef.current = 0;
    }
    
    // For manual mode only: Webinar ends at 152 minutes (not used for appointment mode - stream ends at 102 minutes)
    // Once ended, it should NOT restart until next scheduled time
    if (schedulingMode === "manual") {
      const webinarEndTimeSeconds = 152 * 60;
      if (effectiveTime >= webinarEndTimeSeconds) {
        if (!webinarEndedPermanentlyRef.current) {
          setIsWebinarEnded(true);
          setIsStreamEnded(false);
          webinarEndedPermanentlyRef.current = true; // Mark as permanently ended
          streamEndTimeRef.current = null;
          postStreamTimeRef.current = 0;
          console.log(`[LiveWebinar] Webinar ended permanently after ${(effectiveTime / 60).toFixed(2)} minutes (152 minutes threshold). Will not restart until next scheduled time.`);
        }
      }
    }
    // CRITICAL: Do NOT reset isWebinarEnded if it's already permanently ended
    // The webinar should only restart when a new scheduled time arrives (handled by backend/streaming logic)
  }, [effectiveAbsoluteTime, absoluteTime, isStreamEnded, isWebinarEnded, serverTimeSeconds, webinarInfo.schedulingMode, webinarInfo.startTime, webinarInfo.endTime]);

  // CRITICAL: Continue absoluteTime after stream ends to allow comments to continue
  // For appointment mode: stream ends at 102 minutes, no need to continue
  // This is only needed for manual mode (stream end at 103, webinar end at 152)
  useEffect(() => {
    if (!isStreamEnded || webinarEndedPermanentlyRef.current) return;
    
    const streamEndTimeSeconds = 102 * 60;
    const webinarEndTimeSeconds = 152 * 60;
    
    // If stream has ended, continue time progression for comments
    const interval = setInterval(() => {
      if (streamEndTimeRef.current === null) return;
      
      const elapsedSinceStreamEnd = (Date.now() - streamEndTimeRef.current) / 1000;
      const currentEffectiveTime = streamEndTimeSeconds + elapsedSinceStreamEnd;
      
      // Update postStreamTimeRef to continue timeline
      postStreamTimeRef.current = elapsedSinceStreamEnd;
      
      // Update absoluteTime state to trigger re-renders
      setAbsoluteTimeState(currentEffectiveTime);
      
      // Stop when webinar ends
      if (currentEffectiveTime >= webinarEndTimeSeconds) {
        clearInterval(interval);
        return;
      }
    }, 100); // Update every 100ms for smooth progression
    
    return () => clearInterval(interval);
  }, [isStreamEnded]);

  useEffect(() => {
    if (timeLeft <= 15 * 60) {
      setShowCTA(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (WEBINAR_PREVIEW) return;

    // CRITICAL: Check if we have a valid endTime in the future
    // If endTime is in the future, webinar hasn't ended yet
    const now = new Date();
    const endTime = webinarInfo.endTime;
    const startTime = webinarInfo.startTime;
    const isEndTimeInFuture = endTime.getTime() > now.getTime();
    const isStartTimeInFuture = startTime.getTime() > now.getTime();
    
    // CRITICAL: Only reset if BOTH startTime AND endTime are in the future
    // This means it's a NEW slot that hasn't started yet, not the current slot that just ended
    // If only endTime is in future but startTime is in past, it means current slot ended and we're waiting for next
    if (isEndTimeInFuture && isStartTimeInFuture) {
      // This is a NEW slot that hasn't started yet - safe to reset
      if (isWebinarEnded) {
        console.log('[LiveWebinar] 🆕 NEW SLOT DETECTED (startTime and endTime in future), resetting isWebinarEnded');
        setIsWebinarEnded(false);
      }
      if (webinarEndedPermanentlyRef.current) {
        console.log('[LiveWebinar] 🆕 NEW SLOT DETECTED (startTime and endTime in future), resetting webinarEndedPermanentlyRef');
        webinarEndedPermanentlyRef.current = false;
        setIsStreamEnded(false);
      }
    } else if (isEndTimeInFuture && !isStartTimeInFuture) {
      // endTime is in future but startTime is in past
      // This means current slot has ended but we're still within the time window
      // DO NOT reset - keep webinar ended until next slot actually starts
      if (!isWebinarEnded && webinarEndedPermanentlyRef.current) {
        console.log('[LiveWebinar] ⚠️ Current slot ended but endTime still in future - keeping webinar ended until next slot starts');
        setIsWebinarEnded(true);
      }
    }
    
    // Only mark as ended if timeLeft <= 0 AND endTime is in the past
    // This prevents false "ended" status when a new slot hasn't started yet
    if (timeLeft <= 0 && !isEndTimeInFuture) {
      setIsWebinarEnded(true);
      webinarEndedPermanentlyRef.current = true;
      console.log('Webinar timer ended, marking as permanently ended');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, webinarInfo.endTime, webinarInfo.startTime, isWebinarEnded]);

  const handleVideoEnd = () => {
    if (WEBINAR_PREVIEW) return;

    // CRITICAL: When video ends, permanently mark webinar as ended
    // This prevents video from restarting automatically
    setIsWebinarEnded(true);
    setIsStreamEnded(true);
    webinarEndedPermanentlyRef.current = true;
    
    try {
      localStorage.removeItem('webinar_chat_history');
      console.log('Cleared webinar localStorage data');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
    
    console.log('[LiveWebinar] Video ended. Webinar marked as permanently ended. Will not restart until next scheduled time.');
    setShowEndModal(true);
  };

  // Pinned message disabled - always return null (as requested)
  const pinnedMessage = useMemo(() => {
    // Disabled: No 15-minute warning message
    return null;
  }, []);

  return (
    <div className="fitino-landing relative min-h-dvh overflow-x-hidden overscroll-y-contain bg-[#0e0e0e] text-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-[1400px] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" />
          <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: '-1.5s' }} />
          <div className="fp-pulse-ring absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2" style={{ animationDelay: '-3s' }} />
        </div>

        <div className="relative z-10">
          <div className="mx-auto w-full py-2 sm:py-6 md:py-10">
            <div className="mb-4 text-center sm:mb-6 md:mb-10">
              <div className="mx-auto mb-4 flex max-w-4xl flex-col items-center gap-2.5 px-1 sm:mb-6 sm:gap-3 md:mb-8">
                <span className="fp-chip">
                  <span className="fp-chip__dot fp-chip__dot--live" aria-hidden />
                  پخش زنده فیتینو
                </span>
                <h2 className="max-w-[22rem] text-base font-bold leading-snug text-white sm:max-w-none sm:text-xl md:text-2xl lg:text-3xl" dir="rtl" style={{unicodeBidi: 'embed'}}>
                  کارگاه آنلاین آنالیز بدنی و برنامه‌ریزی هوشمند تمرین و تغذیه
                </h2>
              </div>

              {/* Mobile-first: stacked video→chat; lg+: side-by-side broadcast stage */}
              <div className="mx-auto mb-4 w-full max-w-2xl sm:mb-6 md:mb-8 lg:mb-2 lg:max-w-[95%]">
                  <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:gap-6">
                    {/* Video Player Section */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="relative pt-3">
                        <span className="fp-live-badge">
                          <Radio className="size-3 sm:size-3.5" aria-hidden />
                          پخش زنده
                        </span>
                        <div className="fp-card fp-spine fp-notch relative flex flex-col overflow-hidden p-2 sm:p-3 md:p-4 lg:min-h-[520px] lg:p-6 lg:h-[min(600px,70dvh)] lg:max-h-[600px]">
                        {/* Video Player Header - Only show when stream is actually playing */}
                        {(() => {
                          // Show LIVE and viewer count only when:
                          // 1. Stream is playing (videoUrl exists and playbackStarted is true)
                          // 2. Webinar hasn't ended
                          // 3. Stream hasn't been manually stopped
                          const shouldShowLiveIndicator =
                            WEBINAR_PREVIEW ||
                            (videoUrl && playbackStarted && !isWebinarEnded && !webinarInfo.isManuallyStopped);

                          if (!shouldShowLiveIndicator) {
                            return null;
                          }

                          return (
                            <div className="mb-2 flex items-center justify-between gap-2 sm:mb-4 md:mb-6">
                              <StatusChip tone="live" pulse className="text-xs sm:text-base">
                                LIVE
                              </StatusChip>
                              <StatusChip tone="brand" icon={<Users className="size-3.5" aria-hidden />} className="fp-hud-num text-xs sm:text-base">
                                {viewers.toLocaleString('en-US')}
                              </StatusChip>
                            </div>
                          );
                        })()}

                      {showVideoPlayer ? (
                        <div className="relative aspect-video w-full min-h-0 overflow-hidden rounded-lg sm:rounded-xl lg:aspect-auto lg:min-h-0 lg:flex-1 lg:h-full">
                        <div className="absolute inset-0 lg:relative lg:inset-auto lg:h-full">
                        <VideoPlayer
                          onVideoEnd={handleVideoEnd} 
                          isStreamEnded={isStreamEnded}
                          streamResetKey={streamResetKey}
                          onVideoTimeUpdate={handleVideoTimeUpdate}
                          onMetadataLoaded={handleMetadataLoaded}
                          onPlaybackStarted={handlePlaybackStarted}
                          onUserStartStream={handleUserStartStream}
                        />
                        </div>
                        </div>
                      ) : (
                        <div className="flex min-h-[220px] flex-col items-center justify-center px-2 py-8 sm:min-h-[300px] sm:py-12">
                          {(() => {
                            // Check if stream was manually stopped by admin OR webinar ended
                            // For appointment mode: isWebinarEnded is true when stream ends after 102 minutes
                            // For manual mode: isManuallyStopped is true when admin stops or stream ends
                            if (webinarInfo.isManuallyStopped || isWebinarEnded) {
                              // CRITICAL: Check if next webinar starts within 1 hour
                              // If so, show countdown instead of "کارگاه متوقف شد"
                              const now = new Date();
                              const startTime = webinarInfo.startTime;
                              const endTime = webinarInfo.endTime;
                              
                              // Calculate next start time
                              let nextStartTime = new Date(startTime);
                              if (now >= endTime) {
                                // We're past the end time - use next day's start time
                                nextStartTime = new Date(startTime);
                                nextStartTime.setDate(nextStartTime.getDate() + 1);
                              } else {
                                // Use today's start time (for appointment mode, this is the next slot)
                                nextStartTime = new Date(startTime);
                              }
                              
                              // Calculate time until next webinar (in milliseconds)
                              const timeUntilNext = nextStartTime.getTime() - now.getTime();
                              const hoursUntilNext = timeUntilNext / (1000 * 60 * 60);
                              
                              // If less than 1 hour until next webinar, show countdown
                              if (hoursUntilNext > 0 && hoursUntilNext <= 1) {
                                const startTimeIran = nextStartTime.toLocaleTimeString('fa-IR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit', 
                                  hour12: false, 
                                  timeZone: 'Asia/Tehran' 
                                });
                                
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-warning sm:mb-4 sm:text-2xl md:text-3xl">⏰ در حال حاضر استریم فعال نیست</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                    کارگاه راس ساعت <span className="font-bold text-white">{startTimeIran}</span> شروع می‌شود.
                                  </div>
                                  <div className="mb-2">
                                    <StartCountdownTimer targetTime={nextStartTime} />
                                  </div>
                                </div>
                              );
                              }
                              
                              // Otherwise, show "کارگاه به اتمام رسید"
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-destructive sm:mb-4 sm:text-2xl md:text-3xl">کارگاه به اتمام رسید</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                    مرسی از همراهی شما ❤️
                                  </div>
                                </div>
                              );
                            }
                            
                            const now = new Date();
                            const startTime = webinarInfo.startTime;
                            const endTime = webinarInfo.endTime;
                            
                            // CRITICAL FIX: Calculate next start time correctly
                            // If we're within webinar window (after start, before end), use today's start
                            // Only use tomorrow if we're past the end time
                            const isWithinWebinarWindow = now >= startTime && now < endTime;
                            let nextStartTime = new Date(startTime);
                            
                            if (isWithinWebinarWindow) {
                              // We're in the webinar window - use today's start time
                              // This allows scheduler to start stream immediately
                              nextStartTime = new Date(startTime);
                              console.log('[LiveWebinar] Within webinar window, using today start time for immediate start');
                            } else if (now >= endTime) {
                              // We're past the end time - use tomorrow's start
                              nextStartTime = new Date(startTime);
                              nextStartTime.setDate(nextStartTime.getDate() + 1);
                              console.log('[LiveWebinar] Past end time, using tomorrow start time');
                            } else {
                              // We're before start time - use today's start
                              nextStartTime = new Date(startTime);
                              console.log('[LiveWebinar] Before start time, using today start time');
                            }
                            
                            const hasActuallyEnded = now >= endTime;
                            
                            // CRITICAL FIX: If we're within webinar window but stream hasn't started yet,
                            // show "در حال شروع..." instead of countdown to tomorrow
                            if (isWithinWebinarWindow && !webinarInfo.isLive && !isWebinarStarted) {
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-warning sm:mb-4 sm:text-2xl md:text-3xl">⏰ در حال شروع کارگاه...</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                    کارگاه در حال شروع است. لطفاً چند لحظه صبر کنید.
                                  </div>
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                  </div>
                                </div>
                              );
                            }
                            
                            if (!webinarInfo.isLive && !isWithinWebinarWindow) {
                              // Calculate time until next start
                              const timeUntilNextStart = nextStartTime.getTime() - now.getTime();
                              const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
                              
                              // If more than 1 hour until start, show "ended" message
                              if (timeUntilNextStart > oneHourInMs) {
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-destructive sm:mb-4 sm:text-2xl md:text-3xl">کارگاه آنلاین به پایان رسید</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                    مرسی از همراهی شما دوستان عزیز ❤️
                                  </div>
                                </div>
                              );
                              }
                              
                              // If 1 hour or less until start, show countdown timer
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-warning sm:mb-4 sm:text-2xl md:text-3xl">⏰ کارگاه هنوز شروع نشده است</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                    کارگاه در ساعت <span className="font-bold text-white">{nextStartTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tehran' })}</span> آغاز می‌شود.
                                  </div>
                                  <div className="mb-2">
                                    <StartCountdownTimer targetTime={nextStartTime} />
                                  </div>
                                </div>
                              );
                            }
                            
                            if (!isWebinarStarted && startTime && !isWithinWebinarWindow) {
                              // Calculate time until start
                              const timeUntilStart = startTime.getTime() - now.getTime();
                              const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
                              
                              // If more than 1 hour until start, show "ended" message
                              if (timeUntilStart > oneHourInMs) {
                                return (
                                  <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                    <div className="mb-3 text-lg font-bold text-destructive sm:mb-4 sm:text-2xl md:text-3xl">کارگاه آنلاین به پایان رسید</div>
                                    <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                      مرسی از همراهی شما دوستان عزیز ❤️
                                    </div>
                                  </div>
                                );
                              }
                              
                              // If 1 hour or less until start, show countdown timer
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-warning sm:mb-4 sm:text-2xl md:text-3xl">⏰ کارگاه هنوز شروع نشده است</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                    کارگاه در ساعت <span className="font-bold text-white">{startTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tehran' })}</span> آغاز می‌شود.
                                  </div>
                                  <div className="mb-2">
                                    <StartCountdownTimer targetTime={startTime} />
                                  </div>
                                </div>
                              );
                            }
                            
                            if (hasActuallyEnded) {
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-destructive sm:mb-4 sm:text-2xl md:text-3xl">کارگاه به پایان رسیده است</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">کارگاه امروز به پایان رسیده است. لطفاً در ساعات اعلام‌شده فردا مراجعه کنید.</div>
                                  <button
                                    className="fp-notch-btn bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] text-white px-6 py-3 text-lg font-bold shadow-[0_0_24px_-6px_rgba(38,252,227,0.5)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
                                    onClick={() => window.open('https://fitinoo.ir', '_blank')}
                                  >
                                    شروع مسیر من
                                  </button>
                                </div>
                              );
                            }
                            
                            // If we're within window but stream not started, show waiting message
                            if (isWithinWebinarWindow && !webinarInfo.isLive) {
                              return (
                                <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                  <div className="mb-3 text-lg font-bold text-warning sm:mb-4 sm:text-2xl md:text-3xl">⏰ در حال شروع کارگاه...</div>
                                  <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                    کارگاه در حال شروع است. لطفاً چند لحظه صبر کنید.
                                  </div>
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="fp-card fp-spine fp-notch mx-auto max-w-md px-4 py-6 text-center sm:px-8 sm:py-10">
                                <div className="mb-3 text-lg font-bold text-warning sm:mb-4 sm:text-2xl md:text-3xl">⏰ در حال حاضر استریم فعال نیست</div>
                                <div className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-lg" dir="rtl">
                                  کارگاه بعدی در ساعت <span className="font-bold text-white">{nextStartTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tehran' })}</span> آغاز می‌شود.
                                </div>
                                <div className="mb-2">
                                  <StartCountdownTimer targetTime={nextStartTime} />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      </div>
                      </div>
                    </div>
                    
                    {/* Live Chat — full width under video on mobile; side column on lg+ */}
                    <div className="flex w-full flex-shrink-0 flex-col lg:w-80 xl:w-[28rem]">
                      <div className="flex h-[min(52dvh,440px)] min-h-[320px] flex-col lg:h-[min(600px,70dvh)] lg:min-h-[520px] lg:max-h-[600px]">
                        <LiveChat 
                          isEnabled={chatEnabled}
                          pinnedMessage={pinnedMessage}
                          webinarDuration={70 * 60}
                          isFullscreen={false}
                          onToggleFullscreenChat={undefined}
                          onWebinarEnd={isWebinarEnded ? () => {} : undefined}
                          streamTime={effectiveAbsoluteTime ?? absoluteTime ?? 0}
                          isStreamReady={WEBINAR_PREVIEW || Boolean(isStreamFullyReady && offsetLockedRef.current)}
                          streamResetKey={streamResetKey}
                        />
                      </div>
                    </div>
                  </div>
              </div>

              {showEndModal && (
                <EndWebinarModal onClose={() => setShowEndModal(false)} />
              )}
            </div>
          </div>
        </div>
      </div>

      {isWebinarEnded && !WEBINAR_PREVIEW && (
        <EndWebinarModal 
          onClose={() => {
            // CRITICAL: Do NOT reset isWebinarEnded if webinar has permanently ended
            // This prevents video from restarting after it ends
            if (!webinarEndedPermanentlyRef.current) {
              setIsWebinarEnded(false);
            }
            try {
              localStorage.removeItem('webinar_chat_history');
              console.log('Cleared webinar localStorage data (user closed modal)');
            } catch (error) {
              console.error('Failed to clear localStorage:', error);
            }
          }} 
        />
      )}
    </div>
  );
};

export default LiveWebinar;
