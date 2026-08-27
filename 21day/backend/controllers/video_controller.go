package controllers

import (
	"fitino-challenge-backend/database"
	"fitino-challenge-backend/models"
	"fitino-challenge-backend/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetVideos(c *gin.Context) {
	var videos []models.Video
	database.DB.Find(&videos)
	c.JSON(http.StatusOK, gin.H{"videos": videos})
}

func CompleteVideo(c *gin.Context) {
	phone := c.Query("phone")
	videoID, _ := strconv.Atoi(c.Param("id"))

	var user models.User
	if err := database.DB.Where("phone = ?", phone).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var progress models.Progress
	err := database.DB.Where("user_id = ? AND video_id = ?", user.ID, videoID).First(&progress).Error
	if err != nil {
		progress = models.Progress{UserID: user.ID, VideoID: uint(videoID), Unlocked: true, Completed: true}
		database.DB.Create(&progress)
	} else {
		progress.Completed = true
		database.DB.Save(&progress)
	}

	// Send completion SMS based on video ID. Days 1-4 keep the dense
	// 3h/15h follow-up cadence (highest drop-off window). Days 5-20 send
	// nothing except three milestone days the content already treats as
	// checkpoints (7/14/21) — see config.yaml's patterns: comment for why.
	var patternKey string
	sendSMS := true
	switch videoID {
	case 1:
		patternKey = "complete1"
		// Check if user received 3-hour follow-up for step 1, if yes cancel 15-hour follow-up
		var threeHourSMS models.ScheduledSMS
		if database.DB.Where("user_id = ? AND pattern = ? AND sent = ?", user.ID, "followup1_3h", true).First(&threeHourSMS).Error == nil {
			database.CancelScheduledSMS(user.ID, "followup1_15h")
		}
		// Cancel any remaining follow-ups for step 1
		database.CancelScheduledSMS(user.ID, "followup1_3h")
		database.CancelScheduledSMS(user.ID, "followup1_15h")
		// Schedule follow-ups for step 2
		database.ScheduleSMS(user.ID, "followup2_3h", time.Now().Add(3*time.Hour))
		database.ScheduleSMS(user.ID, "followup2_15h", time.Now().Add(15*time.Hour))
	case 2:
		patternKey = "complete2"
		// Check if user received 3-hour follow-up for step 2, if yes cancel 15-hour follow-up
		var threeHourSMS models.ScheduledSMS
		if database.DB.Where("user_id = ? AND pattern = ? AND sent = ?", user.ID, "followup2_3h", true).First(&threeHourSMS).Error == nil {
			database.CancelScheduledSMS(user.ID, "followup2_15h")
		}
		// Cancel any remaining follow-ups for step 2
		database.CancelScheduledSMS(user.ID, "followup2_3h")
		database.CancelScheduledSMS(user.ID, "followup2_15h")
		// Schedule follow-ups for step 3
		database.ScheduleSMS(user.ID, "followup3_3h", time.Now().Add(3*time.Hour))
		database.ScheduleSMS(user.ID, "followup3_15h", time.Now().Add(15*time.Hour))
	case 3:
		patternKey = "complete3"
		// Check if user received 3-hour follow-up for step 3, if yes cancel 15-hour follow-up
		var threeHourSMS models.ScheduledSMS
		if database.DB.Where("user_id = ? AND pattern = ? AND sent = ?", user.ID, "followup3_3h", true).First(&threeHourSMS).Error == nil {
			database.CancelScheduledSMS(user.ID, "followup3_15h")
		}
		// Cancel any remaining follow-ups for step 3
		database.CancelScheduledSMS(user.ID, "followup3_3h")
		database.CancelScheduledSMS(user.ID, "followup3_15h")
		// Schedule follow-ups for step 4
		database.ScheduleSMS(user.ID, "followup4_3h", time.Now().Add(3*time.Hour))
		database.ScheduleSMS(user.ID, "followup4_15h", time.Now().Add(15*time.Hour))
	case 4:
		patternKey = "complete4"
		// Check if user received 3-hour follow-up for step 4, if yes cancel 15-hour follow-up
		var threeHourSMS models.ScheduledSMS
		if database.DB.Where("user_id = ? AND pattern = ? AND sent = ?", user.ID, "followup4_3h", true).First(&threeHourSMS).Error == nil {
			database.CancelScheduledSMS(user.ID, "followup4_15h")
		}
		// Cancel any remaining follow-ups for step 4
		database.CancelScheduledSMS(user.ID, "followup4_3h")
		database.CancelScheduledSMS(user.ID, "followup4_15h")
		// No more follow-ups needed for final step
	case 7:
		patternKey = "week1"
	case 14:
		patternKey = "midpoint"
	case 21:
		patternKey = "finish"
	default:
		sendSMS = false
	}

	if sendSMS {
		smsParams := map[string]string{
			"name": user.FirstName,
		}
		services.SendSMS(user.Phone, smsParams, patternKey)
	}

	// Inactivity nudge: reschedule "winback" 48h out from this completion,
	// canceling whatever was pending before. Fires once, only if nothing
	// new gets completed before it's due, and reflects whichever day the
	// user is actually stuck on at send time (see main.go's scheduler).
	database.CancelScheduledSMS(user.ID, "winback")
	if videoID < 21 {
		database.ScheduleSMS(user.ID, "winback", time.Now().Add(48*time.Hour))
	}

	// Passing the session quiz unlocks the next day automatically (no end-of-video code).
	nextID := videoID + 1
	var nextVideo models.Video
	if database.DB.First(&nextVideo, nextID).Error == nil {
		var nextProgress models.Progress
		err := database.DB.Where("user_id = ? AND video_id = ?", user.ID, nextID).First(&nextProgress).Error
		if err != nil {
			nextProgress = models.Progress{UserID: user.ID, VideoID: uint(nextID), Unlocked: true}
			database.DB.Create(&nextProgress)
		} else if !nextProgress.Unlocked {
			nextProgress.Unlocked = true
			database.DB.Save(&nextProgress)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Video completed"})
}

func UnlockVideo(c *gin.Context) {
	phone := c.Query("phone")
	videoID, _ := strconv.Atoi(c.Param("id"))

	var user models.User
	if err := database.DB.Where("phone = ?", phone).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var progress models.Progress
	err := database.DB.Where("user_id = ? AND video_id = ?", user.ID, videoID).First(&progress).Error
	if err != nil {
		progress = models.Progress{UserID: user.ID, VideoID: uint(videoID), Unlocked: true}
		database.DB.Create(&progress)
	} else {
		progress.Unlocked = true
		database.DB.Save(&progress)
	}

	// Send SMS for unlocking video with only 'name' param
	// TODO: UNCOMMENT BELOW FOR REAL SMS SENDING
	smsParams := map[string]string{
		"name": user.FirstName,
	}
	// Use completion pattern for the video being unlocked
	var unlockPattern string
	switch videoID {
	case 1:
		unlockPattern = "complete1"
	case 2:
		unlockPattern = "complete2"
	case 3:
		unlockPattern = "complete3"
	case 4:
		unlockPattern = "complete4"
	default:
		unlockPattern = "complete1"
	}
	services.SendSMS(user.Phone, smsParams, unlockPattern)

	c.JSON(http.StatusOK, gin.H{"message": "Video unlocked"})
}

func GetUserProgress(c *gin.Context) {
	phone := c.Query("phone")
	var user models.User
	if err := database.DB.Where("phone = ?", phone).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var progresses []models.Progress
	database.DB.Where("user_id = ?", user.ID).Find(&progresses)

	// Calculate total points, level, and progress
	var totalPoints int
	var completedCount int
	var totalVideos int64
	database.DB.Model(&models.Video{}).Count(&totalVideos)

	for _, p := range progresses {
		if p.Completed {
			var video models.Video
			database.DB.First(&video, p.VideoID)
			totalPoints += video.Points
			completedCount++
		}
	}

	progressPercent := 0
	if totalVideos > 0 {
		progressPercent = int(float64(completedCount) / float64(totalVideos) * 100)
	}
	level := totalPoints/200 + 1

	c.JSON(http.StatusOK, gin.H{
		"progress":         progresses,
		"total_points":     totalPoints,
		"level":            level,
		"progress_percent": progressPercent,
		"completed_videos": completedCount,
		"total_videos":     totalVideos,
	})
}
