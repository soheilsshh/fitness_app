package controllers

import (
	"encoding/csv"
	"fitino-challenge-backend/database"
	"fitino-challenge-backend/models"
	"fitino-challenge-backend/services"
	"net/http"
	"strconv"
	"time"

	"log"

	"github.com/gin-gonic/gin"
)

func RegisterUser(c *gin.Context) {
	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Phone     string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
		// User exists, return existing user data
		c.JSON(http.StatusOK, gin.H{
			"user":     existingUser,
			"message":  "Welcome back! You're already registered.",
			"existing": true,
		})
		return
	}

	// Create new user
	user := models.User{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Database error occurred"})
		return
	}

	// TODO: UNCOMMENT BELOW FOR REAL SMS SENDING
	log.Printf("[DEBUG] About to send registration SMS to %s with pattern %s", user.Phone, "registration")
	// Send welcome SMS with only 'name' param
	smsParams := map[string]string{
		"name": user.FirstName,
	}
	services.SendSMS(user.Phone, smsParams, "registration")

	// Schedule follow-up SMS jobs for step 1
	database.ScheduleSMS(user.ID, "followup1_3h", time.Now().Add(3*time.Hour))
	database.ScheduleSMS(user.ID, "followup1_15h", time.Now().Add(15*time.Hour))

	c.JSON(http.StatusOK, gin.H{
		"user":     user,
		"message":  "Registration successful!",
		"existing": false,
	})
}

func GetAdminUsersCSV(c *gin.Context) {
	writeUsersCSV(c)
}

func writeUsersCSV(c *gin.Context) {
	var users []models.User
	database.DB.Find(&users)

	// Create CSV data
	var csvData [][]string
	csvData = append(csvData, []string{"Name", "Last Name", "Phone", "Level", "Score", "Current Stage", "Completed Videos"})

	for _, user := range users {
		// Get user progress
		var progresses []models.Progress
		database.DB.Where("user_id = ?", user.ID).Find(&progresses)

		// Calculate level and score
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

		level := totalPoints/200 + 1
		currentStage := "Not Started"
		if completedCount > 0 {
			currentStage = "Video " + strconv.Itoa(completedCount)
		}

		// Add user data to CSV
		csvData = append(csvData, []string{
			user.FirstName,
			user.LastName,
			user.Phone,
			strconv.Itoa(level),
			strconv.Itoa(totalPoints),
			currentStage,
			strconv.Itoa(completedCount) + "/" + strconv.FormatInt(totalVideos, 10),
		})
	}

	// Set CSV headers
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=users_report.csv")

	// Write CSV to response
	writer := csv.NewWriter(c.Writer)
	writer.WriteAll(csvData)
}
