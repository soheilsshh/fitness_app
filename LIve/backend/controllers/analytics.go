package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AdminAnalyticsController provides admin analytics endpoints.
type AdminAnalyticsController struct {
	DB *gorm.DB
}

func NewAdminAnalyticsController(db *gorm.DB) *AdminAnalyticsController {
	return &AdminAnalyticsController{DB: db}
}

type thankYouFunnelRow struct {
	Phone             string     `json:"phone"`
	MaxStep           int        `json:"max_step"`
	Completed         int        `json:"completed"`
	TotalWatchSeconds int        `json:"total_watch_seconds"`
	FirstRegisteredAt *time.Time `json:"first_registered_at"`
	Opened            int        `json:"opened"`
}

type behaviorFunnelRow struct {
	Phone              string     `json:"phone"`
	MaxStep            int        `json:"max_step"`
	ThankYouOpened     int        `json:"thankyou_opened"`
	ThankYouCompleted  int        `json:"thankyou_completed"`
	HasWebinarClick    int        `json:"has_webinar_click"`
	FirstViewStartTime *time.Time `json:"first_view_start_time"`
	TotalViewMinutes   int        `json:"total_view_minutes"`
	ActiveWatchMinutes int        `json:"active_watch_minutes"`
	RegisteredAt       time.Time  `json:"registered_at"`
}

