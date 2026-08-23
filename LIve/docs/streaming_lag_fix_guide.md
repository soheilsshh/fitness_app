# راهنمای رفع مشکل لگ و پرش استریم

## 📋 خلاصه مشکل

بر روی برخی دیوایس‌ها استریم لگ می‌گیرد، می‌پرد و دوباره خوب می‌شود. این مشکل معمولاً به دلایل زیر رخ می‌دهد:

1. **مشکلات Buffer Management** در پلیر
2. **Network Jitter** و نوسانات سرعت اینترنت
3. **Segment Loading Delays** در HLS
4. **FFmpeg Encoding Issues** در بک‌اند
5. **Device Performance** محدودیت‌های سخت‌افزاری

---

## 🔍 تشخیص مشکل

### علائم مشکل:
- استریم گاهی لگ می‌گیرد و می‌پرد
- بعد از چند ثانیه دوباره خوب می‌شود
- این مشکل به صورت متناوب تکرار می‌شود
- بیشتر روی موبایل‌های ضعیف یا در شبکه‌های کند رخ می‌دهد

### لاگ‌های مهم برای بررسی:
```javascript
// در Console مرورگر:
[VideoPlayer] ⚠️ [RUNTIME] Video stalled
[VideoPlayer] ⏳ [RUNTIME] Video waiting for data
[VideoPlayer] ⚠️ [HLS.js] ERROR
```

---

## 🛠️ راه‌حل‌های پیشنهادی

### 1. بهبود تنظیمات HLS.js در Frontend

**مشکل فعلی**: تنظیمات HLS.js خیلی ساده است و buffer management ندارد.

**راه‌حل**: اضافه کردن تنظیمات پیشرفته برای buffer management.

**فایل**: `src/components/VideoPlayer.tsx`

```typescript
// در تابع setupHLSjsWithABR، تغییر hlsConfig به:
const hlsConfig: any = {
  enableWorker: true,
  autoStartLoad: true,
  
  // CRITICAL: Buffer Management Settings
  maxBufferLength: 30,           // حداکثر طول buffer (ثانیه) - کاهش از پیش‌فرض 30s
  maxMaxBufferLength: 60,        // حداکثر مطلق buffer (ثانیه)
  maxBufferSize: 60 * 1000 * 1000, // حداکثر حجم buffer (60MB)
  maxBufferHole: 0.5,            // حداکثر gap مجاز در buffer (0.5s)
  
  // CRITICAL: Low Latency Settings
  liveSyncDurationCount: 3,      // تعداد segments برای live sync (کاهش از پیش‌فرض)
  liveMaxLatencyDurationCount: 5, // حداکثر latency (segments)
  liveDurationInfinity: false,    // غیرفعال کردن infinite duration
  
  // CRITICAL: Network Settings
  maxLoadingDelay: 4,            // حداکثر تاخیر در loading (ثانیه)
  maxBufferHole: 0.5,            // حداکثر gap در buffer
  highBufferWatchdogPeriod: 2,   // دوره بررسی buffer بالا (ثانیه)
  
  // CRITICAL: Fragment Loading Settings
  fragLoadingTimeOut: 20000,     // Timeout برای loading fragment (20s)
  manifestLoadingTimeOut: 10000, // Timeout برای loading manifest (10s)
  levelLoadingTimeOut: 10000,    // Timeout برای loading level (10s)
  
  // CRITICAL: Retry Settings
  fragLoadingMaxRetry: 4,        // حداکثر تلاش برای loading fragment
  manifestLoadingMaxRetry: 4,    // حداکثر تلاش برای loading manifest
  levelLoadingMaxRetry: 4,       // حداکثر تلاش برای loading level
  fragLoadingRetryDelay: 1000,   // تاخیر بین retry ها (1s)
  
  // CRITICAL: ABR Settings (Adaptive Bitrate)
  abrEwmaDefaultEstimate: 500000, // تخمین اولیه bitrate (500kbps)
  abrBandWidthFactor: 0.95,       // فاکتور bandwidth برای ABR
  abrBandWidthUpFactor: 0.7,      // فاکتور برای افزایش quality
  abrMaxWithRealBitrate: false,   // استفاده از real bitrate
  
  // CRITICAL: Buffer Management
  startFragPrefetch: true,        // Prefetch اولین fragment
  testBandwidth: true,            // تست bandwidth
  progressive: false,              // غیرفعال کردن progressive download
  lowLatencyMode: true,           // فعال کردن low latency mode
};
```

### 2. بهبود Error Recovery در HLS.js

