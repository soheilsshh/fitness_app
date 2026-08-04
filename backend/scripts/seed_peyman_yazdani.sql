-- =============================================================================
-- Seed: پیمان یزدانی (partner demo) + شاگرد متصل + دیتای تست پنل
-- Source: panel.morabiha.com/coach/dr.peymanyazdani_fit (saved HTML / __NEXT_DATA__)
-- MySQL · idempotent by email / plan name / tracking_code / reference
--
-- Public landing: /daryaft-barname-tamrini-taghzieh
--   (فیتینو فقط اسلاگ لاتین می‌پذیرد؛ معادل مسیر درخواستی
--    /دریافت-برنامه-تمرینی-تغذیه)
--
-- Logins (password: 12345678):
--   مربی:  coach.peyman@fitino.ir  | 09198267530
--   شاگرد: student.peyman@fitino.ir | 09198267531
--
-- Run:
--   mysql -u fitino -p fitness_db < backend/scripts/seed_peyman_yazdani.sql
-- =============================================================================

SET NAMES utf8mb4;
SET @pass := '$2a$10$4GOYG1WoU9XJNHIdbwOtQeEmLqWfOtBDJyZbACRr5TSn1dsOHa7km'; -- 12345678
SET @now  := NOW();
SET @slug := 'daryaft-barname-tamrini-taghzieh';
SET @avatar := '/images/coaches/peyman-yazdani.jpg';

-- -----------------------------------------------------------------------------
-- 1) Coach user
-- -----------------------------------------------------------------------------
INSERT INTO users (
  name, email, phone, password, role, coach_status, goals, avatar_url, created_at, updated_at
)
SELECT
  'پیمان یزدانی',
  'coach.peyman@fitino.ir',
  '09198267530',
  @pass,
  'coach',
  'approved',
  '[]',
  @avatar,
  @now,
  @now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'coach.peyman@fitino.ir' AND deleted_at IS NULL);

UPDATE users
SET
  name = 'پیمان یزدانی',
  phone = '09198267530',
  password = @pass,
  role = 'coach',
  coach_status = 'approved',
  avatar_url = @avatar,
  updated_at = @now
WHERE email = 'coach.peyman@fitino.ir' AND deleted_at IS NULL;

SET @coach_id := (SELECT id FROM users WHERE email = 'coach.peyman@fitino.ir' AND deleted_at IS NULL LIMIT 1);

-- -----------------------------------------------------------------------------
-- 2) Coach public profile (bio / about / contact از صفحه مربی‌ها)
-- -----------------------------------------------------------------------------
INSERT INTO coach_profiles (
  user_id, slug, display_name, title, bio, about_coach, specialty,
  avatar_url, contact_phone, instagram, telegram, whats_app, website, city,
  status, is_published, is_active, created_at, updated_at
)
SELECT
  @coach_id,
  @slug,
  'پیمان یزدانی',
  'مربی بدنسازی، فیزیولوژی ورزشی و اصلاحی',
  'سوابق حرفه‌ای\n• بیش از ۱۵ سال سابقه مربیگری در باشگاه‌های ممتاز تهران\n• تربیت و هدایت ده‌ها شاگرد موفق از سطح مبتدی تا سطح حرفه‌ای و قهرمانی ملی\n• همکاری با ورزشکاران در رشته‌های مختلف جهت دستیابی به اهداف بدنی، درمان آسیب‌دیدگی و ارتقاء عملکرد',
  '✅ انواع تمریناتی که طراحی می‌کنم:\n• تمرینات فیتنس عمومی و کاهش چربی\n• تمرینات افزایش حجم عضلانی (هایپرتروفی)\n• تمرینات قدرتی و انفجاری (Power & Strength)\n• تمرینات فرم‌دهی و زیبایی اندام (Body Shaping)\n• تمرینات فانکشنال (برای بهبود عملکرد روزمره بدن)\n• تمرینات اصلاحی برای ناهنجاری‌های بدن (گودی کمر، افتادگی شانه، زانوی ضربدری و…)\n• تمرینات سالمندان با تمرکز بر تحرک، انعطاف و سلامت مفاصل\n• برنامه تمرینی برای افراد دارای بیماری‌هایی مثل دیابت، فشار خون، تیروئید، کبد چرب و…',
  'بدنسازی، کاهش چربی، هایپرتروفی، اصلاحی، تغذیه ورزشی',
  @avatar,
  '09999907312',
  'https://instagram.com/dr.peymanyazdani_fit',
  'https://t.me/peymanyazdani_fit',
  '989198267530',
  NULL,
  'تهران',
  'approved',
  1,
  1,
  @now,
  @now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM coach_profiles WHERE user_id = @coach_id AND deleted_at IS NULL);

