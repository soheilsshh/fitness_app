# پرامپت‌های پایپ‌لاین ثبت غذا با صدا

سند مرجع برای **تمام لایه‌هایی که پرامپت (دستورالعمل مدل) دریافت می‌کنند** در مسیر ویس → غذا → کالری.

نسخهٔ پرامپت Gemini در لاگ‌ها: `nutrition-v9-layer8-gemini` (`backend/internal/service/ai/persona.go`)

---

## خلاصه: کدام لایه پرامپت دارد؟

| لایه | نام | پرامپت؟ | مدل / سرویس |
|------|-----|---------|-------------|
| ۰ | کلاینت (ضبط ویس) | ❌ | — |
| ۱ | API / ارکستراسیون | ❌ | FastAPI / Go Gin |
| ۲ | دیکود صدا (PCM) | ❌ | PyAV |
| **۳** | **ASR (گفتار → متن)** | **✅** | GapGPT `gapgpt/whisper-1` (پیش‌فرض) |
| ۳ (legacy) | Whisper محلی | ❌ حذف شد | — |
| ۴ | اصلاح املا | ❌ | قوانین قطعی `text.py` |
| ۵ | عدد / واحد / توکن | ❌ | `numbers.py` + `units.py` |
| ۶ | تطبیق غذا | ❌ | `foods_db.py` + rapidfuzz |
| ۷ | گرم و kcal | ❌ | `FoodMatch.resolve` |
| ۸ | JSON خروجی | ❌ | ساختار داده — ورودی لایه ۹ |
| **۹** | **Gemini داور** | **✅** | GapGPT / OpenAI-compatible chat |

**قانون:** لایه ۳ ASR از GapGPT Whisper API است (بدون مدل محلی). لایه ۹ Gemini پرامپت جدا دارد.

---

## لایه ۳ — ASR (GapGPT Whisper)

**فایل:** `app/asr.py` — کلاس `NutritionASR`  
**Endpoint:** `POST /transcribe` و `POST /log-meal`

**متغیرهای محیطی** (`fitness_app/backend/.env`):

```env
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.gapgpt.app/v1
GAPGPT_WHISPER_MODEL=gapgpt/whisper-1
```

```python
client.audio.transcriptions.create(model="gapgpt/whisper-1", file=audio_file)
```

بدون `initial_prompt`. بعد از ASR، `correct_asr_text()` (لایه ۴) اعمال می‌شود.

| ویس در Fitino | مسیر |
|---------------|------|
| ثبت غذا | Go → `/log-meal` |
| تمرین / یادداشت | Go → `/transcribe` |

---

## لایه ۹ — پرامپت Gemini (داور JSON)

**فایل‌ها:**
- `backend/internal/service/ai/generator.go` — `calorieRefineSystemPrompt`
- `backend/internal/service/ai/calorie_api.go` — `RefineCalorieFoodLog`, `layer8ForGemini`
- `backend/internal/service/ai/schemas.go` — `CalorieLogRefineJSONSchema`

**زمان فراخوانی:** فقط اگر `calorieLogNeedsGemini()` true باشد (ابهام، نفی، candidate، unmatched، صدای کم‌اعتماد، چند وعده، …).

**مدل:** از تنظیمات `OPENAI_MODEL` در `.env` (معمولاً Gemini از طریق GapGPT).

**مهم:** Gemini **صدای خام نمی‌بیند** و **حق ساخت kcal/گرم ندارد**.

---

### System prompt (لایه ۹)

