# راهنمای استفاده از Shenava ASR — تبدیل صوت به متن فارسی

این سند توضیح می‌دهد مدل **Shenava Koochik v1.0** در Fitino چطور پیاده‌سازی شده و چطور همان را در یک پروژه دیگر دوباره استفاده کنید.

---

## ۱) مدل چیست؟

| مورد | مقدار |
|------|--------|
| نام | Shenava Koochik v1.0 |
| کاربرد | تشخیص گفتار فارسی آفلاین (ASR / STT) |
| فرمت | `model.onnx` + `tokens.txt` (sherpa-onnx, CTC / NeMo FastConformer) |
| حجم تقریبی | ~۴۵۹ MB |
| نرخ نمونه‌برداری | **۱۶ kHz، مونو** |
| لایسنس مدل | Apache-2.0 |
| مخزن Hugging Face | [`Reza2kn/Shenava-Koochik-v1.0-sherpa-onnx`](https://huggingface.co/Reza2kn/Shenava-Koochik-v1.0-sherpa-onnx) |
| آینه | [`PersianML/Shenava-Koochik-v1.0-sherpa-onnx`](https://huggingface.co/PersianML/Shenava-Koochik-v1.0-sherpa-onnx) |

فایل‌های ضروری وزن‌ها:

```
model.onnx
tokens.txt
```

اختیاری ولی توصیه‌شده: **ITN فارسی** (`persian_itn` / `itn`) — مدل اعداد را به صورت گفتاری می‌گوید (مثلاً «دو») و ITN آن‌ها را به رقم تبدیل می‌کند (مثلاً `۲`).

### نکته مهم مدل

- نرمال‌سازی **per-feature** را برای این export فعال نکنید؛ متادیتای ONNX عمداً `normalize_type` را خالی گذاشته است.
- ورودی ایده‌آل: WAV با ۱۶ kHz و یک کانال.

---

## ۲) ساختار در Fitino (مرجع)

```
fitness_app/ml/
  pyproject.toml              # پکیج نصبی shenava-asr
  README.md
  models/
    shenava-koochik-v1.0/
      model.onnx              # وزن‌ها (معمولاً gitignore)
      tokens.txt
  src/shenava_asr/
    __init__.py
    __main__.py               # python -m shenava_asr
    audio.py                  # خواندن WAV / تبدیل با ffmpeg
    itn.py                    # تبدیل عدد گفتاری → رقم
    paths.py                  # مسیر مدل + SHENAVA_MODEL_DIR
    recognizer.py             # ShenavaASR wrapper
    cli.py                    # CLI + خروجی --json
    download.py               # دانلود از Hugging Face
```

در بک‌اند Go (اختیاری — فقط اگر بک‌اند جدا دارید):

- `internal/service/ai/shenava.go` → subprocess: `python -m shenava_asr <file> --json`
- `internal/service/ai/transcribe.go` → اول Shenava، در صورت نیاز fallback به Whisper
- کانفیگ: `asr.shenava_enabled` / env `ASR_SHENAVA_ENABLED`

در فرانت (اختیاری):

- ضبط مرورگر معمولاً `webm` است → قبل از آپلود به **WAV ۱۶kHz mono** تبدیل می‌شود (`frontend/src/lib/audio/wav.js`).

---

## ۳) حداقل کار برای پروژه جدید (فقط Python)

### ۳.۱ کپی یا لینک پکیج

یکی از این‌ها:

**الف) کپی پوشه `fitness_app/ml` به پروژه جدید**

**ب) نصب editable از همان مسیر Fitino**

```bash
python -m pip install -e "E:/fitino/fitness_app/ml"
python -m pip install -e "E:/fitino/fitness_app/ml[download]"   # برای دانلود مدل
```

نیازمندی‌ها: Python ≥ 3.10، پکیج‌های `sherpa-onnx`، `soundfile`، `numpy`.

### ۳.۲ تهیه وزن‌ها

