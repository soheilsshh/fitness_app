package controllers

import (
	"encoding/csv"
	"fmt"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/utils"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminStatsController struct {
	DB *gorm.DB
}

func NewAdminStatsController(db *gorm.DB) *AdminStatsController {
	return &AdminStatsController{DB: db}
}

type DashboardStats struct {
	TotalRegistrations     int64   `json:"total_registrations"`       // Total users registered
	TotalClicks            int64   `json:"total_clicks"`              // Total clicks on webinar link
	TotalViewers           int64   `json:"total_viewers"`             // Users who watched webinar
	TotalViewMinutes       int64   `json:"total_view_minutes"`        // Total minutes watched
	AverageViewMinutes     float64 `json:"average_view_minutes"`      // Average minutes per viewer
	NonViewers             int64   `json:"non_viewers"`               // Registered but didn't watch
	ConversionRate         float64 `json:"conversion_rate"`           // (Viewers / Clicks) * 100
	RegistrationToViewRate float64 `json:"registration_to_view_rate"` // (Viewers / Registrations) * 100
}

// Helper function to calculate date range based on filter
func getDateRangeFromFilter(filter string) (startDate time.Time, endDate time.Time) {
	now := time.Now()

	switch filter {
	case "today":
		// Today: from start of today to now
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		endDate = now
	case "yesterday":
		// Yesterday: from start of yesterday to end of yesterday
		yesterday := now.AddDate(0, 0, -1)
		startDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
		endDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 23, 59, 59, 999999999, yesterday.Location())
	case "week":
		// This week: from start of week (Monday) to now
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Sunday = 7
		}
		startDate = now.AddDate(0, 0, -weekday+1) // Monday
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
		endDate = now
	case "last_week":
		// Last week: from Monday of last week to Sunday of last week
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		lastWeekMonday := now.AddDate(0, 0, -weekday-6) // Monday of last week
		startDate = time.Date(lastWeekMonday.Year(), lastWeekMonday.Month(), lastWeekMonday.Day(), 0, 0, 0, 0, lastWeekMonday.Location())
		lastWeekSunday := now.AddDate(0, 0, -weekday) // Sunday of last week
		endDate = time.Date(lastWeekSunday.Year(), lastWeekSunday.Month(), lastWeekSunday.Day(), 23, 59, 59, 999999999, lastWeekSunday.Location())
	case "month":
		// This month: from start of current month to now
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = now
	case "last_month":
		// Last month: from start to end of last month
		firstOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		lastMonthEnd := firstOfThisMonth.AddDate(0, 0, -1)
		startDate = time.Date(lastMonthEnd.Year(), lastMonthEnd.Month(), 1, 0, 0, 0, 0, lastMonthEnd.Location())
		endDate = time.Date(lastMonthEnd.Year(), lastMonthEnd.Month(), lastMonthEnd.Day(), 23, 59, 59, 999999999, lastMonthEnd.Location())
	default:
		// All: no date filter
		startDate = time.Time{}
		endDate = time.Time{}
	}

	return startDate, endDate
}

// DailyRegistrationStats represents daily registration statistics
type DailyRegistrationStats struct {
	Date          string `json:"date"`          // Date in format "YYYY-MM-DD" (Gregorian)
	PersianDate   string `json:"persian_date"`  // Date in Persian format "YYYY/MM/DD"
	DayName       string `json:"day_name"`      // Day name in Persian (شنبه، یکشنبه، ...)
	DayNumber     int    `json:"day_number"`    // Day number in month (1-30 for month view)
	Registrations int64  `json:"registrations"` // Number of registrations on this day
	PersianMonth  string `json:"persian_month"` // Persian month name (فروردین، اردیبهشت، ...)
	PersianYear   int    `json:"persian_year"`  // Persian year
}

