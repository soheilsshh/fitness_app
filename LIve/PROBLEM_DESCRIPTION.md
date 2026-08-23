# مشکل: فیلدهای instagram_link، telegram_id، whatsapp_link و status_notes در سیستم مدیریت افیلیت‌ها ذخیره نمی‌شوند

## شرح مشکل

در یک سیستم مدیریت افیلیت‌ها با Go (Gin) backend و React frontend، فیلدهای زیر در دیتابیس ذخیره نمی‌شوند:
- `instagram_link` (VARCHAR(500))
- `telegram_id` (VARCHAR(100))
- `whatsapp_link` (VARCHAR(500))
- `status_notes` (TEXT)

**مشاهدات:**
1. فیلدهای `email` و `phone` به درستی ذخیره و برگردانده می‌شوند
2. فیلدهای `instagram_link`, `telegram_id`, `whatsapp_link`, `status_notes` در JSON response اصلاً ظاهر نمی‌شوند (حتی اگر مقدار داشته باشند)
3. وقتی کاربر در frontend این فیلدها را پر می‌کند و ذخیره می‌کند، هیچ خطایی نمی‌دهد اما داده‌ها ذخیره نمی‌شوند
4. در response JSON، این فیلدها وجود ندارند

## ساختار پروژه

### Backend (Go + Gin + GORM)

**مدل (`backend/models/affiliate.go`):**
```go
type Affiliate struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	FirstName         string          `gorm:"type:varchar(255);not null" json:"first_name"`
	LastName          string          `gorm:"type:varchar(255);not null" json:"last_name"`
	Phone             string          `gorm:"type:varchar(20);index" json:"phone"`
	Email             string          `gorm:"type:varchar(255)" json:"email"`
	InstagramLink     string          `gorm:"type:varchar(500)" json:"instagram_link"`
	TelegramID        string          `gorm:"type:varchar(100)" json:"telegram_id"`
	WhatsAppLink      string          `gorm:"type:varchar(500)" json:"whatsapp_link"`
	FollowerCount     int             `gorm:"default:0" json:"follower_count"`
	RequiredContent   int             `gorm:"default:0" json:"required_content"`
	Status            AffiliateStatus `gorm:"type:varchar(50);default:'lead_pool';index" json:"status"`
	Notes             string          `gorm:"type:text" json:"notes"`
	StatusNotes       string          `gorm:"type:text" json:"status_notes"`
	UrgentFollowUp    bool            `gorm:"default:false;index" json:"urgent_follow_up"`
	AdminUserID       *uint           `gorm:"index" json:"admin_user_id,omitempty"`
	CreatedByID       uint            `gorm:"index" json:"created_by_id"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}
