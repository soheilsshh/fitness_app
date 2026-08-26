import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import type { KeyboardEvent } from "react";
import { Send, MessageCircle, Pin, X, Reply, UserPlus, ArrowLeft } from "lucide-react";
import { apiService } from "@/services/api";
import { config } from "@/config/environment";
import { timedComments, TimeRange } from "@/data/timedComments";
import { AdaptiveCommentEngine, DisplayComment, mapCommentsToAbsoluteTime } from "@/services/AdaptiveCommentEngine";
import StatusChip from "@/components/StatusChip";
import { isWebinarPreviewMode } from "@/config/webinarPreview";
import { MOCK_LIVE_CHAT_SCRIPT } from "@/data/mockLiveChat";

const WEBINAR_PREVIEW = isWebinarPreviewMode();

// Enhanced device detection
const detectDevice = () => {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  
  // Detect iOS (including iPad on iOS 13+)
  const isIOS = 
    (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Detect Android
  const isAndroid = /Android/i.test(ua);
  
  return { isIOS, isAndroid };
};

const deviceInfo = detectDevice();
const isIOS = deviceInfo.isIOS;
const isAndroid = deviceInfo.isAndroid;

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isUser?: boolean;
  isAdmin?: boolean;
  replyToUsername?: string;
  replyToMessage?: string;
  displayAt?: number;
}

interface LiveChatProps {
  isEnabled: boolean;
  pinnedMessage: string | null;
  webinarDuration: number;
  isFullscreen?: boolean;
  onToggleFullscreenChat?: () => void;
  onWebinarEnd?: () => void;
  streamTime: number; // Viewer-aligned absolute timeline (videoTime + locked offset)
  isStreamReady: boolean; // Includes offset lock from LiveWebinar
  streamResetKey?: number;
}

const LIVECHAT_BUILD_ID = "LIVECHAT_BUILD_V2_CHAT_TIMELINE";

console.log("[BUILD_MARKER] LiveChat source loaded with BUILD_ID =", LIVECHAT_BUILD_ID);

const PRELOAD_LIMIT = 100;
const MAX_DISPLAYED_MESSAGES = 200;

