# معماری فعلی سیستم استریمینگ - مستندات فنی

## 📋 خلاصه اجرایی

این مستندات معماری فعلی سیستم استریمینگ را قبل از بهینه‌سازی شرح می‌دهد. هدف: درک کامل جریان داده از ورودی تا خروجی HLS و HTTP-FLV.

---

## 🔄 مسیر استریم از ورودی تا خروجی

### 1. ورودی استریم

**منبع**: فایل ویدیو (`video1.mp4`)
- **مسیر**: `./videos/video1.mp4`
- **مدت زمان**: 1 ساعت 43 دقیقه 36 ثانیه (6216 ثانیه)
- **فرمت**: MP4 (H.264 video + AAC audio)

**فرآیند Ingest**:
```
Video File (video1.mp4)
    ↓
Go Backend (StartFilePublisher)
    ↓
Read Packets (Real-time)
    ↓
RTMP Server (localhost:1935/live/stream)
```

**کد مربوطه**: `backend/streaming/server.go` - `StartFilePublisher()`

---

### 2. تبدیل به RTMP

**پروتکل**: RTMP (Real-Time Messaging Protocol)
- **پورت**: 1935
- **URL**: `rtmp://localhost:1935/live/stream`
- **نقش**: ورودی مشترک برای HLS و HTTP-FLV

**فرآیند**:
```go
// backend/streaming/server.go - StartFilePublisher()
conn, err := rtmp.Dial(rtmpURL)  // اتصال به RTMP server
file, err := avutil.Open(filePath)  // باز کردن فایل ویدیو
conn.WriteHeader(streams)  // ارسال header
conn.WritePacket(pkt)  // ارسال پکت‌ها به صورت real-time
```

**ویژگی‌ها**:
- پکت‌ها با سرعت real-time ارسال می‌شوند
- Timestamp های اصلی حفظ می‌شوند
- همیشه از ابتدای فایل (time 0) شروع می‌شود

---

### 3. تبدیل RTMP به HLS (برای موبایل)

**فرآیند**: FFmpeg process جداگانه
- **ورودی**: `rtmp://localhost:1935/live/stream`
- **خروجی**: `hls_media/stream.m3u8` + segments `.ts`

**کامند FFmpeg فعلی** (قبل از بهینه‌سازی):

```bash
ffmpeg -i rtmp://localhost:1935/live/stream \
  -map 0:v:0 \
  -map 0:a:0 \
  -copyts \
  -fflags +genpts \
  -c:v copy \                    # ❌ PROBLEM: Video copy (bitrate بالا)
  -c:a aac \
  -b:a 128k \
  -ac 2 \
  -ar 44100 \
  -async 1 \
  -vsync 1 \
  -hls_segment_type mpegts \
  -hls_time 4 \                  # هر segment 4 ثانیه
  -hls_list_size 10 \            # نگه داشتن 10 segment
  -hls_flags delete_segments+program_date_time \
  -f hls \
  hls_media/stream.m3u8
```

**مشکلات فعلی**:
1. **`-c:v copy`**: ویدیو بدون re-encode کپی می‌شود
   - Bitrate اصلی حفظ می‌شود (ممکن است بالا باشد)
   - برای موبایل‌های ضعیف decode سنگین است
   - باعث drop frame و کند شدن تصویر می‌شود

2. **`hls_time 4`**: هر segment 4 ثانیه
   - Startup latency: حداقل 4 ثانیه (یک segment)
   - Latency معمول: 12-16 ثانیه (3-4 segment)

3. **`hls_list_size 10`**: فقط 10 segment نگه داشته می‌شود
   - مناسب برای live streaming
   - اما اگر کاربر دیرتر join کند، ممکن است segment های اول را از دست بدهد

**کد مربوطه**: `backend/streaming/server.go` - `startHLSProcess()`

---

### 4. تبدیل RTMP به HTTP-FLV (برای دسکتاپ)

**فرآیند**: Direct streaming از RTMP channel
- **ورودی**: RTMP channel (pubsub queue)
- **خروجی**: HTTP-FLV stream

**مسیر**:
```
RTMP Channel (pubsub.Queue)
    ↓
HTTP Handler (handleHTTPFLV)
    ↓
FLV Muxer
    ↓
HTTP Response (video/x-flv)
```

**ویژگی‌ها**:
- بدون re-encode (direct copy)
- Latency پایین (5-10 ثانیه)
- مناسب برای دسکتاپ (Windows/Mac)

**کد مربوطه**: `backend/streaming/server.go` - `handleHTTPFLV()`

---

### 5. سرویس دهی HLS

**مسیر فایل‌ها**:
- Playlist: `hls_media/stream.m3u8`
- Segments: `hls_media/stream*.ts`

**HTTP Server**:
- **Port**: 8089 (Go HTTP server)
- **URL**: `http://localhost:8089/hls/stream.m3u8`

