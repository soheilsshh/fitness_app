# To-Do List — جدا کردن «دستیار هوشمند AI» از «برنامه‌های من»

> منبع: بررسی mockup پنل کاربر/مربی (۲۰۲۶-۰۸-۱۲) + بررسی واقعی کدبیس `fitness_app`.
> علامت [x] = تأیید شده که در کد وجود دارد. [ ] = هنوز ساخته نشده.
> این فایل را در طول کار آپدیت کن (تیک بزن) تا وضعیت واقعی همیشه معلوم باشد.

## فاز ۱ — اصلاح معماری (بحرانی)

- [x] آیتم مستقل «دستیار هوشمند» به سایدبار کاربر اضافه شود (با دو زیرمنو: ساخت / ویرایش با AI)
      (فایل: `frontend/src/app/(panel)/_shared/nav-config/user.js`)
- [x] دکمهٔ «ساخت فوری با AI» (`AIGenerateBar`) از هدر `my-programs/_components/MyProgramsListClient.js` حذف شد
- [x] صفحهٔ «برنامه‌های من» فقط لیست `/me/programs` رسمی را نشان می‌دهد (بدون preview پیش‌نویس AI)
- [x] مسیر مستقل کاربر ساخته شد: `app/(panel)/user/ai-programs/new/page.js` (اسکلت — فرم چندمرحله‌ای فاز ۲ است)
- [x] مسیر مستقل ویرایش کاربر ساخته شد: `app/(panel)/user/ai-programs/edit/page.js` (اسکلت)
- [x] مسیر مستقل مربی ساخته شد: `app/(panel)/coach/plans/ai-suggest/page.jsx` با `?id=` (هم‌قالب با `coach/plans/detail?id=`، نه `[id]` — چون ساختار فعلی از query param استفاده می‌کند نه dynamic segment)
- [x] دکمهٔ «پیشنهاد AI برای این برنامه» به صفحهٔ جزئیات پلن مربی اضافه شد → لینک به مسیر بالا
      (فایل: `coach/plans/detail/_components/CoachPlanDetailsClient.jsx`)
- [~] دکمهٔ شناور فعلی (`FitinoAIAssistant.jsx` FAB) دست‌نخورده باقی ماند — این یک چت پشتیبانی عمومی جداست (`/user/ai`)، نه بخش ساخت برنامه؛ تداخلی با منوی جدید ندارد پس چیزی حذف نشد (تصمیم قابل بازنگری)
- [ ] آیتم AI در سایدبار مربی — **حذف شد از برنامه**: طبق mockup، پیشنهاد AI برای مربی یک دکمهٔ داخل صفحهٔ برنامه است نه آیتم مستقل سایدبار (بالا انجام شد)

## فاز ۲ — پنل کاربر: ساخت برنامه با AI

- [x] کامپوننت `Stepper` (۴ مرحله: هدف / اطلاعات / جزئیات / پیش‌نمایش، RTL، قابل بازگشت به مراحل تکمیل‌شده)
- [x] کامپوننت `GoalCard` × ۴ (کاهش وزن، عضله‌سازی، تناسب، افزایش وزن) با border فیروزه‌ای روی انتخاب — `GoalStep.jsx`، ذخیره واقعی در `primaryGoal`/`goals` پروفایل
- [x] کامپوننت `ProfileSummaryCard` (سن/قد/وزن/جنسیت/هدف + دکمهٔ ویرایش پروفایل) — از `GET /me` می‌خواند. «سطح فعالیت» حذف شد چون هیچ فیلدی برایش در بک‌اند وجود ندارد (به‌جای فیک کردن یک مقدار، فقط ردیف‌های واقعی نمایش داده می‌شوند)
- [x] فرم جزئیات: `EquipmentSelector`, `DaysSelector` (۲ تا ۶ روز)، مدت جلسه (۲۰/۳۰/۴۵/۶۰/۹۰)، محدودیت‌ها — `DetailsStep.jsx`. محدودیت‌ها در پروفایل واقعی (`physicalLimitations`) ذخیره می‌شود؛ تجهیزات/روزها/مدت فقط برای همان یک درخواست تولید استفاده می‌شوند (پرسیستنس ندارند چون فیلد بک‌اندی برایشان وجود نداشت)
- [x] اتصال فرم به `/me/workout/generate` و `/me/nutrition/generate` با `save:false` برای پیش‌نمایش، `save:true` جدا برای ذخیره
- [x] **تغییر بک‌اند (Go):** `generateWorkoutRequest` و `AIGenerateService.GenerateWorkout` حالا `equipment`/`daysPerWeek`/`sessionMinutes` را به‌عنوان راهنمای همان یک تولید می‌پذیرند (فایل‌های `ai_generate_controller.go` و `ai_generate_service.go`) — بدون migration، چون فقط به prompt اضافه می‌شود نه دیتابیس
- [x] کامپوننت `ProgramPreview` (کارت روزها + حرکات/ست/تکرار/استراحت) با دکمه «تولید مجدد» — در `PreviewStep.jsx`. «ویرایش دستی» ساخته نشد (خارج از حد این پاس، چون نیاز به ویرایشگر جدول تمرین دارد)
- [x] اکشن نهایی «ذخیره در برنامه‌های من» → واقعاً `/me/workout/generate {save:true}` را صدا می‌زند و به جدول رسمی `workout_program` منتقل می‌شود (نیازمند اشتراک فعال با مربی — همان قانون قبلی بک‌اند)
- [ ] برچسب وضعیت روی برنامهٔ ذخیره‌شده: `AI + ذخیره‌شده` + تاریخ ایجاد — هنوز نه؛ نیاز به فیلد `source` در جدول برنامه دارد (فاز ۴/بک‌اند)
- [ ] **تست نشده در مرورگر با لاگین واقعی** — ورود با OTP روی این سیستم درست کار نمی‌کرد (جدا از تغییرات این پاس)؛ فقط با `eslint` و کامپایل موفق Next.js/Go تأیید شده