```
تو داور ثبت غذای فیتینو هستی. ورودی JSON لایه ۸ است (raw_text, items, candidates, unmatched, confidence). صدای خام نمی‌بینی.

قانون: کالری، گرم و ماکرو را نساز و غذا را در کاتالوگ سرچ نکن.
فقط می‌توانی:
1) انتخاب candidate: choose_food_ids فقط از food_idهای همین JSON (items یا candidates).
2) نفی: drop_item_indexes فقط برای همان آیتمی که «نخوردم / بدون / نه» به آن برمی‌گردد.
3) اصلاح جمله: اگر وسط حرف همان غذا عوض شد، ایندکس قبلی را drop کن؛ food_id درست را از candidates/items انتخاب کن.
4) چند وعده: item_meals با food_id + breakfast|lunch|dinner|snack. اگر فقط یک وعده است آرایه را خالی بگذار.
5) questions: اگر بین چند food_id مطمئن نیستی، یا غذایی در unmatched مهم است، سؤال بپرس و id انتخاب نکن.
هر سؤال یک شیء است: {"text":"...","options":["...","...","..."]}.
برای هر سؤال دقیقاً ۳ گزینهٔ کوتاه فارسی بگذار — از items/candidates/unmatched یا انواع رایج ایرانی همان غذا (مثلاً سوپ: سوپ سبزیجات، سوپ جو، سوپ مرغ).
کالری، گرم، مقدار عددی ساختگی، یا food_id جدید در سؤال یا گزینه نگذار.
اگر چند ابهام جدا هست چند سؤال جدا بساز؛ هر سؤال فقط یک ابهام.
6) notes کوتاه.

قانون بحرانی drop:
هر آیتم committed را جداگانه قضاوت کن.
آیتم committed را فقط وقتی drop کن که یکی از این سه برقرار باشد:
1) raw_text همان آیتم را صریحاً نفی کند (نخوردم / بدون / نه مربوط به همان غذا).
2) raw_text همان آیتم را صریحاً اصلاح یا جایگزین کند (منظورم / بلکه / به جاش).
3) شواهد معنایی قوی باشد که extractor عبارت گفته‌شده را به غذای غلط match کرده (spoken با food نمی‌خواند).
در غیر این صورت KEEP. حدس، تکراری بودن، یا غذای unmatched دیگر کافی نیست.
هرگز یک آیتم committed را فقط به‌خاطر این drop نکن که غذای دیگری در raw_text نامشخص، unmatched یا غایب است.
غذای اصلی گم‌شده دلیل حذف بقیهٔ غذاهای تأییدشده نیست.
اگر غذای مهمی unmatched است: همهٔ آیتم‌های committed مستقل را نگه دار، حذف‌شان نکن، و در صورت نیاز برای همان غذای unmatched سؤال بساز.
کلمات unmatched دور یک غذا ممکن است زیرنوع، روش پخت، قید، مقدار، صفت یا بافت باشند — نه دلیل drop.
اگر خودِ غذای committed در متن صریحاً آمده، KEEP کن مگر متن همان غذا را نفی یا جایگزین کند.

مثال: «ماکارونی با گوشت چرخ کرده»
committed: ماکارونی، گوشت. unmatched: چرخ، کرده.
هر دو را KEEP کن. «چرخ کرده» گوشت committed را باطل نمی‌کند. گوشت را drop نکن.

مثال: raw_text «یک پرس چلو کباب کوبیده خوردم، دو سیخ کباب بود، یک بشقاب برنج و یک گوجه کبابی.»
committed: برنج، گوجه. unmatched: کباب کوبیده، سیخ کباب.
درست: برنج و گوجه را KEEP کن. کباب را جدا با questions رسیدگی کن. drop_item_indexes را برای برنج/گوجه پر نکن.

food_id جدید نساز. اگر ابهامی نیست آرایه‌ها را خالی بگذار.
```

---

### User message (لایه ۹)

پیشوند ثابت + JSON لایه ۸ (بدون kcal در candidates؛ items فقط `food_id`, `food`, `spoken`, `meal`, `quantity`, `unit`):

```
JSON استخراج قطعی ثبت غذا:
{...}
```

**ساختار JSON ورودی (`layer8ForGemini`):**

```json
{
  "raw_text": "متن بعد از اصلاح املا",
  "items": [
    {
      "food_id": "…",
      "food": "نام کاتالوگ",
      "spoken": "همان‌طور که کاربر گفت",
      "meal": "breakfast",
      "quantity": 2,
      "unit": "عدد"
    }
  ],
  "candidates": [
    {
      "food_id": "…",
      "food": "…",
      "spoken": "…",
      "quantity": null,
      "unit": null
    }
  ],
  "unmatched": ["توکن‌هایی که غذا نشدند"],
  "confidence": {
    "level": "high",
    "avg_logprob": -0.21,
    "compression_ratio": 1.59
  }
}
```

