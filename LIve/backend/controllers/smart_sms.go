package controllers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"monetizeai-backend/models"
	"monetizeai-backend/scheduler"
	"monetizeai-backend/services"
	"monetizeai-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SmartSMSController struct {
	DB                 *gorm.DB
	AvanakService      *services.AvanakService
	MelipayamakService *services.MelipayamakService
	FarazSMSService    *services.FarazSMSService
}

func NewSmartSMSController(db *gorm.DB, avanakService *services.AvanakService, melipayamakService *services.MelipayamakService, farazSMSService *services.FarazSMSService) *SmartSMSController {
	return &SmartSMSController{
		DB:                 db,
		AvanakService:      avanakService,
		MelipayamakService: melipayamakService,
		FarazSMSService:    farazSMSService,
	}
}

type smartSMSTodayItem struct {
	Category        string `json:"category"`
	Provider        string `json:"provider"`
	ScheduledTime   string `json:"scheduled_time"` // HH:MM
	MessageText     string `json:"message_text"`
	PatternKey      string `json:"pattern_key,omitempty"`
	PatternCode     string `json:"pattern_code,omitempty"`
	AvanakMessageID int    `json:"avanak_message_id,omitempty"` // For Avanak voice calls
	Status          string `json:"status"`                      // در انتظار | ارسال شده | لغو شده | در حال ارسال
	EligibleCount   int    `json:"eligible_count"`
	SentCount       int    `json:"sent_count"`
}

