package controllers

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"monetizeai-backend/config"
	"monetizeai-backend/database"
	"monetizeai-backend/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const adminSessionTTL = 7 * 24 * time.Hour

func generateAdminToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func AdminLogin(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "درخواست نامعتبر است"})
		return
	}

	validUser := subtle.ConstantTimeCompare([]byte(req.Username), []byte(config.Config.Admin.Username)) == 1
	validPass := subtle.ConstantTimeCompare([]byte(req.Password), []byte(config.Config.Admin.Password)) == 1
	if !validUser || !validPass {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "نام کاربری یا رمز عبور اشتباه است"})
		return
	}

	token, err := generateAdminToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد نشست"})
		return
	}

	session := models.AdminSession{
		Token:     token,
		ExpiresAt: time.Now().Add(adminSessionTTL),
	}
	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ایجاد نشست"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func AdminLogout(c *gin.Context) {
	token := extractBearerToken(c)
	if token != "" {
		database.DB.Where("token = ?", token).Delete(&models.AdminSession{})
	}
	c.JSON(http.StatusOK, gin.H{"message": "خارج شدید"})
}

func extractBearerToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(header, "Bearer ")
}

func AdminAuthMiddleware(c *gin.Context) {
	token := extractBearerToken(c)
	if token == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "نیاز به ورود دارید"})
		return
	}

	var session models.AdminSession
	if err := database.DB.Where("token = ? AND expires_at > ?", token, time.Now()).First(&session).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "نشست منقضی شده است"})
		return
	}

	c.Next()
}

type userProgressSummary struct {
	completedCount int
	unlockedCount  int
	totalPoints    int
	lastActivity   *time.Time
}

func summarizeProgress(progresses []models.Progress, videoPoints map[uint]int) userProgressSummary {
	summary := userProgressSummary{}
	for _, p := range progresses {
		if p.Unlocked {
			summary.unlockedCount++
		}
		if p.Completed {
			summary.completedCount++
			summary.totalPoints += videoPoints[p.VideoID]
		}
		if p.UpdatedAt != nil && (summary.lastActivity == nil || p.UpdatedAt.After(*summary.lastActivity)) {
			summary.lastActivity = p.UpdatedAt
		}
	}
	return summary
}