// GetDailyRegistrations returns daily registration statistics for chart
func (ctrl *AdminStatsController) GetDailyRegistrations(c *gin.Context) {
	// Get filter parameter: "week" or "month" (default: "week")
	filter := c.DefaultQuery("filter", "week")

	// Get Persian year and month from query parameters (optional, for month filter)
	persianYearStr := c.Query("persian_year")
	persianMonthStr := c.Query("persian_month")

	// Load Iran timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	now := time.Now().In(loc)
	log.Printf("📅 [GetDailyRegistrations] Current time: %s (%s) in timezone: %s",
		now.Format("2006-01-02 15:04:05"), now.Weekday().String(), loc.String())

	var startDate, endDate time.Time
	var useDateFilter bool = true

	// Calculate date range based on filter
	if filter == "week" {
		// This week: from start of week (Saturday) to end of week (Friday)
		// Find Saturday of the CURRENT week (start of Persian week)
		// Simple approach: Go back day by day until we find Saturday
		startDate = now
		daysBack := 0
		for startDate.Weekday() != time.Saturday {
			startDate = startDate.AddDate(0, 0, -1)
			daysBack++
		}
		// Set to start of day
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)

		log.Printf("📅 [Week] Today: %s (%s) -> Saturday: %s (%s) - went back %d days",
			now.Format("2006-01-02"), now.Weekday().String(),
			startDate.Format("2006-01-02"), startDate.Weekday().String(), daysBack)

		// Calculate Friday (end of week) - exactly 6 days after Saturday
		endDate = startDate.AddDate(0, 0, 6)
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)

		// Verify end date is Friday
		if endDate.Weekday() != time.Friday {
			log.Printf("❌ [Week] ERROR: End date %s is %s, expected Friday! Fixing...",
				endDate.Format("2006-01-02"), endDate.Weekday().String())
			// Fix: Find Friday
			tempDate := startDate.AddDate(0, 0, 6)
			for tempDate.Weekday() != time.Friday {
				if tempDate.Weekday() > time.Friday {
					tempDate = tempDate.AddDate(0, 0, -1)
				} else {
					tempDate = tempDate.AddDate(0, 0, 1)
				}
			}
			endDate = time.Date(tempDate.Year(), tempDate.Month(), tempDate.Day(), 23, 59, 59, 999999999, loc)
			log.Printf("✅ [Week] Fixed end date to Friday: %s", endDate.Format("2006-01-02"))
		}

		log.Printf("📅 [Week] Final week range: Saturday %s (%s) to Friday %s (%s) | Today: %s",
			startDate.Format("2006-01-02"), startDate.Weekday().String(),
			endDate.Format("2006-01-02"), endDate.Weekday().String(),
			now.Format("2006-01-02"))
	} else if filter == "month" {
		// This month: show days 1-30 of specified or current Persian month
		persianNow := utils.ToPersian(now)
		var targetYear, targetMonth int

		// Check if Persian year/month are provided in query parameters
		if persianYearStr != "" && persianMonthStr != "" {
			// Parse provided Persian year and month
			if year, err := strconv.Atoi(persianYearStr); err == nil {
				targetYear = year
			} else {
				targetYear = persianNow.Year
			}
			if month, err := strconv.Atoi(persianMonthStr); err == nil && month >= 1 && month <= 12 {
				targetMonth = month
			} else {
				targetMonth = persianNow.Month
			}
		} else {
			// Use current Persian month
			targetYear = persianNow.Year
			targetMonth = persianNow.Month
		}

		log.Printf("📅 [Month] Target Persian month: %d/%02d", targetYear, targetMonth)

		// Convert Persian month start (day 1) to Gregorian
		startDate = utils.PersianToGregorian(targetYear, targetMonth, 1)
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)

		// Convert Persian month end (day 30, or 29 for month 12) to Gregorian
		lastDay := 30
		if targetMonth == 12 {
			lastDay = 29 // Simplified - should check for leap year
		}
		endDate = utils.PersianToGregorian(targetYear, targetMonth, lastDay)
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)

		log.Printf("📅 [Month] Gregorian range: %s to %s", startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
	} else if filter == "all" {
		// For "all", get all registrations but limit to last 90 days for performance
		startDate = now.AddDate(0, 0, -90) // Last 90 days
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
		endDate = now
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filter. Use 'week', 'month', or 'all'"})
		return
	}

	// Get daily registrations
	var results []struct {
		Date          string
		Registrations int64
	}

	// Get promoter filter (optional - for filtering leads by promoter)
	promoterIDStr := c.Query("promoter_id")
	var promoterID *uint
	if promoterIDStr != "" {
		if id, err := strconv.ParseUint(promoterIDStr, 10, 32); err == nil {
			promoterIDVal := uint(id)
			promoterID = &promoterIDVal
		}
	} else {
		// Auto-filter: If current user is not admin, filter by their own promoter_id
		userID, hasUser := c.Get("user_id")
		if hasUser {
			currentUserID := userID.(uint)
			hasFullAdminPermission := HasPermission(c, ctrl.DB, "dashboard.view") ||
				HasPermission(c, ctrl.DB, "admin_users.view") ||
				HasPermission(c, ctrl.DB, "settings.edit")

			hasAffiliatePermission := HasPermission(c, ctrl.DB, "dashboard.affiliate.view")

			// If user has affiliate permission but not full admin permission, filter by their own promoter_id
			if hasAffiliatePermission && !hasFullAdminPermission {
				promoterID = &currentUserID
			} else if !hasFullAdminPermission {
				promoterID = &currentUserID
			}
		}
	}

	// Query to get daily registration counts
	// Use DATE_FORMAT for MySQL compatibility
	query := ctrl.DB.Model(&models.User{}).
		Select("DATE_FORMAT(registered_at, '%Y-%m-%d') as date, COUNT(*) as registrations")

	// Apply promoter filter if specified
	if promoterID != nil {
		query = query.Where("promoter_id = ?", *promoterID)
	}

	// Only apply date filter if not "all" or if we want to limit
	if useDateFilter {
		query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
	}

	query = query.Group("DATE_FORMAT(registered_at, '%Y-%m-%d')").Order("date ASC")

	log.Printf("📊 [GetDailyRegistrations] Filter: %s, Date range: %s to %s", filter, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
	log.Printf("📊 [GetDailyRegistrations] SQL Query will be executed...")

	if err := query.Scan(&results).Error; err != nil {
		log.Printf("❌ Error fetching daily registrations: %v", err)
		// Try alternative query format
		log.Printf("🔄 Trying alternative query format...")
		altQuery := ctrl.DB.Model(&models.User{}).
			Select("DATE(registered_at) as date, COUNT(*) as registrations")

		// Apply promoter filter if specified
		if promoterID != nil {
			altQuery = altQuery.Where("promoter_id = ?", *promoterID)
		}

		if useDateFilter {
			altQuery = altQuery.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
		}
		altQuery = altQuery.Group("DATE(registered_at)").Order("date ASC")

		if err2 := altQuery.Scan(&results).Error; err2 != nil {
			log.Printf("❌ Alternative query also failed: %v", err2)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch daily registrations", "details": err2.Error()})
			return
		}
		log.Printf("✅ Alternative query succeeded")
	}

	log.Printf("📊 [GetDailyRegistrations] Found %d days with registrations", len(results))
	if len(results) > 0 {
		log.Printf("📊 [GetDailyRegistrations] Sample result: Date=%s, Count=%d", results[0].Date, results[0].Registrations)
	}

	// Create a map of results for quick lookup
	resultMap := make(map[string]int64)
	for _, r := range results {
		resultMap[r.Date] = r.Registrations
		log.Printf("📊 [GetDailyRegistrations] Date: %s, Registrations: %d", r.Date, r.Registrations)
	}

	// Build complete date range (fill missing days with 0)
	var dailyStats []DailyRegistrationStats
	current := startDate

	// For month view, we need exactly 30 days (days 1-30 of Persian month)
	// For week view, we need exactly 7 days (Saturday to Friday)
	// For all view, we need 90 days (last 90 days)
	maxDays := 7 // Default for week (Saturday to Friday)
	if filter == "all" {
		maxDays = 90 // Last 90 days
	}

	dayCount := 0
	persianNow := utils.ToPersian(now)

	// For month filter, determine target Persian month
	var targetPersianYear, targetPersianMonth int
	if filter == "month" {
		maxDays = 30
		if persianYearStr != "" && persianMonthStr != "" {
			if year, err := strconv.Atoi(persianYearStr); err == nil {
				targetPersianYear = year
			} else {
				targetPersianYear = persianNow.Year
			}
			if month, err := strconv.Atoi(persianMonthStr); err == nil && month >= 1 && month <= 12 {
				targetPersianMonth = month
			} else {
				targetPersianMonth = persianNow.Month
			}
		} else {
			targetPersianYear = persianNow.Year
			targetPersianMonth = persianNow.Month
		}
	}

	// For week view, skip the main loop - we'll build it separately
	if filter != "week" {
		for {
			// Check if we should stop
			if filter == "all" {
				if dayCount >= maxDays {
					break
				}
			} else if filter == "month" {
				// For month, check if we've passed endDate or moved to next month
				if current.After(endDate) {
					break
				}
				persianDate := utils.ToPersian(current)
				if persianDate.Year != targetPersianYear || persianDate.Month != targetPersianMonth {
					break
				}
				if persianDate.Day > 30 {
					break
				}
			} else {
				// For other filters, use maxDays
				if dayCount >= maxDays {
					break
				}
			}

			dateStr := current.Format("2006-01-02")
			persianDate := utils.ToPersian(current)
			persianDateStr := utils.FormatPersianDate(current)
			dayName := utils.GetPersianDayName(current)

			count := int64(0)
			if val, exists := resultMap[dateStr]; exists {
				count = val
			}

			dayNumber := 0
			if filter == "month" {
				// For month view, use actual day number
				dayNumber = persianDate.Day
			}

			dailyStats = append(dailyStats, DailyRegistrationStats{
				Date:          dateStr,
				PersianDate:   persianDateStr,
				DayName:       dayName,
				DayNumber:     dayNumber,
				Registrations: count,
				PersianMonth:  utils.GetPersianMonthName(persianDate.Month),
				PersianYear:   persianDate.Year,
			})

			current = current.AddDate(0, 0, 1)
			dayCount++
		}
	}

	// For month view, ensure we have exactly 30 entries (days 1-30)
	if filter == "month" {
		// Sort by day number to ensure correct order
		// Then ensure we have exactly 30 entries
		dayMap := make(map[int]DailyRegistrationStats)
		for _, stat := range dailyStats {
			if stat.DayNumber > 0 && stat.DayNumber <= 30 {
				dayMap[stat.DayNumber] = stat
			}
		}

		// Rebuild array with days 1-30
		dailyStats = []DailyRegistrationStats{}
		for dayNum := 1; dayNum <= 30; dayNum++ {
			if stat, exists := dayMap[dayNum]; exists {
				dailyStats = append(dailyStats, stat)
			} else {
				// Find the Gregorian date for this Persian day
				// Use target Persian month/year
				tempDate := startDate
				found := false
				for i := 0; i < 35; i++ {
					p := utils.ToPersian(tempDate)
					if p.Year == targetPersianYear && p.Month == targetPersianMonth && p.Day == dayNum {
						p := utils.ToPersian(tempDate)
						dailyStats = append(dailyStats, DailyRegistrationStats{
							Date:          tempDate.Format("2006-01-02"),
							PersianDate:   utils.FormatPersianDate(tempDate),
							DayName:       utils.GetPersianDayName(tempDate),
							DayNumber:     dayNum,
							Registrations: 0,
							PersianMonth:  utils.GetPersianMonthName(p.Month),
							PersianYear:   p.Year,
						})
						found = true
						break
					}
					tempDate = tempDate.AddDate(0, 0, 1)
				}
				// If not found, create placeholder
				if !found {
					dailyStats = append(dailyStats, DailyRegistrationStats{
						Date:          "",
						PersianDate:   fmt.Sprintf("%d/%02d/%02d", targetPersianYear, targetPersianMonth, dayNum),
						DayName:       "",
						DayNumber:     dayNum,
						Registrations: 0,
						PersianMonth:  utils.GetPersianMonthName(targetPersianMonth),
						PersianYear:   targetPersianYear,
					})
				}
			}
		}
	}

	// For week view, ensure we have exactly 7 days (Saturday to Friday)
	if filter == "week" {
		// Reset to start of week (Saturday) and rebuild to ensure exactly 7 days
		current = startDate
		dailyStats = []DailyRegistrationStats{}

		// Build exactly 7 days (Saturday to Friday)
		for i := 0; i < 7; i++ {
			dateStr := current.Format("2006-01-02")
			persianDateStr := utils.FormatPersianDate(current)
			dayName := utils.GetPersianDayName(current)

			count := int64(0)
			if val, exists := resultMap[dateStr]; exists {
				count = val
				log.Printf("📊 [Week] Day %d: %s (%s, %s) - %d registrations",
					i+1, dateStr, dayName, current.Weekday().String(), count)
			} else {
				log.Printf("📊 [Week] Day %d: %s (%s, %s) - 0 registrations",
					i+1, dateStr, dayName, current.Weekday().String())
			}

			persianDate := utils.ToPersian(current)
			dailyStats = append(dailyStats, DailyRegistrationStats{
				Date:          dateStr,
				PersianDate:   persianDateStr,
				DayName:       dayName,
				DayNumber:     0,
				Registrations: count,
				PersianMonth:  utils.GetPersianMonthName(persianDate.Month),
				PersianYear:   persianDate.Year,
			})

			current = current.AddDate(0, 0, 1)
		}

		log.Printf("📊 [Week] Built exactly %d days for week view (Saturday to Friday)", len(dailyStats))
		if len(dailyStats) > 0 {
			log.Printf("📊 [Week] First day: %s (%s), Last day: %s (%s)",
				dailyStats[0].Date, dailyStats[0].DayName,
				dailyStats[len(dailyStats)-1].Date, dailyStats[len(dailyStats)-1].DayName)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"filter":      filter,
		"start_date":  startDate.Format("2006-01-02"),
		"end_date":    endDate.Format("2006-01-02"),
		"daily_stats": dailyStats,
	})
}