**مشکل فعلی**: وقتی خطا رخ می‌دهد، پلیر recovery نمی‌کند.

**راه‌حل**: اضافه کردن error recovery logic.

```typescript
// در تابع setupHLSjsWithABR، بعد از hls.on(Hls.Events.ERROR, ...):
hls.on(Hls.Events.ERROR, (event: any, data: any) => {
  console.error(`[VideoPlayer] ❌ [HLS.js] ERROR - type=${data.type}, details=${data.details}, fatal=${data.fatal}`);
  
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        console.log('[VideoPlayer] 🔄 [HLS.js] Network error - attempting recovery');
        // Retry loading
        hls.startLoad();
        break;
        
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.log('[VideoPlayer] 🔄 [HLS.js] Media error - attempting recovery');
        // Recover media error
        hls.recoverMediaError();
        break;
        
      default:
        console.log('[VideoPlayer] 🔄 [HLS.js] Fatal error - destroying and recreating');
        // Destroy and recreate
        hls.destroy();
        setTimeout(() => {
          setupHLSjsWithABR(videoElement, useLowStream);
        }, 1000);
        break;
    }
  }
});
```

### 3. بهبود Buffer Monitoring

**مشکل فعلی**: هیچ monitoring برای buffer health وجود ندارد.

**راه‌حل**: اضافه کردن buffer monitoring و auto-recovery.

```typescript
// اضافه کردن buffer monitoring interval
useEffect(() => {
  const videoElement = videoRef.current;
  if (!videoElement || !hlsPlayerRef.current) return;
  
  const bufferMonitorInterval = setInterval(() => {
    if (!videoElement || videoElement.paused) return;
    
    const buffered = videoElement.buffered;
    const currentTime = videoElement.currentTime;
    
    if (buffered.length > 0) {
      let bufferedAhead = 0;
      for (let i = 0; i < buffered.length; i++) {
        if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
          bufferedAhead = buffered.end(i) - currentTime;
          break;
        }
      }
      
      // CRITICAL: اگر buffer خیلی کم است (< 2s)، اقدام به recovery
      if (bufferedAhead < 2 && videoElement.readyState >= 3) {
        console.log(`[BufferMonitor] ⚠️ Low buffer: ${bufferedAhead.toFixed(2)}s - attempting recovery`);
        
        // اگر HLS.js در دسترس است، startLoad را صدا بزن
        if (hlsPlayerRef.current && hlsPlayerRef.current.startLoad) {
          hlsPlayerRef.current.startLoad();
        }
      }
      
      // CRITICAL: اگر buffer خیلی زیاد است (> 30s)، seek به live edge
      if (bufferedAhead > 30 && hlsPlayerRef.current) {
        const hls = hlsPlayerRef.current;
        if (hls.liveSyncPosition !== null && !isNaN(hls.liveSyncPosition)) {
          const drift = hls.liveSyncPosition - currentTime;
          if (drift > 5) {
            console.log(`[BufferMonitor] ⚡ High buffer: ${bufferedAhead.toFixed(2)}s, drift: ${drift.toFixed(2)}s - seeking to live edge`);
            videoElement.currentTime = hls.liveSyncPosition;
          }
        }
      }
    }
  }, 2000); // بررسی هر 2 ثانیه
  
  return () => {
    clearInterval(bufferMonitorInterval);
  };
}, [hlsPlayerRef.current]);
```

### 4. بهبود تنظیمات FFmpeg در Backend

**مشکل فعلی**: تنظیمات encoding ممکن است بهینه نباشند.

**راه‌حل**: بهبود تنظیمات FFmpeg برای stability بیشتر.

**فایل**: `backend/streaming/server.go`

```go
// در تابع DefaultHLSEncodingConfig، تغییر تنظیمات:
func DefaultHLSEncodingConfig() HLSEncodingConfig {
	return HLSEncodingConfig{
		// ... existing config ...
		
		// CRITICAL: بهبود تنظیمات برای stability
		VideoBitrate: "1200k",     // کاهش از 1500k برای stability بیشتر
		VideoMaxrate: "1500k",     // کاهش از 1800k
		VideoBufsize: "2400k",     // کاهش از 3000k (2x bitrate)
		VideoPreset:  "ultrafast", // نگه داشتن ultrafast برای low latency
		
		// CRITICAL: بهبود HLS settings
		HLSTime:     2,            // نگه داشتن 2s برای low latency
		HLSListSize: 12,           // کاهش از 15 به 12 برای buffer کمتر
		HLSFlags:    "delete_segments+independent_segments+program_date_time", // اضافه کردن program_date_time
	}
}
```

