package controllers

import (
	"fitino-live-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ChatRequest struct {
	Username string `json:"username"`
	Message  string `json:"message"`
}

// GetChatMessages always returns an empty message list
// Chat messages are now managed entirely by the timed comment system (CommentScheduler)
// This ensures a clean start for every webinar session
func GetChatMessages(c *gin.Context, db *gorm.DB) {
	// Always return empty messages - chat should start fresh for each webinar
	c.JSON(http.StatusOK, gin.H{"messages": []models.ChatMessage{}})
}

func PostChatMessage(c *gin.Context, db *gorm.DB) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	if req.Username == "" {
		req.Username = "you"
	}
	msg := models.ChatMessage{
		Username:  req.Username,
		Message:   req.Message,
		Timestamp: time.Now(),
		IsAdmin:   false,
	}
	if err := db.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save message"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": msg})
}

// ResetChatMessages deletes all chat messages from the database
// This is an admin-only endpoint to reset chat history
func ResetChatMessages(c *gin.Context, db *gorm.DB) {
	// Delete all chat messages from the chat_messages table
	result := db.Where("1 = 1").Delete(&models.ChatMessage{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset chat messages", "details": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Chat messages reset successfully",
		"deleted_count": result.RowsAffected,
	})
}