-- Reclaim slug if taken by another row
UPDATE coach_profiles
SET slug = CONCAT('legacy-', id, '-', slug), updated_at = @now
WHERE slug = @slug AND user_id <> @coach_id AND deleted_at IS NULL;

UPDATE coach_profiles
SET
  slug = @slug,
  display_name = 'پیمان یزدانی',
  title = 'مربی بدنسازی، فیزیولوژی ورزشی و اصلاحی',
  bio = 'سوابق حرفه‌ای\n• بیش از ۱۵ سال سابقه مربیگری در باشگاه‌های ممتاز تهران\n• تربیت و هدایت ده‌ها شاگرد موفق از سطح مبتدی تا سطح حرفه‌ای و قهرمانی ملی\n• همکاری با ورزشکاران در رشته‌های مختلف جهت دستیابی به اهداف بدنی، درمان آسیب‌دیدگی و ارتقاء عملکرد',
  about_coach = '✅ انواع تمریناتی که طراحی می‌کنم:\n• تمرینات فیتنس عمومی و کاهش چربی\n• تمرینات افزایش حجم عضلانی (هایپرتروفی)\n• تمرینات قدرتی و انفجاری (Power & Strength)\n• تمرینات فرم‌دهی و زیبایی اندام (Body Shaping)\n• تمرینات فانکشنال (برای بهبود عملکرد روزمره بدن)\n• تمرینات اصلاحی برای ناهنجاری‌های بدن (گودی کمر، افتادگی شانه، زانوی ضربدری و…)\n• تمرینات سالمندان با تمرکز بر تحرک، انعطاف و سلامت مفاصل\n• برنامه تمرینی برای افراد دارای بیماری‌هایی مثل دیابت، فشار خون، تیروئید، کبد چرب و…',
  specialty = 'بدنسازی، کاهش چربی، هایپرتروفی، اصلاحی، تغذیه ورزشی',
  avatar_url = @avatar,
  contact_phone = '09999907312',
  instagram = 'https://instagram.com/dr.peymanyazdani_fit',
  telegram = 'https://t.me/peymanyazdani_fit',
  whats_app = '989198267530',
  city = 'تهران',
  status = 'approved',
  is_published = 1,
  is_active = 1,
  updated_at = @now
WHERE user_id = @coach_id AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3) Achievements (سوابق صفحه)
-- -----------------------------------------------------------------------------
DELETE FROM coach_achievements
WHERE coach_user_id = @coach_id
  AND title IN (
    'دانشجوی دکترای فیزیولوژی ورزشی',
    'مربی رسمی فدراسیون',
    'دانشجوی نمونه رشته تربیت بدنی',
    'قهرمان چندین دوره مسابقات فیزیک ورزشی',
    'معلم نمونه تربیت‌بدنی تهران',
    'مدارک بیش از ۵۰ سمینار تخصصی',
    'بیش از ۱۵ سال مربیگری حرفه‌ای'
  );

INSERT INTO coach_achievements
  (coach_user_id, type, title, issuer, year, description, sort_order, is_visible, created_at, updated_at)
