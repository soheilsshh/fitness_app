-- =============================================================================
-- دو شاگرد «در انتظار برنامه» برای پیمان یزدانی (تست روند اختصاص برنامه)
-- پیش‌نیاز: seed_peyman_yazdani.sql اجرا شده باشد (مربی + پلن موجود)
--
-- Logins (password: 12345678):
--   student.peyman.pending1@fitino.ir | 09198267541
--   student.peyman.pending2@fitino.ir | 09198267542
--
-- Run:
--   mysql -u fitino -p fitness_db < backend/scripts/seed_peyman_pending_students.sql
-- =============================================================================

SET NAMES utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

SET @pass := UNHEX('2432612431302434474f594731576f5539584a4e48496462774f745165456d4c7157664f7442444a795a62414352723554536e3164734f4861376b6d');
SET @now  := NOW();

SET @coach_id := (SELECT id FROM users WHERE email = 'coach.peyman@fitino.ir' AND deleted_at IS NULL LIMIT 1);

SET @plan_id := (
  SELECT id FROM service_plans
  WHERE coach_id = @coach_id
    AND name = 'پیمان · برنامه تمرین تغذیه'
    AND deleted_at IS NULL
  LIMIT 1
);

SELECT IF(@coach_id IS NULL, 'ERROR: پیمان seed نشده — اول seed_peyman_yazdani.sql را بزن', 'coach ok') AS check_coach;
SELECT IF(@plan_id IS NULL, 'ERROR: پلن پیمان پیدا نشد', 'plan ok') AS check_plan;

-- -----------------------------------------------------------------------------
-- شاگرد ۱ — در انتظار برنامه
-- -----------------------------------------------------------------------------
INSERT INTO users (
  name, email, phone, password, role, assigned_coach_id,
  height_cm, weight_kg, gender, primary_goal, target_weight_kg, body_condition,
  goals, created_at, updated_at
)
SELECT
  'سارا منتظر برنامه',
  'student.peyman.pending1@fitino.ir',
  '09198267541',
  @pass,
  'student',
  @coach_id,
  165, 72, 'female', 'کاهش وزن', 64, 'average',
  '["کاهش وزن","فرم‌دهی"]',
  @now, @now
FROM DUAL
WHERE @coach_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'student.peyman.pending1@fitino.ir' AND deleted_at IS NULL
  );

UPDATE users
SET
  name = 'سارا منتظر برنامه',
  phone = '09198267541',
  password = @pass,
  role = 'student',
  assigned_coach_id = @coach_id,
  height_cm = 165,
  weight_kg = 72,
  gender = 'female',
  primary_goal = 'کاهش وزن',
  target_weight_kg = 64,
  body_condition = 'average',
  goals = '["کاهش وزن","فرم‌دهی"]',
  updated_at = @now
WHERE email = 'student.peyman.pending1@fitino.ir' AND deleted_at IS NULL;

SET @s1 := (SELECT id FROM users WHERE email = 'student.peyman.pending1@fitino.ir' AND deleted_at IS NULL LIMIT 1);

-- -----------------------------------------------------------------------------
-- شاگرد ۲ — در انتظار برنامه
-- -----------------------------------------------------------------------------
INSERT INTO users (
  name, email, phone, password, role, assigned_coach_id,
  height_cm, weight_kg, gender, primary_goal, target_weight_kg, body_condition,
  goals, created_at, updated_at
)
SELECT
  'رضا منتظر برنامه',
  'student.peyman.pending2@fitino.ir',
  '09198267542',
  @pass,
  'student',
  @coach_id,
  180, 92, 'male', 'افزایش حجم', 88, 'average',
  '["افزایش حجم","قدرت"]',
  @now, @now
FROM DUAL
WHERE @coach_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'student.peyman.pending2@fitino.ir' AND deleted_at IS NULL
  );

UPDATE users
SET
  name = 'رضا منتظر برنامه',
  phone = '09198267542',
  password = @pass,
  role = 'student',
  assigned_coach_id = @coach_id,
  height_cm = 180,
  weight_kg = 92,
  gender = 'male',
  primary_goal = 'افزایش حجم',
  target_weight_kg = 88,
  body_condition = 'average',
  goals = '["افزایش حجم","قدرت"]',
  updated_at = @now
WHERE email = 'student.peyman.pending2@fitino.ir' AND deleted_at IS NULL;

SET @s2 := (SELECT id FROM users WHERE email = 'student.peyman.pending2@fitino.ir' AND deleted_at IS NULL LIMIT 1);

SET @ends := DATE_ADD(@now, INTERVAL 30 DAY);

-- اشتراک فعال بدون workout_program → status=pending در پنل مربی
INSERT INTO subscriptions (
  user_id, coach_id, service_plan_id, starts_at, ends_at,
  checkin_frequency_days, next_check_in_due_date, created_at, updated_at
)
SELECT
  @s1, @coach_id, @plan_id, @now, @ends,
  14, DATE_ADD(@now, INTERVAL 7 DAY), @now, @now
FROM DUAL
WHERE @s1 IS NOT NULL AND @plan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = @s1 AND coach_id = @coach_id AND deleted_at IS NULL
      AND (ends_at IS NULL OR ends_at > @now)
  );

INSERT INTO subscriptions (
  user_id, coach_id, service_plan_id, starts_at, ends_at,
  checkin_frequency_days, next_check_in_due_date, created_at, updated_at
)
SELECT
  @s2, @coach_id, @plan_id, @now, @ends,
  14, DATE_ADD(@now, INTERVAL 7 DAY), @now, @now
FROM DUAL
WHERE @s2 IS NOT NULL AND @plan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = @s2 AND coach_id = @coach_id AND deleted_at IS NULL
      AND (ends_at IS NULL OR ends_at > @now)
  );

-- اطمینان: هیچ برنامه تمرینی فعالی برای این دو نباشد
UPDATE workout_programs wp
INNER JOIN subscriptions s ON s.id = wp.subscription_id
SET wp.is_active = 0, wp.updated_at = @now
WHERE s.user_id IN (@s1, @s2) AND wp.is_active = 1;

-- نوتیف برای مربی
INSERT INTO notifications (user_id, type, title, message, is_read, created_at, updated_at)
SELECT @coach_id, 'new_subscription', 'اشتراک جدید', 'سارا منتظر برنامه پلن خرید — در انتظار اختصاص برنامه.', 0, @now, @now
FROM DUAL
WHERE @coach_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @coach_id AND title = 'اشتراک جدید'
      AND message LIKE 'سارا منتظر برنامه%' AND deleted_at IS NULL
  );

INSERT INTO notifications (user_id, type, title, message, is_read, created_at, updated_at)
SELECT @coach_id, 'new_subscription', 'اشتراک جدید', 'رضا منتظر برنامه پلن خرید — در انتظار اختصاص برنامه.', 0, @now, @now
FROM DUAL
WHERE @coach_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @coach_id AND title = 'اشتراک جدید'
      AND message LIKE 'رضا منتظر برنامه%' AND deleted_at IS NULL
  );

SELECT
  'OK' AS status,
  @coach_id AS coach_id,
  @s1 AS pending_student_1,
  @s2 AS pending_student_2,
  (SELECT COUNT(*) FROM subscriptions s
    WHERE s.user_id IN (@s1, @s2) AND s.deleted_at IS NULL
      AND (s.ends_at IS NULL OR s.ends_at > @now)
      AND NOT EXISTS (
        SELECT 1 FROM workout_programs wp
        WHERE wp.subscription_id = s.id AND wp.is_active = 1
      )
  ) AS pending_count;