type smartSMSBehaviorItem struct {
	Category      string `json:"category"`
	Provider      string `json:"provider"`
	PatternCode   string `json:"pattern_code,omitempty"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	Status        string `json:"status"` // فعال | غیرفعال
	EligibleCount int    `json:"eligible_count"`
}

func (ctrl *SmartSMSController) getCfgValue(key string) (string, bool) {
	var cfg models.SystemConfig
	if err := ctrl.DB.Where("`key` = ?", key).First(&cfg).Error; err != nil {
		return "", false
	}
	if cfg.Value == "" {
		return "", false
	}
	return cfg.Value, true
}

func (ctrl *SmartSMSController) todayMidnight(now time.Time, loc *time.Location) time.Time {
	n := now.In(loc)
	return time.Date(n.Year(), n.Month(), n.Day(), 0, 0, 0, 0, loc)
}

func (ctrl *SmartSMSController) yesterdayRangeJalali(now time.Time, loc *time.Location) (time.Time, time.Time) {
	y := utils.ToPersian(now.In(loc).AddDate(0, 0, -1))
	start := utils.PersianToGregorian(y.Year, y.Month, y.Day).In(loc)
	return start, start.AddDate(0, 0, 1)
}

func (ctrl *SmartSMSController) countEligibleYesterday(category string, start time.Time, end time.Time) (int, error) {
	// Eligible = ALL unique phone numbers registered in [start,end)
	// Show all users who registered yesterday, regardless of whether they received SMS or not
	// Deduplication by phone number: if user registered multiple times, count only once
	var count int64
	query := ctrl.DB.Table("users AS u").
		Select("COUNT(DISTINCT u.phone)").
		Where("u.registered_at >= ? AND u.registered_at < ?", start, end)

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return int(count), nil
}

func (ctrl *SmartSMSController) countEligiblePopupFollowup(category string, progresses []models.PopupProgress, cutoff time.Time) (int, error) {
	// Eligible = users with popup_progress in progresses, last_popup_activity_at <= cutoff
	// and NOT already sent for (identity, cycle, category). Use identity_id or fallback via user_identities.
	var count int64
	query := ctrl.DB.Table("users AS u").
		Joins("LEFT JOIN user_identities ui ON ui.phone = u.phone").
		Select("COUNT(*)").
		Where("u.last_popup_activity_at IS NOT NULL").
		Where("u.last_popup_activity_at <= ?", cutoff).
		Where("u.popup_progress IN ?", progresses).
		Where(`
			NOT EXISTS (
				SELECT 1 FROM sms_logs sl
				WHERE sl.user_id = COALESCE(u.identity_id, ui.id)
				  AND sl.registration_cycle_id = u.id
				  AND sl.category = ?
			)
		`, category)

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return int(count), nil
}

func (ctrl *SmartSMSController) countEligiblePopupCompletedImmediate(category string) (int, error) {
	var count int64
	query := ctrl.DB.Table("users AS u").
		Joins("LEFT JOIN user_identities ui ON ui.phone = u.phone").
		Select("COUNT(*)").
		Where("u.last_popup_activity_at IS NOT NULL").
		Where("u.popup_progress = ?", models.PopupProgressCompleted).
		Where(`
			NOT EXISTS (
				SELECT 1 FROM sms_logs sl
				WHERE sl.user_id = COALESCE(u.identity_id, ui.id)
				  AND sl.registration_cycle_id = u.id
				  AND sl.category = ?
			)
		`, category)

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return int(count), nil
}

func (ctrl *SmartSMSController) GetTodaySmartSMS(c *gin.Context) {
	if !(HasPermission(c, ctrl.DB, "users.view") || HasPermission(c, ctrl.DB, "dashboard.view")) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	runDate := ctrl.todayMidnight(now, loc)

	start, end := ctrl.yesterdayRangeJalali(now, loc)

	// Load scheduled messages from database (with fallback to defaults)
	var dbMessages []models.SmartSMSScheduledMessage
	if err := ctrl.DB.Where("is_active = ?", true).Order("display_order ASC, hour ASC, minute ASC").Find(&dbMessages).Error; err != nil {
		// Fallback to hard-coded defaults if DB query fails
		dbMessages = nil
	}

	items := make([]smartSMSTodayItem, 0)

	// Default messages (used if DB is empty or query fails)
	defaultMessages := []struct {
		Category      string
		Provider      string
		ScheduledTime string
		MessageText   string
		DisplayOrder  int
	}{
		{
			Category:      "yesterday_0800_faraz",
			Provider:      "faraz",
			ScheduledTime: "08:00",
			MessageText:   "میدونی مشکل چیه؟ بیشتر آدما مشکلشون تنبلی یا کم‌هوشی نیست\n\nمشکلشون اینه که مسیر درست رو ندیدن❌\n\nکارگاه امروز دقیقاً برای همینه!",
			DisplayOrder:  1,
		},
		{
			Category:      "yesterday_1400_faraz",
			Provider:      "faraz",
			ScheduledTime: "14:00",
			MessageText:   "این کارگاه برای آدمایی ساخته شده که دیگه از سردرگمی خسته شدن\nو دنبال یه مسیر و سیستم واقعین🚀\n\nامروز ساعت ۱۹ مسیر روشن می‌شه💫",
			DisplayOrder:  2,
		},
		{
			Category:      "yesterday_1700_faraz",
			Provider:      "faraz",
			ScheduledTime: "17:00",
			MessageText:   "کارگاه امشب زنده برگزار می‌شه و ضبط نمیشه\nنه برای هیجان، برای اینکه تغییر واقعی زنده اتفاق می‌افته",
			DisplayOrder:  3,
		},
		{
			Category:      "yesterday_1815_melipayamak",
			Provider:      "faraz",
			ScheduledTime: "18:15",
			MessageText:   "۳۰ دقیقه تا شروع کارگاه مونده.\nلینک ورود سر ساعت ارسال میشه",
			DisplayOrder:  4,
		},
		{
			Category:      "yesterday_1855_melipayamak",
			Provider:      "faraz",
			ScheduledTime: "18:55",
			MessageText:   "🔴کارگاه شروع شد..\nهمین الان وارد شو:\nhttps://webinar.sianacademy.com/webinar",
			DisplayOrder:  5,
		},
		{
			Category:      "yesterday_1915_faraz",
			Provider:      "faraz",
			ScheduledTime: "19:15",
			MessageText:   "کارگاه در حال اجراست...\nاز دستش ندی👇🏼\nwebinar.sianacademy.com/webinar",
			DisplayOrder:  6,
		},
		{
			Category:      "yesterday_1715_avanak",
			Provider:      "avanak",
			ScheduledTime: "17:15",
			MessageText:   "🔴کارگاه شروع شد..\nهمین الان وارد شو:\nhttps://webinar.sianacademy.com/webinar",
			DisplayOrder:  7,
		},
	}

	// Use DB messages if available, otherwise use defaults
	if len(dbMessages) > 0 {
		for _, msg := range dbMessages {
			scheduledTime := fmt.Sprintf("%02d:%02d", msg.Hour, msg.Minute)
			messageText := msg.Message
			// For Avanak, use a descriptive message if Message is empty
			if msg.Provider == "avanak" && messageText == "" {
				messageText = fmt.Sprintf("🔴کارگاه شروع شد..\nهمین الان وارد شو:\nhttps://webinar.sianacademy.com/webinar\n(پیام صوتی - کد: %d)", msg.AvanakMessageID)
			}
			items = append(items, smartSMSTodayItem{
				Category:        msg.Category,
				Provider:        msg.Provider,
				ScheduledTime:   scheduledTime,
				MessageText:     messageText,
				PatternKey:      msg.PatternKey,
				AvanakMessageID: msg.AvanakMessageID,
			})
		}
	} else {
		// Use defaults
		for _, def := range defaultMessages {
			items = append(items, smartSMSTodayItem{
				Category:      def.Category,
				Provider:      def.Provider,
				ScheduledTime: def.ScheduledTime,
				MessageText:   def.MessageText,
			})
		}
	}

	for i := range items {
		// pattern code (if needed)
		if items[i].PatternKey != "" {
			if val, ok := ctrl.getCfgValue(items[i].PatternKey); ok {
				items[i].PatternCode = val
			}
		}

		eligible, eErr := ctrl.countEligibleYesterday(items[i].Category, start, end)
		if eErr != nil {
			eligible = 0
		}
		items[i].EligibleCount = eligible

		// Determine status based on run table
		var run models.SmartSMSScheduleRun
		if err := ctrl.DB.Where("category = ? AND run_date = ?", items[i].Category, runDate).First(&run).Error; err == nil {
			items[i].SentCount = run.SentCount
			switch run.Status {
			case "sent":
				items[i].Status = "ارسال شده"
			case "cancelled":
				items[i].Status = "لغو شده"
			case "sending":
				items[i].Status = "در حال ارسال"
			default:
				items[i].Status = "در انتظار"
			}
		} else {
			items[i].Status = "در انتظار"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"yesterday_range": gin.H{
			"start": start.Format(time.RFC3339),
			"end":   end.Format(time.RFC3339),
		},
		"items": items,
	})
}

// GetScheduledMessages returns all scheduled SMS messages (for admin editing)
func (ctrl *SmartSMSController) GetScheduledMessages(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, "settings.edit") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var messages []models.SmartSMSScheduledMessage
	if err := ctrl.DB.Order("display_order ASC, hour ASC, minute ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scheduled messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"messages": messages,
	})
}

// UpdateScheduledMessage updates a scheduled SMS message
func (ctrl *SmartSMSController) UpdateScheduledMessage(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, "settings.edit") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		Category        string `json:"category" binding:"required"`
		Provider        string `json:"provider" binding:"required"`
		Hour            int    `json:"hour" binding:"required,min=0,max=23"`
		Minute          int    `json:"minute" binding:"required,min=0,max=59"`
		Message         string `json:"message" binding:"required"`
		PatternKey      string `json:"pattern_key,omitempty"`
		AvanakMessageID int    `json:"avanak_message_id,omitempty"` // For Avanak voice calls
		IsActive        bool   `json:"is_active"`
		DisplayOrder    int    `json:"display_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var message models.SmartSMSScheduledMessage
	if err := ctrl.DB.Where("category = ?", req.Category).First(&message).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scheduled message not found"})
		return
	}

	// Store old time values before updating (for logging)
	oldHour := message.Hour
	oldMinute := message.Minute

	// Check if time has changed (this will trigger status reset)
	timeChanged := message.Hour != req.Hour || message.Minute != req.Minute

	// Update fields
	message.Provider = req.Provider
	message.Hour = req.Hour
	message.Minute = req.Minute
	message.Message = req.Message
	message.PatternKey = req.PatternKey
	message.IsActive = req.IsActive
	message.DisplayOrder = req.DisplayOrder
	// Update AvanakMessageID for Avanak provider
	if req.Provider == "avanak" {
		if req.AvanakMessageID > 0 {
			message.AvanakMessageID = req.AvanakMessageID
		} else {
			// If AvanakMessageID is not provided or invalid, keep existing value
			// Don't reset it to 0
		}
	} else {
		// For non-Avanak providers, reset AvanakMessageID to 0
		message.AvanakMessageID = 0
	}

	// CRITICAL: Explicitly update UpdatedAt to ensure it's set to current time
	// This is needed for the scheduler to detect recent time changes
	message.UpdatedAt = time.Now()

	if err := ctrl.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update scheduled message"})
		return
	}

	log.Printf("✅ smart_sms: updated scheduled message category=%s, hour=%02d, minute=%02d, UpdatedAt=%s",
		req.Category, req.Hour, req.Minute, message.UpdatedAt.Format("2006-01-02 15:04:05"))

	// If time changed, reset status for future runs (today and later)
	// This allows the message to be sent again at the new time
	if timeChanged {
		loc, err := time.LoadLocation("Asia/Tehran")
		if err != nil {
			loc = time.UTC
		}
		now := time.Now().In(loc)
		todayMidnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

		// Delete all SmartSMSScheduleRun records for this category with run_date >= today
		// This will reset the status to "در انتظار" (pending) for future runs
		if err := ctrl.DB.Where("category = ? AND run_date >= ?", req.Category, todayMidnight).
			Delete(&models.SmartSMSScheduleRun{}).Error; err != nil {
			// Log error but don't fail the update
			log.Printf("⚠️ Failed to reset schedule runs for category %s: %v", req.Category, err)
		} else {
			log.Printf("✅ Reset schedule runs for category %s (time changed from %02d:%02d to %02d:%02d)",
				req.Category, oldHour, oldMinute, req.Hour, req.Minute)

			// Always trigger scheduler check after time change (for both past and future times)
			// This ensures immediate processing if time is in the past, or proper scheduling if in the future
			scheduledTime := time.Date(now.Year(), now.Month(), now.Day(), req.Hour, req.Minute, 0, 0, loc)
			timeDiff := scheduledTime.Sub(now)

			if timeDiff <= 0 {
				// Time is in the past - trigger immediate send
				log.Printf("🚀 Time changed to past time (%02d:%02d, now: %02d:%02d, diff: %v) - triggering immediate send for category %s",
					req.Hour, req.Minute, now.Hour(), now.Minute(), -timeDiff, req.Category)
			} else {
				// Time is in the future - trigger check to ensure proper scheduling
				log.Printf("⏰ Time changed to future time (%02d:%02d, now: %02d:%02d, diff: %v) - triggering scheduler check for category %s",
					req.Hour, req.Minute, now.Hour(), now.Minute(), timeDiff, req.Category)
			}

			// Trigger scheduler in a goroutine to avoid blocking the response
			go func() {
				// Small delay to ensure DB transaction is committed
				time.Sleep(1 * time.Second)
				log.Printf("🚀 Triggering scheduler immediately for category=%s after time change", req.Category)
				ctrl.triggerSmartSMSScheduler()
				log.Printf("✅ Scheduler trigger completed for category=%s", req.Category)
			}()
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Scheduled message updated successfully",
		"data":    message,
	})
}