```bash
# از داخل ml یا بعد از نصب پکیج:
shenava-download-model

# یا دستی:
# دانلود model.onnx و tokens.txt از Hugging Face
# بگذارید در:
#   <ml>/models/shenava-koochik-v1.0/
```

یا مسیر دلخواه:

```bash
# Windows
set SHENAVA_MODEL_DIR=D:\models\shenava-koochik-v1.0

# Linux/macOS
export SHENAVA_MODEL_DIR=/path/to/shenava-koochik-v1.0
```

پوشه باید شامل `model.onnx` و `tokens.txt` باشد.

### ۳.۳ استفاده در کد

```python
from shenava_asr import ShenavaASR

# یک‌بار بسازید و چند جا استفاده کنید (لود مدل گران است)
asr = ShenavaASR()  # یا ShenavaASR(model_dir=r"D:\models\shenava-koochik-v1.0")

text = asr.transcribe_file("speech.wav")
print(text)

# از آرایه نمونه‌ها:
# text = asr.transcribe_waveform(samples_float32, sample_rate=16000)
```

فقط ITN:

```python
from shenava_asr import itn
print(itn("دو تا تخم مرغ"))  # → «۲ تا تخم مرغ»
```

### ۳.۴ CLI

```bash
shenava-transcribe speech.wav
shenava-transcribe speech.wav --json
# خروجی JSON:
# {"text": "..."}

python -m shenava_asr speech.wav --json --model-dir "D:\models\shenava-koochik-v1.0"
```

---

## ۴) صدا از مرورگر (Web)

`MediaRecorder` معمولاً `audio/webm` می‌دهد؛ `soundfile`/sherpa مستقیم webm را خوب نمی‌خواند مگر `ffmpeg` روی سرور باشد.

**پیشنهاد Fitino:** در کلاینت به WAV ۱۶kHz mono تبدیل کنید، بعد آپلود کنید.

الگوی کلی:

1. `getUserMedia` → `MediaRecorder`
2. blob وبم را با `AudioContext.decodeAudioData` بخوانید
3. با `OfflineAudioContext` به ۱۶۰۰۰ Hz و mono رندر کنید
4. به WAV ۱۶-bit PCM encode کنید
5. `FormData` با نام مثلاً `voice-note.wav` بفرستید

مرجع پیاده‌سازی: `fitness_app/frontend/src/lib/audio/wav.js`  
تابع مهم: `blobToWav16kMono(blob)`.

اگر کلاینت webm می‌فرستد، روی سرور `ffmpeg` لازم است (`audio.py` در صورت نیاز صدا می‌زند).

---

## ۵) فراخوانی از زبان دیگر (Go / Node / …)

ساده‌ترین قرارداد پایدار: subprocess + JSON.

```bash
python -m shenava_asr /tmp/audio.wav --json
```

خروجی stdout:

```json
{"text": "متن فارسی تشخیص‌داده‌شده"}
```

### مثال Go (خلاصه همان Fitino)

```go
cmd := exec.CommandContext(ctx, "python", "-m", "shenava_asr", wavPath, "--json")
out, err := cmd.Output()
// json.Unmarshal → struct { Text string `json:"text"` }
```

تنظیمات پیشنهادی env:

| متغیر | معنی |
|--------|------|
| `ASR_SHENAVA_ENABLED` | روشن/خاموش کردن مسیر محلی |
| `ASR_PYTHON` | مسیر باینری پایتون (`python` / `python3` / مسیر کامل) |
| `SHENAVA_MODEL_DIR` | پوشه وزن‌ها |

Timeout پیشنهادی برای لود + inference کوتاه: ۶۰–۹۰ ثانیه (اولین بار لود ONNX کندتر است).

---

## ۶) API سطح بالا در پکیج