// GetAdminStats returns aggregate registration, engagement and funnel metrics
// for the 21-day challenge. This is intentionally computed in Go over the
// (small) dataset rather than with complex SQL, matching the rest of this
// service's style.
func GetAdminStats(c *gin.Context) {
	var users []models.User
	database.DB.Find(&users)

	var videos []models.Video
	database.DB.Order("id asc").Find(&videos)

	var allProgress []models.Progress
	database.DB.Find(&allProgress)

	videoPoints := make(map[uint]int)
	for _, v := range videos {
		videoPoints[v.ID] = v.Points
	}

	progressByUser := make(map[uint][]models.Progress)
	for _, p := range allProgress {
		progressByUser[p.UserID] = append(progressByUser[p.UserID], p)
	}

	totalUsers := len(users)
	totalVideos := len(videos)

	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -7)

	registrationsToday := 0
	registrationsThisWeek := 0

	daysBack := 14
	dayBuckets := make([]string, daysBack)
	dayCounts := make(map[string]int, daysBack)
	for i := 0; i < daysBack; i++ {
		d := todayStart.AddDate(0, 0, -(daysBack - 1 - i))
		key := d.Format("2006-01-02")
		dayBuckets[i] = key
		dayCounts[key] = 0
	}

	engagedUsers := 0
	completedAllUsers := 0
	progressPercentSum := 0.0

	for _, u := range users {
		if u.CreatedAt != nil {
			if !u.CreatedAt.Before(todayStart) {
				registrationsToday++
			}
			if !u.CreatedAt.Before(weekStart) {
				registrationsThisWeek++
			}
			key := u.CreatedAt.Format("2006-01-02")
			if _, ok := dayCounts[key]; ok {
				dayCounts[key]++
			}
		}

		summary := summarizeProgress(progressByUser[u.ID], videoPoints)
		if summary.unlockedCount > 0 || summary.completedCount > 0 {
			engagedUsers++
		}
		if totalVideos > 0 && summary.completedCount == totalVideos {
			completedAllUsers++
		}
		if totalVideos > 0 {
			progressPercentSum += float64(summary.completedCount) / float64(totalVideos) * 100
		}
	}

	registrationsByDay := make([]gin.H, 0, daysBack)
	for _, key := range dayBuckets {
		registrationsByDay = append(registrationsByDay, gin.H{"date": key, "count": dayCounts[key]})
	}

	funnel := make([]gin.H, 0, totalVideos+1)
	funnel = append(funnel, gin.H{
		"stage": "ثبت‌نام",
		"count": totalUsers,
	})
	for _, v := range videos {
		reached := 0
		completed := 0
		for _, p := range allProgress {
			if p.VideoID != v.ID {
				continue
			}
			if p.Unlocked {
				reached++
			}
			if p.Completed {
				completed++
			}
		}
		// Day 1 is always open in the academy UI without a progress row.
		if v.ID == 1 && reached < totalUsers {
			reached = totalUsers
		}
		funnel = append(funnel, gin.H{
			"stage":     v.Title,
			"video_id":  v.ID,
			"reached":   reached,
			"completed": completed,
		})
	}

	engagementRate := 0.0
	completionRate := 0.0
	avgProgressPercent := 0.0
	if totalUsers > 0 {
		engagementRate = float64(engagedUsers) / float64(totalUsers) * 100
		completionRate = float64(completedAllUsers) / float64(totalUsers) * 100
		avgProgressPercent = progressPercentSum / float64(totalUsers)
	}

	c.JSON(http.StatusOK, gin.H{
		"total_registrations":  totalUsers,
		"registrations_today":  registrationsToday,
		"registrations_week":   registrationsThisWeek,
		"registrations_by_day": registrationsByDay,
		"total_videos":         totalVideos,
		"engaged_users":        engagedUsers,
		"not_started_users":    totalUsers - engagedUsers,
		"completed_all_users":  completedAllUsers,
		"engagement_rate":      round2(engagementRate),
		"completion_rate":      round2(completionRate),
		"avg_progress_percent": round2(avgProgressPercent),
		"funnel":               funnel,
	})
}

func round2(v float64) float64 {
	return float64(int(v*100)) / 100
}

// GetAdminUsersList returns a paginated, searchable list of registered users
// with their computed progress, for the "who came, how far did they get" view.
func GetAdminUsersList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if pageSize < 1 || pageSize > 200 {
		pageSize = 20
	}
	search := strings.TrimSpace(c.Query("search"))

	query := database.DB.Model(&models.User{})
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?", like, like, like)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	query.Order("created_at desc, id desc").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&users)

	var videos []models.Video
	database.DB.Order("id asc").Find(&videos)
	totalVideos := len(videos)
	videoPoints := make(map[uint]int)
	for _, v := range videos {
		videoPoints[v.ID] = v.Points
	}

	userIDs := make([]uint, 0, len(users))
	for _, u := range users {
		userIDs = append(userIDs, u.ID)
	}

	var progresses []models.Progress
	if len(userIDs) > 0 {
		database.DB.Where("user_id IN ?", userIDs).Find(&progresses)
	}
	progressByUser := make(map[uint][]models.Progress)
	for _, p := range progresses {
		progressByUser[p.UserID] = append(progressByUser[p.UserID], p)
	}

	result := make([]gin.H, 0, len(users))
	for _, u := range users {
		summary := summarizeProgress(progressByUser[u.ID], videoPoints)
		progressPercent := 0
		if totalVideos > 0 {
			progressPercent = int(float64(summary.completedCount) / float64(totalVideos) * 100)
		}
		result = append(result, gin.H{
			"id":               u.ID,
			"first_name":       u.FirstName,
			"last_name":        u.LastName,
			"phone":            u.Phone,
			"created_at":       u.CreatedAt,
			"completed_videos": summary.completedCount,
			"unlocked_videos":  summary.unlockedCount,
			"total_videos":     totalVideos,
			"progress_percent": progressPercent,
			"total_points":     summary.totalPoints,
			"level":            summary.totalPoints/200 + 1,
			"last_activity":    summary.lastActivity,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"users":     result,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}