// triggerSmartSMSScheduler triggers the smart SMS scheduler immediately
// This is used when time is changed to a past time to send immediately
func (ctrl *SmartSMSController) triggerSmartSMSScheduler() {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	log.Printf("🔄 triggerSmartSMSScheduler: calling ProcessSmartYesterdayCampaigns at %s", time.Now().In(loc).Format("2006-01-02 15:04:05"))

	// Call processSmartYesterdayCampaigns directly
	scheduler.ProcessSmartYesterdayCampaigns(
		ctrl.DB,
		ctrl.MelipayamakService,
		ctrl.FarazSMSService,
		ctrl.AvanakService,
		loc,
	)

	log.Printf("✅ triggerSmartSMSScheduler: ProcessSmartYesterdayCampaigns completed")
}

func (ctrl *SmartSMSController) GetPopupFollowups(c *gin.Context) {
	if !(HasPermission(c, ctrl.DB, "users.view") || HasPermission(c, ctrl.DB, "dashboard.view")) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	cutoff := now.Add(-2 * time.Minute)

	meliEnabled := false
	var meliCfg models.SystemConfig
	if err := ctrl.DB.Where("`key` = ?", "melipayamak.enabled").First(&meliCfg).Error; err == nil {
		meliEnabled = (meliCfg.Value == "true" || meliCfg.Value == "1")
	}

	items := []smartSMSBehaviorItem{
		{
			Category:    "popup_entered_no_progress",
			Provider:    "melipayamak",
			PatternCode: "407873",
			Title:       "کاربر وارد ThankYou شد ولی جلو نرفت",
			Description: "وقتی کاربر از لندینگ خارج می‌شود و در حالت «وارد شد» است، بلافاصله ارسال می‌شود. (قانون طلایی: اگر یکی از پیامک‌ها ارسال شده باشد، دیگری ارسال نمی‌شود)",
			Status: func() string {
				if meliEnabled {
					return "فعال"
				}
				return "غیرفعال"
			}(),
		},
		{
			Category:    "popup_gift_or_commitment_no_complete",
			Provider:    "melipayamak",
			PatternCode: "407871",
			Title:       "کلیک هدیه/تعهد کرد ولی کامل نکرد",
			Description: "وقتی کاربر از لندینگ خارج می‌شود و در حالت «کلیک هدیه/تعهد» است، بلافاصله ارسال می‌شود. (قانون طلایی: اگر یکی از پیامک‌ها ارسال شده باشد، دیگری ارسال نمی‌شود)",
			Status: func() string {
				if meliEnabled {
					return "فعال"
				}
				return "غیرفعال"
			}(),
		},
		{
			Category:    "popup_completed",
			Provider:    "melipayamak",
			PatternCode: "407869",
			Title:       "به پاپ‌آپ آخر رسید (Completed)",
			Description: "وقتی کاربر به صفحه «سیستم پولسازی مناسب شما» می‌رسد یا به صفحه آخر لندینگ («ثبت‌نامت انجام شد») می‌رسد، بلافاصله ارسال می‌شود. (قانون طلایی: اگر یکی از پیامک‌ها ارسال شده باشد، دیگری ارسال نمی‌شود)",
			Status: func() string {
				if meliEnabled {
					return "فعال"
				}
				return "غیرفعال"
			}(),
		},
	}

	// Counts are real-time (pending) based on current DB state
	if meliEnabled {
		for i := range items {
			if items[i].Category == "popup_completed" {
				cnt, e := ctrl.countEligiblePopupCompletedImmediate(items[i].Category)
				if e == nil {
					items[i].EligibleCount = cnt
				}
				continue
			}

			var progresses []models.PopupProgress
			switch items[i].Category {
			case "popup_entered_no_progress":
				progresses = []models.PopupProgress{models.PopupProgressEntered}
			case "popup_gift_or_commitment_no_complete":
				progresses = []models.PopupProgress{models.PopupProgressGiftClicked, models.PopupProgressCommitment}
			}
			if len(progresses) == 0 {
				continue
			}
			cnt, e := ctrl.countEligiblePopupFollowup(items[i].Category, progresses, cutoff)
			if e == nil {
				items[i].EligibleCount = cnt
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"cutoff":  cutoff.Format(time.RFC3339),
		"items":   items,
	})
}

type smartSMSEligibleUserRow struct {
	UserID          uint       `json:"user_id"`           // identity id
	CycleID         uint       `json:"cycle_id"`          // registration cycle id (users.id)
	FirstName       string     `json:"first_name"`
	LastName        string     `json:"last_name"`
	Phone           string     `json:"phone"`
	RegisteredAt    time.Time `json:"registered_at"`
	TotalWatchSeconds int      `json:"total_watch_seconds"` // Total watch time in seconds
	FirstJoinAt     *time.Time `json:"first_join_at,omitempty"` // First time joined webinar
}

type smartSMSSentUserRow struct {
	UserID          uint       `json:"user_id"`           // identity id
	CycleID         uint       `json:"cycle_id"`          // registration cycle id (users.id)
	FirstName       string     `json:"first_name"`
	LastName        string     `json:"last_name"`
	Phone           string     `json:"phone"`
	RegisteredAt    time.Time  `json:"registered_at"`
	SentAt          time.Time  `json:"sent_at"`
	Provider        string     `json:"provider"`
	TotalWatchSeconds int      `json:"total_watch_seconds"` // Total watch time in seconds
	FirstJoinAt     *time.Time `json:"first_join_at,omitempty"` // First time joined webinar
}

func (ctrl *SmartSMSController) GetEligibleUsers(c *gin.Context) {
	if !(HasPermission(c, ctrl.DB, "users.view") || HasPermission(c, ctrl.DB, "dashboard.view")) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	category := strings.TrimSpace(c.Query("category"))
	if category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category is required"})
		return
	}

	limit := 200
	if s := c.Query("limit"); s != "" {
		if v, err := strconv.Atoi(s); err == nil && v > 0 {
			if v > 1000 {
				v = 1000
			}
			limit = v
		}
	}
	page := 1
	if s := c.Query("page"); s != "" {
		if v, err := strconv.Atoi(s); err == nil && v > 0 {
			page = v
		}
	}
	offset := (page - 1) * limit

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	cutoff := now.Add(-2 * time.Minute)

	base := ctrl.DB.Table("users AS u").
		Joins("LEFT JOIN user_identities ui ON ui.phone = u.phone").
		Joins(`LEFT JOIN (
			SELECT 
				phone,
				MAX(total_view_minutes) AS max_view_minutes,
				MAX(CASE WHEN view_start_time IS NOT NULL THEN 1 ELSE 0 END) AS has_watched
			FROM webinar_activities
			GROUP BY phone
		) wa ON wa.phone = u.phone`).
		Select(`
			IFNULL(COALESCE(u.identity_id, ui.id), 0) AS user_id,
			u.id AS cycle_id,
			u.first_name AS first_name,
			u.last_name AS last_name,
			u.phone AS phone,
			u.registered_at AS registered_at,
			COALESCE(wa.max_view_minutes * 60, COALESCE(u.total_watch_seconds, 0)) AS total_watch_seconds,
			u.first_join_at AS first_join_at
		`)

	// Category routing
	switch {
	case strings.HasPrefix(category, "yesterday_"):
		// For scheduled messages (yesterday_): show ALL users who registered yesterday
		// Deduplication: if user registered multiple times, show only the most recent registration
		start, end := ctrl.yesterdayRangeJalali(now, loc)
		base = base.
			Where("u.registered_at >= ? AND u.registered_at < ?", start, end).
			// Only show one record per phone number (the most recent registration)
			// Use phone number for matching instead of identity_id to avoid NULL issues
			Where(`
				u.id = (
					SELECT MAX(u2.id) 
					FROM users u2 
					WHERE u2.phone = u.phone
					  AND u2.registered_at >= ? AND u2.registered_at < ?
				)
			`, start, end).
			Order("u.registered_at DESC, u.id DESC")

	case strings.HasPrefix(category, "popup_"):
		// For popup messages: check per registration cycle (keep original logic)
		base = base.Where(`
			NOT EXISTS (
				SELECT 1 FROM sms_logs sl
				WHERE sl.user_id = COALESCE(u.identity_id, ui.id)
				  AND sl.registration_cycle_id = u.id
				  AND sl.category = ?
			)
		`, category)
		// Popup followups: state 1/2 require cutoff; completed is immediate.
		switch category {
		case "popup_entered_no_progress":
			base = base.
				Where("u.last_popup_activity_at IS NOT NULL AND u.last_popup_activity_at <= ?", cutoff).
				Where("u.popup_progress = ?", models.PopupProgressEntered).
				// Golden rule safety: if completed message already exists, do not consider for state 1
				Where(`
					NOT EXISTS (
						SELECT 1 FROM sms_logs sl2
						WHERE sl2.user_id = COALESCE(u.identity_id, ui.id)
						  AND sl2.registration_cycle_id = u.id
						  AND sl2.category = 'popup_completed'
					)
				`).
				Order("u.last_popup_activity_at ASC, u.id ASC")
		case "popup_gift_or_commitment_no_complete":
			base = base.
				Where("u.last_popup_activity_at IS NOT NULL AND u.last_popup_activity_at <= ?", cutoff).
				Where("u.popup_progress IN ?", []models.PopupProgress{models.PopupProgressGiftClicked, models.PopupProgressCommitment}).
				Where(`
					NOT EXISTS (
						SELECT 1 FROM sms_logs sl2
						WHERE sl2.user_id = COALESCE(u.identity_id, ui.id)
						  AND sl2.registration_cycle_id = u.id
						  AND sl2.category = 'popup_completed'
					)
				`).
				Order("u.last_popup_activity_at ASC, u.id ASC")
		case "popup_completed":
			base = base.
				Where("u.popup_progress = ?", models.PopupProgressCompleted).
				Order("u.last_popup_activity_at DESC, u.id DESC")
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "unknown popup category"})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unknown category"})
		return
	}

	// Total count
	var total int64
	if err := ctrl.DB.Table("(?) as q", base).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count eligible users"})
		return
	}

	// Page results
	var rows []smartSMSEligibleUserRow
	if err := base.Limit(limit).Offset(offset).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch eligible users"})
		return
	}

	// Filter out users who watched more than 10 minutes
	// These users should not receive SMS/Avanak messages
	var eligibleRows []smartSMSEligibleUserRow
	var excludedRows []smartSMSEligibleUserRow
	
	for _, row := range rows {
		watchMinutes := row.TotalWatchSeconds / 60
		if watchMinutes > 10 {
			// User watched more than 10 minutes - exclude from eligible list
			excludedRows = append(excludedRows, row)
		} else {
			eligibleRows = append(eligibleRows, row)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"category": category,
		"cutoff":   cutoff.Format(time.RFC3339),
		"pagination": gin.H{
			"page":        page,
			"page_size":   limit,
			"total_count": total,
			"total_pages": func() int {
				if total == 0 {
					return 1
				}
				p := int((total + int64(limit) - 1) / int64(limit))
				if p < 1 {
					return 1
				}
				return p
			}(),
		},
		"users": eligibleRows,
		"excluded_users": excludedRows, // Users excluded because they watched more than 10 minutes
	})
}