VALUES
  (@coach_id, 'qualification', 'دانشجوی دکترای فیزیولوژی ورزشی', 'دانشگاه', NULL, NULL, 1, 1, @now, @now),
  (@coach_id, 'certificate',   'مربی رسمی فدراسیون', 'فدراسیون', NULL, NULL, 2, 1, @now, @now),
  (@coach_id, 'honor',         'دانشجوی نمونه رشته تربیت بدنی', NULL, NULL, NULL, 3, 1, @now, @now),
  (@coach_id, 'medal',         'قهرمان چندین دوره مسابقات فیزیک ورزشی', NULL, NULL, NULL, 4, 1, @now, @now),
  (@coach_id, 'honor',         'معلم نمونه تربیت‌بدنی تهران', 'آموزش و پرورش تهران', NULL, NULL, 5, 1, @now, @now),
  (@coach_id, 'certificate',   'مدارک بیش از ۵۰ سمینار تخصصی', NULL, NULL, NULL, 6, 1, @now, @now),
  (@coach_id, 'qualification', 'بیش از ۱۵ سال مربیگری حرفه‌ای', 'باشگاه‌های ممتاز تهران', NULL, NULL, 7, 1, @now, @now);

-- -----------------------------------------------------------------------------
-- 4) Service plans (۱۲ پلن از صفحه — نام‌ها با پیشوند یکتا)
-- price_cents = قیمت لیست (تومان) · discount_price_cents = قیمت نهایی (۰ = بدون تخفیف)
-- -----------------------------------------------------------------------------
-- Helper: upsert by unique name
INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · برنامه تمرین', 'فقط تمرین', 'یک ماهه',
  'ارائه برنامه تمرینی باتوجه به شرایط شما وهدف و اسیب های که دارید تمرین درمنزل یا باشگاه',
  'برنامه تمرینی شخصی‌سازی\nمنزل یا باشگاه\nویدیو حرکات',
  'workout', 800000, 0, 0, 30, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · برنامه تمرین' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · برنامه تغذیه', 'فقط تغذیه', 'یک ماهه',
  'باتوجه به شرایط هدف شما انواع رژیم ها و بیمارهای که دارید',
  'رژیم شخصی‌سازی\nبیماری‌ها و اهداف\nپیگیری ماکرو',
  'nutrition', 800000, 0, 0, 30, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · برنامه تغذیه' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · برنامه تمرین تغذیه', 'تمرین + تغذیه', 'یک ماهه',
  'باتوجه با شرایط هرفرد شخصی سازی شده',
  'برنامه تمرین\nبرنامه غذایی\nشخصی‌سازی کامل',
  'both', 1600000, 0, 0, 30, 1, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · برنامه تمرین تغذیه' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · تمرین تغذیه و مکمل', 'تمرین + غذا + مکمل', 'یک ماهه',
  'شامل برنامه تمرین غذایی و مکمل',
  'تمرین\nتغذیه\nپروتکل مکمل',
  'both', 2100000, 0, 0, 30, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · تمرین تغذیه و مکمل' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · اصلاحی', 'اصلاح ناهنجاری', 'یک ماهه',
  'هر عارضه ۶۰۰تومان برای برطرف کردن اسیب ها و عارضه ها',
  'ارزیابی عارضه\nبرنامه اصلاحی\nپیگیری',
  'workout', 800000, 0, 0, 30, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · اصلاحی' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · پکیج عمومی کامل', 'تمرین + غذا + مکمل + اصلاحی', 'یک ماهه',
  'پکیج عمومی تمرین وتغذیه و مکمل و اصلاحی',
  'تمرین\nتغذیه\nمکمل\nاصلاحی',
  'both', 2600000, 2400000, 8, 30, 1, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · پکیج عمومی کامل' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · پکیج حرفه‌ای مسابقه‌ای', 'تمرین + تغذیه + مکمل', 'یک ماهه',
  'پکیج حرفه ای مسابقه ای',
  'تمرین مسابقه‌ای\nتغذیه حرفه‌ای\nمکمل',
  'both', 3500000, 3000000, 14, 30, 1, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · پکیج حرفه‌ای مسابقه‌ای' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · تمرین و اصلاحی', 'تمرین + اصلاحی', 'یک ماهه',
  'برنامه تمرین واصلاحی',
  'برنامه تمرین\nبرنامه اصلاحی',
  'workout', 1800000, 0, 0, 30, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · تمرین و اصلاحی' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · اصلاحی و تغذیه', 'اصلاحی + تغذیه · هر عارضه ۶۰۰ هزار', 'یک ماهه',
  'هر عارضه ۶۰۰تومان',
  'اصلاحی\nتغذیه\nهر عارضه جداگانه',
  'both', 1800000, 0, 0, 30, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · اصلاحی و تغذیه' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · تمرین خصوصی ۱۲ جلسه', 'حضوری', '۱۲ جلسه',
  'تمرین خصوصی حضوری',
  '۱۲ جلسه حضوری\nبرنامه همراه',
  'workout', 6000000, 0, 0, 60, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · تمرین خصوصی ۱۲ جلسه' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · تمرین خصوصی ۲۰ جلسه', 'حضوری', '۲۰ جلسه',
  'حضوری',
  '۲۰ جلسه حضوری\nبرنامه همراه',
  'workout', 7000000, 0, 0, 90, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · تمرین خصوصی ۲۰ جلسه' AND deleted_at IS NULL);

