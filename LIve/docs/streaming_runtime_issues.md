# Streaming Runtime Issues and Solutions

این مستندات مشکلات runtime استریم (pause ناگهانی، صفحه سیاه، drop frame) و راه‌حل‌های پیاده‌سازی شده را توضیح می‌دهد.

## مشکلات شناسایی شده (قبل از بهینه‌سازی)

### 1. Pause ناگهانی بعد از چند ثانیه

**علائم:**
- ویدئو بعد از شروع پخش، ناگهان pause می‌شود
- کاربر باید دوباره play بزند
- روی موبایل‌های ضعیف بیشتر رخ می‌دهد

**علل احتمالی:**
- Buffer underrun: buffer خالی می‌شود و ویدئو pause می‌شود
- Media error: خطا در decode یا load segment
- Network error: قطع ارتباط با سرور

### 2. صفحه سیاه

**علائم:**
- بعد از چند ثانیه پخش، تصویر سیاه می‌شود
- صدا ممکن است ادامه داشته باشد یا قطع شود
- روی Android بیشتر از iOS رخ می‌دهد

**علل احتمالی:**
- Media error در decode
- Buffer starvation
- Native HLS player در Android قدیمی مشکل دارد

### 3. حالت "فقط صدا"

**علائم:**
- صدا می‌آید اما تصویر ثابت یا سیاه است
- روی گوشی‌های ضعیف بیشتر رخ می‌دهد

**علل احتمالی:**
- Decode load بالا: CPU نمی‌تواند ویدئو را decode کند
- Bitrate بالا: bitrate از توانایی دستگاه بیشتر است
- Resolution بالا: resolution از توانایی decode بیشتر است

## راه‌حل‌های پیاده‌سازی شده

### 1. Multi-bitrate HLS (ABR)

**تغییرات Backend:**

FFmpeg حالا سه کیفیت مختلف تولید می‌کند:
- **720p** (2500k bitrate) - برای اتصالات خوب
- **480p** (1500k bitrate) - برای اتصالات متوسط
- **360p** (800k bitrate) - برای اتصالات ضعیف/موبایل

**Master Playlist:**
- یک master playlist (`stream.m3u8`) که سه variant دارد
- هر variant یک playlist جداگانه دارد (`stream_0.m3u8`, `stream_1.m3u8`, `stream_2.m3u8`)
- URL اصلی (`/hls/stream.m3u8`) همان master playlist است

**FFmpeg Command (Multi-bitrate):**

```bash
ffmpeg -i rtmp://localhost:1935/live/stream \
  -filter_complex "[0:v]split=3[v0][v1][v2]; [v0]scale=-2:720:flags=lanczos[v0out]; [v1]scale=-2:480:flags=lanczos[v1out]; [v2]scale=-2:360:flags=lanczos[v2out]" \
  -map [v0out] -map 0:a:0 \
  -c:v:0 libx264 -preset:v:0 veryfast -profile:v:0 main -level:v:0 3.1 \
  -b:v:0 2500k -maxrate:v:0 2800k -bufsize:v:0 5000k \
  -map [v1out] -map 0:a:0 \
  -c:v:1 libx264 -preset:v:1 veryfast -profile:v:1 main -level:v:1 3.1 \
  -b:v:1 1500k -maxrate:v:1 1700k -bufsize:v:1 3000k \
  -map [v2out] -map 0:a:0 \
  -c:v:2 libx264 -preset:v:2 veryfast -profile:v:2 baseline -level:v:2 3.0 \
  -b:v:2 800k -maxrate:v:2 1000k -bufsize:v:2 2000k \
  -c:a:0 aac -b:a:0 128k -ac:a:0 2 -ar:a:0 44100 \
  -c:a:1 aac -b:a:1 128k -ac:a:1 2 -ar:a:1 44100 \
  -c:a:2 aac -b:a:2 128k -ac:a:2 2 -ar:a:2 44100 \
  -f hls -hls_segment_type mpegts \
  -hls_time 2 -hls_list_size 15 \
  -hls_flags delete_segments+program_date_time+independent_segments \
  -master_pl_name stream.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  -hls_segment_filename hls_media/stream_%v_%03d.ts \
  hls_media/stream_%v.m3u8
```

### 2. hls.js برای Android با ABR

**تغییرات Frontend:**

- **iOS**: همچنان از native HLS استفاده می‌کند (Safari native support عالی است)
- **Android**: از hls.js استفاده می‌کند برای:
  - ABR (Adaptive Bitrate) - سوییچ خودکار بین کیفیت‌ها
  - Error recovery بهتر
  - کنترل بیشتر روی buffering

**تنظیمات hls.js:**

```javascript
const hlsConfig = {
  autoStartLoad: true,
  startLevel: -1, // Auto-select initially
  capLevelToPlayerSize: true,
  maxBufferLength: 20,
  maxBufferSize: 60 * 1000 * 1000,
  maxBufferHole: 0.5,
  lowLatencyMode: false,
  abrEwmaDefaultEstimate: 500000, // Start conservative (500kbps)
  abrBandWidthFactor: 0.95,
  abrBandWidthUpFactor: 0.7, // Conservative when going up
  abrMaxWithRealBitrate: true,
  maxStarvationDelay: 4,
  maxLoadingDelay: 4,
};
```

**شروع با کیفیت پایین:**

- بعد از parse شدن manifest، از پایین‌ترین کیفیت (360p) شروع می‌کند
- بعد از 15 ثانیه پخش پایدار، ABR فعال می‌شود و کیفیت به مرور بالا می‌رود
- این شبیه رفتار YouTube است

**محدودیت کیفیت برای دستگاه‌های ضعیف:**

- Android قدیمی (4-6) یا CPU < 4 cores: حداکثر 480p
- این از decode overload جلوگیری می‌کند