**Nginx Proxy**:
- **URL عمومی**: `https://webinar.sianacademy.com/hls/stream.m3u8`
- **Proxy**: `proxy_pass http://localhost:8089/hls/;`

**Headers مهم**:
```nginx
Content-Type: application/vnd.apple.mpegurl (برای .m3u8)
Content-Type: video/MP2T (برای .ts)
Cache-Control: no-cache
Access-Control-Allow-Origin: *
```

**کد مربوطه**:
- Go: `backend/streaming/server.go` - `Start()` - HLS handler
- Nginx: `nginx.conf` - `location /hls/`

---

### 6. سرویس دهی HTTP-FLV

**مسیر**:
- **URL**: `https://webinar.sianacademy.com/live/stream`
- **Proxy**: `proxy_pass http://localhost:8089;`

**Headers**:
```nginx
Content-Type: video/x-flv
Access-Control-Allow-Origin: *
```

**کد مربوطه**:
- Go: `backend/streaming/server.go` - `handleHTTPFLV()`
- Nginx: `nginx.conf` - `location /live/`

---

## 📊 جدول مقایسه HLS و HTTP-FLV

| ویژگی | HLS (موبایل) | HTTP-FLV (دسکتاپ) |
|-------|--------------|-------------------|
| **ورودی** | RTMP → FFmpeg | RTMP Channel (direct) |
| **Re-encode** | ❌ فعلاً copy (باید encode شود) | ❌ Copy (بدون re-encode) |
| **Latency** | 10-30s (با hls_time=4) | 5-10s |
| **Bitrate** | ❌ بالا (copy از اصلی) | ✅ اصلی (copy) |
| **موبایل** | ✅ Native support | ❌ نیاز به FLV.js |
| **دسکتاپ** | ⚠️ نیاز به HLS.js | ✅ FLV.js |
| **URL** | `/hls/stream.m3u8` | `/live/stream` |

---

## 🔧 تنظیمات کلیدی فعلی

### FFmpeg برای HLS

| پارامتر | مقدار فعلی | توضیح |
|---------|-----------|-------|
| `-c:v` | `copy` | ❌ مشکل: باید encode شود |
| `-c:a` | `aac` | ✅ درست |
| `-b:a` | `128k` | ✅ مناسب |
| `-hls_time` | `4` | ⚠️ می‌تواند کمتر باشد (2-3) |
| `-hls_list_size` | `10` | ✅ مناسب |
| `-hls_flags` | `delete_segments+program_date_time` | ✅ درست |

### HTTP Server

| تنظیمات | مقدار | توضیح |
|---------|------|-------|
| **Port** | 8089 | Go HTTP server |
| **HLS Path** | `hls_media/` | مسیر segments |
| **Cache Headers** | `no-cache` | ✅ درست |

### Nginx

| تنظیمات | مقدار | توضیح |
|---------|------|-------|
| **HLS Proxy** | `http://localhost:8089/hls/` | ✅ درست |
| **FLV Proxy** | `http://localhost:8089` | ✅ درست |
| **Buffering** | `off` | ✅ مناسب برای live |

---

## ⚠️ مشکلات شناسایی شده

### 1. HLS با `-c:v copy`

**مشکل**:
- Bitrate اصلی حفظ می‌شود
- برای موبایل‌های ضعیف decode سنگین است
- باعث drop frame و کند شدن تصویر می‌شود

**راه‌حل**: استفاده از `libx264` با تنظیمات بهینه

---

### 2. Startup Latency بالا

**مشکل**:
- `hls_time 4` → حداقل 4 ثانیه تا اولین تصویر
- Latency معمول: 12-16 ثانیه

**راه‌حل**: کاهش `hls_time` به 2-3 ثانیه

---

### 3. حالت "فقط صدا بدون تصویر"

**مشکل**:
- Bitrate بالا → decode کند → تصویر lag می‌کند
- صدا معمولاً سبک‌تر است و زودتر decode می‌شود

**راه‌حل**: کاهش bitrate ویدیو با encode بهینه

---

## 📝 خلاصه

**مسیر فعلی استریم**:
```
Video File → Go Backend → RTMP Server
                              ├─→ FFmpeg → HLS (copy) ❌
                              └─→ HTTP-FLV (direct) ✅
```

**مشکلات اصلی**:
1. HLS از `-c:v copy` استفاده می‌کند (bitrate بالا)
2. `hls_time 4` باعث latency بالا می‌شود
3. برای موبایل‌های ضعیف decode سنگین است

**اقدامات بعدی**:
1. تغییر `-c:v copy` به `libx264` با تنظیمات بهینه
2. کاهش `hls_time` به 2-3 ثانیه
3. تنظیم bitrate مناسب برای موبایل (1500-2500k)

---

*تاریخ ایجاد: 2024*
*نسخه: قبل از بهینه‌سازی*