### 5. بهبود Network Error Handling

**مشکل فعلی**: وقتی network error رخ می‌دهد، recovery کند است.

**راه‌حل**: اضافه کردن smart retry logic.

```typescript
// اضافه کردن network error handler
const networkErrorHandler = useCallback(() => {
  const videoElement = videoRef.current;
  if (!videoElement) return;
  
  let retryCount = 0;
  const maxRetries = 3;
  
  const retryLoad = () => {
    if (retryCount >= maxRetries) {
      console.error('[NetworkError] ❌ Max retries reached');
      setError('خطا در اتصال به استریم. لطفاً صفحه را رفرش کنید.');
      return;
    }
    
    retryCount++;
    console.log(`[NetworkError] 🔄 Retry ${retryCount}/${maxRetries}`);
    
    // اگر HLS.js در دسترس است
    if (hlsPlayerRef.current) {
      const hls = hlsPlayerRef.current;
      hls.startLoad();
    } else if (videoElement.src) {
      // برای native HLS
      videoElement.load();
    }
  };
  
  // Listen for network errors
  videoElement.addEventListener('error', (e) => {
    const videoEl = e.target as HTMLVideoElement;
    if (videoEl.error && videoEl.error.code === MediaError.MEDIA_ERR_NETWORK) {
      console.error('[NetworkError] ❌ Network error detected');
      setTimeout(retryLoad, 2000 * retryCount); // Exponential backoff
    }
  });
  
  return () => {
    videoElement.removeEventListener('error', retryLoad as any);
  };
}, []);
```

### 6. بهبود Segment Loading Strategy

**مشکل فعلی**: Segments ممکن است با تاخیر load شوند.

**راه‌حل**: اضافه کردن prefetch و parallel loading.

```typescript
// در HLS.js config:
const hlsConfig: any = {
  // ... existing config ...
  
  // CRITICAL: Segment Loading Strategy
  startLevel: -1,                 // Auto-select best level
  capLevelToPlayerSize: true,     // Cap level to player size
  startFragPrefetch: true,        // Prefetch first fragment
  testBandwidth: true,            // Test bandwidth before selecting level
  
  // CRITICAL: Parallel Loading
  maxMaxBufferLength: 60,         // Allow larger buffer for stability
  backBufferLength: 30,          // Keep 30s of back buffer
};
```

### 7. اضافه کردن Adaptive Quality Switching

**مشکل فعلی**: پلیر نمی‌تواند به صورت خودکار quality را تغییر دهد.

**راه‌حل**: اضافه کردن logic برای switch کردن به low stream در صورت مشکل.

```typescript
// بهبود تابع switchToLowStream
const switchToLowStream = useCallback((videoElement: ExtendedHTMLVideoElement, isNativeHLS: boolean, reason: string) => {
  if (playbackHealthRef.current.isUsingLowStream) {
    console.log('[PlayerHealth] ⚠️ Already using low stream');
    return;
  }
  
  console.log(`[PlayerHealth] 🔄 Switching to LOW stream - Reason: ${reason}`);
  
  // ... existing switch logic ...
  
  // Mark as using low stream
  playbackHealthRef.current.isUsingLowStream = true;
  playbackHealthRef.current.hasEvaluated = true;
  
  // Show notification to user (optional)
  console.log('[PlayerHealth] ℹ️ Switched to low quality stream for better stability');
}, []);
```

### 8. بهبود Stalled/Waiting Recovery

**مشکل فعلی**: وقتی video stalled می‌شود، recovery نمی‌کند.

**راه‌حل**: اضافه کردن automatic recovery.

```typescript
// بهبود handleStalled
const handleStalled = () => {
  const now = Date.now();
  runtimeIssueRef.current.stalledCount++;
  runtimeIssueRef.current.lastStalled = now;
  
  const videoElement = videoRef.current;
  if (!videoElement) return;
  
  const bufferInfo = getBufferInfo(videoElement);
  
  console.log(`[VideoPlayer] ⚠️ [RUNTIME] Video stalled - bufferedAhead=${bufferInfo.bufferedAhead.toFixed(2)}s`);
  
  // CRITICAL: اگر buffer خیلی کم است و HLS.js در دسترس است
  if (bufferInfo.bufferedAhead < 1 && hlsPlayerRef.current) {
    console.log('[VideoPlayer] 🔄 [RUNTIME] Low buffer - attempting recovery');
    
    // Wait a bit, then try to recover
    setTimeout(() => {
      if (videoElement.paused && videoElement.readyState >= 3) {
        videoElement.play().catch(err => {
          console.error('[VideoPlayer] ❌ Recovery play failed:', err);
        });
      }
      
      // اگر HLS.js در دسترس است، startLoad را صدا بزن
      if (hlsPlayerRef.current && hlsPlayerRef.current.startLoad) {
        hlsPlayerRef.current.startLoad();
      }
    }, 500);
  }
  
  // CRITICAL: اگر بیش از 3 بار stalled شد، switch به low stream
  if (runtimeIssueRef.current.stalledCount >= 3 && !playbackHealthRef.current.isUsingLowStream) {
    console.log('[VideoPlayer] 🔄 [RUNTIME] Multiple stalls - switching to low stream');
    switchToLowStream(videoElement, !hlsPlayerRef.current, 'Multiple stalls');
  }
};
```