### 3. Recovery Mechanisms

**Error Handling در hls.js:**

```javascript
hls.on(Hls.Events.ERROR, (event, data) => {
  if (data.fatal) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        hls.startLoad(); // Retry loading
        break;
      case Hls.ErrorTypes.MEDIA_ERROR:
        hls.recoverMediaError(); // Try to recover
        break;
      default:
        // Destroy and recreate (max 2 retries)
        hls.destroy();
        // Recreate instance...
    }
  }
});
```

**Stalled/Waiting Recovery:**

- اگر video برای 5 ثانیه stalled باشد:
  - برای hls.js: `hls.startLoad()` یا switch به کیفیت پایین‌تر
  - برای native HLS: reload source با حفظ currentTime
- Cooldown 10 ثانیه برای جلوگیری از loop

**Buffer Monitoring:**

- لاگ buffer info در هر stalled/waiting event
- Track buffer history (آخرین 10 entry)
- اگر buffer < 1 second برای چند ثانیه: trigger recovery

### 4. بهبود HLS Playlist Settings

**hls_list_size:**
- افزایش از 12 به 15 segments
- این اطمینان می‌دهد که segments در حال پخش حذف نمی‌شوند
- Buffer بزرگ‌تر = stability بیشتر

**delete_segments:**
- همچنان فعال است برای جلوگیری از پر شدن disk
- اما با list_size=15، segments کافی برای پخش وجود دارد

## لاگ‌های Runtime

### Frontend Logs (Development Mode):

```javascript
[VideoPlayer] ⚠️ [RUNTIME] Video stalled - buffering. Count: X
[VideoPlayer] ⚠️ [RUNTIME] Buffer info: bufferedEnd=X.XXs, bufferedAhead=X.XXs, currentTime=X.XXs
[VideoPlayer] ⚠️ [RUNTIME] Device: iOS/Android/Desktop, Protocol: HLS/FLV, UserAgent: ...

[VideoPlayer] ⏸️ [RUNTIME] Video paused unexpectedly. Count: X

[VideoPlayer] ❌ [HLS.js] Error: type=networkError/mediaError, details=..., fatal=true/false
[VideoPlayer] ❌ [HLS.js] Fragment: level=X, url=...
[VideoPlayer] 🔄 [HLS.js] Network error - attempting recovery
[VideoPlayer] 🔄 [HLS.js] Quality switched to level X: 720p/480p/360p, bitrate=...
```

### Backend Logs:

```
⏱️ [BACKEND] FFmpeg process starting at ...
⏱️ [BACKEND] First HLS segments created at ... (X.XXs after FFmpeg start)
```

## نتایج مورد انتظار

### قبل از بهینه‌سازی:

- **Pause ناگهانی**: رایج روی موبایل‌های ضعیف
- **صفحه سیاه**: گاهی بعد از چند ثانیه
- **فقط صدا**: رایج روی Android قدیمی
- **کیفیت**: یک کیفیت ثابت (مشکل برای نت‌های ضعیف)

### بعد از بهینه‌سازی:

- **Pause ناگهانی**: کاهش قابل توجه (recovery mechanisms)
- **صفحه سیاه**: کاهش (hls.js error recovery)
- **فقط صدا**: کاهش (ABR و کیفیت پایین‌تر برای شروع)
- **کیفیت**: Adaptive - شروع از پایین، سپس بالا می‌رود

## تأثیر هر تغییر

### 1. Multi-bitrate HLS:

- **تأثیر**: امکان سوییچ بین کیفیت‌ها بر اساس سرعت نت
- **اولویت**: بالا

### 2. hls.js برای Android:

- **تأثیر**: Error recovery بهتر و ABR
- **اولویت**: بالا

### 3. شروع با کیفیت پایین:

- **تأثیر**: Startup سریع‌تر و کمتر drop frame
- **اولویت**: متوسط-بالا

### 4. Recovery Mechanisms:

- **تأثیر**: کاهش pause ناگهانی و صفحه سیاه
- **اولویت**: بالا

### 5. افزایش hls_list_size:

- **تأثیر**: جلوگیری از حذف segments در حال پخش
- **اولویت**: متوسط

## تست روی دستگاه‌های مختلف

### Android (قدیمی / ضعیف):

- **قبل**: pause ناگهانی، صفحه سیاه، فقط صدا
- **بعد**: شروع از 360p، سپس سوییچ به 480p (اگر نت خوب باشد)، کمتر pause

### Android (جدید):

- **قبل**: گاهی pause
- **بعد**: شروع از 360p، سپس به 720p می‌رود، پخش روان

### iOS (Safari):

- **قبل**: معمولاً خوب (native HLS عالی است)
- **بعد**: همچنان خوب (native HLS حفظ شده)

## نکات مهم

1. **URLها تغییر نکرده‌اند**: `/hls/stream.m3u8` همچنان کار می‌کند
   - اگر multi-bitrate فعال باشد: master playlist
   - اگر غیرفعال باشد: single playlist (backward compatible)

2. **iOS همچنان native HLS استفاده می‌کند**: Safari native support عالی است

3. **Android از hls.js استفاده می‌کند**: برای ABR و error recovery بهتر

4. **Recovery محدود است**: حداکثر 2 retry برای جلوگیری از loop

5. **لاگ‌ها فقط در development**: برای کاهش overhead در production

## مراحل بعدی (اختیاری)

1. **Real Device Testing**: تست روی دستگاه‌های واقعی
2. **Analytics**: جمع‌آوری داده‌های واقعی از runtime issues
3. **Fine-tuning ABR**: تنظیم thresholds بر اساس نتایج واقعی
4. **Additional Quality Levels**: اضافه کردن 240p برای نت‌های بسیار ضعیف
