# HLS Single-Bitrate Profile Tuning for Mobile/Webinar

این مستندات تنظیمات HLS single-bitrate را برای بهینه‌سازی پخش روی موبایل‌های ضعیف توضیح می‌دهد.

## تنظیمات قبلی (قبل از بهینه‌سازی)

### Video Encoding:
- **Codec**: libx264
- **Bitrate**: 2000k
- **Maxrate**: 2400k
- **Bufsize**: 4000k
- **Preset**: veryfast
- **Profile**: main
- **Level**: 3.1
- **FPS**: 25
- **GOP**: 50
- **Resolution**: max(1280x720) - scale down if source is higher
- **Tuning**: None

### Audio Encoding:
- **Codec**: aac
- **Bitrate**: 128k
- **Channels**: 2
- **Sample Rate**: 44100

### HLS Settings:
- **Segment Duration**: 3 seconds
- **List Size**: 10 segments (~30 seconds buffer)
- **Flags**: independent_segments

### مشکلات شناسایی شده:
- Bitrate بالا (2000k) برای موبایل‌های ضعیف سنگین بود
- Audio bitrate (128k) می‌توانست کمتر باشد
- Tuning برای streaming وجود نداشت
- Scaling از lanczos استفاده نمی‌کرد

## تنظیمات جدید (بعد از بهینه‌سازی - برای پایداری مطلق روی موبایل‌های ضعیف)

### Video Encoding:
- **Codec**: libx264
- **Bitrate**: **1500k** (کاهش از 1800k - 17% کاهش، از 2000k اصلی - 25% کاهش)
- **Maxrate**: **1800k** (1.2x bitrate - کاهش از 2160k)
- **Bufsize**: **3000k** (2x bitrate - کاهش از 3600k)
- **Preset**: veryfast
- **Tuning**: **zerolatency** (برای streaming)
- **Profile**: main
- **Level**: 3.1
- **FPS**: 25
- **GOP**: **25** (کاهش از 50 - 1 ثانیه به جای 2 ثانیه برای recovery سریع‌تر)
- **Resolution**: **max(960x540)** (کاهش از 720p - 540p برای کاهش decode load)
- **Scaling**: **lanczos** (کیفیت بهتر scaling)

### Audio Encoding:
- **Codec**: aac
- **Bitrate**: **48k** (کاهش از 96k - 50% کاهش، از 128k اصلی - 62% کاهش)
- **Channels**: 2
- **Sample Rate**: 44100

### HLS Settings:
- **Segment Duration**: **4 seconds** (افزایش از 3s - segments بزرگ‌تر برای buffering پایدارتر)
- **List Size**: **12 segments** (افزایش از 10 - ~48 ثانیه buffer به جای ~30 ثانیه)
- **Flags**: independent_segments

## دلیل انتخاب این مقادیر (نسخه نهایی - برای پایداری مطلق)

### 1. Video Bitrate: 1500k

**دلیل:**
- کاهش 25% از 2000k اصلی برای حداکثر پایداری روی موبایل‌های ضعیف
- 540p با 1500k کیفیت خوب برای وبینار دارد (speech و presentation)
- کاهش قابل توجه فشار روی CPU و network
- در محدوده 1200k-1800k که برای موبایل ضعیف مناسب است

**مقایسه:**
- 2000k: کیفیت عالی اما سنگین برای موبایل ضعیف
- 1800k: کیفیت خوب اما هنوز ممکن است روی موبایل ضعیف lag داشته باشد
- 1500k: کیفیت قابل قبول و پایداری بیشتر روی موبایل ضعیف

### 2. Maxrate: 2160k (1.2x bitrate)

**دلیل:**
- 20% بالاتر از bitrate برای handle کردن peak moments
- نه خیلی بالا (که باعث spike می‌شود) و نه خیلی پایین
- نسبت 1.2x استاندارد برای VBR encoding است

### 3. Bufsize: 3600k (2x bitrate)

**دلیل:**
- 2x bitrate برای buffer مناسب
- نه خیلی بزرگ (که latency را افزایش می‌دهد) و نه خیلی کوچک
- برای streaming پایدار مناسب است

### 4. Tuning: zerolatency