---

### خروجی مورد انتظار (JSON Schema)

اسکیما: `calorie_log_refine`

```json
{
  "drop_item_indexes": [0],
  "choose_food_ids": ["af15eb9f84c00163ea3f7ee11e07d798"],
  "item_meals": [
    { "food_id": "…", "meal": "lunch" }
  ],
  "questions": [
    {
      "text": "چه نوع سوپی میل کردید؟",
      "options": ["سوپ سبزیجات", "سوپ جو", "سوپ مرغ"]
    }
  ],
  "notes": "توضیح کوتاه اختیاری"
}
```

---

### پرامپت‌های کمکی (retry) — لایه ۹

اگر API از `json_schema` پشتیبانی نکند یا JSON ناقص برگردد، به system prompt **الحاق** می‌شود:

**Retry ۱ (اسکیما پشتیبانی نشد):**

```
فقط یک JSON معتبر مطابق اسکیما برگردان.
```

**Retry ۲ (JSON ناقص / قطع‌شده):**

```
خروجی قبلی ناقص یا نامعتبر بود. فقط یک JSON کامل و فشرده مطابق اسکیما برگردان. اعداد را کامل بنویس (نه مثل 10. بدون رقم اعشار).
```

**پارامترهای درخواست API:**

| پارامتر | مقدار |
|---------|--------|
| `temperature` | `0.3` |
| `max_tokens` | `8192` |
| `response_format` | `json_schema` (strict) یا `json_object` در retry |

---

## شرط فراخوانی Gemini (`calorieLogNeedsGemini`)

Gemini صدا زده می‌شود اگر **هر یک** از این‌ها برقرار باشد:

- `low_confidence: true`
- وجود `candidates` یا `unmatched`
- `possible_duplicate` روی یک item
- متن شامل: `نخوردم`, `نخورد`, `بدون`, `نه`, `اشتباه`, `بلکه`, `در واقع`, `منظورم`, `غلط`, `به جاش`, …
- بیش از یک وعده در متن (`صبحانه`, `ناهار`, `شام`, …)

اگر ویس تمیز و بدون ابهام باشد، لایه ۹ **اجرا نمی‌شود**.

---

## لایه‌های بدون پرامپت (مرجع کوتاه)

این لایه‌ها **قوانین کد** هستند، نه پرامپت LLM:

| لایه | فایل اصلی | نقش |
|------|-----------|-----|
| ۴ | `app/text.py` | `correct_asr_text`, `_PHRASE_FIXES`, `_COLLOQUIAL_WORDS` |
| ۴/۶ | `app/negation.py` | `filter_negated_items`, `negated_phrases` |
| ۵ | `app/numbers.py`, `app/units.py`, `app/extract.py` | عدد، واحد، اسکن توکن |
| ۶–۷ | `app/foods_db.py` | match، alias، گرم، kcal |
| ۸ | `app/extract.py` + `app/main.py` | مونتاژ JSON پاسخ `/log-meal` |

---

## نگاشت فایل → پرامپت

```
fa-calorie-api/
  app/asr.py                    → GapGPT Whisper (لایه ۳)
  app/text.py                   → بدون پرامپت (لایه ۴)
  app/negation.py               → بدون پرامپت (لایه ۴/۶)
  app/extract.py                → بدون پرامپت (لایه ۵–۸)

fitness_app/backend/
  internal/service/ai/generator.go   → calorieRefineSystemPrompt (لایه ۹)
  internal/service/ai/calorie_api.go → user JSON + شرط Gemini
  internal/service/ai/transcribe.go  → /transcribe برای سایر ویس‌ها
```

---

## جریان کامل پیام‌ها

```
[ویس]
   → لایه ۳: GapGPT whisper-1 → متن فارسی
   → لایه ۴–۸: قوانین قطعی → JSON
   → (اگر نیاز) لایه ۹: Gemini روی JSON
   → hydrate از کاتالوگ MySQL → FoodLogSchema → UI
```

---

*آخرین هم‌خوانی: مدل واحد GapGPT Whisper — بدون ASR محلی.*