const LiveChat = ({
  isEnabled,
  pinnedMessage,
  webinarDuration,
  isFullscreen = false,
  onToggleFullscreenChat,
  onWebinarEnd,
  streamTime,
  isStreamReady,
  streamResetKey = 0,
}: LiveChatProps) => {
  // Unified offset system for all devices
  const [commentOffsetSeconds, setCommentOffsetSeconds] = useState<number>(0);
  const offsetFetchedRef = useRef(false);

  // Fetch unified offset value from API (poll every 5 seconds to get updates from admin panel)
  useEffect(() => {
    const fetchOffset = async () => {
      try {
        const webinarInfo = await apiService.getWebinarInfo();
        let offset = 0;
        
        if (typeof webinarInfo.comment_offset_seconds === 'number') {
          offset = webinarInfo.comment_offset_seconds;
        }
        
        setCommentOffsetSeconds((prevOffset) => {
          if (prevOffset !== offset) {
            const deviceType = isIOS ? "iOS" : (isAndroid ? "Android" : "Desktop/Other");
            console.log(`[OFFSET] 🔄 Unified offset changed for ${deviceType}: ${prevOffset} → ${offset} seconds`);
            // Reset engine if offset changed
            if (engineRef.current && lastStreamTimeRef.current !== null) {
              console.log(`[OFFSET] 🔄 Resetting engine due to offset change (device: ${deviceType})`);
              // Force complete reset: destroy engine and clear state
              engineRef.current.destroy();
              engineRef.current = null;
              mappedCommentsRef.current = null;
              lastStreamTimeRef.current = null;
              setTimedMessages([]); // Clear displayed messages to force re-sync
            }
          }
          return offset;
        });
        
        if (!offsetFetchedRef.current) {
          offsetFetchedRef.current = true;
          const deviceType = isIOS ? "iOS" : (isAndroid ? "Android" : "Desktop/Other");
          console.log(`[OFFSET] ✅ Initial fetch from API - Unified offset: ${offset} seconds (applies to ALL devices including ${deviceType})`);
        }
      } catch (error) {
        console.error("[LiveChat] ❌ Failed to fetch comment offset:", error);
      }
    };
    
    // Fetch immediately
    fetchOffset();
    
    // Poll every 5 seconds to get updates from admin panel
    const interval = setInterval(fetchOffset, 5000);
    
    return () => clearInterval(interval);
  }, []); // Only run once on mount, polling interval handles updates

  // Calculate effective stream time with unified offset
  // IMPORTANT: Positive offset = comments appear LATER (so we SUBTRACT from streamTime)
  // Negative offset = comments appear EARLIER (so we ADD to streamTime)
  const deviceOffset = commentOffsetSeconds;

  // Final adjusted time for synchronization
  // Positive offset = delay comments (subtract offset from streamTime)
  // Negative offset = advance comments (add offset to streamTime, which is the same as subtracting negative)
  const effectiveStreamTime = streamTime - deviceOffset;

  // Log offset info every 10 seconds to avoid spam
  const shouldLogOffset = useRef(true);
  useEffect(() => {
    const interval = setInterval(() => {
      shouldLogOffset.current = true;
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (shouldLogOffset.current) {
    const deviceType = isIOS ? "iOS" : (isAndroid ? "Android" : "Desktop/Other");
    console.log("[OFFSET] ========== UNIFIED OFFSET SYSTEM ==========");
    console.log("[OFFSET] ⚠️ CRITICAL: streamTime is based on REAL stream start time (not user join time)");
    console.log("[OFFSET] streamTime = (serverNow - streamStartTime) / 1000");
    console.log("[OFFSET] This ensures all users see comments at the same absolute time");
    console.log("[OFFSET] Device Type:", deviceType);
    console.log("[OFFSET] Unified offset from API:", commentOffsetSeconds, "s (applies to ALL devices including Desktop)");
    console.log("[OFFSET] Base streamTime (real stream time):", streamTime.toFixed(2), "s");
    console.log("[OFFSET] Unified offset (applied):", deviceOffset.toFixed(2), "s", deviceOffset > 0 ? "(POSITIVE = comments appear LATER)" : deviceOffset < 0 ? "(NEGATIVE = comments appear EARLIER)" : "(ZERO = no offset)");
    console.log("[OFFSET] Effective streamTime (streamTime - offset):", effectiveStreamTime.toFixed(2), "s");
    console.log("[OFFSET] ✅ All devices (including Desktop) use the same offset - comments appear at the same time!");
    console.log("[OFFSET] ==========================================");
    shouldLogOffset.current = false;
  }

  console.log(
    "%c[LiveChat] props",
    "background:#440;color:#fff;padding:4px",
    {
      isStreamReady,
      streamTime,
      effectiveStreamTime,
    }
  );
  const [timedMessages, setTimedMessages] = useState<Message[]>([]);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showCTA, setShowCTA] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clean state machine - SINGLE SOURCE OF TRUTH: viewer-aligned streamTime
  const engineRef = useRef<AdaptiveCommentEngine | null>(null);
  const mappedCommentsRef = useRef<DisplayComment[] | null>(null);
  // NEW: Unified comments queue - contains both marketing and user comments, sorted by globalTime
  const unifiedCommentsRef = useRef<DisplayComment[] | null>(null);
  const lastStreamTimeRef = useRef<number | null>(null);
  const initLoggedRef = useRef(false);

  // Map comments once per mount/reset. Starts from the static bundled
  // timedComments.ts (legacy single-webinar script, always available
  // synchronously) so the chat has something to show immediately, then
  // the effect below replaces it with whichever WebinarProgram's own
  // comments_json is currently active, fetched live from the API — that's
  // what makes per-webinar marketing comments possible without a rebuild
  // every time a program's script changes.
  const ensureMappedComments = useCallback((): DisplayComment[] => {
    if (!mappedCommentsRef.current) {
      const mapped = mapCommentsToAbsoluteTime(timedComments);
      mappedCommentsRef.current = mapped;
      console.log(`[LiveChat] ✅ mapped ${mapped.length} comments to absolute timestamps (static fallback)`);
    }
    return mappedCommentsRef.current!;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${config.API_BASE_URL}/webinar-programs/current/comments`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TimeRange[] | null) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        mappedCommentsRef.current = mapCommentsToAbsoluteTime(data);
        console.log(`[LiveChat] ✅ loaded ${data.length} comment ranges for the active webinar program from API`);
      })
      .catch(() => {
        // No WebinarProgram configured yet (legacy mode) or a network
        // hiccup — keep the static fallback already in mappedCommentsRef.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // NEW: Get unified comments (marketing + user comments), sorted by displayAt/globalTime
  const getUnifiedComments = useCallback((): DisplayComment[] => {
    const marketingComments = ensureMappedComments();
    // unifiedCommentsRef contains user comments that were added via enqueueMergedMessage
    const userComments = unifiedCommentsRef.current?.filter(c => c.id.startsWith('user-')) || [];
    // Merge and sort by displayAt (which represents globalTime for both types)
    const unified = [...marketingComments, ...userComments].sort((a, b) => {
      if (a.displayAt === b.displayAt) {
        return a.id.localeCompare(b.id);
      }
      return a.displayAt - b.displayAt;
    });
    return unified;
  }, [ensureMappedComments]);

  // Convert DisplayComment to Message
  const toMessage = useCallback((comment: DisplayComment): Message => ({
    id: comment.id,
    username: comment.username,
    message: comment.message,
    timestamp: new Date(),
    isAdmin: comment.isAdmin || false,
    replyToUsername: comment.replyToUsername,
    replyToMessage: comment.replyToMessage,
    displayAt: comment.displayAt,
  }), []);

  // NEW: Enqueue function - the SAME queue that marketing comments use
  // This is the callback passed to AdaptiveCommentEngine
  const enqueueToRenderQueue = useCallback((comment: DisplayComment) => {
    console.log('[LiveChat] 🔔 Enqueueing comment to render queue:', comment.id, 'at displayAt:', comment.displayAt);
    setTimedMessages((prev) => {
      if (prev.some((m) => m.id === comment.id)) return prev;
      return [...prev, toMessage(comment)];
    });
  }, [toMessage]);

  // NEW: Wrapper function to enqueue merged messages (both marketing and user)
  // This ensures user messages go through the EXACT SAME pipeline as marketing messages
  const enqueueMergedMessage = useCallback((message: {
    id: string;
    username: string;
    message: string;
    globalTime: number;
    timestamp: Date;
    isUser?: boolean;
    replyToUsername?: string;
    replyToMessage?: string;
  }) => {
    if (!isStreamReady) {
      console.warn('[LiveChat] ⚠️ Cannot enqueue user message - stream not ready');
      return;
    }

    const currentDeviceOffset = commentOffsetSeconds;
    const currentEffectiveStreamTime = streamTime - currentDeviceOffset;

    // SIMPLE APPROACH: User comments use currentEffectiveStreamTime (not future globalTime)
    // This keeps them in sync with system timeline without causing engine to jump forward

    // STEP 1: Display user comment IMMEDIATELY (just add to timedMessages)
    const userMessage: Message = {
      id: message.id,
      username: message.username,
      message: message.message,
      timestamp: message.timestamp,
      isUser: true,
      replyToUsername: message.replyToUsername,
      replyToMessage: message.replyToMessage,
      displayAt: currentEffectiveStreamTime, // Use current time, not future globalTime
    };
    
    setTimedMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, userMessage];
    });

    // STEP 2: Add user comment to unified queue with currentEffectiveStreamTime
    const displayComment: DisplayComment = {
      id: message.id,
      username: message.username,
      message: message.message,
      displayAt: currentEffectiveStreamTime, // Use current time, not future globalTime
      isAdmin: false,
      replyToUsername: message.replyToUsername,
      replyToMessage: message.replyToMessage,
    };

    if (!unifiedCommentsRef.current) {
      unifiedCommentsRef.current = [];
    }
    unifiedCommentsRef.current.push(displayComment);
    unifiedCommentsRef.current.sort((a, b) => {
      if (a.displayAt === b.displayAt) {
        return a.id.localeCompare(b.id);
      }
      return a.displayAt - b.displayAt;
    });

    // STEP 3: Reload engine with updated unified comments
    // Engine stays at currentEffectiveStreamTime - no jumping to future
    // This ensures system comments continue normally without sync issues
    if (engineRef.current) {
      const unified = getUnifiedComments();
      engineRef.current.reloadComments(unified);
      // Prime engine to currentEffectiveStreamTime (where it already is)
      engineRef.current.primeToTime(currentEffectiveStreamTime);
    }

    console.log('[LiveChat] ✅ User message displayed instantly at current time:', currentEffectiveStreamTime.toFixed(2), 's');
  }, [getUnifiedComments, ensureMappedComments, enqueueToRenderQueue, toMessage, isStreamReady, streamTime, commentOffsetSeconds]);

  // Preload anchor + history (max PRELOAD_LIMIT)
  // Updated to use unified comments (marketing + user)
  const preloadCommentsAtTime = useCallback((t: number) => {
    const unified = getUnifiedComments();

    // Find anchor: last comment with displayAt <= t
    const anchorIndex = (() => {
      let idx = -1;
      for (let i = 0; i < unified.length; i++) {
        if (unified[i].displayAt <= t) {
          idx = i;
        } else {
          break;
        }
      }
      return idx;
    })();

    if (anchorIndex === -1) {
      console.log(`[LiveChat] 📦 No comments before t=${t.toFixed(2)}s, nothing to preload`);
      setTimedMessages([]);
      return;
    }

    const startIndex = Math.max(0, anchorIndex - (PRELOAD_LIMIT - 1));
    const slice = unified.slice(startIndex, anchorIndex + 1);

    console.log(
      `[LiveChat] 📦 Preloading ${slice.length} comments (anchor index: ${anchorIndex}, t=${t.toFixed(
        2
      )}s, from displayAt=${slice[0].displayAt}s to ${slice[slice.length - 1].displayAt}s)`
    );

    setTimedMessages(slice.map(toMessage));
  }, [getUnifiedComments, toMessage]);

  useEffect(() => {
    if (initLoggedRef.current) return;
    initLoggedRef.current = true;
    console.log("[LiveChat] INIT with streamTime (viewer timeline) =", streamTime, "isStreamReady=", isStreamReady);
  }, [streamTime, isStreamReady]);

  // Preview/dev: simulated chat timeline (~60s) on each page load / stream reset
  useEffect(() => {
    if (!WEBINAR_PREVIEW) return;

    setTimedMessages([]);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    MOCK_LIVE_CHAT_SCRIPT.forEach(({ atMs, username, message, isAdmin }) => {
      const id = `mock-${streamResetKey}-${atMs}`;
      timeouts.push(
        setTimeout(() => {
          setTimedMessages((prev) => {
            if (prev.some((m) => m.id === id)) return prev;
            return [
              ...prev,
              {
                id,
                username,
                message,
                timestamp: new Date(),
                isAdmin: isAdmin ?? false,
                displayAt: atMs / 1000,
              },
            ];
          });
        }, atMs)
      );
    });

    return () => timeouts.forEach(clearTimeout);
  }, [streamResetKey]);

  // MAIN SYNC EFFECT - Driven ONLY by viewer-aligned absolute streamTime
  useEffect(() => {
    if (WEBINAR_PREVIEW) return;

    // Recalculate effectiveStreamTime inside effect to ensure it's always fresh
    // Positive offset = delay comments (subtract offset from streamTime)
    // Negative offset = advance comments (subtract negative = add)
    const currentDeviceOffset = commentOffsetSeconds;
    const currentEffectiveStreamTime = streamTime - currentDeviceOffset;
    const deviceType = isIOS ? "iOS" : (isAndroid ? "Android" : "Desktop/Other");

    console.log(`[LiveChat] 🔄 SYNC [${deviceType}] - streamTime: ${streamTime.toFixed(2)}s, offset: ${currentDeviceOffset.toFixed(2)}s, effectiveStreamTime: ${currentEffectiveStreamTime.toFixed(2)}s, isStreamReady: ${isStreamReady}`);

    if (!isStreamReady) {
      return;
    }

    if (!Number.isFinite(streamTime) || streamTime <= 2) {
      return;
    }

    // INITIAL SYNC: Only happens once when lastStreamTimeRef is null
    if (lastStreamTimeRef.current === null) {
      console.log("[LiveChat] 🎯 INITIAL SYNC at effectiveStreamTime =", currentEffectiveStreamTime.toFixed(2), "s");

      const mapped = ensureMappedComments();

      console.log(
        "%c[DEBUG:INITIAL SYNC]",
        "background:#070;color:#fff;padding:4px",
        {
          streamTime,
          effectiveStreamTime: currentEffectiveStreamTime,
          deviceOffset: currentDeviceOffset,
          mappedCount: mappedCommentsRef.current?.length,
          deviceType,
        }
      );

      if (!engineRef.current) {
        // Use unified comments (marketing + user) for engine
        const unified = getUnifiedComments();
        engineRef.current = new AdaptiveCommentEngine(unified, enqueueToRenderQueue);
      }

      console.log(`[OFFSET] 🎯 PRIMING ENGINE with offset applied (${deviceType}):`);
      console.log("  - Base streamTime:", streamTime.toFixed(2), "s");
      console.log("  - Device offset:", currentDeviceOffset.toFixed(2), "s");
      console.log("  - Effective streamTime (streamTime - offset):", currentEffectiveStreamTime.toFixed(2), "s");
      console.log("  - Comments with displayAt <=", currentEffectiveStreamTime.toFixed(2), "will be marked as past");
      
      engineRef.current.primeToTime(currentEffectiveStreamTime);
      preloadCommentsAtTime(currentEffectiveStreamTime);
      lastStreamTimeRef.current = currentEffectiveStreamTime;
      return;
    }

    // SUBSEQUENT UPDATES: Forward progression or backward jump
    const last = lastStreamTimeRef.current;
    if (currentEffectiveStreamTime > last) {
      // Forward progression: engine emits comments between last and now
      const deviceType = isIOS ? "iOS" : (isAndroid ? "Android" : "Desktop/Other");
      // Note: All devices now use the same unified offset
      console.log(`[OFFSET] ⏩ UPDATE [${deviceType}]: ${last.toFixed(2)}s → ${currentEffectiveStreamTime.toFixed(2)}s (offset: ${currentDeviceOffset.toFixed(2)}s, base streamTime: ${streamTime.toFixed(2)}s)`);
      // CRITICAL: Only recreate engine if unified comments have changed (new user message added)
      // Check if unified comments count has changed to avoid unnecessary recreation
      if (engineRef.current) {
        const unified = getUnifiedComments();
        const currentComments = engineRef.current.getComments();
        // Only recreate if comments have actually changed (e.g., new user message added)
        if (unified.length !== currentComments.length) {
          console.log(`[LiveChat] 🔄 Unified comments changed (${currentComments.length} → ${unified.length}), recreating engine`);
          engineRef.current.destroy();
          engineRef.current = new AdaptiveCommentEngine(unified, enqueueToRenderQueue);
          engineRef.current.primeToTime(last);
        }
      }
      engineRef.current?.update(currentEffectiveStreamTime);
      lastStreamTimeRef.current = currentEffectiveStreamTime;
      return;
    }

    if (currentEffectiveStreamTime < last) {
      // Backward jump: reset engine and preload
      // CRITICAL: Only reset if the jump is significant (> 5 seconds) to avoid false positives
      // Small backward jumps might be due to timing adjustments, not actual seeks
      const jumpSize = last - currentEffectiveStreamTime;
      if (jumpSize > 5) {
        console.warn(`[LiveChat] ⚠️ Stream time rewind: ${last.toFixed(2)}s → ${currentEffectiveStreamTime.toFixed(2)}s (jump: ${jumpSize.toFixed(2)}s)`);
        // Ensure engine uses latest unified comments
        if (engineRef.current) {
          const unified = getUnifiedComments();
          engineRef.current.destroy();
          engineRef.current = new AdaptiveCommentEngine(unified, enqueueToRenderQueue);
        }
        engineRef.current?.resetToTime(currentEffectiveStreamTime);
        preloadCommentsAtTime(currentEffectiveStreamTime);
        lastStreamTimeRef.current = currentEffectiveStreamTime;
      } else {
        // Small backward jump - update engine to ensure comments continue
        console.log(`[LiveChat] ⚠️ Small backward jump detected (${jumpSize.toFixed(2)}s), updating engine to continue comments`);
        // Update engine state and force update to ensure comments continue
        if (engineRef.current) {
          engineRef.current.primeToTime(currentEffectiveStreamTime);
          // Force update to ensure any pending comments are emitted
          engineRef.current.update(currentEffectiveStreamTime);
        }
        lastStreamTimeRef.current = currentEffectiveStreamTime;
      }
      return;
    }
    
    // If currentEffectiveStreamTime === last, still update engine to catch any missed comments
    // This prevents comments from getting stuck when streamTime is stable
    if (engineRef.current && Math.abs(currentEffectiveStreamTime - last) < 0.1) {
      // StreamTime is stable (within 0.1s), but still update engine to ensure no comments are missed
      engineRef.current.update(currentEffectiveStreamTime);
    }
  }, [streamTime, isStreamReady, commentOffsetSeconds, preloadCommentsAtTime, ensureMappedComments, toMessage, getUnifiedComments, enqueueToRenderQueue]);

  // STREAM RESET EFFECT: Wipe entire state when streamResetKey changes
  useEffect(() => {
    if (streamResetKey === 0) return;
    console.log(`[LiveChat] 🔄 streamResetKey=${streamResetKey} -> wiping entire state`);
    engineRef.current?.destroy();
    engineRef.current = null;
    mappedCommentsRef.current = null;
    unifiedCommentsRef.current = null; // NEW: Clear unified comments queue on stream reset
    lastStreamTimeRef.current = null;
    setTimedMessages([]);
    // Note: userMessages state kept for backward compatibility but not used for rendering
    setReplyingTo(null);
  }, [streamResetKey]);

  // FALLBACK: Periodic update to ensure comments don't get stuck
  // This is a safety mechanism in case the main sync effect misses updates
  useEffect(() => {
    if (!isStreamReady || !engineRef.current || lastStreamTimeRef.current === null) {
      return;
    }

    const fallbackInterval = setInterval(() => {
      // Only run fallback if streamTime is valid and engine exists
      if (!Number.isFinite(streamTime) || streamTime <= 2 || !engineRef.current) {
        return;
      }

      const currentDeviceOffset = commentOffsetSeconds;
      const currentEffectiveStreamTime = streamTime - currentDeviceOffset;
      const last = lastStreamTimeRef.current;

      // If streamTime has advanced but we haven't updated, force an update
      if (currentEffectiveStreamTime > last + 0.5) {
        console.log(`[LiveChat] 🔄 FALLBACK: Forcing update (last: ${last.toFixed(2)}s, current: ${currentEffectiveStreamTime.toFixed(2)}s)`);
        engineRef.current.update(currentEffectiveStreamTime);
        lastStreamTimeRef.current = currentEffectiveStreamTime;
      } else if (Math.abs(currentEffectiveStreamTime - last) < 0.1) {
        // StreamTime is stable, but ensure engine processes any pending comments
        engineRef.current.update(currentEffectiveStreamTime);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(fallbackInterval);
  }, [isStreamReady, streamTime, commentOffsetSeconds]);

  // Update CTA based on streamTime
  // CTA should appear at 90 minutes (2 minutes later than before - was 88 minutes)
  // Device-specific timing: Android +20s, iOS -40s
  useEffect(() => {
    if (!Number.isFinite(streamTime) || streamTime <= 0) return;
    const baseCtaTriggerTime = 90 * 60; // 90 minutes = 5400 seconds
    
    // Device-specific adjustments
    let ctaTriggerTime = baseCtaTriggerTime;
    if (isAndroid) {
      // Android: 20 seconds later
      ctaTriggerTime = baseCtaTriggerTime + 20; // 5420 seconds
    } else if (isIOS) {
      // iOS: 40 seconds earlier
      ctaTriggerTime = baseCtaTriggerTime - 40; // 5360 seconds
    }
    // Other devices: use base time (5400 seconds)
    
    const ctaHideTime = 203 * 60;
    setShowCTA(streamTime >= ctaTriggerTime && streamTime < ctaHideTime);
  }, [streamTime]);

  // Scroll handling
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setIsUserScrolling(!isAtBottom);
    }
  };

  useEffect(() => {
    if (!isUserScrolling) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [isUserScrolling, timedMessages]);

  // Displayed messages: Use timedMessages which is populated by the unified engine
  // Both marketing and user comments go through the SAME pipeline via enqueueToRenderQueue
  // No separate rendering - everything comes from the unified queue
  // CRITICAL: ONLY use timedMessages - no userMessages rendering
  const displayedMessages = useMemo(() => {
    // timedMessages contains both marketing and user comments, already sorted by displayAt
    // This is populated by the engine via enqueueToRenderQueue callback
    // All messages (marketing + user) go through the same unified pipeline
    return timedMessages.length > MAX_DISPLAYED_MESSAGES 
      ? timedMessages.slice(-MAX_DISPLAYED_MESSAGES) 
      : timedMessages;
  }, [timedMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (!isUserScrolling) {
      container.scrollTop = container.scrollHeight;
    }
  }, [displayedMessages, isUserScrolling]);

  // User message handling
  const getCurrentUserName = () => {
    try {
      const reg = JSON.parse(localStorage.getItem('registrationData') || '{}');
      if (reg.firstName && reg.lastName) return reg.firstName + ' ' + reg.lastName;
      if (reg.firstName) return reg.firstName;
      return 'کاربر';
    } catch {
      return 'کاربر';
    }
  };

  // Memoize handlers to prevent unnecessary re-renders
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;
    const username = getCurrentUserName();
    
    // NEW: Calculate globalTime for merged comment stream
    // globalTime = currentVideoTime + deviceOffset
    // This ensures user messages appear at correct timeline position
    const currentDeviceOffset = commentOffsetSeconds;
    // Only calculate globalTime if stream is ready and streamTime is valid
    // Otherwise use timestamp as fallback (will be sorted by timestamp)
    const globalTime = (isStreamReady && Number.isFinite(streamTime) && streamTime > 0) 
      ? streamTime + currentDeviceOffset 
      : Date.now() / 1000; // Fallback to current timestamp in seconds
    
    const msgObj: Message = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      username,
      message: newMessage,
      timestamp: new Date(),
      isUser: true,
      replyToUsername: replyingTo?.username,
      replyToMessage: replyingTo?.message,
    };
    
    // NEW: Enqueue user message to unified queue (same pipeline as marketing comments)
    // This routes the message through AdaptiveCommentEngine, same as marketing comments
    enqueueMergedMessage({
      id: msgObj.id,
      username: msgObj.username,
      message: msgObj.message,
      globalTime: globalTime,
      timestamp: msgObj.timestamp,
      isUser: true,
      replyToUsername: msgObj.replyToUsername,
      replyToMessage: msgObj.replyToMessage,
    });
    
    // Note: userMessages state is kept for backward compatibility but NOT rendered
    // All rendering goes through timedMessages via the unified pipeline
    setNewMessage("");
    setReplyingTo(null);
    try {
      await apiService.postChatMessage({ username, message: newMessage });
    } catch (e) {
      // ignore
    }
  }, [newMessage, commentOffsetSeconds, isStreamReady, streamTime, replyingTo, enqueueMergedMessage]);

  const handleReplyClick = useCallback((message: Message) => {
    setReplyingTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Allow comments to continue even if streamTime is very high (after webinar ends)
  // Only block if streamTime is invalid or stream is not ready initially
  if (!WEBINAR_PREVIEW && (!isStreamReady || !Number.isFinite(streamTime) || streamTime < 0)) {
    // Only show waiting message if streamTime is very low (initial state)
    if (streamTime <= 2) {
      console.log("[LiveChat] Waiting for ready chat timeline. t=", streamTime, "isStreamReady=", isStreamReady);
      return (
        <div className="p-4 text-center text-muted-foreground">
          در حال اتصال به چت زنده...
        </div>
      );
    }
    // If streamTime is valid but stream not ready, continue processing comments
  }

  // Height comes from parent (responsive stage); fullscreen overrides.
  const containerClasses = isFullscreen
    ? "w-full h-full bg-black/20 backdrop-blur-md border-0 rounded-none"
    : "fp-card fp-notch h-full min-h-0 flex-1";

  return (
    <div className={`${containerClasses} flex flex-col overflow-hidden dir-rtl touch-manipulation`}>
      <div className="border-b border-white/10 bg-white/[0.03] p-3 md:p-4" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="text-[#26fce3] w-5 h-5" strokeWidth={1.5} />
            <h3 className="text-white font-medium text-sm md:text-base">چت زنده</h3>
          </div>

          {isFullscreen && (
            <button
              onClick={onToggleFullscreenChat}
              className="text-white/60 hover:text-white transition-all duration-200 hover:bg-white/10 p-1.5 rounded-lg"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {pinnedMessage && (
        <div
          className="fp-spine flex items-start gap-2 border-b border-white/10 bg-white/[0.03] p-2.5 sm:gap-3 sm:p-3"
          style={{ borderInlineStartColor: "hsl(var(--warning))", borderInlineStartWidth: "4px" }}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/15 sm:h-7 sm:w-7">
            <Pin className="h-3 w-3 text-warning" size={12} />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-xs font-bold tracking-wide text-warning sm:mb-1.5">📌 پیام مهم</div>
            <p className="text-xs font-medium leading-relaxed text-white/85">{pinnedMessage}</p>
          </div>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 scrollbar-thin"
        onScroll={handleScroll}
        dir="rtl"
      >
        {displayedMessages.map((message) => (
            <MessageItem
              key={message.id} 
              message={message}
              onReplyClick={handleReplyClick}
            />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showCTA && (
        <div className="border-t border-white/10 bg-white/[0.03] p-3 sm:p-4" dir="rtl">
          <a
            href="https://fitinoo.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="fp-notch-btn w-full bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] text-white font-bold py-3 sm:py-3.5 px-4 sm:px-6 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_24px_-6px_rgba(38,252,227,0.5)] flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>ثبت نام در پلتفرم</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      )}

      <div className="p-2.5 sm:p-3 md:p-4 border-t border-white/10 bg-white/[0.02]" dir="rtl">
        {replyingTo && (
          <div
            className="mb-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
            style={{ borderInlineStart: "2px solid rgba(38,252,227,0.5)" }}
          >
            <div className="flex items-center gap-2 flex-1">
              <Reply size={14} className="text-[#26fce3]" />
              <div className="flex-1 min-w-0">
                <span className="text-[#26fce3] text-xs font-medium">{replyingTo.username}</span>
                <span className="text-gray-400 text-xs mx-1">•</span>
                <span className="text-gray-300 text-xs line-clamp-1">{replyingTo.message}</span>
              </div>
            </div>
            <button
              onClick={handleCancelReply}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="لغو"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="mb-1.5 flex gap-2 sm:mb-2 sm:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
            className="min-h-[44px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-right text-white transition-all duration-200 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#26fce3]/40 sm:rounded-xl sm:px-4 sm:text-xs"
            dir="rtl"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            aria-label="ارسال پیام"
            className="fp-notch-btn flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center bg-gradient-to-l from-[#187272] via-[#2a9c96] to-[#26fce3] px-3 py-2.5 text-white shadow-[0_0_20px_-6px_rgba(38,252,227,0.5)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} className="sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageItem = memo(({ message, onReplyClick }: { message: Message; onReplyClick: (message: Message) => void }) => {
  const spineColor = message.isUser
    ? "#58cac0"
    : "rgba(255,255,255,0.16)";

  return (
    <div className="group flex justify-start">
      <div
        className="fp-spine max-w-[90%] rounded-lg bg-white/5 p-3 transition-colors duration-200 sm:max-w-[85%]"
        style={{ borderInlineStartColor: spineColor }}
      >
        {message.replyToUsername && (
          <div
            className="mb-2 rounded-md bg-white/5 px-2 py-1.5 text-xs text-gray-400"
            style={{ borderInlineStart: "2px solid rgba(38,252,227,0.5)" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#26fce3]">{message.replyToUsername}</span>
              <span className="text-gray-500">•</span>
              <span className="line-clamp-1 text-gray-300">"{message.replyToMessage}"</span>
            </div>
          </div>
        )}
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {message.isAdmin ? (
            <StatusChip tone="brand" className="px-2 py-0.5 text-[11px]">
              ادمین
            </StatusChip>
          ) : (
            <span className={`text-xs font-medium ${message.isUser ? "text-[#58cac0]" : "text-gray-300"}`}>
              {message.username}
            </span>
          )}
          {!message.isAdmin && (
            <button
              onClick={() => onReplyClick(message)}
              className="p-1 text-gray-400 opacity-0 transition-opacity hover:text-[#26fce3] group-hover:opacity-100"
              title="پاسخ"
            >
              <Reply size={14} />
            </button>
          )}
        </div>
        <p className="text-right text-sm font-normal leading-relaxed text-white">{message.message}</p>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default LiveChat;
