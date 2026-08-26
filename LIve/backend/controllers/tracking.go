package controllers

import (
	"fitino-live-backend/models"
	"fitino-live-backend/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TrackingController struct {
	DB *gorm.DB
}

func NewTrackingController(db *gorm.DB) *TrackingController {
	return &TrackingController{DB: db}
}

type TrackClickRequest struct {
	Phone string `json:"phone" binding:"required"`
}

type TrackViewRequest struct {
	Phone         string     `json:"phone" binding:"required"`
	ViewStartTime *time.Time `json:"view_start_time,omitempty"`
	ViewEndTime   *time.Time `json:"view_end_time,omitempty"`
	ViewMinutes   int        `json:"view_minutes,omitempty"`
}

// TrackClick records when a user clicks on webinar link
func (ctrl *TrackingController) TrackClick(c *gin.Context) {
	var req TrackClickRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Normalize phone number: convert Persian digits to English
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Check if activity already exists for this phone
	var activity models.WebinarActivity
	result := ctrl.DB.Where("phone = ?", normalizedPhone).First(&activity)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new activity (with normalized phone)
		activity = models.WebinarActivity{
			Phone:        normalizedPhone, // Store normalized phone
			ActivityType: "click",
			ClickedAt:    time.Now(),
			CreatedAt:    time.Now(),
			LastUpdated:  time.Now(),
		}
		ctrl.DB.Create(&activity)
	} else {
		// Update existing activity with click time
		activity.ClickedAt = time.Now()
		activity.ActivityType = "click"
		activity.LastUpdated = time.Now()
		// Update phone to normalized version if it changed
		if activity.Phone != normalizedPhone {
			activity.Phone = normalizedPhone
		}
		ctrl.DB.Save(&activity)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Click tracked", "activity": activity})
}

// TrackView records viewing activity
func (ctrl *TrackingController) TrackView(c *gin.Context) {
	var req TrackViewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Normalize phone number: convert Persian digits to English
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Find or create activity for this phone
	var activity models.WebinarActivity
	result := ctrl.DB.Where("phone = ?", normalizedPhone).First(&activity)

	now := time.Now()

	if result.Error == gorm.ErrRecordNotFound {
		// Create new activity (with normalized phone)
		activity = models.WebinarActivity{
			Phone:        normalizedPhone, // Store normalized phone
			ActivityType: "view_update",
			CreatedAt:    now,
			LastUpdated:  now,
		}
	} else {
		activity.ActivityType = "view_update"
		activity.LastUpdated = now
		// Update phone to normalized version if it changed
		if activity.Phone != normalizedPhone {
			activity.Phone = normalizedPhone
		}
	}

	// Update view times
	if req.ViewStartTime != nil {
		activity.ViewStartTime = req.ViewStartTime
	}
	if req.ViewEndTime != nil {
		activity.ViewEndTime = req.ViewEndTime
	}
	if req.ViewMinutes > 0 {
		activity.TotalViewMinutes = req.ViewMinutes
	}

	ctrl.DB.Save(&activity)

	c.JSON(http.StatusOK, gin.H{"message": "View tracked", "activity": activity})
}