```

**Request Struct (`backend/controllers/affiliate.go`):**
```go
type UpdateAffiliateRequest struct {
	FirstName       string                 `json:"first_name"`
	LastName        string                 `json:"last_name"`
	Phone           string                 `json:"phone"`
	Email           string                 `json:"email"`
	InstagramLink   string                 `json:"instagram_link"`
	TelegramID      string                 `json:"telegram_id"`
	WhatsAppLink    string                 `json:"whatsapp_link"`
	FollowerCount   int                    `json:"follower_count"`
	RequiredContent int                    `json:"required_content"`
	Status          models.AffiliateStatus `json:"status"`
	Notes           string                 `json:"notes"`
	StatusNotes     string                 `json:"status_notes"`
	UrgentFollowUp  bool                   `json:"urgent_follow_up"`
	AdminUserID     *uint                  `json:"admin_user_id"`
}
```

**UpdateAffiliate Function (خلاصه):**
- Body را می‌خواند و به `rawData` و `UpdateAffiliateRequest` parse می‌کند
- از `ensureAffiliateColumns` برای اطمینان از وجود ستون‌ها استفاده می‌کند
- فیلدها را از `req` به `affiliate` کپی می‌کند
- با `Updates(map[string]interface{})` ذخیره می‌کند

**GetAffiliatesList Function:**
- از `ensureAffiliateColumns` استفاده می‌کند
- با `Select("*")` query می‌زند
- لیست را برمی‌گرداند

### Frontend (React + TypeScript)

**Interface:**
```typescript
interface Affiliate {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  instagram_link?: string;
  telegram_id?: string;
  whatsapp_link?: string;
  status_notes?: string;
  // ... other fields
}
```

**Update Handler:**
```typescript
const handleUpdate = async () => {
  const finalUpdateData: any = {
    first_name: String(formData.first_name || ""),
    last_name: String(formData.last_name || ""),
    phone: String(formData.phone || ""),
    email: String(formData.email || ""),
    instagram_link: String(formData.instagram_link || ""),
    telegram_id: String(formData.telegram_id || ""),
    whatsapp_link: String(formData.whatsapp_link || ""),
    status_notes: String(statusNotes ? JSON.stringify(statusNotes) : ""),
    // ... other fields
  };

  const response = await fetch(`${API_URL}/admin/affiliates/${editingAffiliate.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(finalUpdateData),
  });
  // ...
};
```

## مشکل اصلی

1. **ستون‌ها در دیتابیس وجود ندارند یا GORM آنها را نمی‌شناسد:**
   - `ensureAffiliateColumns` ممکن است درست کار نکند
   - یا ستون‌ها با نام/نوع اشتباه ساخته شده‌اند

2. **GORM فیلدها را serialize نمی‌کند:**
   - ممکن است GORM فیلدهای خالی را skip کند
   - یا JSON tags مشکل داشته باشند

3. **Query فیلدها را برنمی‌گرداند:**
   - ممکن است `Select("*")` کافی نباشد
   - یا ستون‌ها در دیتابیس وجود ندارند

## آنچه که کار می‌کند

- فیلدهای `email` و `phone` به درستی ذخیره و برگردانده می‌شوند
- سایر فیلدها (first_name, last_name, status, notes) کار می‌کنند
- فقط 4 فیلد مشکل دارند: `instagram_link`, `telegram_id`, `whatsapp_link`, `status_notes`

## Response JSON فعلی

```json
{
  "affiliates": [
    {
      "id": 7,
      "first_name": "سیبشس",
      "last_name": "شسیبشسش",
      "phone": "09103946748",
      "email": "https://www.instagram.com/about.soli",
      "follower_count": 0,
      "required_content": 0,
      "status": "lead_pool",
      "notes": "https://www.instagram.com/about.soli",
      // ❌ instagram_link, telegram_id, whatsapp_link, status_notes وجود ندارند
    }
  ]
}
```

## آنچه که انتظار می‌رود

```json
{
  "affiliates": [
    {
      "id": 7,
      "first_name": "سیبشس",
      "last_name": "شسیبشسش",
      "phone": "09103946748",
      "email": "https://www.instagram.com/about.soli",
      "instagram_link": "https://instagram.com/...",
      "telegram_id": "@username",
      "whatsapp_link": "https://wa.me/...",
      "status_notes": "[{\"status\":\"lead_pool\",\"note\":\"...\"}]",
      "follower_count": 0,
      "required_content": 0,
      "status": "lead_pool",
      "notes": "https://www.instagram.com/about.soli"
    }
  ]
}
```

## راه‌حل مورد نیاز

1. **مطمئن شوید که ستون‌ها در دیتابیس وجود دارند:**
   - بررسی کنید که `ensureAffiliateColumns` درست کار می‌کند
   - یا ستون‌ها را دستی با SQL اضافه کنید

2. **مطمئن شوید که GORM فیلدها را می‌شناسد:**
   - بررسی کنید که مدل درست است
   - مطمئن شوید که AutoMigrate اجرا شده است

3. **مطمئن شوید که فیلدها در query برگردانده می‌شوند:**
   - بررسی کنید که `Select("*")` همه فیلدها را شامل می‌شود
   - یا به صورت explicit فیلدها را select کنید

4. **مطمئن شوید که فیلدها ذخیره می‌شوند:**
   - بررسی کنید که `Updates(map)` همه فیلدها را شامل می‌شود
   - لاگ بزنید تا ببینید چه چیزی به دیتابیس می‌رود

## فایل‌های کلیدی

- `backend/models/affiliate.go` - مدل Affiliate
- `backend/controllers/affiliate.go` - کنترلر با UpdateAffiliate و GetAffiliatesList
- `src/components/AffiliatesManager.tsx` - کامپوننت React برای مدیریت افیلیت‌ها
- `backend/cmd/main.go` - جایی که AutoMigrate اجرا می‌شود

## دیتابیس

- MySQL/MariaDB
- جدول: `affiliates`
- ستون‌های مورد نیاز:
  - `instagram_link` VARCHAR(500)
  - `telegram_id` VARCHAR(100)
  - `whatsapp_link` VARCHAR(500)
  - `status_notes` TEXT
  - `urgent_follow_up` TINYINT(1)

## درخواست

لطفاً کد را بررسی کنید و مشکل را پیدا کنید. احتمالاً یکی از این موارد است:
1. ستون‌ها در دیتابیس وجود ندارند
2. GORM فیلدها را نمی‌شناسد
3. Query فیلدها را برنمی‌گرداند
4. Serialization مشکل دارد

راه‌حل را به صورت کامل و قابل اجرا ارائه دهید.