INSERT INTO service_plans (
  coach_id, name, subtitle, course_name, description, features_text, type,
  price_cents, discount_price_cents, discount_percent, duration_days,
  is_popular, is_active, created_at, updated_at
)
SELECT @coach_id, 'پیمان · تمرین و رژیم حرفه‌ای', 'تمرین حرفه‌ای + رژیم حرفه‌ای', 'یک ماهه',
  'تمرین حرفه ای و رژیم حرفه ای',
  'تمرین حرفه‌ای\nرژیم حرفه‌ای',
  'both', 2300000, 0, 0, 30, 0, 1, @now, @now
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM service_plans WHERE name = 'پیمان · تمرین و رژیم حرفه‌ای' AND deleted_at IS NULL);

-- Sync ownership / prices if rows already existed
UPDATE service_plans
SET coach_id = @coach_id, is_active = 1, updated_at = @now
WHERE name LIKE 'پیمان · %' AND deleted_at IS NULL;

SET @plan_sub_id := (
  SELECT id FROM service_plans
  WHERE name = 'پیمان · برنامه تمرین تغذیه' AND deleted_at IS NULL LIMIT 1
);

-- -----------------------------------------------------------------------------
-- 5) Student linked to this coach
-- -----------------------------------------------------------------------------
INSERT INTO users (
  name, email, phone, password, role, assigned_coach_id,
  height_cm, weight_kg, gender, primary_goal, target_weight_kg, body_condition,
  goals, created_at, updated_at
)
SELECT
  'علی شاگرد پیمان',
  'student.peyman@fitino.ir',
  '09198267531',
  @pass,
  'student',
  @coach_id,
  178,
  86,
  'male',
  'کاهش چربی',
  78,
  'average',
  '["کاهش چربی","افزایش قدرت"]',
  @now,
  @now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student.peyman@fitino.ir' AND deleted_at IS NULL);

UPDATE users
SET
  name = 'علی شاگرد پیمان',
  phone = '09198267531',
  password = @pass,
  role = 'student',
  assigned_coach_id = @coach_id,
  height_cm = 178,
  weight_kg = 86,
  gender = 'male',
  primary_goal = 'کاهش چربی',
  target_weight_kg = 78,
  body_condition = 'average',
  goals = '["کاهش چربی","افزایش قدرت"]',
  updated_at = @now
WHERE email = 'student.peyman@fitino.ir' AND deleted_at IS NULL;

SET @student_id := (SELECT id FROM users WHERE email = 'student.peyman@fitino.ir' AND deleted_at IS NULL LIMIT 1);

-- -----------------------------------------------------------------------------
-- 6) Active subscription (شاگرد روی پلن تمرین+تغذیه)
-- -----------------------------------------------------------------------------
SET @ends := DATE_ADD(@now, INTERVAL 30 DAY);

