/**
 * Maps backend API error strings (mostly English) to user-facing Persian messages.
 */

const EXACT = {
  unauthorized: "لطفاً وارد حساب کاربری خود شوید.",
  "invalid user id in context": "نشست کاربری نامعتبر است. دوباره وارد شوید.",
  "invalid body": "اطلاعات ارسالی نامعتبر است.",
  "invalid id": "شناسه نامعتبر است.",
  "invalid user id": "شناسه کاربر نامعتبر است.",
  "invalid student id": "شناسه شاگرد نامعتبر است.",
  "invalid plan id": "شناسه پلن نامعتبر است.",
  "invalid program id": "شناسه برنامه نامعتبر است.",
  "invalid order id": "شناسه سفارش نامعتبر است.",
  "invalid ticket id": "شناسه تیکت نامعتبر است.",
  "invalid photo id": "شناسه عکس نامعتبر است.",
  "invalid payment status": "وضعیت پرداخت نامعتبر است.",
  "invalid status": "وضعیت نامعتبر است.",
  "invalid status transition": "تغییر وضعیت مجاز نیست.",
  "invalid funnel input": "اطلاعات وارد شده نامعتبر است.",
  "invalid slug": "نامک (slug) نامعتبر است.",
  "invalid credentials": "شماره/ایمیل یا رمز عبور اشتباه است.",
  "invalid or expired otp code": "کد وارد شده نامعتبر یا منقضی شده است.",
  "current password is incorrect": "رمز عبور فعلی اشتباه است.",
  "email already in use": "این ایمیل قبلاً ثبت شده است.",
  "phone already in use": "این شماره موبایل قبلاً ثبت شده است.",
  "email already exists": "این ایمیل قبلاً ثبت شده است.",
  "phone already exists": "این شماره موبایل قبلاً ثبت شده است.",
  "slug already in use": "این نامک قبلاً استفاده شده است.",
  "name, email, phone and password are required": "نام، ایمیل، شماره و رمز عبور الزامی است.",
  "phone is required": "شماره موبایل الزامی است.",
  "ارسال پیامک با خطا مواجه شد": "ارسال پیامک با خطا مواجه شد.",
  "new password must be at least 8 characters": "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.",
  "file is required": "انتخاب فایل الزامی است.",
  "type is required": "نوع فایل الزامی است.",
  "failed to read file": "خواندن فایل ناموفق بود.",
  "type must be front, right, back, or left": "نوع عکس باید جلو، راست، عقب یا چپ باشد.",
  "invalid photo type": "نوع عکس نامعتبر است.",
  "order not found": "سفارش یافت نشد.",
  "program not found": "برنامه یافت نشد.",
  "plan not found": "پلن یافت نشد.",
  "student not found": "شاگرد یافت نشد.",
  "coach not found": "مربی یافت نشد.",
  "coach profile not found": "پروفایل مربی یافت نشد.",
  "achievement not found": "افتخار یافت نشد.",
  "invalid achievement type": "نوع افتخار نامعتبر است.",
  "achievement does not belong to this coach": "این مورد متعلق به شما نیست.",
  "ticket not found": "تیکت یافت نشد.",
  "exercise not found": "تمرین یافت نشد.",
  "exercise not accessible": "دسترسی به این تمرین مجاز نیست.",
  "photo not found": "عکس یافت نشد.",
  "lead not found": "اطلاعات یافت نشد.",
  "student or plan not found": "شاگرد یا پلن یافت نشد.",
  "no assigned coach": "هنوز مربی به شما اختصاص داده نشده است.",
  "no fields to update": "فیلدی برای به‌روزرسانی ارسال نشده است.",
  "answer is required": "متن پاسخ الزامی است.",
  "title is required": "عنوان الزامی است.",
  "email or phone is required": "ایمیل یا شماره تماس الزامی است.",
  "only students can checkout": "فقط دانشجو می‌تواند خرید کند.",
  "student already assigned to a coach": "شما قبلاً زیر نظر یک مربی هستید.",
  "cart is empty": "سبد خرید خالی است.",
  "invalid plan in cart": "پلن انتخاب‌شده نامعتبر است.",
  "all plans must belong to the same coach": "همه پلن‌ها باید متعلق به یک مربی باشند.",
  "plan is not available": "این پلن در دسترس نیست.",
  "only one plan can be purchased at a time": "فقط یک پلن در هر خرید مجاز است.",
  "plan quantity must be 1": "تعداد پلن باید ۱ باشد.",
  "weight must be between 20 and 300 kg": "وزن باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.",
  "invalid tracking photo type": "نوع عکس پیگیری نامعتبر است.",
  "no active subscription found": "اشتراک فعالی یافت نشد.",
  "student has no active subscription with this coach": "این شاگرد اشتراک فعال با شما ندارد.",
  "student does not belong to this coach": "این شاگرد متعلق به شما نیست.",
  "plan does not belong to this coach": "این پلن متعلق به شما نیست.",
  "forbidden": "دسترسی مجاز نیست.",
  "invalid ticket status": "وضعیت تیکت نامعتبر است.",
  "coach is not assigned": "مربی اختصاص داده نشده است.",
  "subscription is not active": "اشتراک فعال نیست.",
  "invalid workout day": "روز تمرین نامعتبر است.",
  "no workout scheduled for this day": "برای این روز تمرینی ثبت نشده است.",
  "subscription does not belong to user": "این اشتراک متعلق به شما نیست.",
  "workout session not found": "جلسه تمرین یافت نشد.",
  "name is required": "نام الزامی است.",
  "externalId is required": "شناسه خارجی الزامی است.",
  "name cannot be empty": "نام نمی‌تواند خالی باشد.",
  "photo file is required": "انتخاب عکس الزامی است.",
  "cannot open photo": "باز کردن عکس ناموفق بود.",
  "unsupported media type": "نوع فایل پشتیبانی نمی‌شود.",
  "failed to create upload dir": "خطا در آماده‌سازی آپلود.",
  "failed to create media dir": "خطا در آماده‌سازی رسانه.",
  "year is required": "سال الزامی است.",
  "invalid year": "سال نامعتبر است.",
  "already paid": "این پرداخت قبلاً انجام شده است.",
  forbidden: "دسترسی مجاز نیست.",
};

