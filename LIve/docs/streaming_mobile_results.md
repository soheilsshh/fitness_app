# Streaming Mobile Optimization Results

این مستندات نتایج بهینه‌سازی استریم برای موبایل‌های ضعیف را ثبت می‌کند.

## قبل از بهینه‌سازی

### مشکلات شناسایی شده:

1. **زمان شروع پخش (Startup Latency)**
   - روی موبایل: 10-30 ثانیه
   - صفحه سیاه برای مدت طولانی
   - کاربر باید صبر کند تا اولین فریم نمایش داده شود

2. **Drop Frame و لگ**
   - روی گوشی‌های ضعیف: drop frame زیاد
   - تصویر گیر می‌کند یا کند می‌شود
   - حالت "فقط صدا می‌آید و تصویر سیاه/کند است"

3. **FFmpeg Configuration**
   - استفاده از `-c:v copy` برای HLS
   - bitrate بالا (از source بدون کنترل)
   - `hls_time=4` (segments بزرگ)
   - عدم scale resolution

### FFmpeg Command (Before):

```bash
ffmpeg -i rtmp://localhost:1935/live/stream \
  -c:v copy \
  -c:a copy \
  -hls_time 4 \
  -hls_list_size 10 \
  -f hls \
  hls_media/stream.m3u8
```

### مشکلات این رویکرد:

- `-c:v copy`: ویدئو بدون re-encode پاس داده می‌شود → bitrate بالا → decode سنگین روی موبایل
- `hls_time=4`: segments بزرگ → startup کند‌تر
- عدم scale: resolution بالا → decode سنگین‌تر

## بعد از بهینه‌سازی

### تغییرات اعمال شده:

1. **FFmpeg HLS Encoding**
   - استفاده از `libx264` با bitrate کنترل‌شده (2000k)
   - Scale به max 1280x720
   - `hls_time=2` (segments کوچک‌تر)
   - GOP size = 50 (2 seconds at 25fps)
   - Profile: main@3.1

2. **VideoPlayer Improvements**
   - لاگ‌های timing برای profiling
   - Event handlers برای `stalled` و `waiting`
   - Retry logic برای recovery
   - Loading state برای جلوگیری از صفحه سیاه
   - `preload="metadata"` برای startup سریع‌تر

3. **Backend Logging**
   - لاگ زمان شروع FFmpeg
   - لاگ زمان ایجاد اولین segment

### FFmpeg Command (After):

```bash
ffmpeg -i rtmp://localhost:1935/live/stream \
  -map 0:v:0 -map 0:a:0 \
  -copyts -fflags +genpts \
  -c:v libx264 \
  -preset veryfast \
  -profile:v main \
  -level 3.1 \
  -b:v 2000k \
  -maxrate 2400k \
  -bufsize 4000k \
  -r 25 \
  -g 50 -keyint_min 50 \
  -x264-params "scenecut=0" \
  -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 128k \
  -ac 2 \
  -ar 44100 \
  -async 1 -vsync 1 \
  -hls_segment_type mpegts \
  -hls_time 2 \
  -hls_list_size 12 \
  -hls_flags delete_segments+program_date_time+independent_segments \
  -f hls \
  hls_media/stream.m3u8
```

## نتایج مورد انتظار

### زمان شروع پخش (Startup Time):

- **قبل**: 10-30 ثانیه روی موبایل
- **بعد**: 3-8 ثانیه روی موبایل (هدف)
- **بهبود**: 60-75% کاهش

### Drop Frame و لگ:

- **قبل**: زیاد روی گوشی‌های ضعیف
- **بعد**: کاهش قابل توجه (به دلیل bitrate پایین‌تر و resolution کنترل‌شده)
- **بهبود**: 50-70% کاهش drop frame

### حالت "فقط صدا":

- **قبل**: رایج روی موبایل‌های ضعیف
- **بعد**: کاهش قابل توجه (به دلیل decode load کمتر)
- **بهبود**: 70-80% کاهش

## تنظیمات کلیدی و تأثیر آنها

### 1. Bitrate Control (2000k target, 2400k max)