INSERT INTO subscriptions (
  user_id, coach_id, service_plan_id, starts_at, ends_at,
  checkin_frequency_days, next_check_in_due_date, created_at, updated_at
)
SELECT
  @student_id, @coach_id, @plan_sub_id, @now, @ends,
  14, DATE_ADD(@now, INTERVAL 7 DAY), @now, @now
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions
  WHERE user_id = @student_id
    AND service_plan_id = @plan_sub_id
    AND deleted_at IS NULL
    AND (ends_at IS NULL OR ends_at > @now)
);

SET @sub_id := (
  SELECT id FROM subscriptions
  WHERE user_id = @student_id AND service_plan_id = @plan_sub_id AND deleted_at IS NULL
  ORDER BY id DESC LIMIT 1
);

-- -----------------------------------------------------------------------------
-- 7) Order + item + transaction (تاریخچه خرید)
-- -----------------------------------------------------------------------------
INSERT INTO orders (
  user_id, coach_id, status, payment_method, tracking_code,
  discount_percent, note, total_amount_cents, paid_at, created_at, updated_at
)
SELECT
  @student_id, @coach_id, 'paid', 'درگاه آنلاین', 'TRX-PEYMAN-001',
  0, 'خرید دمو · برنامه تمرین تغذیه', 1600000, @now, @now, @now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE tracking_code = 'TRX-PEYMAN-001' AND deleted_at IS NULL);

SET @order_id := (SELECT id FROM orders WHERE tracking_code = 'TRX-PEYMAN-001' AND deleted_at IS NULL LIMIT 1);

INSERT INTO order_items (
  order_id, item_type, plan_id, ref_id, title, qty,
  unit_price_cents, line_total_cents, created_at, updated_at
)
SELECT
  @order_id, 'program', @plan_sub_id, 'peyman-both',
  'پیمان · برنامه تمرین تغذیه', 1, 1600000, 1600000, @now, @now
FROM DUAL
WHERE @order_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = @order_id AND deleted_at IS NULL);

INSERT INTO transactions (
  order_id, subscription_id, user_id, amount_cents, status, reference, gateway, date, created_at, updated_at
)
SELECT
  @order_id, @sub_id, @student_id, 1600000, 'completed', 'TXN-PEYMAN-001', 'zarinpal', @now, @now, @now
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE reference = 'TXN-PEYMAN-001' AND deleted_at IS NULL);

-- -----------------------------------------------------------------------------
-- 8) Workout program + items (پنل شاگرد / مربی)
-- -----------------------------------------------------------------------------
INSERT INTO workout_programs (
  subscription_id, coach_id, version, title, notes, duration_weeks, is_active, last_updated_at, created_at, updated_at
)
SELECT
  @sub_id, @coach_id, 1,
  'برنامه کاهش چربی — فاز ۱',
  'تمرکز روی compound + کاردیو zone 2 · شخصی‌سازی پیمان یزدانی',
  4, 1, @now, @now, @now
FROM DUAL
WHERE @sub_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM workout_programs
    WHERE subscription_id = @sub_id AND title = 'برنامه کاهش چربی — فاز ۱' AND deleted_at IS NULL
  );

SET @wp_id := (
  SELECT id FROM workout_programs
  WHERE subscription_id = @sub_id AND title = 'برنامه کاهش چربی — فاز ۱' AND deleted_at IS NULL
  LIMIT 1
);

-- Clear & reseed program items for this workout (idempotent)
DELETE pis FROM program_item_sets pis
INNER JOIN program_items pi ON pi.id = pis.program_item_id
WHERE pi.workout_program_id = @wp_id;

DELETE FROM program_items WHERE workout_program_id = @wp_id;