const PROFILE_FIELD_MESSAGES = {
  "firstname and lastname are required": "نام و نام خانوادگی الزامی است.",
  "heightcm must be between 80 and 250": "قد باید بین ۸۰ تا ۲۵۰ سانتی‌متر باشد.",
  "weightkg must be between 20 and 300": "وزن باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.",
  "birthdate must be yyyy-mm-dd": "فرمت تاریخ تولد باید YYYY-MM-DD باشد.",
  "birthdate is out of allowed range": "تاریخ تولد خارج از محدوده مجاز است (۱۳ تا ۱۰۰ سال).",
  "nationalid is invalid": "کد ملی نامعتبر است.",
  "gender must be male or female": "جنسیت باید مرد یا زن باشد.",
  "at least one goal is required": "حداقل یک هدف انتخاب کنید.",
  "invalid goal value": "هدف انتخاب‌شده نامعتبر است.",
  "primarygoal is required": "هدف اصلی الزامی است.",
  "targetweightkg must be between 20 and 300": "وزن هدف باید بین ۲۰ تا ۳۰۰ کیلوگرم باشد.",
  "invalid bodycondition": "وضعیت بدنی نامعتبر است.",
  "bodyfatpercent must be between 1 and 60": "درصد چربی باید بین ۱ تا ۶۰ باشد.",
};