func (ctrl *SmartSMSController) GetSentUsers(c *gin.Context) {
	if !(HasPermission(c, ctrl.DB, "users.view") || HasPermission(c, ctrl.DB, "dashboard.view")) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	category := strings.TrimSpace(c.Query("category"))
	if category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category is required"})
		return
	}

	limit := 200
	if s := c.Query("limit"); s != "" {
		if v, err := strconv.Atoi(s); err == nil && v > 0 {
			if v > 1000 {
				v = 1000
			}
			limit = v
		}
	}
	page := 1
	if s := c.Query("page"); s != "" {
		if v, err := strconv.Atoi(s); err == nil && v > 0 {
			page = v
		}
	}
	offset := (page - 1) * limit

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)

	// Default: show "today" sends in Tehran timezone (matches admin center intent)
	start := ctrl.todayMidnight(now, loc)
	end := start.AddDate(0, 0, 1)

	base := ctrl.DB.Table("sms_logs AS sl").
		Joins("JOIN users u ON u.id = sl.registration_cycle_id").
		Joins(`LEFT JOIN (
			SELECT 
				phone,
				MAX(total_view_minutes) AS max_view_minutes,
				MAX(CASE WHEN view_start_time IS NOT NULL THEN 1 ELSE 0 END) AS has_watched
			FROM webinar_activities
			GROUP BY phone
		) wa ON wa.phone = u.phone`).
		Select(`
			sl.user_id AS user_id,
			sl.registration_cycle_id AS cycle_id,
			u.first_name AS first_name,
			u.last_name AS last_name,
			u.phone AS phone,
			u.registered_at AS registered_at,
			sl.sent_at AS sent_at,
			sl.provider AS provider,
			COALESCE(wa.max_view_minutes * 60, COALESCE(u.total_watch_seconds, 0)) AS total_watch_seconds,
			u.first_join_at AS first_join_at
		`).
		Where("sl.category = ?", category).
		Where("sl.status = ?", "sent").
		Where("sl.sent_at >= ? AND sl.sent_at < ?", start, end).
		Order("sl.sent_at DESC")

	var total int64
	if err := ctrl.DB.Table("(?) as q", base).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count sent users"})
		return
	}

	var rows []smartSMSSentUserRow
	if err := base.Limit(limit).Offset(offset).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sent users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"category": category,
		"range": gin.H{
			"start": start.Format(time.RFC3339),
			"end":   end.Format(time.RFC3339),
		},
		"pagination": gin.H{
			"page":        page,
			"page_size":   limit,
			"total_count": total,
			"total_pages": func() int {
				if total == 0 {
					return 1
				}
				p := int((total + int64(limit) - 1) / int64(limit))
				if p < 1 {
					return 1
				}
				return p
			}(),
		},
		"users": rows,
	})
}