// GetDashboardStats returns overall statistics with optional date filter
func (ctrl *AdminStatsController) GetDashboardStats(c *gin.Context) {
	// Get promoter filter (optional - for filtering leads by promoter)
	// First check query parameter, then check if current user is not admin (auto-filter)
	promoterIDStr := c.Query("promoter_id")
	var promoterID *uint

	// If promoter_id is explicitly provided in query, use it
	if promoterIDStr != "" {
		if id, err := strconv.ParseUint(promoterIDStr, 10, 32); err == nil {
			promoterIDVal := uint(id)
			promoterID = &promoterIDVal
		}
	} else {
		// Auto-filter: If current user is not admin, filter by their own promoter_id
		// Check if user has admin permissions
		userID, hasUser := c.Get("user_id")
		if hasUser {
			currentUserID := userID.(uint)
			// Check if user has full admin permissions (dashboard.view or any admin permission)
			hasFullAdminPermission := HasPermission(c, ctrl.DB, "dashboard.view") ||
				HasPermission(c, ctrl.DB, "admin_users.view") ||
				HasPermission(c, ctrl.DB, "settings.edit")

			// Check if user has affiliate-only permission
			hasAffiliatePermission := HasPermission(c, ctrl.DB, "dashboard.affiliate.view")

			// If user has affiliate permission but not full admin permission, filter by their own promoter_id
			if hasAffiliatePermission && !hasFullAdminPermission {
				promoterID = &currentUserID
				log.Printf("[AdminStats] Auto-filtering by promoter_id=%d for affiliate-only user", *promoterID)
			} else if !hasFullAdminPermission {
				// If user doesn't have any dashboard permission, filter by their own promoter_id
				promoterID = &currentUserID
				log.Printf("[AdminStats] Auto-filtering by promoter_id=%d for non-admin user", *promoterID)
			} else {
				// For admin users, if viewing all leads, also include NULL promoter_id (old leads assigned to admin)
				// This is handled in the query itself by not filtering when promoterID is nil
				log.Printf("[AdminStats] Admin user viewing all leads (including NULL promoter_id)")
			}
		}
	}

	var stats DashboardStats

	// Get filter parameter: "today", "yesterday", "week", "last_week", "month", "last_month", "all" (default: "all")
	filter := c.DefaultQuery("filter", "all")
	startDate, endDate := getDateRangeFromFilter(filter)

	// Get unique phones filter parameter
	uniquePhones := c.DefaultQuery("unique_phones", "false") == "true"

	// OPTIMIZED: Only log filter details in debug mode (reduces I/O overhead)
	if !startDate.IsZero() {
		utils.LogDebug("[AdminStats] Filter: %s, Date range: %s to %s", filter, startDate.Format("2006-01-02 15:04:05"), endDate.Format("2006-01-02 15:04:05"))
	} else {
		utils.LogDebug("[AdminStats] Filter: %s (all time)", filter)
	}

	// Base queries with date filter - optimized with proper indexing
	userQuery := ctrl.DB.Model(&models.User{})
	clickQuery := ctrl.DB.Model(&models.WebinarActivity{}).Where("activity_type = ?", "click")
	viewerQuery := ctrl.DB.Model(&models.WebinarActivity{}).Where("view_start_time IS NOT NULL")
	viewMinutesQuery := ctrl.DB.Model(&models.WebinarActivity{}).Where("view_start_time IS NOT NULL")

	// OPTIMIZED: Apply promoter filter if specified
	// Use JOIN instead of separate query + IN clause for better performance
	if promoterID != nil {
		// For user query, filter by promoter_id
		userQuery = userQuery.Where("promoter_id = ?", *promoterID)
		// OPTIMIZED: Use JOIN instead of separate query for better performance
		// This avoids loading all phone numbers into memory
		clickQuery = clickQuery.Joins("INNER JOIN users ON users.phone = webinar_activities.phone").
			Where("users.promoter_id = ?", *promoterID)
		viewerQuery = viewerQuery.Joins("INNER JOIN users ON users.phone = webinar_activities.phone").
			Where("users.promoter_id = ?", *promoterID)
		viewMinutesQuery = viewMinutesQuery.Joins("INNER JOIN users ON users.phone = webinar_activities.phone").
			Where("users.promoter_id = ?", *promoterID)
	}

	if !startDate.IsZero() {
		// Apply date filter - indexes on registered_at, clicked_at, view_start_time will speed this up
		userQuery = userQuery.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
		clickQuery = clickQuery.Where("clicked_at >= ? AND clicked_at <= ?", startDate, endDate)
		viewerQuery = viewerQuery.Where("view_start_time >= ? AND view_start_time <= ?", startDate, endDate)
		viewMinutesQuery = viewMinutesQuery.Where("view_start_time >= ? AND view_start_time <= ?", startDate, endDate)
	}

	// Execute queries in parallel for better performance (using goroutines)
	type queryResults struct {
		registrations int64
		clicks        int64
		viewers       int64
		viewMinutes   int64
		err           error
	}

	results := make(chan queryResults, 4)

	// Total registrations
	go func() {
		var count int64
		query := userQuery
		if uniquePhones {
			// Count distinct phone numbers
			err := query.Select("COUNT(DISTINCT phone)").Scan(&count).Error
			results <- queryResults{registrations: count, err: err}
		} else {
			err := query.Count(&count).Error
			results <- queryResults{registrations: count, err: err}
		}
	}()

	// OPTIMIZED: Total clicks (unique users who clicked within the time range)
	// Use COUNT(DISTINCT) instead of Distinct().Count() for better performance
	go func() {
		var count int64
		// Fix ambiguous column: specify table name for phone column
		err := clickQuery.Select("COUNT(DISTINCT webinar_activities.phone)").Scan(&count).Error
		results <- queryResults{clicks: count, err: err}
	}()

	// OPTIMIZED: Total viewers (users who have view_start_time)
	// Use COUNT(DISTINCT) instead of Distinct().Count() for better performance
	go func() {
		var count int64
		// Fix ambiguous column: specify table name for phone column
		err := viewerQuery.Select("COUNT(DISTINCT webinar_activities.phone)").Scan(&count).Error
		results <- queryResults{viewers: count, err: err}
	}()

	// Total view minutes
	go func() {
		var total int64
		err := viewMinutesQuery.Select("COALESCE(SUM(total_view_minutes), 0)").Scan(&total).Error
		results <- queryResults{viewMinutes: total, err: err}
	}()

	// Collect results
	for i := 0; i < 4; i++ {
		result := <-results
		if result.err != nil {
			log.Printf("[AdminStats] Query error: %v", result.err)
		}
		stats.TotalRegistrations += result.registrations
		stats.TotalClicks += result.clicks
		stats.TotalViewers += result.viewers
		stats.TotalViewMinutes += result.viewMinutes
	}

	// Average view minutes
	if stats.TotalViewers > 0 {
		stats.AverageViewMinutes = float64(stats.TotalViewMinutes) / float64(stats.TotalViewers)
	} else {
		stats.AverageViewMinutes = 0
	}

	// Non-viewers (registered but didn't watch)
	// Users who registered in the time range but didn't watch (or watched outside the time range)
	nonViewerQuery := ctrl.DB.Model(&models.User{})

	// Apply promoter filter if specified
	if promoterID != nil {
		nonViewerQuery = nonViewerQuery.Where("promoter_id = ?", *promoterID)
	}

	if !startDate.IsZero() {
		nonViewerQuery = nonViewerQuery.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
		// Exclude users who watched within the time range
		nonViewerQuery = nonViewerQuery.Where("phone NOT IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL AND view_start_time >= ? AND view_start_time <= ?)", startDate, endDate)
	} else {
		// For "all" filter, exclude users who watched at any time
		nonViewerQuery = nonViewerQuery.Where("phone NOT IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL)")
	}

	if uniquePhones {
		// Count distinct phone numbers for non-viewers
		var count int64
		nonViewerQuery.Select("COUNT(DISTINCT phone)").Scan(&count)
		stats.NonViewers = count
	} else {
		nonViewerQuery.Count(&stats.NonViewers)
	}

	// Conversion rate (Viewers / Clicks * 100)
	// Only calculate if we have clicks in the time range
	if stats.TotalClicks > 0 {
		stats.ConversionRate = (float64(stats.TotalViewers) / float64(stats.TotalClicks)) * 100
	} else {
		stats.ConversionRate = 0
	}

	// Registration to view rate (Viewers / Registrations * 100)
	// Only calculate if we have registrations in the time range
	if stats.TotalRegistrations > 0 {
		stats.RegistrationToViewRate = (float64(stats.TotalViewers) / float64(stats.TotalRegistrations)) * 100
	} else {
		stats.RegistrationToViewRate = 0
	}

	// Log final stats for debugging
	log.Printf("[AdminStats] Final stats - Registrations: %d, Clicks: %d, Viewers: %d, Non-viewers: %d, Avg minutes: %.2f, Conversion: %.2f%%, Reg-to-View: %.2f%%",
		stats.TotalRegistrations, stats.TotalClicks, stats.TotalViewers, stats.NonViewers,
		stats.AverageViewMinutes, stats.ConversionRate, stats.RegistrationToViewRate)

	// Set cache headers to ensure fresh data
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	c.JSON(http.StatusOK, stats)
}

