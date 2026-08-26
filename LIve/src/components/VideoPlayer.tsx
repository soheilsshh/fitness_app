import React, { useRef, useEffect, useState, useCallback } from 'react';
import { apiService } from '@/services/api';
import StatusChip from '@/components/StatusChip';
declare const flvjs: any; // Declare flvjs to avoid TypeScript errors
declare const Hls: any; // Declare Hls.js to avoid TypeScript errors

// Extend HTMLVideoElement for webkit fullscreen methods
interface ExtendedHTMLVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitEnterFullScreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitExitFullScreen?: () => void;
}

interface VideoPlayerProps {
  onVideoEnd: () => void;
  isStreamEnded?: boolean; // New prop to indicate if stream has ended
  streamResetKey?: number; // Key to force reset when new stream starts
  onVideoTimeUpdate?: (currentTime: number) => void; // Callback for REAL video.currentTime updates
  onMetadataLoaded?: () => void; // Callback when video metadata is loaded
  onPlaybackStarted?: () => void; // Callback when video actually starts playing
  onUserStartStream?: () => void; // Notifies parent when user explicitly starts playback
}

const VideoPlayer = ({ onVideoEnd, isStreamEnded = false, streamResetKey = 0, onVideoTimeUpdate, onMetadataLoaded, onPlaybackStarted, onUserStartStream }: VideoPlayerProps) => {
  const videoRef = useRef<ExtendedHTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true); // CRITICAL: Always show play overlay initially
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const [iosPlayerInitialized, setIosPlayerInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [isStarting, setIsStarting] = useState(false); // Track if stream is starting
  const userLeftPageRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoEndedPermanentlyRef = useRef(false); // Track if video has permanently ended
  const stalledRecoveryRef = useRef<{ count: number; lastRecovery: number }>({ count: 0, lastRecovery: 0 });
  const startupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flvStreamUrl = 'https://live.fitinoo.ir/live/stream';
  // Use master playlist for multi-bitrate HLS, fallback to single playlist
  const hlsStreamUrl = 'https://live.fitinoo.ir/hls/stream.m3u8'; // Master playlist (if multi-bitrate) or single playlist
  // Low-bitrate stream URL for weak Android devices
  const hlsLowStreamUrl = hlsStreamUrl.replace('stream.m3u8', 'stream_low.m3u8');
  const userStartNotifiedRef = useRef(false);
  
  // Playback health monitoring for auto-switch to low stream
  const playbackHealthRef = useRef<{
    totalStalledEvents: number;
    isUsingLowStream: boolean;
    hasEvaluated: boolean;
  }>({
    totalStalledEvents: 0,
    isUsingLowStream: false,
    hasEvaluated: false,
  });
  
  // Recovery lock to prevent loops
  const recoveryLockRef = useRef<boolean>(false);
  
  // Store cache-busting timestamp only when new stream starts
  const cacheBusterRef = useRef<string>('');
  const previousStreamResetKeyRef = useRef<number>(0);
  
  // Update cache buster when streamResetKey changes
  useEffect(() => {
    if (streamResetKey > 0 && streamResetKey !== previousStreamResetKeyRef.current) {
      cacheBusterRef.current = `?t=${Date.now()}`;
      previousStreamResetKeyRef.current = streamResetKey;
      console.log(`[VideoPlayer] 🆕 New stream detected (key: ${streamResetKey})`);
      
      // Reset health monitoring state for new stream
      playbackHealthRef.current.totalStalledEvents = 0;
      playbackHealthRef.current.isUsingLowStream = false;
      playbackHealthRef.current.hasEvaluated = false;
      recoveryLockRef.current = false;
      console.log('[PlayerHealth] 🔄 Health monitoring state reset for new stream');
    }
  }, [streamResetKey]);
  
  // Detect iOS (includes iPad with iOS 13+)
  const isIOS = useRef(
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
  
  // Detect Android
  const isAndroid = useRef(/Android/i.test(navigator.userAgent));
  
  // Detect mobile devices (iOS or Android)
  const isMobile = useRef(
    isIOS.current || isAndroid.current || 
    /webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
  
  // Detect Windows or Mac (Desktop - should use FLV)
  const isDesktop = useRef(
    !isIOS.current && !isAndroid.current && (
      /Win/i.test(navigator.platform) || 
      /Mac/i.test(navigator.platform) ||
      /Windows/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints === 0)
    )
  );
  
  // Use HLS for iOS, Android, and Desktop (for sync), FLV disabled for sync
  // Desktop now uses HLS for perfect sync with mobile devices
  const shouldUseHLS = useRef(isIOS.current || isAndroid.current || isDesktop.current);
  const shouldUseFLV = useRef(false); // Disabled - all devices use HLS for sync
  const isSafariLike = useRef(
    isIOS.current ||
    (/safari/i.test(navigator.userAgent) && !/chrome|chromium|android/i.test(navigator.userAgent))
  );
  const flvPlayerRef = useRef<any>(null); // Store FLV player instance for cleanup/reload
  const hlsPlayerRef = useRef<any>(null); // Store HLS.js player instance for cleanup/reload
  
  // Player State Machine: idle, loading, playing, error, reloading
  type PlayerState = 'idle' | 'loading' | 'playing' | 'error' | 'reloading';
  const playerStateRef = useRef<PlayerState>('idle');
  const playPromiseRef = useRef<Promise<void> | null>(null); // Track current play() promise
  
  // Detect low-end Android device
  const isLowEndAndroid = useRef<boolean>(false);
  useEffect(() => {
    if (isAndroid.current) {
      const hardwareConcurrency = navigator.hardwareConcurrency || 0;
      const deviceMemory = (navigator as any).deviceMemory || 0;
      const screenWidth = window.screen.width;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Low-end criteria:
      // - CPU cores <= 4
      // - Device memory <= 3GB (if available)
      // - Small screen with high DPI (indicates older device)
      isLowEndAndroid.current = 
        hardwareConcurrency <= 4 ||
        (deviceMemory > 0 && deviceMemory <= 3) ||
        (screenWidth < 720 && pixelRatio > 2);
      
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log(`[VideoPlayer] 📱 Android device detected: hardwareConcurrency=${hardwareConcurrency}, deviceMemory=${deviceMemory}, isLowEnd=${isLowEndAndroid.current}`);
      }
    }
  }, []);
  
  // Helper to check if error is "play() interrupted"
  const isInterruptedPlayError = (err: any): boolean => {
    if (!err) return false;
    const msg = String(err.message || err || '');
    return msg.includes('The play() request was interrupted by a new load request') ||
           msg.includes('play() request was interrupted') ||
           msg.includes('AbortError') ||
           (err.name && err.name.includes('Abort'));
  };
  
  // Safe play function that handles interrupted play errors
  const safePlayVideo = useCallback((mutedFallback = false): Promise<void> => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return Promise.reject(new Error('Video element not available'));
    }
    
    // If already loading or reloading, don't start another play
    if (playerStateRef.current === 'loading' || playerStateRef.current === 'reloading') {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log(`[VideoPlayer] ⏸️ [STATE] Ignoring play() request - state is ${playerStateRef.current}`);
      }
      // Return existing promise if available
      if (playPromiseRef.current) {
        return playPromiseRef.current;
      }
      return Promise.resolve();
    }
    
    // If already playing, just return success
    if (playerStateRef.current === 'playing' && !videoElement.paused) {
      return Promise.resolve();
    }
    
    try {
      // Set state to loading before play
      if (playerStateRef.current === 'idle' || playerStateRef.current === 'error') {
        playerStateRef.current = 'loading';
      }
      
      const playPromise = videoElement.play();
      
      if (playPromise && typeof playPromise.then === 'function') {
        playPromiseRef.current = playPromise;
        
        return playPromise
          .then(() => {
            playPromiseRef.current = null;
            playerStateRef.current = 'playing';
            const isDev = import.meta.env.DEV;
            if (isDev) {
              console.log('[VideoPlayer] ✅ [STATE] Playback started successfully');
            }
          })
          .catch((err: any) => {
            playPromiseRef.current = null;
            
            // Swallow interrupted play errors - they're not real errors
            if (isInterruptedPlayError(err)) {
              const isDev = import.meta.env.DEV;
              if (isDev) {
                console.warn('[VideoPlayer] ⚠️ [STATE] play() interrupted by new load - ignoring (this is normal during reload)', err);
              }
              // Don't change state - let the new load handle it
              return;
            }
            
            // Handle autoplay policy errors
            if (!mutedFallback && (err.name === 'NotAllowedError' || err.name === 'NotSupportedError')) {
              const isDev = import.meta.env.DEV;
              if (isDev) {
                console.warn('[VideoPlayer] ⚠️ [STATE] Play blocked, retrying muted');
              }
              videoElement.muted = true;
              setIsMuted(true);
              setShowUnmuteButton(true);
              return safePlayVideo(true);
            }
            
            // Real error - set state to error
            playerStateRef.current = 'error';
            const isDev = import.meta.env.DEV;
            if (isDev) {
              console.error('[VideoPlayer] ❌ [STATE] Play failed:', err);
            }
            throw err;
          });
      } else {
        // Synchronous play (older browsers)
        playerStateRef.current = 'playing';
        return Promise.resolve();
      }
    } catch (err: any) {
      playPromiseRef.current = null;
      playerStateRef.current = 'error';
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.error('[VideoPlayer] ❌ [STATE] Play threw:', err);
      }
      throw err;
    }
  }, []);

  // Reset user start notification on stream reset
  useEffect(() => {
    userStartNotifiedRef.current = false;
  }, [streamResetKey]);

  // CRITICAL: Use native 'timeupdate' event for onVideoTimeUpdate callback
  // This fires automatically when video currentTime changes (not polling)
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !onVideoTimeUpdate) {
      return;
    }

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime;
      if (isFinite(currentTime)) {
        onVideoTimeUpdate(currentTime);
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onVideoTimeUpdate]);

  // CRITICAL: Detect metadata loaded - MUST fire onMetadataLoaded callback
  // Works for both native HLS (iOS Safari) and FLV
  // For live streams, duration might be Infinity - we still fire the callback
  // Reset guard on stream reset to allow callback to fire again for new stream
  const metadataFiredRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Reset guard on stream reset
    metadataFiredRef.current = false;
  }, [streamResetKey]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !onMetadataLoaded) return;

    const handleMetadataLoaded = () => {
      // Only fire once per metadata load cycle
      if (metadataFiredRef.current) return;
      
      console.log('[VideoPlayer] 🔍 loadedmetadata event fired, duration:', videoElement.duration);
      
      // For live streams, duration is often Infinity - still accept it
      // Check if we have any metadata (duration can be Infinity or a number)
      if (videoElement.duration !== undefined && videoElement.duration !== null && !isNaN(videoElement.duration)) {
        metadataFiredRef.current = true;
        console.log('[VideoPlayer] ✅✅✅ Metadata loaded - calling onMetadataLoaded()');
        console.log('[VideoPlayer] ⚠️ This sets metadataLoaded=true in LiveWebinar');
        onMetadataLoaded();
      }
    };

    videoElement.addEventListener('loadedmetadata', handleMetadataLoaded, { once: false });
    videoElement.addEventListener('durationchange', handleMetadataLoaded, { once: false });

    // Check immediately in case already loaded
    if (videoElement.duration !== undefined && videoElement.duration !== null && !isNaN(videoElement.duration)) {
      handleMetadataLoaded();
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
      videoElement.removeEventListener('durationchange', handleMetadataLoaded);
    };
  }, [onMetadataLoaded, streamResetKey]);

  // CRITICAL: Detect actual playback started - MUST fire onPlaybackStarted callback
  // Use 'play' event (fires when playback starts), not 'playing' (fires continuously while playing)
  // Works for both native HLS (iOS Safari) and FLV
  // Does NOT depend on autoplay - fires when user clicks play button
  // Reset guard on stream reset to allow callback to fire again for new stream
  const playbackStartedFiredRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Reset guard on stream reset
    playbackStartedFiredRef.current = false;
  }, [streamResetKey]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !onPlaybackStarted) return;

    const handlePlay = () => {
      // Only fire once per playback start cycle
      if (playbackStartedFiredRef.current) return;
      
      // t4: playing event (actual playback started)
      const t4 = performance.now();
      startupTimingRef.current.t4 = t4;
      const isDev = import.meta.env.DEV;
      if (isDev) {
        const t0 = startupTimingRef.current.t0 || 0;
        const t3 = startupTimingRef.current.t3 || 0;
        const totalTime = t4 - t0;
        console.log(`[VideoPlayer] ⏱️ [STARTUP] t4=${t4.toFixed(2)}ms (t4-t0=${totalTime.toFixed(2)}ms, t4-t3=${(t4 - t3).toFixed(2)}ms) - playing event (playback started)`);
        console.log(`[VideoPlayer] ⏱️ [STARTUP] Summary: Total startup time = ${totalTime.toFixed(2)}ms`);
        if (startupTimingRef.current.t1 && startupTimingRef.current.t2 && startupTimingRef.current.t3) {
          console.log(`[VideoPlayer] ⏱️ [STARTUP] Breakdown: URL set=${((startupTimingRef.current.t1 - t0)).toFixed(2)}ms, metadata=${((startupTimingRef.current.t2 - startupTimingRef.current.t1)).toFixed(2)}ms, canplay=${((startupTimingRef.current.t3 - startupTimingRef.current.t2)).toFixed(2)}ms, playing=${((t4 - startupTimingRef.current.t3)).toFixed(2)}ms`);
        }
      }
      
      console.log('[VideoPlayer] ✅✅✅ Play event fired - playback started');
      console.log('[VideoPlayer] ⚠️ Calling onPlaybackStarted() - this sets playbackStarted=true in LiveWebinar');
      
      playbackStartedFiredRef.current = true;
      
      // Auto-fire onUserStartStream for autoplay scenarios (if not already called)
      if (!userStartNotifiedRef.current && onUserStartStream) {
        console.log('[VideoPlayer] 🚀 Auto-firing onUserStartStream() for autoplay scenario');
        userStartNotifiedRef.current = true;
        onUserStartStream();
      }
      
      onPlaybackStarted();
    };

    videoElement.addEventListener('play', handlePlay, { once: false });

    return () => {
      videoElement.removeEventListener('play', handlePlay);
    };
  }, [onPlaybackStarted, onUserStartStream, streamResetKey]);


  // CRITICAL: Prevent video from restarting after ending
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isStreamEnded && !videoEndedPermanentlyRef.current) {
      console.log('[VideoPlayer] 🛑 Stream ended - preventing restart');
      videoEndedPermanentlyRef.current = true;
      
      // Pause video immediately
      videoElement.pause();
      
      // Seek to end if duration is available
      if (videoElement.duration && isFinite(videoElement.duration)) {
        videoElement.currentTime = videoElement.duration;
      }
      
      // Remove source to prevent any reload attempts
      videoElement.src = '';
      videoElement.removeAttribute('src');
      
      // For FLV player, unload and destroy
      if (flvPlayerRef.current) {
        try {
          flvPlayerRef.current.pause();
          flvPlayerRef.current.unload();
          flvPlayerRef.current.detachMediaElement();
          flvPlayerRef.current.destroy();
          flvPlayerRef.current = null;
        } catch (err) {
          console.error('[VideoPlayer] Error destroying FLV player on end:', err);
        }
      }
      
      // For HLS.js player, destroy
      if (hlsPlayerRef.current) {
        try {
          hlsPlayerRef.current.destroy();
          hlsPlayerRef.current = null;
        } catch (err) {
          console.error('[VideoPlayer] Error destroying hls.js player on end:', err);
        }
      }
    }
  }, [isStreamEnded]);

  // Reset video player when new stream starts (streamResetKey changes)
  // DO NOT destroy HLS unless user reloads the page
  useEffect(() => {
    if (streamResetKey === 0) return; // Skip initial mount
    
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Reset the permanent end flag when a new stream starts
    if (streamResetKey > 0) {
      videoEndedPermanentlyRef.current = false;
    }

    console.log(`[VideoPlayer] 🔄 New stream detected (key: ${streamResetKey}). Resetting player...`);

    if (shouldUseHLS.current) {
      // Stop current playback and set state to idle
      playerStateRef.current = 'reloading';
      if (!videoElement.paused) {
        videoElement.pause();
      }
      
      // DO NOT destroy HLS - just reset state for re-initialization
      playerStateRef.current = 'idle';
      setIosPlayerInitialized(false);
      setShowPlayOverlay(true);
      setIsLoading(false);
      setError('');
      playPromiseRef.current = null;
    }
  }, [streamResetKey]);

  useEffect(() => {
    // HLS Path: iOS and Android - show play button and wait for user (run once on mount)
    if (shouldUseHLS.current) {
      console.log(`[VideoPlayer] ${isIOS.current ? 'iOS' : 'Android'} device detected. Using HLS.`);
      // Don't set showPlayOverlay here - it's already true by default
      return;
    }

    // FLV Path: Windows/Mac Desktop only
    if (shouldUseFLV.current) {
      console.log("[VideoPlayer] Windows/Mac desktop detected. Initializing FLV.js.");
      const videoElement = videoRef.current;
      if (!videoElement || !flvjs.isSupported()) {
        console.error("FLV.js is not supported or video element not found.");
        return;
      }

      // Create or recreate FLV player
      const createFLVPlayer = () => {
        if (flvPlayerRef.current) {
      try {
            flvPlayerRef.current.pause();
            flvPlayerRef.current.unload();
            flvPlayerRef.current.detachMediaElement();
            flvPlayerRef.current.destroy();
          } catch (err) {
            console.error('[FLV] Error destroying previous player:', err);
          }
          flvPlayerRef.current = null;
        }

        try {
          const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: flvStreamUrl,
          isLive: true,
          cors: true,
          enableWorker: false,
          enableStashBuffer: false,
          stashInitialSize: 128,
        });
        
        flvPlayer.attachMediaElement(videoElement);
          flvPlayerRef.current = flvPlayer;
          
        
        // Error handling for FLV player
        flvPlayer.on(flvjs.Events.ERROR, (errorType: string, errorDetail: string, errorInfo: any) => {
          console.error('[FLV] Error:', errorType, errorDetail, errorInfo);
          
          if (errorType === flvjs.ErrorTypes.NETWORK_ERROR) {
            if (errorInfo && errorInfo.code === 404) {
              setError('استریم در حال حاضر در دسترس نیست. لطفاً صبر کنید...');
            } else {
              setError('خطای شبکه در دریافت استریم');
            }
          } else if (errorType === flvjs.ErrorTypes.MEDIA_ERROR) {
            setError('خطا در پخش رسانه');
          } else {
            setError('خطا در برقراری ارتباط با استریم');
          }
        });
        
        flvPlayer.load();
        
          console.log('[VideoPlayer] 💡 FLV player initialized');
        
          // CRITICAL: Do NOT auto-play - wait for user to click play button
          // This ensures userStartedStream gate is properly triggered
          console.log('[VideoPlayer] 📺 FLV player ready - waiting for user to click play button');
      } catch (err) {
        console.error('[FLV] Failed to initialize player:', err);
        setError('خطا در راه‌اندازی پخش‌کننده');
      }
      };

      createFLVPlayer();

      return () => {
        if (flvPlayerRef.current) {
          try {
            flvPlayerRef.current.pause();
            flvPlayerRef.current.unload();
            flvPlayerRef.current.detachMediaElement();
            flvPlayerRef.current.destroy();
          } catch (err) {
            console.error('[FLV] Error during cleanup:', err);
          }
          flvPlayerRef.current = null;
        }
      };
    }
  }, []);

  // Startup timing tracking (for profiling)
  const startupTimingRef = useRef<{
    t0?: number; // Click on play
    t1?: number; // URL set
    t2?: number; // loadedmetadata
    t3?: number; // canplay
    t4?: number; // playing
  }>({});

  const handlePlayAndUnmute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // State machine check: Don't allow play if already loading/reloading
    if (playerStateRef.current === 'loading' || playerStateRef.current === 'reloading') {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log(`[VideoPlayer] ⏸️ [STATE] Play button clicked but state is ${playerStateRef.current} - ignoring (debounced)`);
      }
      return;
    }

    // t0: User clicked play button
    const t0 = performance.now();
    startupTimingRef.current = { t0 };
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.log(`[VideoPlayer] ⏱️ [STARTUP] t0=${t0.toFixed(2)}ms - User clicked play button`);
    }

    if (!userStartNotifiedRef.current && onUserStartStream) {
      console.log('[VideoPlayer] ✅✅✅ USER CLICKED PLAY BUTTON');
      console.log('[VideoPlayer] ⚠️ Calling onUserStartStream()');
      userStartNotifiedRef.current = true;
      onUserStartStream();
    }

    console.log('[VideoPlayer] 🎬 Play button clicked - starting playback');
    setShowPlayOverlay(false);
    setShowUnmuteButton(false);
    videoElement.muted = false;
    setIsMuted(false);

    // HLS setup for iOS and Android - SIMPLIFIED
    if (shouldUseHLS.current && !iosPlayerInitialized) {
      // Set state to loading before init
      playerStateRef.current = 'loading';
      
      const deviceType = isIOS.current ? 'iOS' : isAndroid.current ? 'Android' : 'Desktop';
      console.log(`[VideoPlayer] 🎬 ${deviceType} HLS setup (with Live Edge Locking)`);
      setIsLoading(true);
      setIsStarting(true);
      
      // Use hls.js if supported (for Android, Desktop, and macOS)
      // Only use native HLS on iPhone (not macOS Safari/Chrome)
      if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        // Use hls.js for Android, Desktop, and macOS
        setupHLSjsWithABR(videoElement);
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS only for iPhone (not macOS)
        if (isIOS.current && !isDesktop.current) {
          setupNativeHLS(videoElement);
        } else {
          // macOS Safari/Chrome: Force hls.js or show error
          console.error('[VideoPlayer] ❌ HLS.js not supported and native HLS disabled for macOS. Please use Chrome/Firefox.');
          setError('مرورگر شما از پخش HLS پشتیبانی نمی‌کند. لطفاً از Chrome یا Firefox استفاده کنید.');
        }
      } else {
        // No HLS support at all
        console.error('[VideoPlayer] ❌ No HLS support available');
        setError('مرورگر شما از پخش HLS پشتیبانی نمی‌کند.');
      }
      
      setIosPlayerInitialized(true);
    } else {
      // FLV or already initialized - simple play
      console.log('[VideoPlayer] 🎬 User clicked play - starting FLV playback');
      
      videoElement.play().catch(err => {
        console.error('[VideoPlayer] ❌ FLV Play failed:', err);
        setError(`خطا در پخش: ${err.message || 'خطای ناشناخته'}`);
      });
    }
  };

  // Setup native HLS for iOS (Safari) - SIMPLIFIED: No retry, no complex logic
  // Switch to low-bitrate stream for weak devices
  const switchToLowStream = useCallback((videoElement: ExtendedHTMLVideoElement, isNativeHLS: boolean) => {
    if (playbackHealthRef.current.isUsingLowStream || playbackHealthRef.current.hasEvaluated) {
      console.log('[PlayerHealth] ⚠️ Already using low stream or already evaluated, skipping switch');
      return;
    }

    const currentTime = videoElement?.currentTime ?? 0;
    console.log(`[PlayerHealth] 🔄 Switching to LOW stream (currentTime: ${currentTime.toFixed(2)}s)`);

    // Cleanup current HLS instance if using hls.js
    if (!isNativeHLS && hlsPlayerRef.current) {
      try {
        hlsPlayerRef.current.destroy();
        hlsPlayerRef.current = null;
      } catch (err) {
        console.error('[PlayerHealth] Error destroying hls.js instance:', err);
      }
    }

    // Mark as using low stream
    playbackHealthRef.current.isUsingLowStream = true;
    playbackHealthRef.current.hasEvaluated = true;

    // Reset video element
    videoElement.pause();
    videoElement.src = '';
    videoElement.load();

    // Setup with low stream URL
    if (isNativeHLS) {
      setupNativeHLS(videoElement, true);
    } else {
      setupHLSjsWithABR(videoElement, true);
    }

    // Restore playback position after canplay
    const restorePosition = () => {
      if (videoElement && currentTime > 0) {
        videoElement.currentTime = currentTime;
        console.log(`[PlayerHealth] ✅ Restored playback position to ${currentTime.toFixed(2)}s`);
      }
      videoElement.removeEventListener('canplay', restorePosition);
    };
    videoElement.addEventListener('canplay', restorePosition);
  }, []);

  // Start health monitoring for playback quality - simplified to only track stalled events
  const startHealthMonitoring = useCallback((videoElement: ExtendedHTMLVideoElement, isNativeHLS: boolean) => {
    // Reset health state
    playbackHealthRef.current.totalStalledEvents = 0;
    playbackHealthRef.current.hasEvaluated = false;

    // Track stalled events only
    const onStalled = () => {
      playbackHealthRef.current.totalStalledEvents++;
      console.log(`[PlayerHealth] ⚠️ Stalled event (total: ${playbackHealthRef.current.totalStalledEvents})`);
      
      // Switch to low stream after 3 stalled events
      if (!playbackHealthRef.current.hasEvaluated && 
          !playbackHealthRef.current.isUsingLowStream && 
          playbackHealthRef.current.totalStalledEvents >= 3) {
        console.log(`[PlayerHealth] 🔄 Switching to LOW stream after ${playbackHealthRef.current.totalStalledEvents} stalled events`);
        playbackHealthRef.current.hasEvaluated = true;
        videoElement.removeEventListener('stalled', onStalled);
        switchToLowStream(videoElement, isNativeHLS);
      }
    };

    videoElement.addEventListener('stalled', onStalled);
  }, [switchToLowStream]);

  const setupNativeHLS = (videoElement: ExtendedHTMLVideoElement, useLowStream: boolean = false) => {
    const streamUrl = useLowStream ? hlsLowStreamUrl : hlsStreamUrl;
    const streamType = useLowStream ? 'LOW' : 'PRIMARY';
    console.log(`[VideoPlayer] 🎬 [Native HLS] SIMPLIFIED INIT - Starting simple native HLS setup (${streamType})`);
    
    const hlsUrlWithCacheBuster = streamUrl + (streamResetKey > 0 ? cacheBusterRef.current : '');
    console.log(`[VideoPlayer] 🎬 [Native HLS] URL: ${hlsUrlWithCacheBuster}`);
    
    // Set video attributes
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('playsinline', 'true');
    videoElement.controls = false;
    videoElement.removeAttribute('controls');
    videoElement.setAttribute('controlsList', 'nodownload nofullscreen noplaybackrate');
    videoElement.setAttribute('disablePictureInPicture', 'true');
    videoElement.style.pointerEvents = 'none';
    
    // CRITICAL LOGGING: Track all video events
    const onLoadedMetadata = () => {
      console.log('[VideoPlayer] ✅ [VIDEO] loadedmetadata event fired');
    };
    
    const onCanPlay = () => {
      console.log('[VideoPlayer] ✅ [VIDEO] canplay event fired');
      setIsStarting(false);
        setIsLoading(false);
      // ONLY play on canplay - nothing else
      videoElement.play().catch(err => {
        console.error('[VideoPlayer] ❌ [VIDEO] play() failed:', err);
      });
      };
      
    const onPlaying = () => {
      console.log('[VideoPlayer] ✅ [VIDEO] playing event fired - Video is actually playing');
      playerStateRef.current = 'playing';
      
      // Start health monitoring only for primary stream and Android devices
      if (!useLowStream && isAndroid.current && !playbackHealthRef.current.hasEvaluated) {
        startHealthMonitoring(videoElement, true);
      }
      };
      
    const onStalled = () => {
      console.log('[VideoPlayer] ⚠️ [VIDEO] stalled event fired');
      };
      
    const onWaiting = () => {
      console.log('[VideoPlayer] ⚠️ [VIDEO] waiting event fired');
    };
    
    const onError = (e: Event) => {
      const videoEl = e.target as HTMLVideoElement;
      if (videoEl.error) {
        console.error(`[VideoPlayer] ❌ [VIDEO] error event - code=${videoEl.error.code}, message=${videoEl.error.message}`);
      }
    };
    
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.addEventListener('canplay', onCanPlay);
    videoElement.addEventListener('playing', onPlaying);
    videoElement.addEventListener('stalled', onStalled);
    videoElement.addEventListener('waiting', onWaiting);
      videoElement.addEventListener('error', onError);
      
    // Set HLS source
    playerStateRef.current = 'loading';
    videoElement.src = hlsUrlWithCacheBuster;
    videoElement.load();
    
    // NO attemptPlay() - only play on canplay
    // NO retry logic
    // NO setTimeout play
  };

  // Setup hls.js - SIMPLIFIED: No ABR, no level manipulation, just simple playback
  const setupHLSjsWithABR = (videoElement: ExtendedHTMLVideoElement, useLowStream: boolean = false) => {
    const streamUrl = useLowStream ? hlsLowStreamUrl : hlsStreamUrl;
    const streamType = useLowStream ? 'LOW' : 'PRIMARY';
    console.log(`[VideoPlayer] 🎬 [HLS.js] SIMPLIFIED INIT - Starting simple HLS setup (${streamType})`);
    
    // Cleanup previous hls.js instance if exists
    if (hlsPlayerRef.current) {
      try {
        hlsPlayerRef.current.destroy();
      } catch (err) {
        console.error('[VideoPlayer] Error destroying previous hls.js instance:', err);
      }
      hlsPlayerRef.current = null;
    }
    
    const hlsUrlWithCacheBuster = streamUrl + (streamResetKey > 0 ? cacheBusterRef.current : '');
    console.log(`[VideoPlayer] 🎬 [HLS.js] URL: ${hlsUrlWithCacheBuster}`);
          
    // Minimal and safe HLS.js configuration
    const hlsConfig: any = {
      enableWorker: true,
      autoStartLoad: true,
    };
    
    const hls = new Hls(hlsConfig);
    hlsPlayerRef.current = hls;
    
    // CRITICAL LOGGING: Track all events to diagnose freeze
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('[VideoPlayer] ✅ [HLS.js] MEDIA_ATTACHED - Video element attached');
    });
    
    hls.on(Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
      console.log(`[VideoPlayer] ✅ [HLS.js] MANIFEST_PARSED - Levels: ${data.levels?.length || 0}`);
      if (data.levels && data.levels.length > 0) {
        data.levels.forEach((level: any, index: number) => {
          console.log(`[VideoPlayer] 📊 [HLS.js] Level ${index}: ${level.height}p, bitrate=${level.bitrate}`);
        });
      }
    });
    
    hls.on(Hls.Events.FRAG_LOADED, (event: any, data: any) => {
      console.log(`[VideoPlayer] ✅ [HLS.js] FRAG_LOADED - Fragment loaded: level=${data.frag.level}, sn=${data.frag.sn}`);
    });
    
    // Startup Buffer Stabilization: Prevent race conditions on initial load
    let hasStarted = false;
    hls.on(Hls.Events.BUFFER_APPENDED, () => {
      if (!hasStarted && videoElement.readyState >= 3) {
        hasStarted = true;
        if (videoElement.paused) {
          videoElement.play().catch(err => {
            console.error('[VideoPlayer] ❌ [VIDEO] play() failed in BUFFER_APPENDED:', err);
          });
        }
      }
    });
    
    // Single recovery mechanism: on 'stalled' event, call hls.startLoad()
    const handleStalledRecovery = () => {
      if (recoveryLockRef.current || !hls) return;
      
      recoveryLockRef.current = true;
      console.log('[VideoPlayer] 🔄 [HLS.js] Stalled - calling hls.startLoad()');
      
      try {
        hls.startLoad();
      } catch (err) {
        console.error('[VideoPlayer] ❌ [HLS.js] Error in startLoad():', err);
      }
      
      // Release lock after 2 seconds to allow retry if needed
      setTimeout(() => {
        recoveryLockRef.current = false;
      }, 2000);
    };
    
    videoElement.addEventListener('stalled', handleStalledRecovery);
    
    hls.on(Hls.Events.ERROR, (event: any, data: any) => {
      console.error(`[VideoPlayer] ❌ [HLS.js] ERROR - type=${data.type}, details=${data.details}, fatal=${data.fatal}`);
      if (data.frag) {
        console.error(`[VideoPlayer] ❌ [HLS.js] Fragment: level=${data.frag.level}, url=${data.frag.url}`);
      }
    });
      
    // Attach to video element
    playerStateRef.current = 'loading';
    hls.loadSource(hlsUrlWithCacheBuster);
    hls.attachMedia(videoElement);
      
    // Set video attributes
      videoElement.setAttribute('playsinline', 'true');
      videoElement.controls = false;
      videoElement.removeAttribute('controls');
      videoElement.setAttribute('controlsList', 'nodownload nofullscreen noplaybackrate');
      videoElement.setAttribute('disablePictureInPicture', 'true');
      videoElement.style.pointerEvents = 'none';
      
    // CRITICAL LOGGING: Track video events
    const onCanPlay = () => {
      console.log('[VideoPlayer] ✅ [VIDEO] canplay event fired');
      setIsStarting(false);
      setIsLoading(false);
      // ONLY play on canplay - nothing else
      videoElement.play().catch(err => {
        console.error('[VideoPlayer] ❌ [VIDEO] play() failed:', err);
      });
    };
    
    const onPlaying = () => {
      console.log('[VideoPlayer] ✅ [VIDEO] playing event fired - Video is actually playing');
      playerStateRef.current = 'playing';
      
      // Start health monitoring only for primary stream and Android devices
      if (!useLowStream && isAndroid.current && !playbackHealthRef.current.hasEvaluated) {
        startHealthMonitoring(videoElement, false);
      }
    };
    
    const onStalled = () => {
      console.log('[VideoPlayer] ⚠️ [VIDEO] stalled event fired');
    };
    
    const onWaiting = () => {
      console.log('[VideoPlayer] ⚠️ [VIDEO] waiting event fired');
    };
    
    const onError = (e: Event) => {
      const videoEl = e.target as HTMLVideoElement;
      if (videoEl.error) {
        console.error(`[VideoPlayer] ❌ [VIDEO] error event - code=${videoEl.error.code}, message=${videoEl.error.message}`);
        }
    };
    
    videoElement.addEventListener('canplay', onCanPlay);
    videoElement.addEventListener('playing', onPlaying);
    videoElement.addEventListener('waiting', onWaiting);
    videoElement.addEventListener('error', onError);
  };
  
  // Handle fullscreen (disabled for iOS, enabled for Android and Desktop)
  const enterFullscreen = async () => {
    try {
      // ❌ iOS: Fullscreen disabled - no fullscreen functionality
      if (isIOS.current) {
        console.log('[Fullscreen] Fullscreen disabled on iOS');
        return;
      }
      
      const element = containerRef.current;
      const video = videoRef.current;
      
      if (!element || !video) return;
      
      console.log('[Fullscreen] Entering fullscreen mode');
      
      // ✅ Android/Desktop Fullscreen using Fullscreen API (container-based)
      // This method doesn't trigger native video controls
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        // Safari Android/Desktop
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      
      // Lock orientation to landscape on Android
      if (isAndroid.current && screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
          console.log('[Fullscreen] Locked to landscape');
        } catch (err) {
          console.log('[Fullscreen] Could not lock orientation:', err);
        }
      }
      
      setIsFullscreen(true);
    } catch (err) {
      console.error('[Fullscreen] Error entering fullscreen:', err);
    }
  };
  
  const exitFullscreen = async () => {
    try {
      console.log('[Fullscreen] Exiting fullscreen mode');
      
      // Standard Fullscreen API for all platforms
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      
      // Unlock orientation on Android
      if (isAndroid.current && screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
          console.log('[Fullscreen] Unlocked orientation');
        } catch (err) {
          console.log('[Fullscreen] Could not unlock orientation:', err);
        }
      }
      
      setIsFullscreen(false);
    } catch (err) {
      console.error('[Fullscreen] Error exiting fullscreen:', err);
    }
  };
  
  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };
  
  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).webkitCurrentFullScreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      console.log('[Fullscreen] State changed:', isCurrentlyFullscreen);
      setIsFullscreen(isCurrentlyFullscreen);
    };
    
    // Add listeners for all browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Listen for fullscreen changes on all platforms (using document events, not video events)
    // This ensures we catch fullscreen changes from our custom fullscreen button
    // We don't listen to video fullscreen events to avoid native controls
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    
    const hideControlsTimer = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };
    
    const showControlsTemp = () => {
      setShowControls(true);
      hideControlsTimer();
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', showControlsTemp);
      container.addEventListener('touchstart', showControlsTemp);
      container.addEventListener('click', showControlsTemp);
    }
    
    hideControlsTimer();
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (container) {
        container.removeEventListener('mousemove', showControlsTemp);
        container.removeEventListener('touchstart', showControlsTemp);
        container.removeEventListener('click', showControlsTemp);
      }
    };
  }, [isFullscreen]);
  
  // Runtime issue tracking and logging
  const runtimeIssueRef = useRef<{
    stalledCount: number;
    waitingCount: number;
    pauseCount: number;
    lastStalled: number;
    lastWaiting: number;
    lastPause: number;
    bufferHistory: Array<{ time: number; buffered: number }>;
  }>({
    stalledCount: 0,
    waitingCount: 0,
    pauseCount: 0,
    lastStalled: 0,
    lastWaiting: 0,
    lastPause: 0,
    bufferHistory: [],
  });

  // Helper to get buffer info
  const getBufferInfo = (videoEl: HTMLVideoElement) => {
    const buffered = videoEl.buffered;
    if (buffered.length === 0) return { bufferedEnd: 0, bufferedAhead: 0 };
    
    const currentTime = videoEl.currentTime;
    let bufferedEnd = 0;
    let bufferedAhead = 0;
    
    for (let i = 0; i < buffered.length; i++) {
      if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
        bufferedEnd = buffered.end(i);
        bufferedAhead = bufferedEnd - currentTime;
        break;
      }
    }
    
    return { bufferedEnd, bufferedAhead };
  };

  // Handle stalled/waiting events for recovery with detailed logging
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleStalled = () => {
      const now = Date.now();
      runtimeIssueRef.current.stalledCount++;
      runtimeIssueRef.current.lastStalled = now;
      
      const bufferInfo = getBufferInfo(videoElement);
      const isDev = import.meta.env.DEV;
      
      if (isDev) {
        console.log(`[VideoPlayer] ⚠️ [RUNTIME] Video stalled - buffering. Count: ${runtimeIssueRef.current.stalledCount}`);
        console.log(`[VideoPlayer] ⚠️ [RUNTIME] Buffer info: bufferedEnd=${bufferInfo.bufferedEnd.toFixed(2)}s, bufferedAhead=${bufferInfo.bufferedAhead.toFixed(2)}s, currentTime=${videoElement.currentTime.toFixed(2)}s`);
        console.log(`[VideoPlayer] ⚠️ [RUNTIME] Device: ${isIOS.current ? 'iOS' : isAndroid.current ? 'Android' : 'Desktop'}, Protocol: ${shouldUseHLS.current ? 'HLS' : 'FLV'}, UserAgent: ${navigator.userAgent}`);
      }
      
      // Track buffer history
      runtimeIssueRef.current.bufferHistory.push({
        time: now,
        buffered: bufferInfo.bufferedAhead,
      });
      // Keep only last 10 entries
      if (runtimeIssueRef.current.bufferHistory.length > 10) {
        runtimeIssueRef.current.bufferHistory.shift();
      }
      
      // SIMPLIFIED: Just log stalled state, no recovery
      // Recovery removed for stability - only logging to diagnose freeze
      console.log(`[VideoPlayer] ⚠️ [RUNTIME] Video stalled - readyState=${videoElement.readyState}, paused=${videoElement.paused}, currentTime=${videoElement.currentTime.toFixed(2)}s`);
    };

    const handleWaiting = () => {
      const now = Date.now();
      runtimeIssueRef.current.waitingCount++;
      runtimeIssueRef.current.lastWaiting = now;
      
      const bufferInfo = getBufferInfo(videoElement);
      const isDev = import.meta.env.DEV;
      
      if (isDev) {
        console.log(`[VideoPlayer] ⏳ [RUNTIME] Video waiting for data. Count: ${runtimeIssueRef.current.waitingCount}`);
        console.log(`[VideoPlayer] ⏳ [RUNTIME] Buffer info: bufferedEnd=${bufferInfo.bufferedEnd.toFixed(2)}s, bufferedAhead=${bufferInfo.bufferedAhead.toFixed(2)}s, currentTime=${videoElement.currentTime.toFixed(2)}s`);
      }
      
      // Track buffer history
      runtimeIssueRef.current.bufferHistory.push({
        time: now,
        buffered: bufferInfo.bufferedAhead,
      });
      if (runtimeIssueRef.current.bufferHistory.length > 10) {
        runtimeIssueRef.current.bufferHistory.shift();
      }
      
      // Similar recovery logic as stalled
      handleStalled();
    };

    const handlePause = () => {
      const now = Date.now();
      // Only log if pause was not user-initiated (check if paused state changed unexpectedly)
      if (!videoElement.paused) return; // If not paused, ignore
      
      runtimeIssueRef.current.pauseCount++;
      runtimeIssueRef.current.lastPause = now;
      
      const bufferInfo = getBufferInfo(videoElement);
      const isDev = import.meta.env.DEV;
      
      if (isDev) {
        console.log(`[VideoPlayer] ⏸️ [RUNTIME] Video paused unexpectedly. Count: ${runtimeIssueRef.current.pauseCount}`);
        console.log(`[VideoPlayer] ⏸️ [RUNTIME] Buffer info: bufferedEnd=${bufferInfo.bufferedEnd.toFixed(2)}s, bufferedAhead=${bufferInfo.bufferedAhead.toFixed(2)}s, currentTime=${videoElement.currentTime.toFixed(2)}s`);
        console.log(`[VideoPlayer] ⏸️ [RUNTIME] Device: ${isIOS.current ? 'iOS' : isAndroid.current ? 'Android' : 'Desktop'}, Protocol: ${shouldUseHLS.current ? 'HLS' : 'FLV'}`);
      }
    };

    const handleError = (e: Event) => {
      const videoEl = e.target as HTMLVideoElement;
      if (videoEl.error) {
        const errorCode = videoEl.error.code;
        const errorMessage = videoEl.error.message;
        const bufferInfo = getBufferInfo(videoEl);
        const isDev = import.meta.env.DEV;
        
        if (isDev) {
          console.error(`[VideoPlayer] ❌ [RUNTIME] Video error: code=${errorCode}, message=${errorMessage}`);
          console.error(`[VideoPlayer] ❌ [RUNTIME] Device: ${isIOS.current ? 'iOS' : isAndroid.current ? 'Android' : 'Desktop'}, Protocol: ${shouldUseHLS.current ? 'HLS' : 'FLV'}`);
          console.error(`[VideoPlayer] ❌ [RUNTIME] Buffer info: bufferedEnd=${bufferInfo.bufferedEnd.toFixed(2)}s, bufferedAhead=${bufferInfo.bufferedAhead.toFixed(2)}s, currentTime=${videoEl.currentTime.toFixed(2)}s`);
          console.error(`[VideoPlayer] ❌ [RUNTIME] readyState=${videoEl.readyState}, networkState=${videoEl.networkState}`);
        }
      }
    };

    const handleEnded = () => {
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log(`[VideoPlayer] ⏹️ [RUNTIME] Video ended. Device: ${isIOS.current ? 'iOS' : isAndroid.current ? 'Android' : 'Desktop'}, Protocol: ${shouldUseHLS.current ? 'HLS' : 'FLV'}`);
      }
    };

    videoElement.addEventListener('stalled', handleStalled);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('stalled', handleStalled);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Startup timeout: if canplay doesn't fire within 10 seconds, retry
  useEffect(() => {
    if (!isStarting) return;

    startupTimeoutRef.current = setTimeout(() => {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      // Check if we're still in starting state and no canplay yet
      if (videoElement.readyState < 2) { // Less than HAVE_CURRENT_DATA
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.log('[VideoPlayer] ⏱️ Startup timeout - attempting light retry');
        }
        
        // Light retry: reload source
        const currentSrc = videoElement.src;
        if (currentSrc) {
          videoElement.src = '';
          videoElement.removeAttribute('src');
          setTimeout(() => {
            videoElement.src = currentSrc;
            videoElement.load();
          }, 500);
        }
      }
    }, 10000); // 10 seconds timeout

    return () => {
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
        startupTimeoutRef.current = null;
      }
    };
  }, [isStarting]);
  
  // Cleanup on unmount (only when user reloads page)
  useEffect(() => {
    return () => {
      // Destroy HLS only on page reload/unmount
      if (hlsPlayerRef.current) {
        try {
          hlsPlayerRef.current.destroy();
          hlsPlayerRef.current = null;
          console.log('[VideoPlayer] 🧹 Cleaned up HLS.js on unmount');
        } catch (err) {
          console.error('[VideoPlayer] Error destroying HLS.js on unmount:', err);
        }
      }
    };
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (startupTimeoutRef.current) {
        clearTimeout(startupTimeoutRef.current);
      }
    };
  }, []);

  // Handle page visibility changes (user leaves/returns to page)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Mark that user left the page
        userLeftPageRef.current = true;
      } else {
        // User came back → show overlay if they had left
        if (userLeftPageRef.current) {
          setShowResumeOverlay(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black overflow-hidden shadow-2xl w-full h-full group transition-all duration-300 flex items-center justify-center ${
        isFullscreen 
          ? 'fixed inset-0 z-[9999] rounded-none' 
          : 'rounded-xl sm:rounded-2xl'
      }`}
    >
      {/* Stream Ended Screen - Black screen with message */}
      {isStreamEnded ? (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center px-4 sm:px-6" dir="rtl">
          <div className="fp-spine w-full max-w-2xl bg-white/[0.03] px-6 py-8 text-center sm:px-10 sm:py-10">
            <div
              className="mx-auto mb-6 sm:mb-8 flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              استریم تموم شد
            </h2>
            <p className="text-gray-300 text-lg sm:text-xl md:text-2xl leading-relaxed mb-2 sm:mb-3">
              مرسی از حضور گرمتون توی کارگاه
            </p>
            <p className="text-gray-400 text-base sm:text-lg md:text-xl">
              کارگاه به پایان رسیده است
            </p>
          </div>
        </div>
      ) : (
        <>
          <video
        ref={videoRef}
        id="live-video"
        playsInline
        muted={isMuted}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate nofullscreen"
        preload="metadata" // Load metadata only, not full video (faster initial load)
        className="max-w-full max-h-full w-auto h-auto transition-all duration-300 pointer-events-none object-contain"
        webkit-playsinline="true"
        style={{
          pointerEvents: 'none', // Prevent any touch interactions that might show native controls
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'none',
          opacity: 1,
          transition: 'opacity 0.2s',
          objectFit: 'contain',
          margin: '0 auto'
        }}
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu
      />

      {/* Loading Spinner - Show when loading or starting */}
      {(isLoading || isStarting) && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="w-16 h-16 border-4 border-[#2a9c96]/30 border-t-[#26fce3] rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-bold">در حال بارگذاری...</p>
          <p className="text-gray-300 text-sm mt-2">لطفاً چند لحظه صبر کنید</p>
        </div>
      )}

      {/* Error Display */}
      {error && !isLoading && (
        <div className="absolute inset-0 z-26 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 pointer-events-auto">
          <div className="bg-red-600/90 backdrop-blur-md text-white px-6 py-4 rounded-xl max-w-md text-center">
            <p className="font-bold mb-2 text-lg">⚠️ خطا در پخش</p>
            <p className="text-sm mb-4">{error}</p>
            <button 
              onClick={() => {
                setError('');
                window.location.reload();
              }}
              className="bg-white text-red-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      )}

      {/* Play/Unmute Overlay - Full clickable area */}
      {(showPlayOverlay || showUnmuteButton) && !isLoading && !error && (
        <div 
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer pointer-events-auto" 
          onClick={handlePlayAndUnmute}
          style={{ pointerEvents: 'auto', zIndex: 100 }}
        >
          <button 
            className="bg-gradient-to-r from-[#187272] to-[#26fce3] text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-3 pointer-events-auto relative z-[101]"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayAndUnmute();
            }}
            style={{ pointerEvents: 'auto', zIndex: 101 }}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
            <span>{showPlayOverlay ? "شروع پخش زنده" : "برای شنیدن صدا کلیک کنید"}</span>
          </button>
        </div>
      )}

      {/* Resume Playback Overlay - Shows when user returns to page after leaving */}
      {showResumeOverlay && !isLoading && !error && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer pointer-events-auto"
            onClick={() => {
              setShowResumeOverlay(false);
              window.location.reload();
            }}
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowResumeOverlay(false);
              window.location.reload();
            }}
            className="bg-gradient-to-r from-[#187272] to-[#26fce3] text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg hover:scale-105 transition-all duration-200 pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
          >
            ادامه پخش زنده
          </button>
        </div>
      )}

      {/* Fullscreen Controls - Always visible on top */}
      <div 
        className={`absolute top-0 left-0 right-0 z-40 transition-all duration-300 ${
          showControls || !isFullscreen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6">
          <div className="flex items-center justify-between">
            {/* Fullscreen Button - فقط Android و Desktop (نه iOS) */}
            {!isIOS.current && (
              <button
                onClick={toggleFullscreen}
                className={`bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg group/btn ${
                  isAndroid.current ? 'p-1.5 sm:p-2' : 'p-2.5 sm:p-3'
                }`}
                title={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
              >
                {isFullscreen ? (
                  // Exit Fullscreen Icon
                  <svg 
                    className={isAndroid.current ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5 sm:w-6 sm:h-6"} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" 
                    />
                  </svg>
                ) : (
                  // Enter Fullscreen Icon
                  <svg 
                    className={isAndroid.current ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5 sm:w-6 sm:h-6"} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" 
                    />
                  </svg>
                )}
              </button>
            )}
            {/* Empty div for spacing on the right */}
            <div></div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