func (ctrl *SmartSMSController) CancelTodaySmartSMS(c *gin.Context) {
	if !(HasPermission(c, ctrl.DB, "users.view") || HasPermission(c, ctrl.DB, "dashboard.view")) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		Category string `json:"category" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	runDate := ctrl.todayMidnight(now, loc)

	updates := map[string]interface{}{
		"status":     "cancelled",
		"updated_at": now,
	}

	var run models.SmartSMSScheduleRun
	if err := ctrl.DB.Where("category = ? AND run_date = ?", req.Category, runDate).First(&run).Error; err == nil {
		ctrl.DB.Model(&run).Updates(updates)
	} else {
		// Create a cancelled run record (prevents sending)
		run = models.SmartSMSScheduleRun{
			Category:    req.Category,
			RunDate:     runDate,
			Provider:    "",
			ScheduledAt: runDate,
			Status:      "cancelled",
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		_ = ctrl.DB.Create(&run).Error
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ResetScheduledMessageStatus resets the status of a scheduled message and updates its time
// This is used to reset a message from "sent" to "pending" and change its scheduled time
// If category is not provided, it will find the Avanak message with the specified hour/minute
func (ctrl *SmartSMSController) ResetScheduledMessageStatus(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, "settings.edit") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		Category string `json:"category"` // Optional: if not provided, will find by provider and time
		Provider string `json:"provider"` // Optional: if category not provided, use this to find message
		Hour     int    `json:"hour" binding:"required,min=0,max=23"`
		Minute   int    `json:"minute" binding:"required,min=0,max=59"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var message models.SmartSMSScheduledMessage
	var findErr error

	// If category is provided, use it directly
	if req.Category != "" {
		findErr = ctrl.DB.Where("category = ?", req.Category).First(&message).Error
	} else {
		// If category not provided, find by provider and time
		// Default to "avanak" if provider not specified
		provider := req.Provider
		if provider == "" {
			provider = "avanak"
		}
		findErr = ctrl.DB.Where("provider = ? AND hour = ? AND minute = ?", provider, req.Hour, req.Minute).First(&message).Error
	}

	if findErr != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scheduled message not found"})
		return
	}

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	todayMidnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	// Store old time values for logging
	oldHour := message.Hour
	oldMinute := message.Minute
	category := message.Category

	// Update time
	message.Hour = req.Hour
	message.Minute = req.Minute
	message.UpdatedAt = now

	if err := ctrl.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update scheduled message"})
		return
	}

	log.Printf("✅ smart_sms: reset scheduled message category=%s, time changed from %02d:%02d to %02d:%02d",
		category, oldHour, oldMinute, req.Hour, req.Minute)

	// CRITICAL: Delete SmartSMSLog entries for this category to allow re-sending
	// This ensures alreadySent() won't reject all users when message is reset
	deletedLogs := ctrl.DB.Where("category = ?", category).Delete(&models.SmartSMSLog{}).RowsAffected
	if deletedLogs > 0 {
		log.Printf("🗑️ smart_sms: deleted %d SmartSMSLog entries for category=%s to allow re-send", deletedLogs, category)
	}

	// Delete all SmartSMSScheduleRun records for this category with run_date >= today
	// This will reset the status to "در انتظار" (pending) for future runs
	deletedCount := ctrl.DB.Where("category = ? AND run_date >= ?", category, todayMidnight).
		Delete(&models.SmartSMSScheduleRun{}).RowsAffected

	log.Printf("✅ smart_sms: deleted %d schedule run records for category=%s (reset to pending)", deletedCount, category)

	// Trigger scheduler in a goroutine to avoid blocking the response
	go func() {
		// Small delay to ensure DB transaction is committed
		time.Sleep(1 * time.Second)
		log.Printf("🚀 Triggering scheduler immediately for category=%s after reset", category)
		ctrl.triggerSmartSMSScheduler()
		log.Printf("✅ Scheduler trigger completed for category=%s", category)
	}()

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "Scheduled message reset successfully",
		"category":     category,
		"new_time":     fmt.Sprintf("%02d:%02d", req.Hour, req.Minute),
		"old_time":     fmt.Sprintf("%02d:%02d", oldHour, oldMinute),
		"deleted_runs": deletedCount,
	})
}