## فاز ۳ — پنل مربی: کمک‌نویس هوشمند

- [ ] تغییر متن دکمهٔ AI فعلی مربی به «پیشنهاد AI برای این برنامه»
- [ ] کامپوننت `AISuggestionDiff` (دو ستون: نسخهٔ فعلی / پیشنهاد AI، رنگ‌بندی تغییر=زرد، جدید=سبز، حذف=قرمز)
- [ ] اکشن‌های مربی: قبول همه / رد همه / قبول تکی / مقایسهٔ دقیق
- [ ] نمایش دلیل هر پیشنهاد AI (متن توضیح کنار هر آیتم)
- [ ] بعد از اعمال تغییرات، نسخهٔ جدید ساخته شود بدون حذف نسخهٔ قبلی (`VersionHistoryDrawer`)
- [ ] بک‌اند: endpoint پیشنهاد AI برای برنامهٔ موجود (متفاوت از generate خام فعلی) در `coach_program_controller.go`

## فاز ۴ — ذخیره‌سازی و رفتارهای حیاتی

- [ ] Autosave هر ۱۰ ثانیه (localStorage یا draft API) حین پر کردن فرم ساخت برنامه
- [ ] پیام «پیش‌نویس شما ذخیره شد»
- [ ] بازیابی پیش‌نویس بعد از رفرش صفحه
- [ ] اعتبارسنجی قبل از تولید AI (هدف انتخاب‌شده، وزن/قد موجود، حداقل ۱ روز، حداقل ۱ تجهیزات)
- [ ] برچسب‌های وضعیت در کل سیستم: `پیش‌نویس` / `رسمی` / `تأیید مربی`

## بک‌اند — جداول/مدل‌های جدید (Go + GORM)

فایل‌های فعلی مرتبط: `backend/internal/models/workout_program.go`, `nutrition_program.go`, `ai_request_log.go`

- [ ] مدل/migration `ai_program_drafts` (id, user_id, goal, input_json, generated_json, status)
- [ ] مدل/migration `saved_programs` (id, user_id, source: coach|ai|mixed, title, program_json) — یا الحاق فیلد `source` به مدل‌های موجود `workout_program`/`nutrition_program`
- [ ] مدل/migration `program_versions` (id, program_id, version, changes_json) — جایگزین فیلد ساده `Version int` فعلی
- [ ] اندپوینت جدید برای پیشنهاد AI روی برنامهٔ موجود (متفاوت از `/me/workout/generate` که مستقیم تولید می‌کند)

---
### وضعیت کلی: فاز ۱ (اصلاح معماری) کامل شد. فازهای ۲، ۳ و ۴ هنوز شروع نشده‌اند.
فایل‌های تغییریافته/جدید در فاز ۱:
- `frontend/src/app/(panel)/_shared/nav-config/user.js`
- `frontend/src/app/(panel)/user/my-programs/_components/MyProgramsListClient.js`
- `frontend/src/app/(panel)/user/ai-programs/new/page.js` + `_components/AIProgramNewClient.jsx`
- `frontend/src/app/(panel)/user/ai-programs/edit/page.js` + `_components/AIProgramEditClient.jsx`
- `frontend/src/app/(panel)/coach/plans/ai-suggest/page.jsx` + `_components/CoachAISuggestClient.jsx`
- `frontend/src/app/(panel)/coach/plans/detail/_components/CoachPlanDetailsClient.jsx`

**نکته دربارهٔ تست:** لاجیک با `eslint` روی فایل‌های تغییریافته چک شد (بدون خطای جدید) و صفحات از طریق سرور dev سرو شدند بدون خطای build. اما نتوانستم به‌صورت کامل لاگین کنم و سایدبار/صفحات را در حالت احراز هویت‌شده در مرورگر ببینم — ورود با OTP پیامکی است و در dev کد به ترمینال بک‌اند چاپ می‌شود که به آن ترمینال دسترسی نداشتم (درخواست OTP هم عملاً هیچ‌وقت شلیک نشد، احتمالاً یک مشکل جدا در فرم لاگین). پیشنهاد می‌شود خودتان یک بار با موبایل واقعی وارد شوید و ظاهر سایدبار را تأیید کنید.