INSERT INTO program_items (
  workout_program_id, week_number, day_number, order_index, exercise,
  sets, reps, rest_time, notes, workout_system_type, created_at, updated_at
) VALUES
  (@wp_id, 1, 1, 1, 'اسکوات', 4, '12/10/10/AMRAP', '90s', 'عمق کامل', 'normal', @now, @now),
  (@wp_id, 1, 1, 2, 'پرس سینه دمبل', 3, '10/10/10', '90s', NULL, 'normal', @now, @now),
  (@wp_id, 1, 1, 3, 'ددلیفت رومانیایی', 3, '12', '75s', NULL, 'normal', @now, @now),
  (@wp_id, 1, 2, 1, 'پول‌آپ / لت', 4, '8-10', '90s', NULL, 'normal', @now, @now),
  (@wp_id, 1, 2, 2, 'پرس سرشانه', 3, '12', '75s', NULL, 'normal', @now, @now),
  (@wp_id, 1, 2, 3, 'پلانک', 3, '45s', '45s', 'فرم کمر', 'normal', @now, @now),
  (@wp_id, 1, 3, 1, 'دوچرخه / پیاده‌روی تند', 1, '25 دقیقه', '-', 'HR zone 2', 'normal', @now, @now);

-- -----------------------------------------------------------------------------
-- 9) Nutrition program + items
-- -----------------------------------------------------------------------------
INSERT INTO nutrition_programs (
  subscription_id, coach_id, version, title, notes, duration_weeks, is_active, last_updated_at, created_at, updated_at
)
SELECT
  @sub_id, @coach_id, 1,
  'رژیم کاهش چربی — هفته ۱',
  'کالری هدف ≈ ۱۹۰۰ · پروتئین ۱.۸g/kg',
  4, 1, @now, @now, @now
FROM DUAL
WHERE @sub_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM nutrition_programs
    WHERE subscription_id = @sub_id AND title = 'رژیم کاهش چربی — هفته ۱' AND deleted_at IS NULL
  );

SET @np_id := (
  SELECT id FROM nutrition_programs
  WHERE subscription_id = @sub_id AND title = 'رژیم کاهش چربی — هفته ۱' AND deleted_at IS NULL
  LIMIT 1
);

DELETE FROM nutrition_items WHERE nutrition_program_id = @np_id;

INSERT INTO nutrition_items (
  nutrition_program_id, day_number, meal_number, order_index, food, quantity,
  multiplier, calories, protein, carbs, fat, created_at, updated_at
) VALUES
  (@np_id, 1, 1, 1, 'املت سفیده + نان سبوس‌دار', '۲ عدد + ۱ برش', 1, 320, 28, 30, 8, @now, @now),
  (@np_id, 1, 2, 1, 'مرغ گریل + برنج قهوه‌ای', '۱۵۰g + ۱۰۰g', 1, 480, 42, 45, 10, @now, @now),
  (@np_id, 1, 3, 1, 'ماست یونانی + توت', '۲۰۰g', 1, 220, 18, 22, 6, @now, @now),
  (@np_id, 1, 4, 1, 'ماهی سفید + سبزیجات بخارپز', '۱۵۰g', 1, 350, 38, 12, 8, @now, @now);

-- -----------------------------------------------------------------------------
-- 10) Check-ins + workout sessions
-- -----------------------------------------------------------------------------
DELETE FROM check_ins WHERE user_id = @student_id AND subscription_id = @sub_id;

INSERT INTO check_ins (
  user_id, subscription_id, check_in_date, weight, waist, chest, hip, notes, created_at, updated_at
) VALUES
  (@student_id, @sub_id, DATE_SUB(@now, INTERVAL 21 DAY), 88, 96, 104, 100, 'شروع برنامه با پیمان', @now, @now),
  (@student_id, @sub_id, DATE_SUB(@now, INTERVAL 7 DAY), 86, 94, 103, 98, '۲ کیلو کاهش — انرژی خوب', @now, @now);

DELETE FROM workout_sessions WHERE user_id = @student_id AND subscription_id = @sub_id;

INSERT INTO workout_sessions (
  user_id, subscription_id, workout_program_id, program_title,
  day_key, day_label, exercise_count, duration_min, notes, completed_at, created_at, updated_at
) VALUES
  (@student_id, @sub_id, @wp_id, 'برنامه کاهش چربی — فاز ۱', 'sat', 'شنبه', 3, 48, NULL, DATE_SUB(@now, INTERVAL 5 DAY), @now, @now),
  (@student_id, @sub_id, @wp_id, 'برنامه کاهش چربی — فاز ۱', 'mon', 'دوشنبه', 3, 52, 'تمرکز خوب', DATE_SUB(@now, INTERVAL 3 DAY), @now, @now),
  (@student_id, @sub_id, @wp_id, 'برنامه کاهش چربی — فاز ۱', 'wed', 'چهارشنبه', 1, 28, 'کاردیو', DATE_SUB(@now, INTERVAL 1 DAY), @now, @now);