type UserWithActivity struct {
	ID                 uint       `json:"id"`
	FirstName          string     `json:"first_name"`
	LastName           string     `json:"last_name"`
	Phone              string     `json:"phone"`
	RegisteredAt       time.Time  `json:"registered_at"`
	PromoterID         *uint      `json:"promoter_id,omitempty"`
	PromoterUsername   *string    `json:"promoter_username,omitempty"`
	ClickedAt          *time.Time `json:"clicked_at"`
	ViewStartTime      *time.Time `json:"view_start_time"`
	ViewEndTime        *time.Time `json:"view_end_time"`
	TotalViewMinutes   int        `json:"total_view_minutes"`
	ActiveWatchMinutes int        `json:"active_watch_minutes"` // Active watch minutes (only when page is visible)
	WatchedWebinar     bool       `json:"watched_webinar"`
}

// GetUsersList returns list of all users with their activity (with pagination and date filter)
func (ctrl *AdminStatsController) GetUsersList(c *gin.Context) {
	now := time.Now()
	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	// Get filter parameter: "today", "yesterday", "week", "last_week", "month", "last_month", "all" (default: "all")
	filter := c.DefaultQuery("filter", "all")

	// Check for custom date/time range (advanced filter)
	customStartDate := c.Query("start_date")
	customStartTime := c.Query("start_time")
	customEndDate := c.Query("end_date")
	customEndTime := c.Query("end_time")

	var startDate, endDate time.Time

	// If custom date/time is provided, use it; otherwise use filter
	if customStartDate != "" && customEndDate != "" {
		// Parse custom date/time range
		loc, _ := time.LoadLocation("Asia/Tehran")
		startTimeStr := customStartTime
		if startTimeStr == "" {
			startTimeStr = "00:00"
		}
		endTimeStr := customEndTime
		if endTimeStr == "" {
			endTimeStr = "23:59"
		}

		// Parse start date/time
		startDateTimeStr := fmt.Sprintf("%s %s", customStartDate, startTimeStr)
		parsedStart, err := time.ParseInLocation("2006-01-02 15:04", startDateTimeStr, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date or start_time format"})
			return
		}
		startDate = parsedStart

		// Parse end date/time
		endDateTimeStr := fmt.Sprintf("%s %s", customEndDate, endTimeStr)
		parsedEnd, err := time.ParseInLocation("2006-01-02 15:04", endDateTimeStr, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date or end_time format"})
			return
		}
		endDate = parsedEnd
	} else {
		// Use filter-based date range
		startDate, endDate = getDateRangeFromFilter(filter)
	}

	// Get watch filter parameter: "all", "watched", "not_watched" (default: "all")
	watchFilter := c.DefaultQuery("watch_filter", "all")

	// Get unique phones filter parameter
	uniquePhones := c.DefaultQuery("unique_phones", "false") == "true"

	// Get promoter filter (optional - for filtering leads by promoter)
	// Check for explicit affiliate filter from frontend
	affiliateFilter := c.Query("affiliate_filter") // "true" or "false"
	promoterIDStr := c.Query("promoter_id")
	var promoterID *uint

	if promoterIDStr != "" {
		// Explicit promoter_id provided
		if id, err := strconv.ParseUint(promoterIDStr, 10, 32); err == nil {
			promoterIDVal := uint(id)
			promoterID = &promoterIDVal
		}
	} else {
		// Auto-filter logic
		userID, hasUser := c.Get("user_id")
		if hasUser {
			currentUserID := userID.(uint)
			hasFullAdminPermission := HasPermission(c, ctrl.DB, "dashboard.view") ||
				HasPermission(c, ctrl.DB, "admin_users.view") ||
				HasPermission(c, ctrl.DB, "settings.edit")

			hasAffiliatePermission := HasPermission(c, ctrl.DB, "dashboard.affiliate.view")

			// If affiliate_filter is explicitly set to "true", filter by current user's ID
			// This allows admin users to see only their own affiliate leads
			if affiliateFilter == "true" {
				promoterID = &currentUserID
				log.Printf("[GetUsersList] Affiliate filter enabled for user %d", *promoterID)
			} else if hasAffiliatePermission && !hasFullAdminPermission {
				// Users with affiliate-only permission always see only their own leads
				promoterID = &currentUserID
				log.Printf("[GetUsersList] Auto-filtering by promoter_id=%d for affiliate-only user", *promoterID)
			} else if !hasFullAdminPermission {
				// Non-admin users always see only their own leads
				promoterID = &currentUserID
				log.Printf("[GetUsersList] Auto-filtering by promoter_id=%d for non-admin user", *promoterID)
			}
		}
	}

	// Build query with date filter
	query := ctrl.DB.Model(&models.User{})
	if !startDate.IsZero() {
		query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
	}

	// Apply promoter filter if specified
	if promoterID != nil {
		query = query.Where("promoter_id = ?", *promoterID)
	}

	// Get total count for pagination (before applying unique filter for count)
	var totalCount int64
	if uniquePhones {
		// Count distinct phone numbers
		countQuery := ctrl.DB.Model(&models.User{})
		if !startDate.IsZero() {
			countQuery = countQuery.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
		}
		if promoterID != nil {
			countQuery = countQuery.Where("promoter_id = ?", *promoterID)
		}
		countQuery.Select("COUNT(DISTINCT phone)").Scan(&totalCount)
	} else {
		query.Count(&totalCount)
	}

	// Apply unique phones filter if specified
	if uniquePhones {
		// For unique phones, we need to get only one record per phone
		// Use a subquery to get the minimum ID (first registered) for each phone
		subquery := ctrl.DB.Model(&models.User{}).
			Select("MIN(id) as id").
			Group("phone")

		if !startDate.IsZero() {
			subquery = subquery.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
		}
		if promoterID != nil {
			subquery = subquery.Where("promoter_id = ?", *promoterID)
		}

		var uniqueIDs []uint
		subquery.Pluck("id", &uniqueIDs)

		if len(uniqueIDs) > 0 {
			query = query.Where("id IN ?", uniqueIDs)
		} else {
			// No unique phones found, return empty result
			query = query.Where("1 = 0")
		}
	}

	// Preload Promoter relationship for all users
	query = query.Preload("Promoter")

	// Get paginated users
	var users []models.User
	offset := (page - 1) * pageSize
	if err := query.Order("registered_at DESC").Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	// OPTIMIZED: Batch load activities for all users in one query instead of N+1 queries
	// Get all unique phone numbers from users
	userPhones := make([]string, 0, len(users))
	for _, user := range users {
		userPhones = append(userPhones, user.Phone)
	}

	// Load all activities for these phones in one query
	var activities []models.WebinarActivity
	if len(userPhones) > 0 {
		// Get the most recent activity for each phone
		ctrl.DB.Where("phone IN ?", userPhones).
			Order("created_at DESC").
			Find(&activities)
	}

	// Create a map for O(1) lookup: phone -> activity
	activityMap := make(map[string]models.WebinarActivity)
	for _, activity := range activities {
		// Keep only the most recent activity for each phone
		if existing, exists := activityMap[activity.Phone]; !exists || activity.CreatedAt.After(existing.CreatedAt) {
			activityMap[activity.Phone] = activity
		}
	}

	var usersWithActivity []UserWithActivity

	for _, user := range users {
		activity, hasActivity := activityMap[user.Phone]

		userWithActivity := UserWithActivity{
			ID:                 user.ID,
			FirstName:          user.FirstName,
			LastName:           user.LastName,
			Phone:              user.Phone,
			RegisteredAt:       user.RegisteredAt,
			PromoterID:         user.PromoterID,
			PromoterUsername:   nil,
			TotalViewMinutes:   0,
			ActiveWatchMinutes: 0,
			WatchedWebinar:     false,
		}

		// Set promoter username if exists
		if user.Promoter != nil {
			userWithActivity.PromoterUsername = &user.Promoter.Username
		}

		if hasActivity && activity.ID != 0 {
			userWithActivity.ClickedAt = &activity.ClickedAt
			userWithActivity.ViewStartTime = activity.ViewStartTime
			userWithActivity.ViewEndTime = activity.ViewEndTime

			// CRITICAL: Calculate accurate view minutes
			if activity.ViewStartTime != nil {
				var endTime time.Time
				if activity.ViewEndTime != nil {
					// Use end time if available
					endTime = *activity.ViewEndTime
				} else {
					// Calculate from start time to now if still watching
					endTime = now
				}

				// Calculate elapsed minutes from start to end
				elapsedSeconds := endTime.Sub(*activity.ViewStartTime).Seconds()
				elapsedMinutes := int(elapsedSeconds / 60)

				// Use maximum of stored value or calculated value
				if elapsedMinutes > activity.TotalViewMinutes {
					userWithActivity.TotalViewMinutes = elapsedMinutes
				} else {
					userWithActivity.TotalViewMinutes = activity.TotalViewMinutes
				}
			} else {
				// Use stored value if no start time
				userWithActivity.TotalViewMinutes = activity.TotalViewMinutes
			}

			userWithActivity.WatchedWebinar = activity.ViewStartTime != nil
			userWithActivity.ActiveWatchMinutes = activity.ActiveWatchMinutes
		}

		// Apply watch filter
		if watchFilter == "watched" && !userWithActivity.WatchedWebinar {
			continue // Skip users who haven't watched
		}
		if watchFilter == "not_watched" && userWithActivity.WatchedWebinar {
			continue // Skip users who have watched
		}

		usersWithActivity = append(usersWithActivity, userWithActivity)
	}

	// Calculate pagination info
	totalPages := (int(totalCount) + pageSize - 1) / pageSize
	if totalPages == 0 {
		totalPages = 1
	}

	// Set cache headers to ensure fresh data
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	c.JSON(http.StatusOK, gin.H{
		"users": usersWithActivity,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total_count": totalCount,
			"total_pages": totalPages,
		},
	})
}

