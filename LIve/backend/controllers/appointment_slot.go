package controllers

import (
	"fmt"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AppointmentSlotController struct {
	DB *gorm.DB
}

func NewAppointmentSlotController(db *gorm.DB) *AppointmentSlotController {
	return &AppointmentSlotController{DB: db}
}

// GetSchedulingMode returns the current scheduling mode (manual or appointment)
func (ctrl *AppointmentSlotController) GetSchedulingMode(c *gin.Context) {
	var sysConfig models.SystemConfig
	if err := ctrl.DB.Where("`key` = ?", "webinar.scheduling_mode").First(&sysConfig).Error; err != nil {
		// Default to manual if not set
		c.JSON(http.StatusOK, gin.H{"mode": "manual"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"mode": sysConfig.Value})
}

// SetSchedulingMode sets the scheduling mode (manual or appointment)
// CRITICAL: If switching to appointment mode, validates that today's slot exists
func (ctrl *AppointmentSlotController) SetSchedulingMode(c *gin.Context) {
	var req struct {
		Mode string `json:"mode" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Mode != "manual" && req.Mode != "appointment" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mode must be 'manual' or 'appointment'"})
		return
	}

	// CRITICAL: If switching to appointment mode, check if today's slot exists
	if req.Mode == "appointment" {
		loc, err := time.LoadLocation("Asia/Tehran")
		if err != nil {
			loc = time.UTC
		}

		now := time.Now().In(loc)
		persianNow := utils.ToPersian(now)

		// Try to find today's non-completed slot
		var slot models.AppointmentSlot
		err = ctrl.DB.Where("persian_year = ? AND persian_month = ? AND persian_day = ? AND is_completed = ?",
			persianNow.Year, persianNow.Month, persianNow.Day, false).
			Order("id DESC").
			First(&slot).Error

		// If not found by Persian date, try by StartDateTime range (fallback)
		if err != nil {
			todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
			todayEnd := todayStart.AddDate(0, 0, 1)

			err = ctrl.DB.Where("start_date_time >= ? AND start_date_time < ? AND is_completed = ?",
				todayStart, todayEnd, false).
				Order("id DESC").
				First(&slot).Error
		}

		// If still not found, check if ANY slots exist for current month
		if err != nil {
			var monthSlotCount int64
			ctrl.DB.Model(&models.AppointmentSlot{}).
				Where("persian_year = ? AND persian_month = ?", persianNow.Year, persianNow.Month).
				Count(&monthSlotCount)

			if monthSlotCount == 0 {
				// No slots exist for current month at all
				c.JSON(http.StatusBadRequest, gin.H{
					"error":         "no_slots_for_month",
					"message":       "هیچ نوبتی برای ماه جاری ایجاد نشده است. لطفاً ابتدا نوبت‌های ماه را ایجاد کنید.",
					"persian_year":  persianNow.Year,
					"persian_month": persianNow.Month,
					"persian_day":   persianNow.Day,
				})
				return
			} else {
				// Slots exist for month but not for today
				c.JSON(http.StatusBadRequest, gin.H{
					"error":            "no_slot_for_today",
					"message":          fmt.Sprintf("نوبتی برای امروز (روز %d) یافت نشد. لطفاً نوبت‌های ماه را بررسی یا به‌روزرسانی کنید.", persianNow.Day),
					"persian_year":     persianNow.Year,
					"persian_month":    persianNow.Month,
					"persian_day":      persianNow.Day,
					"month_slot_count": monthSlotCount,
				})
				return
			}
		}

		// Slot found - log success
		log.Printf("✅ SetSchedulingMode - Appointment mode validated: Found slot for today (ID=%d, Day=%d, Start=%02d:%02d)",
			slot.ID, slot.PersianDay, slot.StartHour, slot.StartMinute)
	}

	// Save to SystemConfig (only if validation passed)
	sysConfig := models.SystemConfig{
		Key:   "webinar.scheduling_mode",
		Value: req.Mode,
	}
	ctrl.DB.Where("`key` = ?", "webinar.scheduling_mode").Assign(models.SystemConfig{Value: req.Mode}).FirstOrCreate(&sysConfig)

	log.Printf("✅ Scheduling mode updated to: %s", req.Mode)
	c.JSON(http.StatusOK, gin.H{"message": "Scheduling mode updated", "mode": req.Mode})
}

// CreateAppointmentSlotsForMonth creates 30 appointment slots for a Persian month
func (ctrl *AppointmentSlotController) CreateAppointmentSlotsForMonth(c *gin.Context) {
	var req struct {
		PersianYear  int `json:"persian_year" binding:"required"`
		PersianMonth int `json:"persian_month" binding:"required,min=1,max=12"`
		StartHour    int `json:"start_hour" binding:"required,min=0,max=23"`
		StartMinute  int `json:"start_minute" binding:"required,min=0,max=59"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	// Get comment_offset from config (end_hour is calculated automatically: start + 102 minutes)
	var commentOffset float64
	var sysConfig models.SystemConfig

	if err := ctrl.DB.Where("`key` = ?", "webinar.comment_offset_seconds").First(&sysConfig).Error; err == nil {
		if val, err := strconv.ParseFloat(sysConfig.Value, 64); err == nil {
			commentOffset = val
		}
	}

	// Load Iran timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	// Check if slots already exist for this month
	var existingCount int64
	ctrl.DB.Model(&models.AppointmentSlot{}).
		Where("persian_year = ? AND persian_month = ?", req.PersianYear, req.PersianMonth).
		Count(&existingCount)

	if existingCount > 0 {
		// Delete existing slots for this month before creating new ones
		ctrl.DB.Where("persian_year = ? AND persian_month = ?", req.PersianYear, req.PersianMonth).
			Delete(&models.AppointmentSlot{})
		log.Printf("🗑️  Deleted %d existing appointment slots for year %d, month %d", existingCount, req.PersianYear, req.PersianMonth)
	}

	// Create 30 slots (days 1-30)
	slots := []models.AppointmentSlot{}
	for day := 1; day <= 30; day++ {
		// Convert Persian date to Gregorian
		gregorianDate := utils.PersianToGregorian(req.PersianYear, req.PersianMonth, day)
		startDateTime := time.Date(gregorianDate.Year(), gregorianDate.Month(), gregorianDate.Day(), req.StartHour, req.StartMinute, 0, 0, loc)

		// Calculate end time: start time + 102 minutes (1 hour 42 minutes)
		endDateTime := startDateTime.Add(102 * time.Minute)
		endHour := endDateTime.Hour()

		// EndHour field is integer, so we use the hour of end time
		// For appointment slots, duration is fixed at 102 minutes, so end time is always start + 102 minutes

		slot := models.AppointmentSlot{
			PersianYear:   req.PersianYear,
			PersianMonth:  req.PersianMonth,
			PersianDay:    day,
			StartDateTime: startDateTime,
			StartHour:     req.StartHour,
			StartMinute:   req.StartMinute,
			EndHour:       endHour, // Automatically calculated: start + 102 minutes
			CommentOffset: commentOffset,
			IsCompleted:   false,
		}
		slots = append(slots, slot)
	}

	// Batch insert
	if err := ctrl.DB.Create(&slots).Error; err != nil {
		log.Printf("❌ Failed to create appointment slots: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointment slots", "details": err.Error()})
		return
	}

	log.Printf("✅ Successfully created %d appointment slots for year %d, month %d", len(slots), req.PersianYear, req.PersianMonth)

	// Verify slots were created
	var createdCount int64
	ctrl.DB.Model(&models.AppointmentSlot{}).
		Where("persian_year = ? AND persian_month = ?", req.PersianYear, req.PersianMonth).
		Count(&createdCount)
	log.Printf("🔍 Verification: Found %d slots in database for year %d, month %d", createdCount, req.PersianYear, req.PersianMonth)

	c.JSON(http.StatusOK, gin.H{
		"message":        "Appointment slots created successfully",
		"count":          len(slots),
		"year":           req.PersianYear,
		"month":          req.PersianMonth,
		"verified_count": createdCount,
	})
}

// GetAppointmentSlots returns appointment slots for a specific month
func (ctrl *AppointmentSlotController) GetAppointmentSlots(c *gin.Context) {
	persianYearStr := c.Query("persian_year")
	persianMonthStr := c.Query("persian_month")

	log.Printf("🔍 GetAppointmentSlots called with persian_year=%s, persian_month=%s", persianYearStr, persianMonthStr)

	var slots []models.AppointmentSlot
	query := ctrl.DB.Model(&models.AppointmentSlot{})

	if persianYearStr != "" && persianMonthStr != "" {
		persianYear, _ := strconv.Atoi(persianYearStr)
		persianMonth, _ := strconv.Atoi(persianMonthStr)
		log.Printf("🔍 Querying slots for year %d, month %d", persianYear, persianMonth)
		query = query.Where("persian_year = ? AND persian_month = ?", persianYear, persianMonth)
	} else {
		// If no filters, get ALL slots for debugging
		log.Printf("⚠️  GetAppointmentSlots - No filters provided, returning ALL slots")
	}

	query = query.Order("persian_year DESC, persian_month DESC, persian_day ASC").Find(&slots)

	log.Printf("✅ Found %d slots for year %s, month %s", len(slots), persianYearStr, persianMonthStr)

	// If no slots found, try to find ANY slots in database
	if len(slots) == 0 {
		var anySlots []models.AppointmentSlot
		ctrl.DB.Order("persian_year DESC, persian_month DESC, persian_day DESC").Limit(10).Find(&anySlots)
		if len(anySlots) > 0 {
			log.Printf("⚠️  GetAppointmentSlots - No slots found with filters, but found %d slots in database (showing last 10):", len(anySlots))
			for _, s := range anySlots {
				log.Printf("  Slot ID=%d: Persian=%d/%d/%d, Start=%02d:%02d, StartDateTime=%s",
					s.ID, s.PersianYear, s.PersianMonth, s.PersianDay, s.StartHour, s.StartMinute,
					s.StartDateTime.Format("2006-01-02 15:04:05 MST"))
			}
		} else {
			log.Printf("❌ GetAppointmentSlots - No slots found in database at all!")
		}
	}

	c.JSON(http.StatusOK, gin.H{"slots": slots, "count": len(slots)})
}

// UpdateAppointmentSlot updates a single appointment slot (mainly for time changes)
func (ctrl *AppointmentSlotController) UpdateAppointmentSlot(c *gin.Context) {
	slotID := c.Param("id")
	log.Printf("📥 UpdateAppointmentSlot called for slot ID: %s", slotID)

	var req struct {
		StartHour   *int `json:"start_hour"`
		StartMinute *int `json:"start_minute"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ UpdateAppointmentSlot - Invalid request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
		return
	}

	log.Printf("📥 UpdateAppointmentSlot - Request: start_hour=%v, start_minute=%v", req.StartHour, req.StartMinute)

	var slot models.AppointmentSlot
	if err := ctrl.DB.First(&slot, slotID).Error; err != nil {
		log.Printf("❌ UpdateAppointmentSlot - Slot not found: ID=%s, Error=%v", slotID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment slot not found", "details": err.Error()})
		return
	}

	log.Printf("📋 UpdateAppointmentSlot - Found slot: ID=%d, Persian=%d/%d/%d, Current time=%02d:%02d",
		slot.ID, slot.PersianYear, slot.PersianMonth, slot.PersianDay, slot.StartHour, slot.StartMinute)

	// Update time if provided
	if req.StartHour != nil && req.StartMinute != nil {
		oldHour := slot.StartHour
		oldMinute := slot.StartMinute
		slot.StartHour = *req.StartHour
		slot.StartMinute = *req.StartMinute

		// Recalculate StartDateTime
		loc, _ := time.LoadLocation("Asia/Tehran")
		gregorianDate := utils.PersianToGregorian(slot.PersianYear, slot.PersianMonth, slot.PersianDay)
		slot.StartDateTime = time.Date(gregorianDate.Year(), gregorianDate.Month(), gregorianDate.Day(), slot.StartHour, slot.StartMinute, 0, 0, loc)

		// Calculate EndHour: start time + 102 minutes (1 hour 42 minutes)
		endDateTime := slot.StartDateTime.Add(102 * time.Minute)
		slot.EndHour = endDateTime.Hour()

		log.Printf("🔄 UpdateAppointmentSlot - Updating time from %02d:%02d to %02d:%02d, StartDateTime=%s, EndHour=%d (calculated: start + 102 minutes)",
			oldHour, oldMinute, slot.StartHour, slot.StartMinute, slot.StartDateTime.Format("2006-01-02 15:04:05 MST"), slot.EndHour)
	}

	// CRITICAL: Use Save with explicit error handling
	if err := ctrl.DB.Save(&slot).Error; err != nil {
		log.Printf("❌ UpdateAppointmentSlot - Failed to save slot: ID=%d, Error=%v", slot.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment slot", "details": err.Error()})
		return
	}

	// Verify the slot was actually saved
	var verifySlot models.AppointmentSlot
	if err := ctrl.DB.First(&verifySlot, slotID).Error; err != nil {
		log.Printf("❌ UpdateAppointmentSlot - Verification failed: Could not retrieve saved slot, Error=%v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Slot updated but verification failed", "details": err.Error()})
		return
	}

	log.Printf("✅ UpdateAppointmentSlot - Successfully updated slot: ID=%d, Persian=%d/%d/%d, Time=%02d:%02d, StartDateTime=%s",
		verifySlot.ID, verifySlot.PersianYear, verifySlot.PersianMonth, verifySlot.PersianDay,
		verifySlot.StartHour, verifySlot.StartMinute, verifySlot.StartDateTime.Format("2006-01-02 15:04:05 MST"))

	c.JSON(http.StatusOK, gin.H{
		"message": "Appointment slot updated successfully",
		"slot":    verifySlot,
	})
}

// DeleteAppointmentSlots deletes all appointment slots for a specific month
func (ctrl *AppointmentSlotController) DeleteAppointmentSlots(c *gin.Context) {
	persianYearStr := c.Query("persian_year")
	persianMonthStr := c.Query("persian_month")

	if persianYearStr == "" || persianMonthStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "persian_year and persian_month are required"})
		return
	}

	persianYear, _ := strconv.Atoi(persianYearStr)
	persianMonth, _ := strconv.Atoi(persianMonthStr)

	result := ctrl.DB.Where("persian_year = ? AND persian_month = ?", persianYear, persianMonth).Delete(&models.AppointmentSlot{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete appointment slots"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment slots deleted", "count": result.RowsAffected})
}

// FixAppointmentSlotsStartDateTime recalculates and updates StartDateTime for all slots
// This fixes slots that were created with the old incorrect conversion formula
func (ctrl *AppointmentSlotController) FixAppointmentSlotsStartDateTime(c *gin.Context) {
	log.Printf("🔧 FixAppointmentSlotsStartDateTime - Starting to fix StartDateTime for all appointment slots")

	// Load Iran timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	// Get all slots
	var slots []models.AppointmentSlot
	if err := ctrl.DB.Find(&slots).Error; err != nil {
		log.Printf("❌ Failed to fetch slots: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointment slots", "details": err.Error()})
		return
	}

	log.Printf("🔧 Found %d slots to fix", len(slots))

	fixedCount := 0
	errorCount := 0

	// Update each slot
	for _, slot := range slots {
		// Recalculate StartDateTime using the correct formula
		gregorianDate := utils.PersianToGregorian(slot.PersianYear, slot.PersianMonth, slot.PersianDay)
		newStartDateTime := time.Date(gregorianDate.Year(), gregorianDate.Month(), gregorianDate.Day(), slot.StartHour, slot.StartMinute, 0, 0, loc)

		// Update only if StartDateTime has changed
		if slot.StartDateTime.Equal(newStartDateTime) {
			log.Printf("✅ Slot ID=%d: StartDateTime already correct (%s)", slot.ID, slot.StartDateTime.Format("2006-01-02 15:04:05 MST"))
			continue
		}

		// Log the change
		log.Printf("🔧 Slot ID=%d: Fixing StartDateTime from %s to %s (Persian=%d/%d/%d)",
			slot.ID,
			slot.StartDateTime.Format("2006-01-02 15:04:05 MST"),
			newStartDateTime.Format("2006-01-02 15:04:05 MST"),
			slot.PersianYear, slot.PersianMonth, slot.PersianDay)

		// Update the slot
		if err := ctrl.DB.Model(&slot).Update("start_date_time", newStartDateTime).Error; err != nil {
			log.Printf("❌ Failed to update slot ID=%d: %v", slot.ID, err)
			errorCount++
			continue
		}

		fixedCount++
	}

	log.Printf("✅ FixAppointmentSlotsStartDateTime - Fixed %d slots, %d errors, %d already correct", fixedCount, errorCount, len(slots)-fixedCount-errorCount)

	c.JSON(http.StatusOK, gin.H{
		"message":         "StartDateTime fixed successfully",
		"total_slots":     len(slots),
		"fixed_count":     fixedCount,
		"error_count":     errorCount,
		"already_correct": len(slots) - fixedCount - errorCount,
	})
}

// DeleteAllAppointmentSlots deletes ALL appointment slots from the database
func (ctrl *AppointmentSlotController) DeleteAllAppointmentSlots(c *gin.Context) {
	log.Printf("🗑️  DeleteAllAppointmentSlots - Request received to delete ALL appointment slots")

	// First, count existing slots
	var count int64
	if err := ctrl.DB.Model(&models.AppointmentSlot{}).Count(&count).Error; err != nil {
		log.Printf("❌ DeleteAllAppointmentSlots - Failed to count slots: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count appointment slots", "details": err.Error()})
		return
	}

	log.Printf("📊 DeleteAllAppointmentSlots - Found %d slots to delete", count)

	// Delete all slots
	result := ctrl.DB.Where("1 = 1").Delete(&models.AppointmentSlot{})
	if result.Error != nil {
		log.Printf("❌ DeleteAllAppointmentSlots - Failed to delete slots: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete appointment slots", "details": result.Error.Error()})
		return
	}

	log.Printf("✅ DeleteAllAppointmentSlots - Successfully deleted %d appointment slots", result.RowsAffected)

	c.JSON(http.StatusOK, gin.H{
		"message": "All appointment slots deleted successfully",
		"count":   result.RowsAffected,
	})
}

// GetCurrentMonthSlots returns slots for the current Persian month
// CRITICAL: Uses StartDateTime to find slots for current month, not Persian date (more reliable)
func (ctrl *AppointmentSlotController) GetCurrentMonthSlots(c *gin.Context) {
	loc, _ := time.LoadLocation("Asia/Tehran")
	now := time.Now().In(loc)
	persianNow := utils.ToPersian(now)

	log.Printf("🔍 GetCurrentMonthSlots - Current time: %s (Iran TZ)", now.Format("2006-01-02 15:04:05 MST"))
	log.Printf("🔍 GetCurrentMonthSlots - Persian date: %d/%d/%d", persianNow.Year, persianNow.Month, persianNow.Day)

	// Calculate start and end of current month in Gregorian
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	monthEnd := monthStart.AddDate(0, 1, 0) // Next month

	var slots []models.AppointmentSlot

	// First try by Persian date (original method)
	ctrl.DB.Where("persian_year = ? AND persian_month = ?", persianNow.Year, persianNow.Month).
		Order("persian_day ASC").
		Find(&slots)

	log.Printf("✅ GetCurrentMonthSlots - Found %d slots for month %d/%d (by Persian date)", len(slots), persianNow.Year, persianNow.Month)

	// If no slots found by Persian date, try by StartDateTime range (fallback)
	if len(slots) == 0 {
		log.Printf("⚠️  GetCurrentMonthSlots - No slots found by Persian date, trying StartDateTime range...")
		ctrl.DB.Where("start_date_time >= ? AND start_date_time < ?", monthStart, monthEnd).
			Order("persian_day ASC").
			Find(&slots)
		log.Printf("✅ GetCurrentMonthSlots - Found %d slots for current month (by StartDateTime range)", len(slots))
	}

	// If still no slots found, try to find ANY slots in database to see what exists
	if len(slots) == 0 {
		var anySlots []models.AppointmentSlot
		ctrl.DB.Order("persian_year DESC, persian_month DESC, persian_day DESC").Limit(20).Find(&anySlots)
		if len(anySlots) > 0 {
			log.Printf("⚠️  GetCurrentMonthSlots - No slots found for month %d/%d, but found %d slots in database (showing last 20):",
				persianNow.Year, persianNow.Month, len(anySlots))
			for _, s := range anySlots {
				log.Printf("  Slot ID=%d: Persian=%d/%d/%d, Start=%02d:%02d, StartDateTime=%s, IsCompleted=%v",
					s.ID, s.PersianYear, s.PersianMonth, s.PersianDay, s.StartHour, s.StartMinute,
					s.StartDateTime.Format("2006-01-02 15:04:05 MST"), s.IsCompleted)
			}
		} else {
			log.Printf("❌ GetCurrentMonthSlots - No slots found in database at all!")
		}
	} else {
		// Show first few slots for debugging
		log.Printf("🔍 GetCurrentMonthSlots - Sample slots (first 5):")
		for i, s := range slots {
			if i < 5 {
				log.Printf("  Slot[%d]: ID=%d, Day=%d, Start=%02d:%02d, StartDateTime=%s, Persian=%d/%d/%d",
					i, s.ID, s.PersianDay, s.StartHour, s.StartMinute,
					s.StartDateTime.Format("2006-01-02 15:04:05 MST"),
					s.PersianYear, s.PersianMonth, s.PersianDay)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"slots":         slots,
		"count":         len(slots),
		"persian_year":  persianNow.Year,
		"persian_month": persianNow.Month,
	})
}

// GetAllSlots returns ALL appointment slots in database (for debugging)
func (ctrl *AppointmentSlotController) GetAllSlots(c *gin.Context) {
	var allSlots []models.AppointmentSlot
	ctrl.DB.Order("persian_year DESC, persian_month DESC, persian_day DESC").Find(&allSlots)

	log.Printf("🔍 GetAllSlots - Found %d total slots in database", len(allSlots))

	// Group by year/month for summary
	yearMonthCount := make(map[string]int)
	for _, s := range allSlots {
		key := fmt.Sprintf("%d/%d", s.PersianYear, s.PersianMonth)
		yearMonthCount[key]++
	}

	log.Printf("🔍 GetAllSlots - Slots grouped by year/month:")
	for key, count := range yearMonthCount {
		log.Printf("  %s: %d slots", key, count)
	}

	c.JSON(http.StatusOK, gin.H{
		"slots":              allSlots,
		"count":              len(allSlots),
		"year_month_summary": yearMonthCount,
	})
}

// GetTodaySlot returns today's appointment slot (for debugging)
func (ctrl *AppointmentSlotController) GetTodaySlot(c *gin.Context) {
	loc, _ := time.LoadLocation("Asia/Tehran")
	now := time.Now().In(loc)
	persianNow := utils.ToPersian(now)

	log.Printf("🔍 GetTodaySlot - Current time: %s (Iran TZ)", now.Format("2006-01-02 15:04:05 MST"))
	log.Printf("🔍 GetTodaySlot - Persian date: %d/%d/%d", persianNow.Year, persianNow.Month, persianNow.Day)

	// Check scheduling mode
	var sysConfig models.SystemConfig
	schedulingMode := "manual"
	if err := ctrl.DB.Where("`key` = ?", "webinar.scheduling_mode").First(&sysConfig).Error; err == nil {
		schedulingMode = sysConfig.Value
	}

	// Get all slots for today
	var allSlots []models.AppointmentSlot
	ctrl.DB.Where("persian_year = ? AND persian_month = ? AND persian_day = ?",
		persianNow.Year, persianNow.Month, persianNow.Day).
		Order("id DESC").
		Find(&allSlots)

	log.Printf("🔍 GetTodaySlot - Found %d slots for Persian date %d/%d/%d", len(allSlots), persianNow.Year, persianNow.Month, persianNow.Day)

	// Also check all slots in current month to see what exists
	var monthSlots []models.AppointmentSlot
	ctrl.DB.Where("persian_year = ? AND persian_month = ?", persianNow.Year, persianNow.Month).
		Order("persian_day ASC").
		Find(&monthSlots)
	log.Printf("🔍 GetTodaySlot - Found %d total slots in month %d/%d", len(monthSlots), persianNow.Year, persianNow.Month)

	// Show all slots in month for debugging
	if len(monthSlots) > 0 {
		log.Printf("🔍 GetTodaySlot - All slots in month %d/%d:", persianNow.Year, persianNow.Month)
		for _, s := range monthSlots {
			log.Printf("  Slot ID=%d: Day=%d, Start=%02d:%02d, StartDateTime=%s, Persian=%d/%d/%d",
				s.ID, s.PersianDay, s.StartHour, s.StartMinute,
				s.StartDateTime.Format("2006-01-02 15:04:05 MST"),
				s.PersianYear, s.PersianMonth, s.PersianDay)
		}
	} else {
		log.Printf("⚠️  GetTodaySlot - No slots found in month %d/%d at all!", persianNow.Year, persianNow.Month)
		// Try to find slots in any month to see what exists
		var anySlots []models.AppointmentSlot
		ctrl.DB.Order("persian_year DESC, persian_month DESC, persian_day DESC").Limit(10).Find(&anySlots)
		if len(anySlots) > 0 {
			log.Printf("🔍 GetTodaySlot - Found %d slots in database (showing last 10):", len(anySlots))
			for _, s := range anySlots {
				log.Printf("  Slot ID=%d: Persian=%d/%d/%d, Start=%02d:%02d, StartDateTime=%s",
					s.ID, s.PersianYear, s.PersianMonth, s.PersianDay, s.StartHour, s.StartMinute,
					s.StartDateTime.Format("2006-01-02 15:04:05 MST"))
			}
		}
	}

	// Get non-completed slot
	var slot models.AppointmentSlot
	err := ctrl.DB.Where("persian_year = ? AND persian_month = ? AND persian_day = ? AND is_completed = ?",
		persianNow.Year, persianNow.Month, persianNow.Day, false).
		Order("id DESC").
		First(&slot).Error

	// Also try to find by StartDateTime range (fallback) - CRITICAL for finding today's slot
	// This is more reliable than Persian date because it uses the actual stored StartDateTime
	var slotByDateTime models.AppointmentSlot
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	todayEnd := todayStart.AddDate(0, 0, 1)
	err2 := ctrl.DB.Where("start_date_time >= ? AND start_date_time < ? AND is_completed = ?", todayStart, todayEnd, false).
		Order("id DESC").
		First(&slotByDateTime).Error

	if err2 == nil {
		log.Printf("✅ GetTodaySlot - Found slot by StartDateTime range: SlotID=%d, Persian=%d/%d/%d, StartDateTime=%s",
			slotByDateTime.ID, slotByDateTime.PersianYear, slotByDateTime.PersianMonth, slotByDateTime.PersianDay,
			slotByDateTime.StartDateTime.Format("2006-01-02 15:04:05 MST"))
		log.Printf("⚠️  WARNING: Persian date mismatch! Looking for %d/%d/%d but found slot with Persian date %d/%d/%d",
			persianNow.Year, persianNow.Month, persianNow.Day,
			slotByDateTime.PersianYear, slotByDateTime.PersianMonth, slotByDateTime.PersianDay)
	} else {
		log.Printf("⚠️  GetTodaySlot - StartDateTime range search also failed: %v", err2)
	}

	response := gin.H{
		"scheduling_mode":    schedulingMode,
		"persian_date":       gin.H{"year": persianNow.Year, "month": persianNow.Month, "day": persianNow.Day},
		"gregorian_date":     now.Format("2006-01-02 15:04:05"),
		"all_slots_count":    len(allSlots),
		"all_slots":          allSlots,
		"month_slots_count":  len(monthSlots),
		"month_slots_sample": monthSlots[:min(5, len(monthSlots))], // First 5 slots as sample
	}

	if err != nil {
		response["found"] = false
		response["error"] = err.Error()
		response["non_completed_found"] = false

		// If found by StartDateTime, use that (CRITICAL FALLBACK)
		if err2 == nil {
			log.Printf("✅ GetTodaySlot - Using slot found by StartDateTime range (fallback)")
			response["found"] = true
			response["slot"] = slotByDateTime
			response["non_completed_found"] = true
			response["start_time"] = slotByDateTime.StartDateTime.Format("2006-01-02 15:04:05 MST")
			response["start_time_iran"] = slotByDateTime.StartDateTime.In(loc).Format("2006-01-02 15:04:05 MST")
			response["found_by_datetime"] = true
			response["persian_date_mismatch"] = true
			response["slot_persian_date"] = gin.H{
				"year":  slotByDateTime.PersianYear,
				"month": slotByDateTime.PersianMonth,
				"day":   slotByDateTime.PersianDay,
			}
		} else {
			response["found_by_datetime"] = false
		}
	} else {
		response["found"] = true
		response["slot"] = slot
		response["non_completed_found"] = true
		response["start_time"] = slot.StartDateTime.Format("2006-01-02 15:04:05 MST")
		response["start_time_iran"] = slot.StartDateTime.In(loc).Format("2006-01-02 15:04:05 MST")
		response["found_by_datetime"] = false
	}

	c.JSON(http.StatusOK, response)
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetSlotStats returns detailed statistics for users who registered during a specific appointment slot
func (ctrl *AppointmentSlotController) GetSlotStats(c *gin.Context) {
	slotID := c.Param("id")
	if slotID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slot ID is required"})
		return
	}

	var slot models.AppointmentSlot
	if err := ctrl.DB.First(&slot, slotID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment slot not found"})
		return
	}

	// Calculate start and end time for this slot
	startTime := slot.StartDateTime
	// CRITICAL: For appointment slots, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
	endTime := startTime.Add(102 * time.Minute)

	log.Printf("📊 Getting stats for slot #%d: %s to %s (start + 102 minutes)", slot.ID, startTime.Format("2006-01-02 15:04:05"), endTime.Format("2006-01-02 15:04:05"))

	// IMPORTANT: Users who registered the day BEFORE should be in this slot's list
	// For example: users registered on 20 Azar should appear in slot for 21 Azar
	previousDayStart := startTime.AddDate(0, 0, -1)
	previousDayEnd := startTime

	log.Printf("📅 Looking for users registered between %s and %s (previous day)",
		previousDayStart.Format("2006-01-02 15:04:05"), previousDayEnd.Format("2006-01-02 15:04:05"))

	// Get users who registered during the PREVIOUS day (for this slot)
	var users []models.User
	query := ctrl.DB.Model(&models.User{}).
		Where("registered_at >= ? AND registered_at < ?", previousDayStart, previousDayEnd).
		Order("registered_at DESC")

	if err := query.Find(&users).Error; err != nil {
		log.Printf("❌ Error querying users for slot #%d: %v", slot.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query users"})
		return
	}

	// Calculate statistics
	var totalUsers int = len(users)
	var watchedCount int = 0
	var purchaseCount int = 0
	var fullPurchaseCount int = 0
	var installmentPurchaseCount int = 0

	for _, user := range users {
		if user.FirstJoinAt != nil {
			watchedCount++
		}
		if user.PurchaseStatus != "none" {
			purchaseCount++
			if user.PurchaseStatus == "full" {
				fullPurchaseCount++
			} else if user.PurchaseStatus == "installment" {
				installmentPurchaseCount++
			}
		}
	}

	// Prepare user list with formatted data
	type UserInfo struct {
		ID                uint       `json:"id"`
		FirstName         string     `json:"first_name"`
		LastName          string     `json:"last_name"`
		Phone             string     `json:"phone"`
		RegisteredAt      time.Time  `json:"registered_at"`
		HasWatched        bool       `json:"has_watched"`
		FirstJoinAt       *time.Time `json:"first_join_at,omitempty"`
		TotalWatchSeconds int        `json:"total_watch_seconds"`
		PurchaseStatus    string     `json:"purchase_status"`
		LicenseCode       *string    `json:"license_code,omitempty"`
	}

	userList := make([]UserInfo, 0, len(users))
	for _, user := range users {
		userList = append(userList, UserInfo{
			ID:                user.ID,
			FirstName:         user.FirstName,
			LastName:          user.LastName,
			Phone:             user.Phone,
			RegisteredAt:      user.RegisteredAt,
			HasWatched:        user.FirstJoinAt != nil,
			FirstJoinAt:       user.FirstJoinAt,
			TotalWatchSeconds: user.TotalWatchSeconds,
			PurchaseStatus:    user.PurchaseStatus,
			LicenseCode:       user.LicenseCode,
		})
	}

	log.Printf("✅ Found %d users for slot #%d", totalUsers, slot.ID)

	// Get ACTUAL attendees (users who actually watched during this slot's stream time)
	// This includes users who joined during the stream window, even for 1 second
	var actualAttendees []models.User
	var actualAttendeeActivities []models.WebinarActivity

	// Find users who joined (FirstJoinAt) during the slot's stream time
	actualAttendeesQuery := ctrl.DB.Model(&models.User{}).
		Where("first_join_at >= ? AND first_join_at < ?", startTime, endTime).
		Order("first_join_at DESC")

	if err := actualAttendeesQuery.Find(&actualAttendees).Error; err != nil {
		log.Printf("⚠️  Error querying actual attendees: %v", err)
		actualAttendees = []models.User{}
	}

	// Also get WebinarActivity records for more accurate tracking
	actualActivitiesQuery := ctrl.DB.Model(&models.WebinarActivity{}).
		Where("view_start_time >= ? AND view_start_time < ?", startTime, endTime).
		Order("view_start_time DESC")

	if err := actualActivitiesQuery.Find(&actualAttendeeActivities).Error; err != nil {
		log.Printf("⚠️  Error querying activities: %v", err)
		actualAttendeeActivities = []models.WebinarActivity{}
	}

	// Combine unique users from both sources
	actualAttendeeMap := make(map[string]bool)
	actualAttendeeList := make([]UserInfo, 0)

	// Add users from FirstJoinAt
	for _, user := range actualAttendees {
		if !actualAttendeeMap[user.Phone] {
			actualAttendeeMap[user.Phone] = true
			actualAttendeeList = append(actualAttendeeList, UserInfo{
				ID:                user.ID,
				FirstName:         user.FirstName,
				LastName:          user.LastName,
				Phone:             user.Phone,
				RegisteredAt:      user.RegisteredAt,
				HasWatched:        true,
				FirstJoinAt:       user.FirstJoinAt,
				TotalWatchSeconds: user.TotalWatchSeconds,
				PurchaseStatus:    user.PurchaseStatus,
				LicenseCode:       user.LicenseCode,
			})
		}
	}

	// Add users from WebinarActivity (might include users not in User table)
	for _, activity := range actualAttendeeActivities {
		if !actualAttendeeMap[activity.Phone] && activity.UserID != nil {
			// Try to find user by ID
			var user models.User
			if err := ctrl.DB.First(&user, *activity.UserID).Error; err == nil {
				actualAttendeeMap[activity.Phone] = true
				actualAttendeeList = append(actualAttendeeList, UserInfo{
					ID:                user.ID,
					FirstName:         user.FirstName,
					LastName:          user.LastName,
					Phone:             user.Phone,
					RegisteredAt:      user.RegisteredAt,
					HasWatched:        true,
					FirstJoinAt:       activity.ViewStartTime,
					TotalWatchSeconds: activity.TotalViewMinutes * 60,
					PurchaseStatus:    user.PurchaseStatus,
					LicenseCode:       user.LicenseCode,
				})
			}
		}
	}

	actualAttendeeCount := len(actualAttendeeList)
	log.Printf("✅ Found %d actual attendees for slot #%d", actualAttendeeCount, slot.ID)

	c.JSON(http.StatusOK, gin.H{
		"slot": slot,
		"stats": gin.H{
			"total_users":                totalUsers,
			"watched_count":              watchedCount,
			"not_watched_count":          totalUsers - watchedCount,
			"purchase_count":             purchaseCount,
			"full_purchase_count":        fullPurchaseCount,
			"installment_purchase_count": installmentPurchaseCount,
			"no_purchase_count":          totalUsers - purchaseCount,
			"actual_attendees_count":     actualAttendeeCount,
		},
		"users":            userList,
		"actual_attendees": actualAttendeeList,
		"time_range": gin.H{
			"start_time": startTime,
			"end_time":   endTime,
			"registration_window": gin.H{
				"start": previousDayStart,
				"end":   previousDayEnd,
			},
		},
	})
}

// GetSlotMinuteByMinutePresence returns minute-by-minute presence data for a slot
// Stream duration is 1 hour 42 minutes = 102 minutes
func (ctrl *AppointmentSlotController) GetSlotMinuteByMinutePresence(c *gin.Context) {
	slotID := c.Param("id")
	if slotID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slot ID is required"})
		return
	}

	var slot models.AppointmentSlot
	if err := ctrl.DB.First(&slot, slotID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment slot not found"})
		return
	}

	// Calculate start and end time for this slot
	startTime := slot.StartDateTime
	// CRITICAL: For appointment slots, end time is ALWAYS start time + 102 minutes (1 hour 42 minutes)
	endTime := startTime.Add(102 * time.Minute)

	// Stream duration: 1 hour 42 minutes = 102 minutes
	streamDurationMinutes := 102
	minuteData := make([]gin.H, streamDurationMinutes)

	// Initialize all minutes with 0
	for i := 0; i < streamDurationMinutes; i++ {
		minuteData[i] = gin.H{
			"minute": i + 1,
			"count":  0,
		}
	}

	// Get all WebinarActivity records that started during this slot
	var activities []models.WebinarActivity
	query := ctrl.DB.Model(&models.WebinarActivity{}).
		Where("view_start_time >= ? AND view_start_time < ?", startTime, endTime)

	if err := query.Find(&activities).Error; err != nil {
		log.Printf("⚠️  Error querying activities for minute-by-minute: %v", err)
		c.JSON(http.StatusOK, gin.H{
			"slot":        slot,
			"minute_data": minuteData,
		})
		return
	}

	// Track unique users per minute to avoid double counting
	userMinutesMap := make(map[int]map[string]bool) // minute -> phone -> present

	// For each activity, calculate which minutes the user was present
	for _, activity := range activities {
		if activity.ViewStartTime == nil {
			continue
		}

		// Normalize phone to avoid duplicates
		normalizedPhone := utils.NormalizePhoneNumber(activity.Phone)

		// Calculate start minute (relative to slot start)
		startMinute := int(activity.ViewStartTime.Sub(startTime).Minutes())
		if startMinute < 0 {
			startMinute = 0
		}
		if startMinute >= streamDurationMinutes {
			continue // Activity started after stream ended
		}

		// Calculate end minute
		var endMinute int
		if activity.ViewEndTime != nil {
			endMinute = int(activity.ViewEndTime.Sub(startTime).Minutes())
		} else {
			// If no end time, use total view minutes
			endMinute = startMinute + activity.TotalViewMinutes
		}

		if endMinute > streamDurationMinutes {
			endMinute = streamDurationMinutes
		}

		// Mark user as present for each minute they watched (avoid duplicates)
		for minute := startMinute; minute < endMinute && minute < streamDurationMinutes; minute++ {
			if minute >= 0 {
				if userMinutesMap[minute] == nil {
					userMinutesMap[minute] = make(map[string]bool)
				}
				if !userMinutesMap[minute][normalizedPhone] {
					userMinutesMap[minute][normalizedPhone] = true
					currentCount := minuteData[minute]["count"].(int)
					minuteData[minute]["count"] = currentCount + 1
				}
			}
		}
	}

	// Also check User.FirstJoinAt for users who joined during the slot
	var users []models.User
	userQuery := ctrl.DB.Model(&models.User{}).
		Where("first_join_at >= ? AND first_join_at < ?", startTime, endTime)

	if err := userQuery.Find(&users).Error; err == nil {
		for _, user := range users {
			if user.FirstJoinAt == nil {
				continue
			}

			// Normalize phone to avoid duplicates
			normalizedPhone := utils.NormalizePhoneNumber(user.Phone)

			// Calculate start minute
			startMinute := int(user.FirstJoinAt.Sub(startTime).Minutes())
			if startMinute < 0 {
				startMinute = 0
			}
			if startMinute >= streamDurationMinutes {
				continue
			}

			// Calculate end minute based on total watch seconds
			watchMinutes := user.TotalWatchSeconds / 60
			if watchMinutes == 0 {
				watchMinutes = 1 // At least 1 minute if they joined
			}
			endMinute := startMinute + watchMinutes
			if endMinute > streamDurationMinutes {
				endMinute = streamDurationMinutes
			}

			// Mark user as present for each minute (avoid duplicates with activities)
			for minute := startMinute; minute < endMinute && minute < streamDurationMinutes; minute++ {
				if minute >= 0 {
					if userMinutesMap[minute] == nil {
						userMinutesMap[minute] = make(map[string]bool)
					}
					if !userMinutesMap[minute][normalizedPhone] {
						userMinutesMap[minute][normalizedPhone] = true
						currentCount := minuteData[minute]["count"].(int)
						minuteData[minute]["count"] = currentCount + 1
					}
				}
			}
		}
	}

	log.Printf("✅ Generated minute-by-minute data for slot #%d", slot.ID)

	c.JSON(http.StatusOK, gin.H{
		"slot":             slot,
		"minute_data":      minuteData,
		"duration_minutes": streamDurationMinutes,
		"time_range": gin.H{
			"start_time": startTime,
			"end_time":   endTime,
		},
	})
}