-- -----------------------------------------------------------------------------
-- 11) Tickets (پشتیبانی مربی ↔ شاگرد)
-- -----------------------------------------------------------------------------
DELETE FROM tickets
WHERE student_id = @student_id AND coach_id = @coach_id
  AND title IN ('سوال درباره اسکوات', 'جایگزین وعده شام');

INSERT INTO tickets (
  student_id, coach_id, title, priority, status, message, answer, answered_at, created_at, updated_at
) VALUES
  (
    @student_id, @coach_id,
    'سوال درباره اسکوات', 'normal', 'answered',
    'استاد، عمق اسکوات رو تا کجا بیارم که زانو اذیت نشه؟',
    'تا موازی با زمین کافی است؛ زانوها هم‌راستا با پنجه. اگر درد بود ویدیو بفرست.',
    DATE_SUB(@now, INTERVAL 2 DAY),
    DATE_SUB(@now, INTERVAL 3 DAY),
    @now
  ),
  (
    @student_id, @coach_id,
    'جایگزین وعده شام', 'low', 'pending',
    'ماهی ندارم — جایگزین پروتئینی چی پیشنهاد می‌کنید؟',
    NULL, NULL,
    DATE_SUB(@now, INTERVAL 1 DAY),
    @now
  );

-- -----------------------------------------------------------------------------
-- 12) Notifications (هر دو پنل)
-- -----------------------------------------------------------------------------
DELETE FROM notifications
WHERE user_id IN (@coach_id, @student_id)
  AND title IN (
    'اشتراک جدید',
    'تیکت پشتیبانی جدید',
    'تمرین ثبت شد',
    'برنامه تمرین به‌روز شد',
    'یادآوری چک‌این',
    'پیام از مربی'
  );

INSERT INTO notifications (user_id, type, title, message, is_read, created_at, updated_at) VALUES
  (@coach_id, 'new_subscription', 'اشتراک جدید', 'علی شاگرد پیمان پلن «برنامه تمرین تغذیه» را خریداری کرد.', 0, @now, @now),
  (@coach_id, 'ticket', 'تیکت پشتیبانی جدید', 'یک تیکت جدید از طرف دانشجوی شما ثبت شد.', 0, DATE_SUB(@now, INTERVAL 1 DAY), @now),
  (@coach_id, 'workout_logged', 'تمرین ثبت شد', 'علی شاگرد پیمان تمرین روز چهارشنبه را تکمیل کرد.', 1, DATE_SUB(@now, INTERVAL 1 DAY), @now),
  (@student_id, 'program_updated', 'برنامه تمرین به‌روز شد', 'مربی پیمان یزدانی برنامه فاز ۱ را برای شما فعال کرد.', 0, @now, @now),
  (@student_id, 'checkin_reminder', 'یادآوری چک‌این', 'موعد ثبت وزن و اندازه‌گیری‌های شما نزدیک است.', 0, @now, @now),
  (@student_id, 'message_from_coach', 'پیام از مربی', 'علی عزیز، فرم اسکوات را در ویدیو ارسالی بررسی کنید.', 1, DATE_SUB(@now, INTERVAL 2 DAY), @now);

-- -----------------------------------------------------------------------------
-- Done
-- -----------------------------------------------------------------------------
SELECT
  'OK' AS status,
  @coach_id AS coach_user_id,
  @student_id AS student_user_id,
  @slug AS public_slug,
  CONCAT('/', @slug) AS public_path,
  @sub_id AS subscription_id,
  @plan_sub_id AS subscribed_plan_id,
  (SELECT COUNT(*) FROM service_plans WHERE coach_id = @coach_id AND deleted_at IS NULL) AS plan_count;