| نماد | کار |
|------|-----|
| `ShenavaASR` | Recognizer قابل‌استفاده مجدد |
| `ShenavaASR.transcribe_file(path)` | فایل → متن |
| `ShenavaASR.transcribe_waveform(samples, sr)` | آرایه float32 → متن |
| `transcribe_file` / `transcribe_waveform` | one-shot (هر بار مدل را لود می‌کند — برای پروداکشن توصیه نمی‌شود) |
| `itn(text)` | عدد گفتاری → رقم فارسی |
| `default_model_dir()` / `resolve_model_paths()` | مسیر وزن‌ها |
| `shenava-download-model` | دانلود از HF |

سازنده:

```python
ShenavaASR(
    model_dir=None,      # یا مسیر پوشه
    num_threads=4,
    apply_itn=True,      # بعد از ASR، ITN اعمال شود
    persian_digits=True, # رقم‌های فارسی ۰–۹
)
```

زیر کاپوت: `sherpa_onnx.OfflineRecognizer.from_nemo_ctc(model=..., tokens=...)`.

---

## ۷) چک‌لیست انتقال به پروژه دیگر

1. [ ] Python ≥ 3.10
2. [ ] `pip install -e <path-to-ml>` (یا کپی `ml/` + نصب)
3. [ ] `model.onnx` + `tokens.txt` در `models/shenava-koochik-v1.0` یا `SHENAVA_MODEL_DIR`
4. [ ] تست: `python -m shenava_asr sample.wav --json`
5. [ ] ورودی صوتی ۱۶ kHz mono WAV (یا ffmpeg روی PATH)
6. [ ] در سرویس طولانی‌عمر: **یک instance از `ShenavaASR` بسازید و reuse کنید**
7. [ ] فایل‌های `.onnx` را در git commit نکنید (حجم زیاد) — دانلود در deploy

---

## ۸) عیب‌یابی سریع

| مشکل | راه حل |
|------|--------|
| `FileNotFoundError` برای onnx/tokens | `shenava-download-model` یا تنظیم `SHENAVA_MODEL_DIR` |
| `No module named shenava_asr` | همان venv که سرویس استفاده می‌کند را `pip install -e` کنید |
| خروجی خالی | سکوت / نویز / نرخ نمونه‌برداری اشتباه؛ با WAV ۱۶kHz واقعی تست کنید |
| خطای decode webm/ogg | ffmpeg نصب شود یا از کلاینت WAV بفرستید |
| خیلی کند در اولین درخواست | طبیعی است (لود ~۴۵۹MB)؛ instance را warm نگه دارید |
| متن با اعداد گفتاری | `apply_itn=True` (پیش‌فرض) |

---

## ۹) حداقل اسکلت برای پروژه جدید (بدون Fitino)

اگر فقط می‌خواهید از صفر کپی کنید، این کافی است:

```text
your_project/
  asr/
    pyproject.toml          # از fitness_app/ml/pyproject.toml
    src/shenava_asr/        # کل پکیج
    models/shenava-koochik-v1.0/
      model.onnx
      tokens.txt
```

```bash
cd your_project/asr
python -m pip install -e .
python -m shenava_asr path/to/audio.wav --json
```

---

## ۱۰) جریان کامل در Fitino (مرجع معماری)

```
مرورگر: ضبط → WAV 16kHz mono
    ↓ POST multipart
بک‌اند Go: ذخیره موقت → python -m shenava_asr --json
    ↓ transcript
(اختیاری) LLM برای استخراج ساختاریافته غذا/ست
    ↓
پاسخ JSON شامل transcript (+ آیتم‌های استخراج‌شده)
فرانت: نمایش «متن تشخیص‌داده‌شده»
```

برای پروژه دیگر اگر فقط STT می‌خواهید، همان سه خط پایتون/`--json` کافی است؛ لایه LLM اختیاری است.

---

## ۱۱) منابع

- پکیج محلی: `fitness_app/ml/`
- README کوتاه: `fitness_app/ml/README.md`
- مدل HF: https://huggingface.co/Reza2kn/Shenava-Koochik-v1.0-sherpa-onnx
- Runtime: https://github.com/k2-fsa/sherpa-onnx
- مستندات sherpa-onnx: https://k2-fsa.github.io/sherpa/onnx/
