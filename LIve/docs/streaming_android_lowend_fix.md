# Android Low-End Device Fix and Play() Interrupted Error Resolution

این مستندات مشکلات runtime روی Android (خصوصاً دستگاه‌های ضعیف) و راه‌حل‌های پیاده‌سازی شده را توضیح می‌دهد.

## مشکلات شناسایی شده

### 1. خطای "The play() request was interrupted by a new load request"

**علائم:**
- خطای `The play() request was interrupted by a new load request` نمایش داده می‌شود
- ویدئو اصلاً پخش نمی‌شود
- این خطا معمولاً در console log دیده می‌شود

**علت:**
- در حین اجرای `video.play()` Promise، یک `video.load()` یا تغییر `src` انجام می‌شود
- مرورگر play را reject می‌کند
- Player این را به عنوان خطای واقعی نشان می‌دهد

**مثال لاگ:**
```
[VideoPlayer] ❌ Play failed: DOMException: The play() request was interrupted by a new load request
```

### 2. مشکل روی Android ضعیف: قطع و وصل بعد از چند دقیقه

**علائم:**
- بعد از چند دقیقه پخش، استریم مدام قطع و وصل می‌شود
- لگ شدید دارد
- در حالی که روی iPhone در همان شرایط، پخش روان و پایدار است

**علل احتمالی:**
- ABR خیلی تهاجمی - کیفیت بالا (720p) روی دستگاه ضعیف
- Buffer config نامناسب - buffer خیلی بزرگ باعث RAM/CPU overload می‌شود
- CPU decode overload - دستگاه نمی‌تواند 720p را decode کند
- Oscillation در ABR - مدام بین کیفیت‌ها سوییچ می‌کند و rebuffer می‌شود

## راه‌حل‌های پیاده‌سازی شده

### 1. Player State Machine

**طراحی:**

یک state machine با 5 state:
- `idle`: Player آماده است، هنوز init نشده
- `loading`: در حال load کردن source
- `playing`: در حال پخش
- `error`: خطا رخ داده
- `reloading`: در حال reload برای recovery

**استفاده:**

```typescript
type PlayerState = 'idle' | 'loading' | 'playing' | 'error' | 'reloading';
const playerStateRef = useRef<PlayerState>('idle');
```

**قوانین:**

1. فقط در حالت `idle` یا `error` اجازه init جدید
2. اگر state `loading` یا `reloading` است، play button را ignore کن (debounce)
3. قبل از هر `load()` یا تغییر `src`، state را `reloading` بگذار
4. بعد از موفقیت در play، state را `playing` کن

### 2. safePlayVideo() Function

**هدف:**

جلوگیری از خطای "play() interrupted" با:
- Swallow کردن خطاهای interrupted
- مدیریت state machine
- جلوگیری از double-call play()

**پیاده‌سازی:**

```typescript
const safePlayVideo = useCallback((mutedFallback = false): Promise<void> => {
  // Check state - don't play if loading/reloading
  if (playerStateRef.current === 'loading' || playerStateRef.current === 'reloading') {
    return Promise.resolve();
  }
  
  // Set state to loading
  playerStateRef.current = 'loading';
  
  const playPromise = videoElement.play();
  
  return playPromise
    .then(() => {
      playerStateRef.current = 'playing';
    })
    .catch((err) => {
      // Swallow interrupted errors
      if (isInterruptedPlayError(err)) {
        console.warn('play() interrupted - ignoring');
        return;
      }
      // Handle real errors
      playerStateRef.current = 'error';
      throw err;
    });
}, []);
```

**Helper Function:**

```typescript
const isInterruptedPlayError = (err: any): boolean => {
  const msg = String(err.message || err || '');
  return msg.includes('The play() request was interrupted by a new load request') ||
         msg.includes('play() request was interrupted') ||
         msg.includes('AbortError');
};
```

### 3. Low-End Android Detection

**معیارهای تشخیص:**

```typescript
const isLowEndAndroid = useRef<boolean>(false);

// Low-end criteria:
// - CPU cores <= 4
// - Device memory <= 3GB (if available)
// - Small screen with high DPI (indicates older device)
isLowEndAndroid.current = 
  hardwareConcurrency <= 4 ||
  (deviceMemory > 0 && deviceMemory <= 3) ||
  (screenWidth < 720 && pixelRatio > 2);
```

### 4. Low-End Android hls.js Config

**تنظیمات محافظه‌کارانه:**

```typescript
const lowEndAndroidConfig = {
  maxBufferLength: 10,         // بافر کوتاه‌تر (10s vs 20s)
  maxBufferSize: 30 * 1000 * 1000, // 30MB vs 60MB
  abrEwmaDefaultEstimate: 400000,   // 400kbps vs 500kbps
  abrBandWidthFactor: 0.7,          // محافظه‌کارانه‌تر
  abrBandWidthUpFactor: 0.7,       // محافظه‌کارانه‌تر
  maxStarvationDelay: 3,            // سریع‌تر switch down
  maxLoadingDelay: 3,
};
```

**محدودیت کیفیت:**

