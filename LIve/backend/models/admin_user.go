package models

import "time"

// AdminUser represents an admin user with authentication
type AdminUser struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	Username            string    `gorm:"type:varchar(191);uniqueIndex;not null" json:"username"`
	Password            string    `gorm:"type:varchar(255);not null" json:"-"`                               // Don't expose password in JSON
	IsActive            bool      `gorm:"default:true;index" json:"is_active"`                               // Can disable users without deleting
	IsAffiliate         bool      `gorm:"default:false;index" json:"is_affiliate"`                           // آیا این کاربر به عنوان افیلیت فعال است
	AffiliatePercentage *float64  `gorm:"type:decimal(5,2);default:0" json:"affiliate_percentage,omitempty"` // درصد سود افیلیت (مثلاً 20.00 برای 20%)
	ContentModeEnabled  bool      `gorm:"default:false;index" json:"content_mode_enabled"`                   // آیا حالت محتوا سازی برای این کاربر فعال است
	TelegramID          *string   `gorm:"type:varchar(100);index" json:"telegram_id,omitempty"`              // Telegram user ID for bot authentication
	Name                *string   `gorm:"type:varchar(255)" json:"name"`                                     // نام کاربر برای ارسال SMS
	Phone               *string   `gorm:"type:varchar(20)" json:"phone"`                                     // شماره تماس کاربر برای ارسال SMS
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`

	// Permissions relationship - CRITICAL: removed omitempty to always show permissions array
	Permissions []AdminPermission `gorm:"many2many:admin_user_permissions;foreignKey:ID;joinForeignKey:AdminUserID;References:ID;joinReferences:AdminPermissionID" json:"permissions"`

	// Derived field for response only
	PermissionsCount int `gorm:"-" json:"permissions_count"`
}

// AdminPermission represents a permission that can be granted to admin users
type AdminPermission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Key         string    `gorm:"column:key;type:varchar(100);uniqueIndex;not null" json:"key"` // Column name is "key" (reserved word, escaped in queries)
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`            // Human-readable name
	Description string    `gorm:"type:text" json:"description"`                      // Description of what this permission allows
	Category    string    `gorm:"type:varchar(50);index" json:"category"`            // e.g., "dashboard", "sms", "users", "settings"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AdminUserPermission is the join table for many-to-many relationship
type AdminUserPermission struct {
	AdminUserID       uint      `gorm:"primaryKey;index" json:"admin_user_id"`
	AdminPermissionID uint      `gorm:"primaryKey;index" json:"admin_permission_id"`
	CreatedAt         time.Time `json:"created_at"`
}

// TableName specifies the table name for AdminUserPermission
func (AdminUserPermission) TableName() string {
	return "admin_user_permissions"
}