// GetThankYouFunnel returns aggregated funnel stats for /thank-you popup steps.
// It reads landing_activities rows with status:
// - thankyou_step_1 .. thankyou_step_7
// - thankyou_complete
//
// Query params:
// - start_ts: unix milliseconds (optional, default: now-7d)
// - end_ts: unix milliseconds (optional, default: now)
// - promoter_id: optional filter; if omitted, may auto-filter for non-full-admin users.
func (ctrl *AdminAnalyticsController) GetThankYouFunnel(c *gin.Context) {
	// Require at least users.view or dashboard.view
	if !(HasPermission(c, ctrl.DB, "users.view") || HasPermission(c, ctrl.DB, "dashboard.view")) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Parse time range
	now := time.Now()
	start := now.AddDate(0, 0, -7)
	end := now

	if startStr := c.Query("start_ts"); startStr != "" {
		if v, err := strconv.ParseInt(startStr, 10, 64); err == nil {
			start = time.UnixMilli(v)
		}
	}
	if endStr := c.Query("end_ts"); endStr != "" {
		if v, err := strconv.ParseInt(endStr, 10, 64); err == nil {
			end = time.UnixMilli(v)
		}
	}

	// Promoter filter (optional + auto-filter)
	promoterIDStr := c.Query("promoter_id")
	var promoterID *uint
	if promoterIDStr != "" {
		if id, err := strconv.ParseUint(promoterIDStr, 10, 32); err == nil {
			val := uint(id)
			promoterID = &val
		}
	} else {
		userID, hasUser := c.Get("user_id")
		if hasUser {
			currentUserID := userID.(uint)
			hasFullAdminPermission := HasPermission(c, ctrl.DB, "dashboard.view") ||
				HasPermission(c, ctrl.DB, "admin_users.view") ||
				HasPermission(c, ctrl.DB, "settings.edit")
			hasAffiliatePermission := HasPermission(c, ctrl.DB, "dashboard.affiliate.view")

			if (hasAffiliatePermission && !hasFullAdminPermission) || !hasFullAdminPermission {
				promoterID = &currentUserID
			}
		}
	}

	// Optional watch filter (based on users.total_watch_seconds)
	// Values: all | watched | not_watched
	watchFilter := c.DefaultQuery("watch_filter", "all")

	// MySQL step parsing:
	// 'thankyou_step_' length = 13, step begins at pos 14 (1-based)
	stepExpr := `
		CASE
			WHEN la.status = 'thankyou_complete' THEN 8
			WHEN la.status LIKE 'thankyou_step_%' THEN CAST(SUBSTRING(la.status, 14) AS UNSIGNED)
			ELSE 0
		END
	`

	base := ctrl.DB.Table("landing_activities AS la").
		Select(`
			la.phone AS phone,
			MAX(`+stepExpr+`) AS max_step,
			MAX(CASE WHEN la.status = 'thankyou_complete' THEN 1 ELSE 0 END) AS completed,
			MAX(CASE WHEN la.status = 'thankyou_open' THEN 1 ELSE 0 END) AS opened,
			MAX(COALESCE(u.total_watch_seconds, 0)) AS total_watch_seconds,
			MIN(u.registered_at) AS first_registered_at
		`).
		Joins("LEFT JOIN users u ON u.phone = la.phone").
		Where("(la.status LIKE 'thankyou_step_%' OR la.status = 'thankyou_complete' OR la.status = 'thankyou_open')").
		Where("la.created_at >= ? AND la.created_at <= ?", start, end)

	if promoterID != nil {
		base = base.Where("u.promoter_id = ?", *promoterID)
	}

	// Apply watch filter at group-level (HAVING)
	if watchFilter == "watched" {
		base = base.Having("MAX(COALESCE(u.total_watch_seconds, 0)) > 0")
	} else if watchFilter == "not_watched" {
		base = base.Having("MAX(COALESCE(u.total_watch_seconds, 0)) = 0")
	}

	var rows []thankYouFunnelRow
	if err := base.Group("la.phone").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch funnel stats", "details": err.Error()})
		return
	}

	total := len(rows)
	reached := map[string]int{
		"opened":   0,
		"step_1":   0,
		"step_2":   0,
		"step_3":   0,
		"step_4":   0,
		"step_5":   0,
		"step_6":   0,
		"step_7":   0,
		"complete": 0,
	}
	maxStepDist := map[string]int{}
	watchedCount := 0
	sumWatchSeconds := 0

	for _, r := range rows {
		if r.Opened == 1 {
			reached["opened"]++
		}
		// Distribution by max step (0..8)
		distKey := strconv.Itoa(r.MaxStep)
		maxStepDist[distKey] = maxStepDist[distKey] + 1

		if r.MaxStep >= 1 {
			reached["step_1"]++
		}
		if r.MaxStep >= 2 {
			reached["step_2"]++
		}
		if r.MaxStep >= 3 {
			reached["step_3"]++
		}
		if r.MaxStep >= 4 {
			reached["step_4"]++
		}
		if r.MaxStep >= 5 {
			reached["step_5"]++
		}
		if r.MaxStep >= 6 {
			reached["step_6"]++
		}
		if r.MaxStep >= 7 {
			reached["step_7"]++
		}
		if r.Completed == 1 || r.MaxStep >= 8 {
			reached["complete"]++
		}

		if r.TotalWatchSeconds > 0 {
			watchedCount++
			sumWatchSeconds += r.TotalWatchSeconds
		}
	}

	avgWatchMinutes := 0.0
	if watchedCount > 0 {
		avgWatchMinutes = float64(sumWatchSeconds) / 60.0 / float64(watchedCount)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"range": gin.H{
			"start": start.UnixMilli(),
			"end":   end.UnixMilli(),
		},
		"total_unique_users":    total,
		"reached":               reached,
		"max_step_distribution": maxStepDist,
		"watch": gin.H{
			"watched_count": watchedCount,
			"watched_rate": func() float64 {
				if total == 0 {
					return 0
				}
				return float64(watchedCount) / float64(total)
			}(),
			"avg_watch_minutes": avgWatchMinutes,
		},
	})
}

