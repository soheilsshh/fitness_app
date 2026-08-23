package controllers

import (
	"monetizeai-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRequest moved to webinar.go to avoid duplicate declaration
// This function is no longer used - registration is handled by WebinarController.RegisterUser

func RegisterUser(c *gin.Context, db *gorm.DB) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var webinar models.Webinar
	if err := db.First(&webinar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Webinar not found"})
		return
	}
	if webinar.RegisteredCount >= webinar.Capacity {
		c.JSON(http.StatusForbidden, gin.H{"error": "Webinar is full"})
		return
	}

	// var existing models.User
	// if err := db.Where("phone = ?", req.Phone).First(&existing).Error; err == nil {
	// 	c.JSON(http.StatusConflict, gin.H{"error": "Phone already registered"})
	// 	return
	// }

	user := models.User{
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		RegisteredAt: time.Now(),
	}
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register"})
		return
	}
	db.Model(&webinar).Update("registered_count", webinar.RegisteredCount+1)

	c.JSON(http.StatusOK, gin.H{"message": "Registration successful", "user": user})
}