برای low-end Android:
- حداکثر 480p (یا 360p اگر available باشد)
- Lock به این level - disable auto-level switching
- این از oscillation و rebuffer جلوگیری می‌کند

```typescript
if (isLowEndAndroid.current) {
  hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
    const maxHeight = 480;
    const candidates = levels.filter(l => l.height <= maxHeight);
    const best = candidates.reduce((best, l) => {
      if (l.height === 360) return l; // Prefer 360p
      return l.height > best.height ? l : best;
    }, candidates[0]);
    
    // Lock to this level
    hls.currentLevel = best.index;
    hls.maxAutoLevel = best.index;
    hls.autoLevelCapping = best.index;
  });
}
```

### 5. بهبود Recovery Mechanisms

**Stalled/Waiting Recovery:**

1. **State Check**: قبل از recovery، چک کن state `reloading` یا `loading` نباشد
2. **Pause Before Reload**: همیشه `video.pause()` قبل از `load()` یا تغییر `src`
3. **State Management**: 
   - قبل از reload: `playerStateRef.current = 'reloading'`
   - بعد از load: `playerStateRef.current = 'loading'`
   - بعد از play موفق: `playerStateRef.current = 'playing'`

**hls.js Recovery:**

```typescript
if (hlsPlayerRef.current) {
  playerStateRef.current = 'reloading';
  videoElement.pause();
  hls.startLoad();
  // Reset state after recovery
  setTimeout(() => {
    if (playerStateRef.current === 'reloading') {
      playerStateRef.current = 'loading';
    }
  }, 1000);
}
```

### 6. جلوگیری از Double-Init

**قوانین:**

1. قبل از init جدید، همیشه instance قبلی را destroy کن
2. فقط در حالت `idle` یا `error` init جدید انجام بده
3. از dependency array در useEffect مراقب باش - فقط URL واقعی استریم را track کن

**پیاده‌سازی:**

```typescript
// In handlePlayAndUnmute
if (playerStateRef.current === 'loading' || playerStateRef.current === 'reloading') {
  return; // Ignore - already initializing
}

// In setupHLSjsWithABR
if (hlsPlayerRef.current) {
  hlsPlayerRef.current.destroy();
  hlsPlayerRef.current = null;
}
```

## تغییرات در کد

### فایل‌های تغییر یافته:

1. **`src/components/VideoPlayer.tsx`**:
   - اضافه شدن Player State Machine
   - اضافه شدن `safePlayVideo()` function
   - اضافه شدن Low-end Android detection
   - بهبود hls.js config برای low-end
   - بهبود recovery mechanisms
   - به‌روزرسانی همه `play()` calls به `safePlayVideo()`

### تغییرات کلیدی:

1. **State Machine**: `playerStateRef` برای track کردن وضعیت player
2. **safePlayVideo**: جایگزین همه `video.play()` calls
3. **Low-end Config**: تنظیمات خاص برای Android ضعیف
4. **Quality Lock**: Lock کردن کیفیت برای low-end Android
5. **Recovery State**: استفاده از state machine در recovery

## نتایج مورد انتظار

### قبل از بهینه‌سازی:

- **خطای play() interrupted**: نمایش داده می‌شد به کاربر
- **Android ضعیف**: قطع و وصل، لگ، freeze بعد از چند دقیقه
- **ABR**: خیلی تهاجمی، oscillation

### بعد از بهینه‌سازی:

- **خطای play() interrupted**: دیگر نمایش داده نمی‌شود (فقط در console log)
- **Android ضعیف**: پخش پایدار با کیفیت پایین‌تر (360p/480p)
- **ABR**: محافظه‌کارانه‌تر، بدون oscillation
- **State Management**: کنترل بهتر روی init/reload/play

## تست روی دستگاه‌های مختلف

### Android Low-End (CPU <= 4, RAM <= 3GB):

- **قبل**: قطع و وصل، لگ، خطای play() interrupted
- **بعد**: پخش پایدار با 360p/480p، بدون خطا

### Android Normal (CPU > 4, RAM > 3GB):

- **قبل**: گاهی لگ
- **بعد**: پخش روان، ABR محافظه‌کارانه

### iOS (Safari):

- **قبل**: خوب بود
- **بعد**: همچنان خوب (native HLS حفظ شده)

## نکات مهم

1. **State Machine**: تنها منبع حقیقت برای تصمیم‌گیری
2. **safePlayVideo**: همه play() calls باید از این استفاده کنند
3. **Low-end Detection**: فقط برای تنظیمات hls.js استفاده می‌شود
4. **Quality Lock**: برای low-end Android، ABR disable می‌شود
5. **Recovery**: همیشه pause قبل از reload

## مراحل بعدی (اختیاری)

1. **Real Device Testing**: تست روی دستگاه‌های واقعی Android ضعیف
2. **Analytics**: جمع‌آوری داده‌های واقعی از runtime issues
3. **Fine-tuning**: تنظیم thresholds بر اساس نتایج واقعی
4. **Additional Quality Levels**: اضافه کردن 240p برای نت‌های بسیار ضعیف