// GetSchedulerLogs returns recent scheduler logs for a specific category
// This helps debug why messages are not being sent
func (ctrl *SmartSMSController) GetSchedulerLogs(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, "settings.edit") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	category := c.Query("category")
	if category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category parameter is required"})
		return
	}

	// Return a message indicating logs should be checked in server logs
	// In production, you might want to read from a log file or database
	c.JSON(http.StatusOK, gin.H{
		"message": "برای مشاهده لاگ‌های دقیق، لطفاً لاگ‌های سرور را بررسی کنید. لاگ‌ها شامل اطلاعات زیر هستند:\n" +
			"- آیا پیام پیدا می‌شود؟\n" +
			"- آیا کاربران پیدا می‌شوند؟\n" +
			"- آیا چک‌های اولیه رد می‌شوند؟\n" +
			"- آیا ارسال انجام می‌شود؟\n" +
			"- آیا لاگ نوشته می‌شود؟",
		"category": category,
		"note":     "لاگ‌های دقیق در فایل لاگ سرور موجود است. برای مشاهده، از دستور 'tail -f /path/to/logfile | grep smart_sms' استفاده کنید.",
	})
}

// TestSendAvanakScheduledMessage tests sending an Avanak scheduled message
// This endpoint allows testing Avanak voice calls for a specific category
func (ctrl *SmartSMSController) TestSendAvanakScheduledMessage(c *gin.Context) {
	var req struct {
		Category string `json:"category" binding:"required"` // e.g., "yesterday_1715_avanak"
		Phone    string `json:"phone,omitempty"`             // Optional: if provided, send only to this phone
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Load the scheduled message from database
	var scheduledMsg models.SmartSMSScheduledMessage
	if err := ctrl.DB.Where("category = ? AND is_active = ?", req.Category, true).First(&scheduledMsg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scheduled message not found or inactive"})
		return
	}

	// Verify it's an Avanak message
	if scheduledMsg.Provider != "avanak" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This endpoint is only for Avanak messages"})
		return
	}

	// Check Avanak service
	if ctrl.AvanakService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Avanak service is not initialized"})
		return
	}

	avanakConfig := ctrl.AvanakService.GetConfig()
	if avanakConfig == nil || !avanakConfig.Enabled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Avanak service is disabled"})
		return
	}

	if scheduledMsg.AvanakMessageID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Avanak message ID is missing or invalid"})
		return
	}

	loc, _ := time.LoadLocation("Asia/Tehran")
	now := time.Now().In(loc)

	var sentCount int
	var failedCount int
	var testPhones []string

	if req.Phone != "" {
		// Test mode: send to specific phone only
		testPhones = []string{req.Phone}
		log.Printf("🧪 TEST: Sending Avanak voice call to test phone: %s (category=%s, messageID=%d)", req.Phone, req.Category, scheduledMsg.AvanakMessageID)
	} else {
		// Production mode: send to all eligible users (yesterday registrations)
		start, end := ctrl.yesterdayRangeJalali(now, loc)
		var users []models.User
		if err := ctrl.DB.Where("registered_at >= ? AND registered_at < ?", start, end).Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch eligible users: " + err.Error()})
			return
		}

		if len(users) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"message":      "No eligible users found for yesterday",
				"sent_count":   0,
				"failed_count": 0,
			})
			return
		}

		// Extract phone numbers
		testPhones = make([]string, 0, len(users))
		for _, u := range users {
			if u.Phone != "" {
				testPhones = append(testPhones, u.Phone)
			}
		}

		log.Printf("🧪 TEST: Sending Avanak voice call to %d eligible users (category=%s, messageID=%d)", len(testPhones), req.Category, scheduledMsg.AvanakMessageID)
	}

	// Send to all test phones
	for _, phone := range testPhones {
		normalizedPhone := utils.NormalizePhoneNumber(phone)
		if err := ctrl.AvanakService.SendVoiceCall(normalizedPhone, scheduledMsg.AvanakMessageID); err != nil {
			log.Printf("❌ TEST: Failed to send Avanak voice call to %s: %v", normalizedPhone, err)
			failedCount++
		} else {
			log.Printf("✅ TEST: Avanak voice call sent successfully to %s (messageID=%d)", normalizedPhone, scheduledMsg.AvanakMessageID)
			sentCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Test completed",
		"category":     req.Category,
		"message_id":   scheduledMsg.AvanakMessageID,
		"sent_count":   sentCount,
		"failed_count": failedCount,
		"total_phones": len(testPhones),
	})
}