---

## 📊 تنظیمات پیشنهادی برای انواع دیوایس

### موبایل‌های ضعیف (Android Low-End):
```typescript
const lowEndConfig = {
  maxBufferLength: 20,           // Buffer کمتر
  liveSyncDurationCount: 2,      // Latency کمتر
  startLevel: -1,                // Auto-select
  capLevelToPlayerSize: true,    // Cap to player size
};
```

### موبایل‌های قوی (iOS/Android High-End):
```typescript
const highEndConfig = {
  maxBufferLength: 30,           // Buffer بیشتر برای stability
  liveSyncDurationCount: 3,      // Latency متوسط
  startLevel: -1,                // Auto-select
  testBandwidth: true,           // Test bandwidth
};
```

### دسکتاپ:
```typescript
const desktopConfig = {
  maxBufferLength: 40,           // Buffer بیشتر
  liveSyncDurationCount: 4,       // Latency بیشتر برای stability
  startLevel: -1,                 // Auto-select
  testBandwidth: true,           // Test bandwidth
};
```

---

## 🔧 تغییرات لازم در کد

### 1. تغییر در `src/components/VideoPlayer.tsx`:

```typescript
// خط 931: تغییر hlsConfig
const hlsConfig: any = {
  enableWorker: true,
  autoStartLoad: true,
  
  // اضافه کردن تمام تنظیمات buffer management
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  maxBufferSize: 60 * 1000 * 1000,
  maxBufferHole: 0.5,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 5,
  liveDurationInfinity: false,
  maxLoadingDelay: 4,
  highBufferWatchdogPeriod: 2,
  fragLoadingTimeOut: 20000,
  manifestLoadingTimeOut: 10000,
  levelLoadingTimeOut: 10000,
  fragLoadingMaxRetry: 4,
  manifestLoadingMaxRetry: 4,
  levelLoadingMaxRetry: 4,
  fragLoadingRetryDelay: 1000,
  abrEwmaDefaultEstimate: 500000,
  abrBandWidthFactor: 0.95,
  abrBandWidthUpFactor: 0.7,
  abrMaxWithRealBitrate: false,
  startFragPrefetch: true,
  testBandwidth: true,
  progressive: false,
  lowLatencyMode: true,
  startLevel: -1,
  capLevelToPlayerSize: true,
  backBufferLength: 30,
};
```

### 2. بهبود Error Recovery:

```typescript
// خط 982: بهبود error handler
hls.on(Hls.Events.ERROR, (event: any, data: any) => {
  console.error(`[VideoPlayer] ❌ [HLS.js] ERROR - type=${data.type}, details=${data.details}, fatal=${data.fatal}`);
  
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        console.log('[VideoPlayer] 🔄 [HLS.js] Network error - attempting recovery');
        hls.startLoad();
        break;
        
      case Hls.ErrorTypes.MEDIA_ERROR:
        console.log('[VideoPlayer] 🔄 [HLS.js] Media error - attempting recovery');
        hls.recoverMediaError();
        break;
        
      default:
        console.log('[VideoPlayer] 🔄 [HLS.js] Fatal error - destroying and recreating');
        hls.destroy();
        setTimeout(() => {
          setupHLSjsWithABR(videoElement, useLowStream);
        }, 1000);
        break;
    }
  }
});
```

### 3. اضافه کردن Buffer Monitor:

```typescript
// بعد از setupHLSjsWithABR، اضافه کردن:
useEffect(() => {
  const videoElement = videoRef.current;
  if (!videoElement || !hlsPlayerRef.current) return;
  
  const bufferMonitorInterval = setInterval(() => {
    if (!videoElement || videoElement.paused) return;
    
    const buffered = videoElement.buffered;
    const currentTime = videoElement.currentTime;
    
    if (buffered.length > 0) {
      let bufferedAhead = 0;
      for (let i = 0; i < buffered.length; i++) {
        if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
          bufferedAhead = buffered.end(i) - currentTime;
          break;
        }
      }
      
      // Low buffer recovery
      if (bufferedAhead < 2 && videoElement.readyState >= 3) {
        console.log(`[BufferMonitor] ⚠️ Low buffer: ${bufferedAhead.toFixed(2)}s`);
        if (hlsPlayerRef.current && hlsPlayerRef.current.startLoad) {
          hlsPlayerRef.current.startLoad();
        }
      }
      
      // High buffer correction
      if (bufferedAhead > 30 && hlsPlayerRef.current) {
        const hls = hlsPlayerRef.current;
        if (hls.liveSyncPosition !== null && !isNaN(hls.liveSyncPosition)) {
          const drift = hls.liveSyncPosition - currentTime;
          if (drift > 5) {
            console.log(`[BufferMonitor] ⚡ High buffer: ${bufferedAhead.toFixed(2)}s, drift: ${drift.toFixed(2)}s`);
            videoElement.currentTime = hls.liveSyncPosition;
          }
        }
      }
    }
  }, 2000);
  
  return () => {
    clearInterval(bufferMonitorInterval);
  };
}, [hlsPlayerRef.current]);
```

### 4. بهبود Stalled Recovery:

```typescript
// خط 1284: بهبود handleStalled
const handleStalled = () => {
  // ... existing code ...
  
  // CRITICAL: Recovery logic
  if (bufferInfo.bufferedAhead < 1 && hlsPlayerRef.current) {
    setTimeout(() => {
      if (videoElement.paused && videoElement.readyState >= 3) {
        videoElement.play().catch(err => {
          console.error('[VideoPlayer] ❌ Recovery play failed:', err);
        });
      }
      
      if (hlsPlayerRef.current && hlsPlayerRef.current.startLoad) {
        hlsPlayerRef.current.startLoad();
      }
    }, 500);
  }
  
  // Switch to low stream after multiple stalls
  if (runtimeIssueRef.current.stalledCount >= 3 && !playbackHealthRef.current.isUsingLowStream) {
    switchToLowStream(videoElement, !hlsPlayerRef.current, 'Multiple stalls');
  }
};
```

---

## 🧪 تست و اعتبارسنجی

### مراحل تست:

1. **تست روی موبایل ضعیف**:
   - استفاده از Android emulator با CPU محدود
   - تست با network throttling (3G)
   - بررسی لاگ‌های console

2. **تست روی شبکه کند**:
   - استفاده از Chrome DevTools Network Throttling
   - تست با 3G/4G simulation
   - بررسی recovery behavior

3. **تست روی شبکه ناپایدار**:
   - استفاده از Network Condition: "Slow 3G" + "Offline" simulation
   - بررسی retry logic
   - بررسی error recovery

### معیارهای موفقیت:

- ✅ استریم بدون لگ برای 5 دقیقه متوالی
- ✅ Recovery خودکار از network errors
- ✅ Switch خودکار به low stream در صورت مشکل
- ✅ Buffer management مناسب (2-30s)
- ✅ Latency مناسب (< 10s)

---

## 📝 چک‌لیست پیاده‌سازی

- [ ] اضافه کردن تنظیمات HLS.js پیشرفته
- [ ] بهبود error recovery logic
- [ ] اضافه کردن buffer monitoring
- [ ] بهبود stalled/waiting recovery
- [ ] اضافه کردن adaptive quality switching
- [ ] تست روی موبایل ضعیف
- [ ] تست روی شبکه کند
- [ ] تست روی شبکه ناپایدار
- [ ] بررسی لاگ‌ها و بهبودها
- [ ] مستندسازی تغییرات

---

## 🚨 نکات مهم

1. **تغییرات تدریجی**: تغییرات را به صورت تدریجی اعمال کنید و بعد از هر تغییر تست کنید.

2. **مانیتورینگ**: بعد از اعمال تغییرات، لاگ‌ها را به دقت بررسی کنید.

3. **Fallback**: همیشه fallback به low stream را فعال نگه دارید.

4. **Testing**: قبل از deploy به production، حتماً روی محیط test تست کنید.

---

## 📞 پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های console را بررسی کنید
2. لاگ‌های backend را بررسی کنید
3. Network tab در DevTools را بررسی کنید
4. با تیم توسعه تماس بگیرید

---

**تاریخ ایجاد**: 2025  
**نسخه**: 1.0.0  
**وضعیت**: پیشنهادی - نیاز به پیاده‌سازی