// UpdateViewTime updates viewing time periodically
// IMPORTANT: Each call creates or updates a record for THIS specific device/session
// If the last update was more than 5 minutes ago, create a new record (new device/session)
func (ctrl *TrackingController) UpdateViewTime(c *gin.Context) {
	var req struct {
		Phone              string `json:"phone" binding:"required"`
		ViewMinutes        int    `json:"view_minutes" binding:"required"`
		ActiveWatchMinutes int    `json:"active_watch_minutes"` // Active watch minutes (only when page is visible)
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Normalize phone number: convert Persian digits to English
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	now := time.Now()
	// If last update was more than 5 minutes ago, consider it a new device/session
	sessionThreshold := now.Add(-5 * time.Minute)

	// Find the most recent activity for this phone that was updated recently (same session)
	var activity models.WebinarActivity
	err := ctrl.DB.Where("phone = ? AND last_updated > ?", normalizedPhone, sessionThreshold).
		Order("last_updated DESC").
		First(&activity).Error

	if err != nil {
		// No recent activity found - create new record (new device/session)
		activity = models.WebinarActivity{
			Phone:             normalizedPhone,
			ActivityType:      "view_update",
			ViewStartTime:     &now,
			TotalViewMinutes:  req.ViewMinutes,
			ActiveWatchMinutes: req.ActiveWatchMinutes,
			CreatedAt:         now,
			LastUpdated:       now,
		}
		ctrl.DB.Create(&activity)
	} else {
		// Update existing session - ensure we have view start time
		if activity.ViewStartTime == nil {
			activity.ViewStartTime = &now
		}

		// CRITICAL: Calculate actual view minutes from view_start_time to now
		// This ensures accurate tracking even if user refreshes or reconnects
		if activity.ViewStartTime != nil {
			elapsedSeconds := now.Sub(*activity.ViewStartTime).Seconds()
			elapsedMinutes := int(elapsedSeconds / 60)

			// Use the maximum of: calculated elapsed time OR provided minutes
			// This ensures we don't lose track if user was watching but didn't send updates
			if elapsedMinutes > activity.TotalViewMinutes {
				activity.TotalViewMinutes = elapsedMinutes
			}
			// If provided minutes is higher (shouldn't happen, but safety check), use it
			if req.ViewMinutes > activity.TotalViewMinutes {
				activity.TotalViewMinutes = req.ViewMinutes
			}
		} else {
			// Fallback: use provided minutes if no start time
			if req.ViewMinutes > activity.TotalViewMinutes {
				activity.TotalViewMinutes = req.ViewMinutes
			}
		}

		// Update ActiveWatchMinutes
		if req.ActiveWatchMinutes > activity.ActiveWatchMinutes {
			activity.ActiveWatchMinutes = req.ActiveWatchMinutes
		}

		activity.ActivityType = "view_update"
		activity.LastUpdated = now
		// Update phone to normalized version if it changed
		if activity.Phone != normalizedPhone {
			activity.Phone = normalizedPhone
		}
		ctrl.DB.Save(&activity)
	}

	c.JSON(http.StatusOK, gin.H{"message": "View time updated", "activity": activity})
}

// Heartbeat updates last_updated timestamp for online status tracking
// This should be called frequently (every 10-15 seconds) ONLY when page is visible
// If page goes to background, heartbeat stops, and user will be marked offline after 3 minutes
func (ctrl *TrackingController) Heartbeat(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Normalize phone number: convert Persian digits to English
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	now := time.Now()
	// If last update was more than 5 minutes ago, consider it a new device/session
	sessionThreshold := now.Add(-5 * time.Minute)

	// Find the most recent activity for this phone that was updated recently (same session)
	var activity models.WebinarActivity
	err := ctrl.DB.Where("phone = ? AND last_updated > ?", normalizedPhone, sessionThreshold).
		Order("last_updated DESC").
		First(&activity).Error

	if err != nil {
		// No recent activity found - create new record (new device/session)
		activity = models.WebinarActivity{
			Phone:        normalizedPhone,
			ActivityType: "view_update",
			ViewStartTime: &now,
			CreatedAt:    now,
			LastUpdated:  now,
		}
		ctrl.DB.Create(&activity)
	} else {
		// Update existing session - only update last_updated timestamp
		// This marks the user as online (visible and active)
		activity.LastUpdated = now
		// Ensure we have view start time
		if activity.ViewStartTime == nil {
			activity.ViewStartTime = &now
		}
		// Update phone to normalized version if it changed
		if activity.Phone != normalizedPhone {
			activity.Phone = normalizedPhone
		}
		ctrl.DB.Save(&activity)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Heartbeat received", "last_updated": now})
}

// EndSession marks the user as offline immediately
// Should be called when page goes to background or is closed
// This ensures user is marked offline instantly, not after threshold timeout
func (ctrl *TrackingController) EndSession(c *gin.Context) {
	var req struct {
		Phone string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Normalize phone number: convert Persian digits to English
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	now := time.Now()
	// Set last_updated to 20 seconds ago to ensure user is marked offline immediately
	// This is older than the 15-second threshold, so user will be excluded from online count
	offlineTime := now.Add(-20 * time.Second)
	
	// If last update was more than 5 minutes ago, consider it a new device/session
	sessionThreshold := now.Add(-5 * time.Minute)

	// Find the most recent activity for this phone that was updated recently (same session)
	var activity models.WebinarActivity
	err := ctrl.DB.Where("phone = ? AND last_updated > ?", normalizedPhone, sessionThreshold).
		Order("last_updated DESC").
		First(&activity).Error

	if err == nil {
		// Update existing session - set last_updated to past time to mark as offline
		activity.LastUpdated = offlineTime
		// Update phone to normalized version if it changed
		if activity.Phone != normalizedPhone {
			activity.Phone = normalizedPhone
		}
		ctrl.DB.Save(&activity)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session ended", "marked_offline_at": offlineTime})
}