// ExportViewersExcel exports users who watched webinar to Excel (CSV format) with date filter
func (ctrl *AdminStatsController) ExportViewersExcel(c *gin.Context) {
	// Get filter parameter: "today", "yesterday", "week", "last_week", "month", "last_month", "all" (default: "all")
	filter := c.DefaultQuery("filter", "all")
	startDate, endDate := getDateRangeFromFilter(filter)

	// Get watch filter parameter: "all", "watched", "not_watched" (default: "all")
	watchFilter := c.DefaultQuery("watch_filter", "all")

	// Get unique phones filter parameter
	uniquePhones := c.DefaultQuery("unique_phones", "false") == "true"

	// If watchFilter is "not_watched", return empty file (no viewers to export)
	if watchFilter == "not_watched" {
		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", "attachment; filename=webinar_viewers.csv")
		c.Writer.Write([]byte{0xEF, 0xBB, 0xBF}) // BOM
		writer := csv.NewWriter(c.Writer)
		defer writer.Flush()
		writer.Write([]string{"نام", "نام خانوادگی", "شماره تماس", "تاریخ ثبت\u200cنام", "تاریخ شروع تماشا", "تاریخ پایان تماشا", "مدت زمان تماشا (دقیقه)"})
		return
	}

	var activities []models.WebinarActivity
	query := ctrl.DB.Where("view_start_time IS NOT NULL")
	if !startDate.IsZero() {
		query = query.Where("view_start_time >= ? AND view_start_time <= ?", startDate, endDate)
	}

	if uniquePhones {
		// Get only unique phone numbers - get the first activity (minimum ID) for each phone
		subquery := ctrl.DB.Model(&models.WebinarActivity{}).
			Select("MIN(id) as id").
			Where("view_start_time IS NOT NULL").
			Group("phone")

		if !startDate.IsZero() {
			subquery = subquery.Where("view_start_time >= ? AND view_start_time <= ?", startDate, endDate)
		}

		var uniqueIDs []uint
		subquery.Pluck("id", &uniqueIDs)

		if len(uniqueIDs) > 0 {
			query = query.Where("id IN ?", uniqueIDs)
		} else {
			// No unique activities found
			query = query.Where("1 = 0")
		}
	}

	query.Order("view_start_time DESC").Find(&activities)

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=webinar_viewers.csv")

	// Write BOM for UTF-8 Excel compatibility
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	header := []string{
		"نام",
		"نام خانوادگی",
		"شماره تماس",
		"تاریخ ثبت\u200cنام",
		"تاریخ شروع تماشا",
		"تاریخ پایان تماشا",
		"مدت زمان تماشا (دقیقه)",
	}
	writer.Write(header)

	// Write data (only for users who registered)
	for _, activity := range activities {
		// Find user by phone (only export if user registered)
		var user models.User
		if err := ctrl.DB.Where("phone = ?", activity.Phone).First(&user).Error; err != nil {
			// Skip activities from non-registered users (shouldn't happen, but just in case)
			continue
		}

		// Format dates in Jalali (Persian) format
		row := []string{
			user.FirstName,
			user.LastName,
			activity.Phone,
			utils.FormatPersianDate(user.RegisteredAt) + " " + user.RegisteredAt.Format("15:04:05"),
		}

		if activity.ViewStartTime != nil {
			row = append(row, utils.FormatPersianDate(*activity.ViewStartTime)+" "+activity.ViewStartTime.Format("15:04:05"))
		} else {
			row = append(row, "")
		}

		if activity.ViewEndTime != nil {
			row = append(row, utils.FormatPersianDate(*activity.ViewEndTime)+" "+activity.ViewEndTime.Format("15:04:05"))
		} else {
			row = append(row, "")
		}

		row = append(row, strconv.Itoa(activity.TotalViewMinutes))

		writer.Write(row)
	}
}

