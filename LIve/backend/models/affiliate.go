package models

import "time"

// AffiliateStatus represents the status of an affiliate
type AffiliateStatus string

const (
	AffiliateStatusLeadPool        AffiliateStatus = "lead_pool"         // انبار لید
	AffiliateStatusMeetingNegotiate AffiliateStatus = "meeting_negotiate" // مذاکره برای جلسه
	AffiliateStatusWaitingMeeting  AffiliateStatus = "waiting_meeting"    // منتظر برگزاری جلسه
	AffiliateStatusClosingContract AffiliateStatus = "closing_contract"   // بستن قرار داد
	AffiliateStatusFollowUp        AffiliateStatus = "follow_up"          // پیگیری شروع همکاری
	AffiliateStatusActive          AffiliateStatus = "active"             // افیلیت فعال
)

// Affiliate represents an affiliate partner
type Affiliate struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	FirstName         string          `gorm:"type:varchar(255);not null" json:"first_name"`
	LastName          string          `gorm:"type:varchar(255);not null" json:"last_name"`
	Phone             string          `gorm:"type:varchar(20);index" json:"phone"`
	Email             string          `gorm:"type:varchar(255)" json:"email"`
	InstagramLink     string          `gorm:"type:varchar(500)" json:"instagram_link"`  // لینک اینستاگرام
	TelegramID        string          `gorm:"type:varchar(100)" json:"telegram_id"`       // آیدی تلگرام
	WhatsAppLink      string          `gorm:"type:varchar(500)" json:"whatsapp_link"`     // لینک واتساپ
	FollowerCount     int             `gorm:"default:0" json:"follower_count"`           // تعداد فالوور
	RequiredContent   int             `gorm:"default:0" json:"required_content"`       // تعداد محتوای مورد نیاز
	LeadsCount        int             `gorm:"default:0" json:"leads_count"`            // تعداد لیدهای گرفته شده (فقط برای فعال)
	Status            AffiliateStatus `gorm:"type:varchar(50);default:'lead_pool';index" json:"status"`
	Notes             string          `gorm:"type:text" json:"notes"`                  // یادداشت‌های کلی
	StatusNotes       string          `gorm:"type:text" json:"status_notes"`          // یادداشت‌های وضعیت (JSON format: [{"status":"lead_pool","note":"...","created_at":"..."},...])
	UrgentFollowUp    bool            `gorm:"default:false;index" json:"urgent_follow_up"` // نیاز به پیگیری فوری
	AdminUserID       *uint           `gorm:"index" json:"admin_user_id,omitempty"`     // برای افیلیت‌های فعال - ارتباط با AdminUser
	AdminUser         *AdminUser      `gorm:"foreignKey:AdminUserID" json:"admin_user,omitempty"`
	CreatedByID       uint            `gorm:"index" json:"created_by_id"`              // کسی که این افیلیت را ثبت کرده
	CreatedBy         *AdminUser      `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}

// TableName specifies the table name
func (Affiliate) TableName() string {
	return "affiliates"
}