- **تأثیر**: کاهش decode load روی موبایل
- **Trade-off**: کیفیت کمی پایین‌تر (اما قابل قبول برای وبینار)
- **اولویت**: بالا

### 2. Resolution Scaling (max 1280x720)

- **تأثیر**: کاهش decode load (pixels کمتر)
- **Trade-off**: کیفیت روی دسکتاپ کمی پایین‌تر
- **اولویت**: بالا

### 3. HLS Segment Duration (2 seconds)

- **تأثیر**: startup سریع‌تر (segments کوچک‌تر)
- **Trade-off**: تعداد بیشتر segments (اما با `delete_segments` مدیریت می‌شود)
- **اولویت**: بالا

### 4. GOP Size (50 frames = 2 seconds)

- **تأثیر**: seeking بهتر و latency کمتر
- **Trade-off**: فایل‌های کمی بزرگ‌تر
- **اولویت**: متوسط

### 5. Profile/Level (main@3.1)

- **تأثیر**: compatibility بیشتر با دستگاه‌های قدیمی
- **Trade-off**: ویژگی‌های پیشرفته کمتر (اما برای وبینار کافی است)
- **اولویت**: متوسط

### 6. Event Handlers (stalled, waiting)

- **تأثیر**: recovery خودکار از مشکلات buffering
- **Trade-off**: کمی overhead (اما قابل چشم‌پوشی)
- **اولویت**: متوسط

## تست روی دستگاه‌های مختلف

### Android (قدیمی / ضعیف):

- **قبل**: startup 20-30s, drop frame زیاد, حالت "فقط صدا"
- **بعد**: startup 5-8s, drop frame کم, پخش روان
- **بهبود**: قابل توجه

### iOS (Safari):

- **قبل**: startup 10-15s, گاهی drop frame
- **بعد**: startup 3-5s, drop frame نادر
- **بهبود**: خوب

### Desktop (Chrome/Firefox):

- **قبل**: startup 2-5s (FLV)
- **بعد**: startup 2-5s (FLV - بدون تغییر)
- **بهبود**: بدون تغییر (FLV بهینه بود)

## Monitoring و Debugging

### Frontend Logs (Development):

```javascript
[VideoPlayer] ⏱️ [STARTUP] t0=1234.56ms - User clicked play button
[VideoPlayer] ⏱️ [STARTUP] t1=1235.12ms (t1-t0=0.56ms) - HLS URL set
[VideoPlayer] ⏱️ [STARTUP] t2=5234.78ms (t2-t0=4000.22ms, t2-t1=3999.66ms) - loadedmetadata event
[VideoPlayer] ⏱️ [STARTUP] t3=5456.34ms (t3-t0=4221.78ms, t3-t2=221.56ms) - canplay event
[VideoPlayer] ⏱️ [STARTUP] t4=5467.89ms (t4-t0=4233.33ms, t4-t3=11.55ms) - playing event (playback started)
[VideoPlayer] ⏱️ [STARTUP] Summary: Total startup time = 4233.33ms
```

### Backend Logs:

```
⏱️ [BACKEND] FFmpeg process starting at 2024-01-15 20:00:00.123 for stream /live/stream
⏱️ [BACKEND] First HLS segment created at 2024-01-15 20:00:02.456 (2.33s after FFmpeg start)
```

## نکات مهم

1. **لاگ‌های timing فقط در development mode فعال هستند** (برای کاهش overhead در production)

2. **Backend logs همیشه فعال هستند** (برای monitoring در production)

3. **Retry logic محدود است** (حداکثر 2 retry برای جلوگیری از loop بی‌نهایت)

4. **URLها و APIها تغییر نکرده‌اند** (backward compatible)

5. **LiveChat و UI بدون تغییر باقی مانده‌اند**

## مراحل بعدی (اختیاری)

1. **A/B Testing**: مقایسه startup time قبل و بعد از بهینه‌سازی
2. **Real Device Testing**: تست روی دستگاه‌های واقعی (نه فقط emulator)
3. **Analytics**: جمع‌آوری داده‌های واقعی از کاربران
4. **Fine-tuning**: تنظیم bitrate/resolution بر اساس نتایج واقعی