// Permission keys constants
const (
	// Dashboard permissions
	PermissionDashboardView                = "dashboard.view"
	PermissionDashboardAffiliateView       = "dashboard.affiliate.view"
	PermissionDashboardExport              = "dashboard.export"
	PermissionDashboardWidgetOnline        = "dashboard.widget.online"
	PermissionDashboardWidgetRegistrations = "dashboard.widget.registrations"
	PermissionDashboardWidgetClicks        = "dashboard.widget.clicks"
	PermissionDashboardWidgetViewers       = "dashboard.widget.viewers"
	PermissionDashboardWidgetNonViewers    = "dashboard.widget.non_viewers"
	PermissionDashboardWidgetOverview      = "dashboard.widget.overview"
	PermissionDashboardWidgetRegChart      = "dashboard.widget.registration_chart"
	PermissionDashboardWidgetConversion    = "dashboard.widget.conversion_rate"
	PermissionDashboardWidgetRegToView     = "dashboard.widget.registration_to_view"

	// Task permissions
	PermissionTasksManage      = "tasks.manage"
	PermissionTasksCollaborate = "tasks.collaborate"

	// Users permissions
	PermissionUsersView   = "users.view"
	PermissionUsersExport = "users.export"

	// SMS permissions
	PermissionSMSView   = "sms.view"
	PermissionSMSCreate = "sms.create"
	PermissionSMSEdit   = "sms.edit"
	PermissionSMSDelete = "sms.delete"
	PermissionSMSSend   = "sms.send"

	// Avanak permissions
	PermissionAvanakView   = "avanak.view"
	PermissionAvanakCreate = "avanak.create"
	PermissionAvanakEdit   = "avanak.edit"
	PermissionAvanakDelete = "avanak.delete"

	// Workflow permissions
	PermissionWorkflowView   = "workflow.view"
	PermissionWorkflowCreate = "workflow.create"
	PermissionWorkflowEdit   = "workflow.edit"
	PermissionWorkflowDelete = "workflow.delete"

	// Settings permissions
	PermissionSettingsView     = "settings.view"
	PermissionSettingsEdit     = "settings.edit"
	PermissionSettingsWebinar  = "settings.webinar"
	PermissionSettingsSMS      = "settings.sms"
	PermissionSettingsComments = "settings.comments"

	// Admin users management (super admin only)
	PermissionAdminUsersView   = "admin_users.view"
	PermissionAdminUsersCreate = "admin_users.create"
	PermissionAdminUsersEdit   = "admin_users.edit"
	PermissionAdminUsersDelete = "admin_users.delete"

	// Payments permissions
	PermissionPaymentsView         = "payments.view"
	PermissionPaymentsListControls = "payments.list.controls" // کنترل نمایش بخش‌های لیست پرداخت‌ها (جستجو، فیلترها، خروجی)
	PermissionPaymentsStatsSuccess = "payments.stats.success" // نمایش کادر آمار "موفق"
	PermissionPaymentsStatsPending = "payments.stats.pending" // نمایش کادر آمار "در انتظار"
	PermissionPaymentsStatsTotal   = "payments.stats.total"   // نمایش کادر آمار "مجموع موفق"
	PermissionPaymentsStatsProfit  = "payments.stats.profit"  // نمایش کادر آمار "سود شما"
	PermissionPaymentsDailyChart   = "payments.daily.chart"   // نمایش نمودار فروش روزانه
	PermissionPaymentsFilterInstallment = "payments.filter.installment" // فیلتر پرداخت‌های قسطی/کامل
	// دسترسی‌های محدود برای مدیریت پرداخت‌ها
	PermissionPaymentsViewInstallmentOnly = "payments.view.installment_only" // فقط پرداخت‌های قسطی
	PermissionPaymentsViewFullOnly        = "payments.view.full_only"        // فقط پرداخت‌های کامل
	PermissionPaymentsViewSuccessOnly     = "payments.view.success_only"     // فقط پرداخت‌های موفق
	PermissionPaymentsViewPendingOnly     = "payments.view.pending_only"     // فقط پرداخت‌های در انتظار
	PermissionPaymentsViewLandingActivity = "payments.view.landing_activity"  // نمایش رفتارهای لندینگ

	// Licenses permissions
	PermissionLicensesView   = "licenses.view"
	PermissionLicensesManage = "licenses.manage"

	// Affiliates permissions
	PermissionAffiliatesView   = "affiliates.view"
	PermissionAffiliatesCreate = "affiliates.create"
	PermissionAffiliatesEdit   = "affiliates.edit"
	PermissionAffiliatesDelete = "affiliates.delete"
)