// ExportNonViewersExcel exports users who registered but didn't watch to Excel (CSV format) with date filter
func (ctrl *AdminStatsController) ExportNonViewersExcel(c *gin.Context) {
	// Get filter parameter: "today", "yesterday", "week", "last_week", "month", "last_month", "all" (default: "all")
	filter := c.DefaultQuery("filter", "all")
	startDate, endDate := getDateRangeFromFilter(filter)

	// Get watch filter parameter: "all", "watched", "not_watched" (default: "all")
	watchFilter := c.DefaultQuery("watch_filter", "all")

	// Get unique phones filter parameter
	uniquePhones := c.DefaultQuery("unique_phones", "false") == "true"

	// If watchFilter is "watched", return empty file (no non-viewers to export)
	if watchFilter == "watched" {
		c.Header("Content-Type", "text/csv; charset=utf-8")
		c.Header("Content-Disposition", "attachment; filename=webinar_non_viewers.csv")
		c.Writer.Write([]byte{0xEF, 0xBB, 0xBF}) // BOM
		writer := csv.NewWriter(c.Writer)
		defer writer.Flush()
		writer.Write([]string{"نام", "نام خانوادگی", "شماره تماس", "تاریخ ثبت\u200cنام"})
		return
	}

	var users []models.User

	// Find users who didn't watch
	query := ctrl.DB.Where("phone NOT IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL)")
	if !startDate.IsZero() {
		query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
	}

	if uniquePhones {
		// Get only unique phone numbers - get the first user (minimum ID) for each phone
		subquery := ctrl.DB.Model(&models.User{}).
			Select("MIN(id) as id").
			Where("phone NOT IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL)").
			Group("phone")

		if !startDate.IsZero() {
			subquery = subquery.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
		}

		var uniqueIDs []uint
		subquery.Pluck("id", &uniqueIDs)

		if len(uniqueIDs) > 0 {
			query = query.Where("id IN ?", uniqueIDs)
		} else {
			// No unique users found
			query = query.Where("1 = 0")
		}
	}

	query.Order("registered_at DESC").Find(&users)

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=webinar_non_viewers.csv")

	// Write BOM for UTF-8 Excel compatibility
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	header := []string{
		"نام",
		"نام خانوادگی",
		"شماره تماس",
		"تاریخ ثبت\u200cنام",
	}
	writer.Write(header)

	// Write data
	for _, user := range users {
		// Format date in Jalali (Persian) format
		row := []string{
			user.FirstName,
			user.LastName,
			user.Phone,
			utils.FormatPersianDate(user.RegisteredAt) + " " + user.RegisteredAt.Format("15:04:05"),
		}
		writer.Write(row)
	}
}

// ExportAllUsersExcel exports all users with their activity to Excel (CSV format) with date filter
func (ctrl *AdminStatsController) ExportAllUsersExcel(c *gin.Context) {
	// Get filter parameter: "today", "yesterday", "week", "last_week", "month", "last_month", "all" (default: "all")
	filter := c.DefaultQuery("filter", "all")

	// Get unique phones filter parameter
	uniquePhones := c.DefaultQuery("unique_phones", "false") == "true"

	// Check for custom date/time range (advanced filter)
	customStartDate := c.Query("start_date")
	customStartTime := c.Query("start_time")
	customEndDate := c.Query("end_date")
	customEndTime := c.Query("end_time")

	var startDate, endDate time.Time

	// If custom date/time is provided, use it; otherwise use filter
	if customStartDate != "" && customEndDate != "" {
		// Parse custom date/time range
		loc, _ := time.LoadLocation("Asia/Tehran")
		startTimeStr := customStartTime
		if startTimeStr == "" {
			startTimeStr = "00:00"
		}
		endTimeStr := customEndTime
		if endTimeStr == "" {
			endTimeStr = "23:59"
		}

		// Parse start date/time
		startDateTimeStr := fmt.Sprintf("%s %s", customStartDate, startTimeStr)
		parsedStart, err := time.ParseInLocation("2006-01-02 15:04", startDateTimeStr, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date or start_time format"})
			return
		}
		startDate = parsedStart

		// Parse end date/time
		endDateTimeStr := fmt.Sprintf("%s %s", customEndDate, endTimeStr)
		parsedEnd, err := time.ParseInLocation("2006-01-02 15:04", endDateTimeStr, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date or end_time format"})
			return
		}
		endDate = parsedEnd
	} else {
		// Use filter-based date range
		startDate, endDate = getDateRangeFromFilter(filter)
	}

	// Get watch filter parameter: "all", "watched", "not_watched" (default: "all")
	watchFilter := c.DefaultQuery("watch_filter", "all")

	// Build query with date filter
	query := ctrl.DB.Model(&models.User{})
	if !startDate.IsZero() {
		query = query.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
	}

	// Apply watch filter
	if watchFilter == "watched" {
		// Only users who watched
		query = query.Where("phone IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL)")
	} else if watchFilter == "not_watched" {
		// Only users who didn't watch
		query = query.Where("phone NOT IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL)")
	}
	// If watchFilter == "all", no additional filter needed

	// Apply unique phones filter if specified
	if uniquePhones {
		// Get only unique phone numbers - get the first user (minimum ID) for each phone
		subquery := ctrl.DB.Model(&models.User{}).
			Select("MIN(id) as id")

		if !startDate.IsZero() {
			subquery = subquery.Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)
		}

		// Apply watch filter to subquery
		if watchFilter == "watched" {
			subquery = subquery.Where("phone IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL)")
		} else if watchFilter == "not_watched" {
			subquery = subquery.Where("phone NOT IN (SELECT DISTINCT phone FROM webinar_activities WHERE view_start_time IS NOT NULL)")
		}

		subquery = subquery.Group("phone")

		var uniqueIDs []uint
		subquery.Pluck("id", &uniqueIDs)

		if len(uniqueIDs) > 0 {
			query = query.Where("id IN ?", uniqueIDs)
		} else {
			// No unique users found
			query = query.Where("1 = 0")
		}
	}

	// Get all users (no pagination for export)
	var users []models.User
	query.Order("registered_at DESC").Find(&users)

	c.Header("Content-Type", "text/csv; charset=utf-8")

	// Generate filename based on filter or custom date range
	var filterLabel string
	if customStartDate != "" && customEndDate != "" {
		// Use custom date range for filename
		filterLabel = fmt.Sprintf("%s_%s_to_%s_%s", customStartDate, customStartTime, customEndDate, customEndTime)
		filterLabel = strings.ReplaceAll(filterLabel, ":", "-")
		filterLabel = strings.ReplaceAll(filterLabel, " ", "_")
	} else {
		// Use filter-based label
		switch filter {
		case "today":
			filterLabel = "today"
		case "yesterday":
			filterLabel = "yesterday"
		case "week":
			filterLabel = "this_week"
		case "last_week":
			filterLabel = "last_week"
		case "month":
			filterLabel = "this_month"
		case "last_month":
			filterLabel = "last_month"
		default:
			filterLabel = "all"
		}
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=users_%s.csv", filterLabel))

	// Write BOM for UTF-8 Excel compatibility
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write header
	header := []string{
		"نام",
		"نام خانوادگی",
		"شماره تماس",
		"تاریخ ثبت\u200cنام",
		"زمان کلیک روی لینک",
		"زمان شروع تماشا",
		"زمان پایان تماشا",
		"مدت زمان تماشا (دقیقه)",
		"تماشا کرده",
	}
	writer.Write(header)

	// Write data
	now := time.Now()
	for _, user := range users {
		var activity models.WebinarActivity
		ctrl.DB.Where("phone = ?", user.Phone).
			Order("created_at DESC").
			First(&activity)

		// Calculate accurate view minutes
		totalViewMinutes := 0
		if activity.ViewStartTime != nil {
			var endTime time.Time
			if activity.ViewEndTime != nil {
				endTime = *activity.ViewEndTime
			} else {
				endTime = now
			}
			elapsedSeconds := endTime.Sub(*activity.ViewStartTime).Seconds()
			elapsedMinutes := int(elapsedSeconds / 60)
			if elapsedMinutes > activity.TotalViewMinutes {
				totalViewMinutes = elapsedMinutes
			} else {
				totalViewMinutes = activity.TotalViewMinutes
			}
		}

		// Format dates in Jalali (Persian) format
		row := []string{
			user.FirstName,
			user.LastName,
			user.Phone,
			utils.FormatPersianDate(user.RegisteredAt) + " " + user.RegisteredAt.Format("15:04:05"),
		}

		if activity.ID != 0 && !activity.ClickedAt.IsZero() {
			row = append(row, utils.FormatPersianDate(activity.ClickedAt)+" "+activity.ClickedAt.Format("15:04:05"))
		} else {
			row = append(row, "")
		}

		if activity.ViewStartTime != nil {
			row = append(row, utils.FormatPersianDate(*activity.ViewStartTime)+" "+activity.ViewStartTime.Format("15:04:05"))
		} else {
			row = append(row, "")
		}

		if activity.ViewEndTime != nil {
			row = append(row, utils.FormatPersianDate(*activity.ViewEndTime)+" "+activity.ViewEndTime.Format("15:04:05"))
		} else {
			row = append(row, "")
		}

		row = append(row, strconv.Itoa(totalViewMinutes))

		if activity.ViewStartTime != nil {
			row = append(row, "بله")
		} else {
			row = append(row, "خیر")
		}

		writer.Write(row)
	}
}