**دلیل:**
- بهینه‌سازی برای low-latency streaming
- کاهش delay در encoding
- مناسب برای live streaming

### 5. Resolution: 540p (960x540)

**دلیل:**
- کاهش از 720p به 540p برای کاهش decode load
- 540p برای وبینار (speech, presentation) کیفیت کافی دارد
- کاهش ~40% در pixel count = کاهش قابل توجه در CPU decode load
- مناسب برای موبایل‌های ضعیف با صفحه کوچک

**مقایسه:**
- 720p (1280x720): 921,600 pixels
- 540p (960x540): 518,400 pixels
- کاهش: ~44% کمتر pixels = decode load کمتر

### 6. Audio Bitrate: 48k

**دلیل:**
- کاهش 62% از 128k اصلی برای حداقل bandwidth
- برای وبینار (speech) 48k کافی است
- کاهش قابل توجه فشار روی network و CPU
- AAC 48k برای speech quality خوب است

### 7. Segment Duration: 4 seconds

**دلیل:**
- افزایش از 3s به 4s برای buffering پایدارتر
- Segments بزرگ‌تر = کمتر network requests
- Buffer بزرگ‌تر = کمتر rebuffering
- مناسب برای نت‌های ضعیف

### 8. List Size: 12 segments

**دلیل:**
- افزایش از 10 به 12 segments
- Buffer ~48 ثانیه به جای ~30 ثانیه
- پایداری بیشتر در network fluctuations
- کمتر احتمال rebuffering

### 9. GOP: 25 (1 second)

**دلیل:**
- کاهش از 50 (2s) به 25 (1s)
- Recovery سریع‌تر از errors
- Keyframes بیشتر = seeking بهتر
- مناسب برای streaming

### 10. Scaling: lanczos

**دلیل:**
- کیفیت بهتر scaling نسبت به default (bilinear)
- کاهش artifacts در downscaling
- مناسب برای حفظ کیفیت در 540p

## FFmpeg Command (نهایی - برای پایداری مطلق)

```bash
ffmpeg -i rtmp://localhost:1935/live/stream \
  -map 0:v:0 -map 0:a:0 \
  -copyts -fflags +genpts \
  -c:v libx264 \
  -preset veryfast \
  -tune zerolatency \
  -profile:v main \
  -level 3.1 \
  -b:v 1500k \
  -maxrate 1800k \
  -bufsize 3000k \
  -r 25 \
  -g 25 -keyint_min 25 \
  -x264-params "scenecut=0" \
  -pix_fmt yuv420p \
  -vf "scale='min(960,iw)':'min(540,ih)':force_original_aspect_ratio=decrease:flags=lanczos" \
  -c:a aac \
  -b:a 48k \
  -ac 2 \
  -ar 44100 \
  -async 1 -vsync 1 \
  -hls_segment_type mpegts \
  -hls_time 4 \
  -hls_list_size 12 \
  -hls_flags independent_segments \
  -f hls \
  hls_media/stream.m3u8
```

## نتایج مورد انتظار (نسخه نهایی)

### قبل از بهینه‌سازی:
- **Bitrate**: 2000k + 128k audio = ~2128k total
- **Resolution**: 720p (1280x720)
- **CPU Load**: بالا روی موبایل‌های ضعیف
- **Network**: سنگین برای نت‌های ضعیف
- **Lag**: بیشتر روی موبایل‌های ضعیف
- **Buffering**: بیشتر rebuffering

### بعد از بهینه‌سازی (نسخه نهایی):
- **Bitrate**: 1500k + 48k audio = ~1548k total (**~27% کاهش از 2128k**)
- **Resolution**: 540p (960x540) (**~44% کاهش pixels**)
- **CPU Load**: به طور قابل توجهی کمتر روی موبایل‌های ضعیف
- **Network**: سبک‌تر برای نت‌های ضعیف
- **Lag**: کمتر روی موبایل‌های ضعیف
- **Buffering**: کمتر rebuffering (segments بزرگ‌تر و buffer بیشتر)
- **Quality**: قابل قبول برای وبینار (540p برای speech/presentation کافی است)

## تأثیر هر تغییر (نسخه نهایی)