// GetDefaultPermissions returns a list of all default permissions with their metadata
func GetDefaultPermissions() []AdminPermission {
	return []AdminPermission{
		// Dashboard
		{Key: PermissionDashboardView, Name: "مشاهده آمار کلی", Description: "دسترسی به صفحه داشبورد و آمار کلی سیستم", Category: "dashboard"},
		{Key: PermissionDashboardAffiliateView, Name: "مشاهده آمار افیلیت", Description: "مشاهده آمار مربوط به کاربرانی که از لینک اختصاصی ثبت‌نام کرده‌اند", Category: "dashboard"},
		{Key: PermissionDashboardExport, Name: "خروجی داشبورد", Description: "خروجی گرفتن از داده‌های داشبورد", Category: "dashboard"},
		{Key: PermissionDashboardWidgetOnline, Name: "کارت کاربران آنلاین", Description: "نمایش کارت کاربران آنلاین", Category: "dashboard"},
		{Key: PermissionDashboardWidgetRegistrations, Name: "کارت ثبت‌نام‌ها", Description: "نمایش کارت تعداد ثبت‌نام", Category: "dashboard"},
		{Key: PermissionDashboardWidgetClicks, Name: "کارت کلیک روی لینک", Description: "نمایش کارت آمار کلیک", Category: "dashboard"},
		{Key: PermissionDashboardWidgetViewers, Name: "کارت بینندگان", Description: "نمایش کارت تعداد بینندگان", Category: "dashboard"},
		{Key: PermissionDashboardWidgetNonViewers, Name: "کارت عدم تماشا", Description: "نمایش کارت کاربران بدون تماشا", Category: "dashboard"},
		{Key: PermissionDashboardWidgetOverview, Name: "نمودار آمار کلی", Description: "نمایش نمودار آمار کلی داشبورد", Category: "dashboard"},
		{Key: PermissionDashboardWidgetRegChart, Name: "نمودار ثبت‌نام‌ها", Description: "نمایش نمودار ثبت‌نام‌ها", Category: "dashboard"},
		{Key: PermissionDashboardWidgetConversion, Name: "کارت نرخ تبدیل", Description: "نمایش کارت نرخ تبدیل کلیک به تماشا", Category: "dashboard"},
		{Key: PermissionDashboardWidgetRegToView, Name: "کارت ثبت‌نام به تماشا", Description: "نمایش کارت نرخ ثبت‌نام به تماشا", Category: "dashboard"},

		// Tasks
		{Key: PermissionTasksManage, Name: "مدیریت کامل تسک‌ها", Description: "ایجاد، ویرایش، حذف و تخصیص تسک‌ها", Category: "tasks"},
		{Key: PermissionTasksCollaborate, Name: "همکاری در تسک‌ها", Description: "مشاهده و بروزرسانی تسک‌های محول‌شده", Category: "tasks"},

		// Users
		{Key: PermissionUsersView, Name: "مشاهده کاربران", Description: "مشاهده لیست کاربران", Category: "users"},
		{Key: PermissionUsersExport, Name: "خروجی کاربران", Description: "خروجی گرفتن از لیست کاربران", Category: "users"},

		// SMS
		{Key: PermissionSMSView, Name: "مشاهده پیام‌های SMS", Description: "مشاهده لیست پیام‌های SMS", Category: "sms"},
		{Key: PermissionSMSCreate, Name: "ایجاد پیام SMS", Description: "ایجاد پیام SMS جدید", Category: "sms"},
		{Key: PermissionSMSEdit, Name: "ویرایش پیام SMS", Description: "ویرایش پیام‌های SMS", Category: "sms"},
		{Key: PermissionSMSDelete, Name: "حذف پیام SMS", Description: "حذف پیام‌های SMS", Category: "sms"},
		{Key: PermissionSMSSend, Name: "ارسال SMS", Description: "ارسال دستی و گروهی SMS", Category: "sms"},

		// Avanak
		{Key: PermissionAvanakView, Name: "مشاهده پیام‌های آوانک", Description: "مشاهده لیست پیام‌های صوتی", Category: "avanak"},
		{Key: PermissionAvanakCreate, Name: "ایجاد پیام آوانک", Description: "ایجاد پیام صوتی جدید", Category: "avanak"},
		{Key: PermissionAvanakEdit, Name: "ویرایش پیام آوانک", Description: "ویرایش پیام‌های صوتی", Category: "avanak"},
		{Key: PermissionAvanakDelete, Name: "حذف پیام آوانک", Description: "حذف پیام‌های صوتی", Category: "avanak"},

		// Workflow
		{Key: PermissionWorkflowView, Name: "مشاهده گردش‌کارها", Description: "مشاهده لیست گردش‌کارها", Category: "workflow"},
		{Key: PermissionWorkflowCreate, Name: "ایجاد گردش‌کار", Description: "ایجاد گردش‌کار جدید", Category: "workflow"},
		{Key: PermissionWorkflowEdit, Name: "ویرایش گردش‌کار", Description: "ویرایش گردش‌کارها", Category: "workflow"},
		{Key: PermissionWorkflowDelete, Name: "حذف گردش‌کار", Description: "حذف گردش‌کارها", Category: "workflow"},

		// Settings
		{Key: PermissionSettingsView, Name: "مشاهده تنظیمات", Description: "مشاهده تنظیمات سیستم", Category: "settings"},
		{Key: PermissionSettingsEdit, Name: "ویرایش تنظیمات", Description: "ویرایش تنظیمات سیستم", Category: "settings"},
		{Key: PermissionSettingsWebinar, Name: "مدیریت زمان‌بندی کارگاه", Description: "دسترسی به تب زمان‌بندی کارگاه در تنظیمات", Category: "settings"},
		{Key: PermissionSettingsSMS, Name: "مدیریت تنظیمات پیامک", Description: "دسترسی به تب مدیریت پیام‌های SMS در تنظیمات", Category: "settings"},
		{Key: PermissionSettingsComments, Name: "مدیریت تنظیمات کامنت‌ها", Description: "دسترسی به تب مدیریت کامنت‌ها در تنظیمات", Category: "settings"},

		// Admin Users (super admin)
		{Key: PermissionAdminUsersView, Name: "مشاهده کاربران ادمین", Description: "مشاهده لیست کاربران ادمین", Category: "admin_users"},
		{Key: PermissionAdminUsersCreate, Name: "ایجاد کاربر ادمین", Description: "ایجاد کاربر ادمین جدید", Category: "admin_users"},
		{Key: PermissionAdminUsersEdit, Name: "ویرایش کاربر ادمین", Description: "ویرایش کاربران ادمین", Category: "admin_users"},
		{Key: PermissionAdminUsersDelete, Name: "حذف کاربر ادمین", Description: "حذف کاربران ادمین", Category: "admin_users"},

		// Payments
		{Key: PermissionPaymentsView, Name: "مشاهده پرداخت‌ها", Description: "مشاهده لیست پرداخت‌های انجام شده در لندینگ", Category: "payments"},
		{Key: PermissionPaymentsListControls, Name: "کنترل لیست پرداخت‌ها", Description: "نمایش/عدم نمایش بخش‌های لیست پرداخت‌ها (جستجو، فیلترها، خروجی اکسل، ارسال پیام)", Category: "payments"},
		{Key: PermissionPaymentsStatsSuccess, Name: "آمار پرداخت موفق", Description: "نمایش کادر آمار تعداد پرداخت‌های موفق", Category: "payments"},
		{Key: PermissionPaymentsStatsPending, Name: "آمار پرداخت در انتظار", Description: "نمایش کادر آمار تعداد پرداخت‌های در انتظار", Category: "payments"},
		{Key: PermissionPaymentsStatsTotal, Name: "آمار مجموع موفق", Description: "نمایش کادر آمار مجموع مبلغ پرداخت‌های موفق", Category: "payments"},
		{Key: PermissionPaymentsStatsProfit, Name: "آمار سود افیلیت", Description: "نمایش کادر آمار سود افیلیت", Category: "payments"},
		{Key: PermissionPaymentsDailyChart, Name: "نمودار فروش روزانه", Description: "نمایش نمودار فروش روزانه و مبلغ فروش موفق", Category: "payments"},
		{Key: PermissionPaymentsFilterInstallment, Name: "فیلتر پرداخت قسطی/کامل", Description: "استفاده از فیلتر برای نمایش فقط پرداخت‌های قسطی یا کامل", Category: "payments"},
		{Key: PermissionPaymentsViewInstallmentOnly, Name: "نمایش پرداخت قسطی", Description: "نمایش پرداخت‌های قسطی در لیست پرداخت‌ها", Category: "payments"},
		{Key: PermissionPaymentsViewFullOnly, Name: "نمایش پرداخت کامل", Description: "نمایش پرداخت‌های کامل (غیرقسطی) در لیست پرداخت‌ها", Category: "payments"},
		{Key: PermissionPaymentsViewSuccessOnly, Name: "فقط پرداخت‌های موفق", Description: "فقط پرداخت‌های موفق را مشاهده و مدیریت کند", Category: "payments"},
		{Key: PermissionPaymentsViewPendingOnly, Name: "فقط پرداخت‌های در انتظار", Description: "فقط پرداخت‌های در انتظار را مشاهده و مدیریت کند", Category: "payments"},
		{Key: PermissionPaymentsViewLandingActivity, Name: "نمایش رفتار کاربر", Description: "نمایش ستون‌های مربوط به رفتار کاربر در لندینگ", Category: "payments"},

		// Licenses
		{Key: PermissionLicensesView, Name: "مشاهده لایسنس‌ها", Description: "مشاهده لیست لایسنس‌ها و آمار", Category: "licenses"},
		{Key: PermissionLicensesManage, Name: "مدیریت لایسنس‌ها", Description: "آپلود، مدیریت و اختصاص لایسنس‌ها", Category: "licenses"},

		// Affiliates
		{Key: PermissionAffiliatesView, Name: "مشاهده افیلیت‌ها", Description: "مشاهده لیست افیلیت‌ها", Category: "affiliates"},
		{Key: PermissionAffiliatesCreate, Name: "ایجاد افیلیت", Description: "ثبت افیلیت جدید", Category: "affiliates"},
		{Key: PermissionAffiliatesEdit, Name: "ویرایش افیلیت", Description: "ویرایش اطلاعات افیلیت‌ها", Category: "affiliates"},
		{Key: PermissionAffiliatesDelete, Name: "حذف افیلیت", Description: "حذف افیلیت‌ها", Category: "affiliates"},
	}
}