// GetOnlineViewersCount returns the count of UNIQUE users (by phone) currently watching the webinar
// Each phone number represents a unique user (even if they registered multiple times)
// A user is considered online if:
// - They have view_start_time
// - Either view_end_time is NULL (still watching) OR last_updated is within the last 15 seconds
func (ctrl *AdminStatsController) GetOnlineViewersCount(c *gin.Context) {
	now := time.Now()
	// CRITICAL: Reduced threshold to 15 seconds for real-time tracking
	// If heartbeat stops (page goes to background), user will be marked offline within 15 seconds
	onlineThreshold := now.Add(-15 * time.Second)

	var onlineCount int64

	// OPTIMIZED: Use more efficient query with proper index usage
	// Count UNIQUE phone numbers (users) that are currently watching:
	// 1. Started watching (have view_start_time)
	// 2. Haven't ended watching (view_end_time is NULL)
	// 3. Last update was recent (within 15 seconds) - user is actively online
	// Use DISTINCT to count unique phone numbers, not all records
	// OPTIMIZED: Use Select with COUNT for better performance
	ctrl.DB.Model(&models.WebinarActivity{}).
		Select("COUNT(DISTINCT phone)").
		Where("view_start_time IS NOT NULL").
		Where("view_end_time IS NULL").             // User hasn't ended watching
		Where("last_updated > ?", onlineThreshold). // Last activity within threshold (15 seconds)
		Scan(&onlineCount)

	// Set cache headers to prevent caching (real-time data)
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	c.JSON(http.StatusOK, gin.H{
		"online_viewers": onlineCount,
		"timestamp":      now.Unix(),
	})
}

// GetOnlineViewersList returns detailed list of UNIQUE online viewers (by phone) with their information
// Returns: name, phone, watch duration, and other details
// Each phone number appears only once, even if user registered multiple times
func (ctrl *AdminStatsController) GetOnlineViewersList(c *gin.Context) {
	now := time.Now()
	onlineThreshold := now.Add(-15 * time.Second)

	type OnlineViewer struct {
		Phone              string    `json:"phone"`
		FirstName          string    `json:"first_name"`
		LastName           string    `json:"last_name"`
		ViewStartTime      time.Time `json:"view_start_time"`
		WatchDuration      int       `json:"watch_duration_minutes"` // Total minutes since start
		ActiveWatchMinutes int       `json:"active_watch_minutes"`   // Active watch minutes
		LastUpdated        time.Time `json:"last_updated"`
		UserID             *uint     `json:"user_id,omitempty"`
	}

	var onlineViewers []OnlineViewer

	// Get UNIQUE online users (by phone) with their information
	// Use GROUP BY phone to get only one record per phone number
	// For each phone, get the earliest view_start_time and sum all watch minutes
	type RawViewer struct {
		Phone              string    `gorm:"column:phone"`
		FirstName          string    `gorm:"column:first_name"`
		LastName           string    `gorm:"column:last_name"`
		ViewStartTime      time.Time `gorm:"column:view_start_time"`
		TotalViewMinutes   int       `gorm:"column:total_view_minutes"`
		ActiveWatchMinutes int       `gorm:"column:active_watch_minutes"`
		LastUpdated        time.Time `gorm:"column:last_updated"`
		UserID             *uint     `gorm:"column:user_id"`
	}

	var rawViewers []RawViewer

	ctrl.DB.Table("webinar_activities").
		Select(`
			webinar_activities.phone,
			COALESCE(MAX(users.first_name), '') as first_name,
			COALESCE(MAX(users.last_name), '') as last_name,
			MIN(webinar_activities.view_start_time) as view_start_time,
			SUM(COALESCE(webinar_activities.total_view_minutes, 0)) as total_view_minutes,
			SUM(COALESCE(webinar_activities.active_watch_minutes, 0)) as active_watch_minutes,
			MAX(webinar_activities.last_updated) as last_updated,
			MAX(webinar_activities.user_id) as user_id
		`).
		Joins("LEFT JOIN users ON webinar_activities.phone = users.phone").
		Where("webinar_activities.view_start_time IS NOT NULL").
		Where("webinar_activities.view_end_time IS NULL").
		Where("webinar_activities.last_updated > ?", onlineThreshold).
		Group("webinar_activities.phone").
		Order("MIN(webinar_activities.view_start_time) ASC").
		Scan(&rawViewers)

	// Convert to OnlineViewer and calculate watch duration
	onlineViewers = make([]OnlineViewer, 0, len(rawViewers))
	for _, raw := range rawViewers {
		viewer := OnlineViewer{
			Phone:              raw.Phone,
			FirstName:          raw.FirstName,
			LastName:           raw.LastName,
			ViewStartTime:      raw.ViewStartTime,
			ActiveWatchMinutes: raw.ActiveWatchMinutes,
			LastUpdated:        raw.LastUpdated,
			UserID:             raw.UserID,
		}

		// Calculate watch duration from earliest view_start_time to now
		if !viewer.ViewStartTime.IsZero() {
			duration := now.Sub(viewer.ViewStartTime)
			viewer.WatchDuration = int(duration.Minutes())
		} else {
			// Fallback to total_view_minutes if view_start_time is not available
			viewer.WatchDuration = raw.TotalViewMinutes
		}

		onlineViewers = append(onlineViewers, viewer)
	}

	// Set cache headers to prevent caching (real-time data)
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	c.JSON(http.StatusOK, gin.H{
		"online_viewers": onlineViewers,
		"count":          len(onlineViewers),
		"timestamp":      now.Unix(),
	})
}

// GetUsersByRegistrationRange returns users who registered within a specific date and time range
// Used for previewing which users will receive SMS messages
func (ctrl *AdminStatsController) GetUsersByRegistrationRange(c *gin.Context) {
	// Get parameters
	registrationTimeRange := c.DefaultQuery("registration_time_range", "all")
	registrationStartHourStr := c.Query("registration_start_hour")
	registrationEndHourStr := c.Query("registration_end_hour")

	// Get timezone
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}

	now := time.Now().In(loc)

	// Calculate date range from registration_time_range
	var startDate, endDate time.Time
	switch registrationTimeRange {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
		endDate = time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, loc)
	case "yesterday":
		yesterday := now.AddDate(0, 0, -1)
		startDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, loc)
		endDate = time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 23, 59, 59, 999999999, loc)
	case "week":
		// This week: from start of week (Saturday) to end of week (Friday)
		startDate = now
		for startDate.Weekday() != time.Saturday {
			startDate = startDate.AddDate(0, 0, -1)
		}
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
		endDate = startDate.AddDate(0, 0, 6)
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)
	case "last_week":
		// Last week: from Saturday of last week to Friday of last week
		lastWeek := now.AddDate(0, 0, -7)
		startDate = lastWeek
		for startDate.Weekday() != time.Saturday {
			startDate = startDate.AddDate(0, 0, -1)
		}
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
		endDate = startDate.AddDate(0, 0, 6)
		endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, loc)
	case "month":
		// This month: from start of current month to now
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		endDate = now
	case "last_month":
		// Last month: from start to end of last month
		firstOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		lastMonthEnd := firstOfThisMonth.AddDate(0, 0, -1)
		startDate = time.Date(lastMonthEnd.Year(), lastMonthEnd.Month(), 1, 0, 0, 0, 0, loc)
		endDate = time.Date(lastMonthEnd.Year(), lastMonthEnd.Month(), lastMonthEnd.Day(), 23, 59, 59, 999999999, loc)
	default: // "all"
		// No date filter - but limit to last 90 days for performance
		startDate = now.AddDate(0, 0, -90)
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
		endDate = now
	}

	// Build query
	query := ctrl.DB.Model(&models.User{}).Where("registered_at >= ? AND registered_at <= ?", startDate, endDate)

	// Apply hour range filter if specified
	if registrationStartHourStr != "" && registrationEndHourStr != "" {
		startHour, err1 := strconv.Atoi(registrationStartHourStr)
		endHour, err2 := strconv.Atoi(registrationEndHourStr)
		if err1 == nil && err2 == nil {
			if startHour <= endHour {
				// Same day range
				query = query.Where("HOUR(registered_at) >= ? AND HOUR(registered_at) <= ?", startHour, endHour)
			} else {
				// Crosses midnight
				query = query.Where("HOUR(registered_at) >= ? OR HOUR(registered_at) <= ?", startHour, endHour)
			}
		}
	}

	// Get users (limit to 1000 for performance)
	var users []models.User
	if err := query.Order("registered_at DESC").Limit(1000).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	// Format response
	type UserInfo struct {
		ID           uint      `json:"id"`
		FirstName    string    `json:"first_name"`
		LastName     string    `json:"last_name"`
		Phone        string    `json:"phone"`
		RegisteredAt time.Time `json:"registered_at"`
	}

	userInfos := make([]UserInfo, len(users))
	for i, user := range users {
		userInfos[i] = UserInfo{
			ID:           user.ID,
			FirstName:    user.FirstName,
			LastName:     user.LastName,
			Phone:        user.Phone,
			RegisteredAt: user.RegisteredAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users":       userInfos,
		"total_count": len(userInfos),
		"date_range": gin.H{
			"start": startDate.Format("2006-01-02 15:04:05"),
			"end":   endDate.Format("2006-01-02 15:04:05"),
		},
	})
}