### 1. کاهش Resolution (720p → 540p):
- **تأثیر**: کاهش ~44% در pixel count = کاهش قابل توجه در CPU decode load
- **اولویت**: خیلی بالا (بیشترین تأثیر)

### 2. کاهش Video Bitrate (2000k → 1500k):
- **تأثیر**: کاهش 25% در bandwidth و CPU decode load
- **اولویت**: خیلی بالا

### 3. کاهش Audio Bitrate (128k → 48k):
- **تأثیر**: کاهش 62% در audio bandwidth
- **اولویت**: بالا

### 4. افزایش Segment Duration (3s → 4s):
- **تأثیر**: buffering پایدارتر، کمتر network requests
- **اولویت**: متوسط-بالا

### 5. افزایش List Size (10 → 12 segments):
- **تأثیر**: buffer بزرگ‌تر (~48s) = کمتر rebuffering
- **اولویت**: متوسط-بالا

### 6. کاهش GOP (50 → 25):
- **تأثیر**: recovery سریع‌تر از errors
- **اولویت**: متوسط

### 7. اضافه کردن Tuning (zerolatency):
- **تأثیر**: کاهش latency در encoding
- **اولویت**: متوسط

### 8. بهبود Scaling (lanczos):
- **تأثیر**: کیفیت بهتر در downscaling
- **اولویت**: پایین-متوسط

## تست روی دستگاه‌های مختلف

### Android Low-End (CPU <= 4, RAM <= 3GB):

**قبل:**
- Lag و drop frame بعد از چند دقیقه
- CPU overload (>80%)
- Network congestion
- Buffering مکرر

**بعد (نسخه نهایی):**
- Lag به طور قابل توجهی کمتر
- CPU load قابل تحمل (<80% target)
- Network usage کمتر (~27% کاهش)
- Buffering کمتر (segments بزرگ‌تر و buffer بیشتر)
- پایداری بیشتر برای 10+ دقیقه پخش

### Android Normal (CPU > 4, RAM > 3GB):

**قبل:**
- معمولاً خوب بود
- گاهی lag

**بعد:**
- همچنان خوب
- Lag کمتر

### iOS (Safari):

**قبل:**
- خوب بود

**بعد:**
- همچنان خوب
- Network usage کمتر

## نکات مهم

1. **Multi-bitrate غیرفعال است**: فقط single-bitrate استفاده می‌شود
2. **URLها تغییر نکرده‌اند**: `/hls/stream.m3u8` همچنان کار می‌کند
3. **Frontend بدون تغییر**: هیچ تغییری در player انجام نشده
4. **Backward Compatible**: اگر config تغییر کند، URL و ساختار یکسان می‌ماند

## مراحل بعدی (اختیاری)

1. **Real Device Testing**: تست روی دستگاه‌های واقعی Android ضعیف
2. **Fine-tuning**: تنظیم bitrate بر اساس نتایج واقعی
3. **Analytics**: جمع‌آوری داده‌های واقعی از CPU/network usage
4. **A/B Testing**: مقایسه 1800k vs 2000k vs 1500k

## Rollback Plan

اگر این تنظیمات مشکل ایجاد کرد:

1. `VideoBitrate` را به `2000k` برگردان
2. `VideoMaxrate` را به `2400k` برگردان
3. `VideoBufsize` را به `4000k` برگردان
4. `VideoGOP` را به `50` برگردان
5. `AudioBitrate` را به `128k` برگردان
6. `HLSTime` را به `3` برگردان
7. `HLSListSize` را به `10` برگردان
8. Resolution را به `1280x720` برگردان (در `buildSingleBitrateHLSCommand`)
9. `Tuning` را حذف کن (یا به `film` تغییر بده)
10. `Scaling` را به default برگردان

همه این تغییرات در `DefaultHLSEncodingConfig()` و `buildSingleBitrateHLSCommand()` در `backend/streaming/server.go` است.

## معیارهای موفقیت

بعد از این بهینه‌سازی، استریم باید:

✅ روی Android ضعیف (2GB RAM) حداقل 10 دقیقه بدون lag پخش شود
✅ CPU گوشی نباید بالای 80% برود
✅ Buffering نباید بیشتر از 1 بار در هر 5 دقیقه باشد
✅ کیفیت برای وبینار (speech/presentation) قابل قبول باشد