// GetBehaviorFunnel returns a full funnel from registration -> thankyou -> webinar click/watch.
//
// Query params:
// - cohort_start_ts / cohort_end_ts: (ms) selects users by registered_at (default: last 7d)
// - event_start_ts / event_end_ts: (ms) selects events on landing_activities/webinar_activities (default: same as cohort)
// - promoter_id: optional (same auto-filter logic as other endpoints)
func (ctrl *AdminAnalyticsController) GetBehaviorFunnel(c *gin.Context) {
	if !(HasPermission(c, ctrl.DB, "users.view") || HasPermission(c, ctrl.DB, "dashboard.view")) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	now := time.Now()
	cohortStart := now.AddDate(0, 0, -7)
	cohortEnd := now
	eventStart := cohortStart
	eventEnd := cohortEnd

	parseMs := func(q string) (*time.Time, bool) {
		if q == "" {
			return nil, false
		}
		v, err := strconv.ParseInt(q, 10, 64)
		if err != nil {
			return nil, false
		}
		t := time.UnixMilli(v)
		return &t, true
	}

	if t, ok := parseMs(c.Query("cohort_start_ts")); ok {
		cohortStart = *t
	}
	if t, ok := parseMs(c.Query("cohort_end_ts")); ok {
		cohortEnd = *t
	}
	if t, ok := parseMs(c.Query("event_start_ts")); ok {
		eventStart = *t
	}
	if t, ok := parseMs(c.Query("event_end_ts")); ok {
		eventEnd = *t
	}

	// Backward compatibility: if user only passes start_ts/end_ts, treat as both cohort and event
	if t, ok := parseMs(c.Query("start_ts")); ok {
		cohortStart = *t
		eventStart = *t
	}
	if t, ok := parseMs(c.Query("end_ts")); ok {
		cohortEnd = *t
		eventEnd = *t
	}

	// Promoter filter (optional + auto-filter)
	promoterIDStr := c.Query("promoter_id")
	var promoterID *uint
	if promoterIDStr != "" {
		if id, err := strconv.ParseUint(promoterIDStr, 10, 32); err == nil {
			val := uint(id)
			promoterID = &val
		}
	} else {
		userID, hasUser := c.Get("user_id")
		if hasUser {
			currentUserID := userID.(uint)
			hasFullAdminPermission := HasPermission(c, ctrl.DB, "dashboard.view") ||
				HasPermission(c, ctrl.DB, "admin_users.view") ||
				HasPermission(c, ctrl.DB, "settings.edit")
			hasAffiliatePermission := HasPermission(c, ctrl.DB, "dashboard.affiliate.view")

			if (hasAffiliatePermission && !hasFullAdminPermission) || !hasFullAdminPermission {
				promoterID = &currentUserID
			}
		}
	}

	stepExpr := `
		CASE
			WHEN la.status = 'thankyou_complete' THEN 8
			WHEN la.status LIKE 'thankyou_step_%' THEN CAST(SUBSTRING(la.status, 14) AS UNSIGNED)
			ELSE 0
		END
	`

	// landing_activities aggregation
	landingAgg := ctrl.DB.Table("landing_activities AS la").
		Select(`
			la.phone AS phone,
			MAX(`+stepExpr+`) AS max_step,
			MAX(CASE WHEN la.status = 'thankyou_open' THEN 1 ELSE 0 END) AS thankyou_opened,
			MAX(CASE WHEN la.status = 'thankyou_complete' THEN 1 ELSE 0 END) AS thankyou_completed
		`).
		Where("(la.status LIKE 'thankyou_step_%' OR la.status = 'thankyou_complete' OR la.status = 'thankyou_open')").
		Where("la.created_at >= ? AND la.created_at <= ?", eventStart, eventEnd).
		Group("la.phone")

	// webinar_activities aggregation
	webinarAgg := ctrl.DB.Table("webinar_activities AS wa").
		Select(`
			wa.phone AS phone,
			MAX(CASE WHEN wa.activity_type = 'click' THEN 1 ELSE 0 END) AS has_webinar_click,
			MIN(wa.view_start_time) AS first_view_start_time,
			SUM(COALESCE(wa.total_view_minutes, 0)) AS total_view_minutes,
			SUM(COALESCE(wa.active_watch_minutes, 0)) AS active_watch_minutes
		`).
		Where(`
			(wa.activity_type = 'click' AND wa.clicked_at >= ? AND wa.clicked_at <= ?)
			OR (wa.view_start_time IS NOT NULL AND wa.view_start_time >= ? AND wa.view_start_time <= ?)
			OR (wa.last_updated >= ? AND wa.last_updated <= ?)
		`, eventStart, eventEnd, eventStart, eventEnd, eventStart, eventEnd).
		Group("wa.phone")

	base := ctrl.DB.Table("users AS u").
		Select(`
			u.phone AS phone,
			u.registered_at AS registered_at,
			COALESCE(la.max_step, 0) AS max_step,
			COALESCE(la.thankyou_opened, 0) AS thankyou_opened,
			COALESCE(la.thankyou_completed, 0) AS thankyou_completed,
			COALESCE(wa.has_webinar_click, 0) AS has_webinar_click,
			wa.first_view_start_time AS first_view_start_time,
			COALESCE(wa.total_view_minutes, 0) AS total_view_minutes,
			COALESCE(wa.active_watch_minutes, 0) AS active_watch_minutes
		`).
		Joins("LEFT JOIN (?) AS la ON la.phone = u.phone", landingAgg).
		Joins("LEFT JOIN (?) AS wa ON wa.phone = u.phone", webinarAgg).
		Where("u.registered_at >= ? AND u.registered_at <= ?", cohortStart, cohortEnd)

	if promoterID != nil {
		base = base.Where("u.promoter_id = ?", *promoterID)
	}

	var rows []behaviorFunnelRow
	if err := base.Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch behavior funnel", "details": err.Error()})
		return
	}

	total := len(rows)
	count := func(pred func(r behaviorFunnelRow) bool) int {
		n := 0
		for _, r := range rows {
			if pred(r) {
				n++
			}
		}
		return n
	}

	reached := map[string]int{
		"registered":        total,
		"webinar_click":     0,
		"thankyou_opened":   0,
		"thankyou_step_1":   0,
		"thankyou_step_2":   0,
		"thankyou_step_3":   0,
		"thankyou_step_4":   0,
		"thankyou_step_5":   0,
		"thankyou_step_6":   0,
		"thankyou_step_7":   0,
		"thankyou_complete": 0,
		"watched_any":       0,
		"watched_5m":        0,
		"watched_20m":       0,
	}

	reached["webinar_click"] = count(func(r behaviorFunnelRow) bool { return r.HasWebinarClick == 1 })
	reached["thankyou_opened"] = count(func(r behaviorFunnelRow) bool { return r.ThankYouOpened == 1 })
	reached["thankyou_step_1"] = count(func(r behaviorFunnelRow) bool { return r.MaxStep >= 1 })
	reached["thankyou_step_2"] = count(func(r behaviorFunnelRow) bool { return r.MaxStep >= 2 })
	reached["thankyou_step_3"] = count(func(r behaviorFunnelRow) bool { return r.MaxStep >= 3 })
	reached["thankyou_step_4"] = count(func(r behaviorFunnelRow) bool { return r.MaxStep >= 4 })
	reached["thankyou_step_5"] = count(func(r behaviorFunnelRow) bool { return r.MaxStep >= 5 })
	reached["thankyou_step_6"] = count(func(r behaviorFunnelRow) bool { return r.MaxStep >= 6 })
	reached["thankyou_step_7"] = count(func(r behaviorFunnelRow) bool { return r.MaxStep >= 7 })
	reached["thankyou_complete"] = count(func(r behaviorFunnelRow) bool { return r.ThankYouCompleted == 1 || r.MaxStep >= 8 })
	reached["watched_any"] = count(func(r behaviorFunnelRow) bool {
		return r.FirstViewStartTime != nil || r.TotalViewMinutes > 0 || r.ActiveWatchMinutes > 0
	})
	reached["watched_5m"] = count(func(r behaviorFunnelRow) bool { return r.ActiveWatchMinutes >= 5 })
	reached["watched_20m"] = count(func(r behaviorFunnelRow) bool { return r.ActiveWatchMinutes >= 20 })

	avgActiveWatch := 0.0
	watchedAny := reached["watched_any"]
	if watchedAny > 0 {
		sum := 0
		for _, r := range rows {
			if r.FirstViewStartTime != nil || r.TotalViewMinutes > 0 || r.ActiveWatchMinutes > 0 {
				sum += r.ActiveWatchMinutes
			}
		}
		avgActiveWatch = float64(sum) / float64(watchedAny)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"cohort_range": gin.H{
			"start": cohortStart.UnixMilli(),
			"end":   cohortEnd.UnixMilli(),
		},
		"event_range": gin.H{
			"start": eventStart.UnixMilli(),
			"end":   eventEnd.UnixMilli(),
		},
		"reached": reached,
		"watch": gin.H{
			"watched_any":        watchedAny,
			"avg_active_minutes": avgActiveWatch,
		},
	})
}