// GetUsersByPhoneNumbers returns user information for a list of phone numbers
// This is used for matching phone numbers with user names in SMS bulk send
func (ctrl *AdminStatsController) GetUsersByPhoneNumbers(c *gin.Context) {
	var request struct {
		PhoneNumbers []string `json:"phone_numbers" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body. phone_numbers array is required."})
		return
	}

	if len(request.PhoneNumbers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone_numbers array cannot be empty"})
		return
	}

	// Normalize all phone numbers using the same logic as backend
	normalizedPhones := make([]string, 0, len(request.PhoneNumbers))

	for _, phone := range request.PhoneNumbers {
		normalized := utils.NormalizePhoneNumber(phone)
		if normalized != "" {
			normalizedPhones = append(normalizedPhones, normalized)
		}
	}

	if len(normalizedPhones) == 0 {
		c.JSON(http.StatusOK, gin.H{"users": []interface{}{}})
		return
	}

	// Query users from database using normalized phone numbers
	var users []models.User
	if err := ctrl.DB.Where("phone IN ?", normalizedPhones).Find(&users).Error; err != nil {
		log.Printf("Error querying users by phone numbers: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query users"})
		return
	}

	// Create a map of normalized phone -> user for quick lookup
	userMap := make(map[string]models.User)
	for _, user := range users {
		userMap[user.Phone] = user
	}

	// Build response: match each normalized phone with user info
	type UserInfo struct {
		Phone     string `json:"phone"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Name      string `json:"name"` // Full name for convenience
	}

	result := make([]UserInfo, 0, len(normalizedPhones))
	for _, normalizedPhone := range normalizedPhones {
		if user, exists := userMap[normalizedPhone]; exists {
			fullName := strings.TrimSpace(user.FirstName + " " + user.LastName)
			result = append(result, UserInfo{
				Phone:     normalizedPhone,
				FirstName: user.FirstName,
				LastName:  user.LastName,
				Name:      fullName,
			})
		} else {
			// User not found, but still include in response
			result = append(result, UserInfo{
				Phone:     normalizedPhone,
				FirstName: "",
				LastName:  "",
				Name:      "",
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users":            result,
		"total_requested":  len(request.PhoneNumbers),
		"total_normalized": len(normalizedPhones),
		"total_found":      len(users),
	})
}

// DeleteUser deletes a user by phone number
func (ctrl *AdminStatsController) DeleteUser(c *gin.Context) {
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
		return
	}

	// Find user by phone
	var user models.User
	if err := ctrl.DB.Where("phone = ?", phone).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user: " + err.Error()})
		return
	}

	// Delete related records first (to maintain referential integrity)
	// Note: We use transaction to ensure all deletions succeed or none
	// IMPORTANT: Order matters - delete records with foreign keys pointing to user first

	tx := ctrl.DB.Begin()

	// Temporarily disable foreign key checks to allow deletion of related records
	// This is safe within a transaction - checks will be re-enabled after commit/rollback
	if err := tx.Exec("SET FOREIGN_KEY_CHECKS = 0").Error; err != nil {
		tx.Rollback()
		log.Printf("❌ Failed to disable foreign key checks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disable foreign key checks: " + err.Error()})
		return
	}
	defer func() {
		// Re-enable foreign key checks (in case of early return)
		tx.Exec("SET FOREIGN_KEY_CHECKS = 1")
	}()

	// Step 1: Delete payment transactions FIRST (they have foreign key to users)
	// This must be done before deleting the user due to foreign key constraints
	result := tx.Exec("DELETE FROM payment_transactions WHERE phone = ? OR user_id = ?", phone, user.ID)
	if result.Error != nil {
		tx.Exec("SET FOREIGN_KEY_CHECKS = 1")
		tx.Rollback()
		log.Printf("❌ Failed to delete payment transactions for user %s (ID: %d): %v", phone, user.ID, result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete payment transactions: " + result.Error.Error()})
		return
	}
	log.Printf("✅ Deleted %d payment transactions for user %s (ID: %d)", result.RowsAffected, phone, user.ID)

	// Step 2: Delete or nullify licenses (set user_id to null instead of deleting)
	if err := tx.Model(&models.License{}).Where("user_id = ?", user.ID).Update("user_id", nil).Error; err != nil {
		tx.Exec("SET FOREIGN_KEY_CHECKS = 1")
		tx.Rollback()
		log.Printf("❌ Failed to update licenses for user %s (ID: %d): %v", phone, user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update licenses: " + err.Error()})
		return
	}
	log.Printf("✅ Updated licenses for user %s (ID: %d) - set user_id to null", phone, user.ID)

	// Step 3: Delete webinar activities (by phone and user_id)
	if err := tx.Where("phone = ? OR user_id = ?", phone, user.ID).Delete(&models.WebinarActivity{}).Error; err != nil {
		tx.Exec("SET FOREIGN_KEY_CHECKS = 1")
		tx.Rollback()
		log.Printf("❌ Failed to delete webinar activities for user %s (ID: %d): %v", phone, user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user activities: " + err.Error()})
		return
	}
	log.Printf("✅ Deleted webinar activities for user %s (ID: %d)", phone, user.ID)

	// Step 4: Delete landing activities (by phone)
	if err := tx.Where("phone = ?", phone).Delete(&models.LandingActivity{}).Error; err != nil {
		tx.Exec("SET FOREIGN_KEY_CHECKS = 1")
		tx.Rollback()
		log.Printf("❌ Failed to delete landing activities for user %s: %v", phone, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete landing activities: " + err.Error()})
		return
	}
	log.Printf("✅ Deleted landing activities for user %s", phone)

	// Step 5: Delete chat messages (by user_id - ChatMessage doesn't have phone field)
	if err := tx.Where("user_id = ?", user.ID).Delete(&models.ChatMessage{}).Error; err != nil {
		log.Printf("⚠️  Warning: Failed to delete chat messages for user %s (ID: %d): %v", phone, user.ID, err)
		// Continue anyway - chat messages are not critical
	} else {
		log.Printf("✅ Deleted chat messages for user %s (ID: %d)", phone, user.ID)
	}

	// Finally, delete the user
	if err := tx.Delete(&user).Error; err != nil {
		tx.Exec("SET FOREIGN_KEY_CHECKS = 1")
		tx.Rollback()
		log.Printf("❌ Failed to delete user %s (ID: %d): %v", phone, user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user: " + err.Error()})
		return
	}

	// Re-enable foreign key checks before commit
	if err := tx.Exec("SET FOREIGN_KEY_CHECKS = 1").Error; err != nil {
		tx.Rollback()
		log.Printf("❌ Failed to re-enable foreign key checks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to re-enable foreign key checks: " + err.Error()})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("❌ Failed to commit transaction for user deletion %s (ID: %d): %v", phone, user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	log.Printf("✅ User deleted successfully: %s (ID: %d)", phone, user.ID)
	c.JSON(http.StatusOK, gin.H{
		"message": "User deleted successfully",
		"phone":   phone,
	})
}