const FIELD_LABELS = {
  Name: "نام",
  Email: "ایمیل",
  Phone: "شماره موبایل",
  Password: "رمز عبور",
  NewPassword: "رمز عبور جدید",
  CurrentPassword: "رمز عبور فعلی",
  Code: "کد تأیید",
  Identifier: "ایمیل یا شماره",
  DisplayName: "نام نمایشی",
  Slug: "نامک",
  FirstName: "نام",
  LastName: "نام خانوادگی",
  Title: "عنوان",
  Message: "پیام",
  Answer: "پاسخ",
};

const TAG_MESSAGES = {
  required: "الزامی است",
  email: "فرمت ایمیل نامعتبر است",
  min: "کوتاه‌تر از حد مجاز است",
  max: "بلندتر از حد مجاز است",
};

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function translateProfileFieldError(message) {
  const normalized = normalizeKey(message);
  const prefix = "invalid profile field:";
  if (!normalized.startsWith(prefix)) return null;

  const detail = normalized.slice(prefix.length).trim();
  return PROFILE_FIELD_MESSAGES[detail] || "یکی از فیلدهای پروفایل نامعتبر است.";
}

function translateGinValidationError(message) {
  if (!message.includes("Field validation for")) return null;

  const fieldMatch = message.match(/Field validation for '([^']+)' failed on the '([^']+)' tag/);
  if (!fieldMatch) {
    return "اطلاعات ارسالی نامعتبر است.";
  }

  const field = fieldMatch[1];
  const tag = fieldMatch[2];
  const label = FIELD_LABELS[field] || field;
  const tagMsg = TAG_MESSAGES[tag] || "نامعتبر است";

  return `${label} ${tagMsg}.`;
}

function translateJsonSyntaxError(message) {
  const normalized = normalizeKey(message);
  if (
    normalized.includes("json") ||
    normalized.includes("unexpected") ||
    normalized.includes("cannot unmarshal")
  ) {
    return "فرمت داده‌های ارسالی نامعتبر است.";
  }
  return null;
}

/**
 * Translate a raw API error string to Persian.
 * Returns the original message if already Persian or unknown.
 */
export function translateApiError(message) {
  if (message == null || message === "") return "";

  const raw = String(message).trim();
  if (!raw) return "";

  // Already Persian (rough heuristic: contains Persian letters)
  if (/[\u0600-\u06FF]/.test(raw)) return raw;

  const normalized = normalizeKey(raw);

  if (EXACT[normalized]) return EXACT[normalized];

  const profileMsg = translateProfileFieldError(raw);
  if (profileMsg) return profileMsg;

  const ginMsg = translateGinValidationError(raw);
  if (ginMsg) return ginMsg;

  const jsonMsg = translateJsonSyntaxError(raw);
  if (jsonMsg) return jsonMsg;

  // Partial matches for service errors passed through err.Error()
  if (normalized.includes("record not found")) return "مورد درخواستی یافت نشد.";
  if (normalized.includes("duplicate") || normalized.includes("already exists")) {
    return "این مورد قبلاً ثبت شده است.";
  }
  if (normalized.includes("forbidden")) return "دسترسی مجاز نیست.";
  if (normalized.includes("timeout") || normalized.includes("deadline exceeded")) {
    return "زمان درخواست به پایان رسید. دوباره تلاش کنید.";
  }
  if (normalized.includes("kavenegar") || normalized.includes("کاوه")) {
    return raw;
  }
  if (normalized.includes("api") && normalized.includes("نامعتبر")) {
    return raw;
  }
  if (normalized.includes("connection refused") || normalized.includes("network")) {
    return "ارتباط با سرور برقرار نشد.";
  }

  return raw;
}

/**
 * Extract and translate error message from axios error object.
 */
export function getApiErrorMessage(error, fallback = "خطایی رخ داد. دوباره تلاش کنید.") {
  const raw =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === "string" ? error.response.data : "") ||
    error?.message ||
    "";

  const translated = translateApiError(raw);
  if (translated && translated !== raw) return translated;
  if (translated && /[\u0600-\u06FF]/.test(translated)) return translated;
  if (raw && !/[\u0600-\u06FF]/.test(String(raw))) return fallback;
  return translated || fallback;
}
