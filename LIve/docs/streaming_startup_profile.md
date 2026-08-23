# Streaming Startup Profile

این مستندات مسیر کامل startup استریم را از لحظه کلیک کاربر تا اولین فریم ویدئو توضیح می‌دهد.

## مسیر Startup (User Click → First Frame)

### Frontend Timeline

1. **t0: User Click on Play Button**
   - کاربر روی دکمه "شروع پخش زنده" یا "ادامه استریم" کلیک می‌کند
   - `handlePlayAndUnmute()` فراخوانی می‌شود
   - لاگ: `[VideoPlayer] ⏱️ [STARTUP] t0=XXXms - User clicked play button`

2. **t1: URL Set**
   - URL استریم (HLS یا FLV) به `video.src` ست می‌شود
   - برای HLS: `https://webinar.sianacademy.com/hls/stream.m3u8?t=timestamp`
   - برای FLV: `https://webinar.sianacademy.com/live/stream`
   - `video.load()` فراخوانی می‌شود
   - لاگ: `[VideoPlayer] ⏱️ [STARTUP] t1=XXXms (t1-t0=XXXms) - HLS URL set`

3. **t2: loadedmetadata Event**
   - مرورگر metadata ویدئو را لود کرده است
   - `duration`, `videoWidth`, `videoHeight` در دسترس است
   - برای live streams، `duration` معمولاً `Infinity` است
   - لاگ: `[VideoPlayer] ⏱️ [STARTUP] t2=XXXms (t2-t0=XXXms, t2-t1=XXXms) - loadedmetadata event`

4. **t3: canplay Event**
   - مرورگر به اندازه کافی داده دارد که بتواند پخش را شروع کند
   - ویدئو آماده پخش است (اما هنوز پخش نشده)
   - لاگ: `[VideoPlayer] ⏱️ [STARTUP] t3=XXXms (t3-t0=XXXms, t3-t2=XXXms) - canplay event`

5. **t4: playing Event**
   - ویدئو واقعاً در حال پخش است
   - اولین فریم نمایش داده می‌شود
   - لاگ: `[VideoPlayer] ⏱️ [STARTUP] t4=XXXms (t4-t0=XXXms, t4-t3=XXXms) - playing event (playback started)`

### Backend Timeline

1. **FFmpeg Start**
   - زمانی که RTMP stream شروع می‌شود، `startHLSProcess()` فراخوانی می‌شود
   - لاگ: `⏱️ [BACKEND] FFmpeg process starting at YYYY-MM-DD HH:MM:SS.mmm for stream /live/stream`

2. **First HLS Segment Created**
   - اولین segment HLS (`.ts` file) ایجاد می‌شود
   - زمان: تقریباً `hls_time` (2 ثانیه) بعد از شروع FFmpeg
   - لاگ: `⏱️ [BACKEND] First HLS segment created at YYYY-MM-DD HH:MM:SS.mmm (X.XXs after FFmpeg start)`

## ترتیب Eventها

```
User Click (t0)
    ↓
URL Set (t1)
    ↓
[Backend: FFmpeg starts]
    ↓
[Backend: First segment created (~2s)]
    ↓
loadedmetadata (t2)
    ↓
canplay (t3)
    ↓
playing (t4) ← First frame visible
```

## Bottleneck Analysis

### Potential Bottlenecks:

1. **FFmpeg Startup Delay**
   - زمان بین شروع RTMP stream و شروع FFmpeg
   - معمولاً < 1 ثانیه

2. **First Segment Creation**
   - زمان بین شروع FFmpeg و ایجاد اولین segment
   - هدف: 2 ثانیه (با `hls_time=2`)

3. **Network Latency**
   - زمان بین ایجاد segment و دریافت توسط مرورگر
   - بستگی به شبکه دارد

4. **Browser Decode**
   - زمان بین دریافت segment و decode توسط مرورگر
   - روی موبایل‌های ضعیف می‌تواند کند باشد

### Expected Timings (Mobile):

- **t1 - t0**: < 10ms (URL set)
- **t2 - t1**: 2-5 seconds (metadata load - depends on first segment)
- **t3 - t2**: 0.5-2 seconds (canplay - depends on buffer)
- **t4 - t3**: < 1 second (playing - immediate after canplay)

**Total Startup Time (t4 - t0)**: هدف: 3-8 ثانیه روی موبایل

## FFmpeg Command (Current)

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

## Key Optimizations Applied

1. **HLS Segment Duration**: کاهش از 4s به 2s برای startup سریع‌تر
2. **Video Scaling**: Scale به max 1280x720 برای کاهش decode load
3. **Bitrate Control**: 2000k target, 2400k max برای موبایل
4. **GOP Size**: 50 frames (2 seconds at 25fps) برای seeking بهتر
5. **Profile/Level**: main@3.1 برای compatibility بیشتر
6. **Independent Segments**: برای seeking بهتر و startup سریع‌تر

## Logging

### Frontend Logs (Development Mode Only)

لاگ‌های timing فقط در محیط development (`import.meta.env.DEV === true`) فعال هستند:

- `[VideoPlayer] ⏱️ [STARTUP] t0=...` - User click
- `[VideoPlayer] ⏱️ [STARTUP] t1=...` - URL set
- `[VideoPlayer] ⏱️ [STARTUP] t2=...` - loadedmetadata
- `[VideoPlayer] ⏱️ [STARTUP] t3=...` - canplay
- `[VideoPlayer] ⏱️ [STARTUP] t4=...` - playing
- `[VideoPlayer] ⏱️ [STARTUP] Summary: Total startup time = ...ms`

### Backend Logs (Always Active)

- `⏱️ [BACKEND] FFmpeg process starting at ...`
- `⏱️ [BACKEND] First HLS segment created at ... (X.XXs after FFmpeg start)`

## Protocol Selection

- **Mobile (iOS/Android)**: HLS (`.m3u8`) - Native support
- **Desktop (Windows/Mac)**: HTTP-FLV (`.flv`) - Using flv.js

این انتخاب در `VideoPlayer.tsx` بر اساس `isIOS.current`, `isAndroid.current`, و `isDesktop.current` انجام می‌شود.
