package controllers

import (
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"monetizeai-backend/utils"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminTaskMessagesController struct {
	DB                 *gorm.DB
	MelipayamakService *services.MelipayamakService
}

func NewAdminTaskMessagesController(db *gorm.DB, melipayamakService *services.MelipayamakService) *AdminTaskMessagesController {
	return &AdminTaskMessagesController{
		DB:                 db,
		MelipayamakService: melipayamakService,
	}
}

func (ctrl *AdminTaskMessagesController) ListMessages(c *gin.Context) {
	userIDVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	currentUserID := userIDVal.(uint)
	canManage := HasPermission(c, ctrl.DB, models.PermissionTasksManage)

	targetUserID := currentUserID
	requestedUserID := c.Query("user_id")
	if canManage && requestedUserID != "" {
		if parsed, err := strconv.ParseUint(requestedUserID, 10, 64); err == nil {
			targetUserID = uint(parsed)
		}
	}

	var messages []models.TaskMessage
	if err := ctrl.DB.Preload("Sender", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, username")
	}).Preload("Task", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, title")
	}).Where("user_id = ?", targetUserID).Order("created_at ASC").Find(&messages).Error; err != nil {
		log.Printf("failed to fetch task messages: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	now := time.Now()
	isManagerView := canManage && targetUserID != currentUserID
	if isManagerView {
		ctrl.DB.Model(&models.TaskMessage{}).
			Where("user_id = ? AND read_by_manager_at IS NULL AND is_from_manager = ?", targetUserID, false).
			Update("read_by_manager_at", now)
	} else {
		ctrl.DB.Model(&models.TaskMessage{}).
			Where("user_id = ? AND read_by_user_at IS NULL AND is_from_manager = ?", targetUserID, true).
			Update("read_by_user_at", now)
	}

	c.JSON(http.StatusOK, gin.H{
		"messages":         messages,
		"user_id":          targetUserID,
		"is_manager_view":  isManagerView,
		"current_user_id":  currentUserID,
		"can_manage_tasks": canManage,
	})
}

func (ctrl *AdminTaskMessagesController) CreateMessage(c *gin.Context) {
	userIDVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	currentUserID := userIDVal.(uint)
	canManage := HasPermission(c, ctrl.DB, models.PermissionTasksManage)

	var req struct {
		UserID           uint   `json:"user_id"`
		TaskID           *uint  `json:"task_id"`
		Topic            string `json:"topic"`
		Body             string `json:"body" binding:"required"`
		SendSMSNotification bool `json:"send_sms_notification"` // گزینه اطلاع‌رسانی از طریق SMS
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	req.Body = strings.TrimSpace(req.Body)
	req.Topic = strings.TrimSpace(req.Topic)
	if req.Body == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message body is required"})
		return
	}

	targetUserID := currentUserID
	isFromManager := false
	var managerID *uint

	if canManage && req.UserID != 0 && req.UserID != currentUserID {
		targetUserID = req.UserID
		isFromManager = true
		managerID = &currentUserID
	} else {
		targetUserID = currentUserID
	}

	message := models.TaskMessage{
		UserID:        targetUserID,
		ManagerID:     managerID,
		SenderID:      currentUserID,
		TaskID:         req.TaskID,
		Topic:          req.Topic,
		Body:           req.Body,
		IsFromManager:  isFromManager,
	}

	now := time.Now()
	if isFromManager {
		message.ReadByManagerAt = &now
	} else {
		message.ReadByUserAt = &now
	}

	if err := ctrl.DB.Create(&message).Error; err != nil {
		log.Printf("failed to create message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	ctrl.DB.Preload("Sender", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, username")
	}).First(&message, message.ID)

	// ارسال SMS در صورت فعال بودن گزینه اطلاع‌رسانی
	if req.SendSMSNotification && isFromManager && ctrl.MelipayamakService != nil {
		go func() {
			// دریافت اطلاعات کاربر هدف
			var targetUser models.AdminUser
			if err := ctrl.DB.Select("id, name, phone").First(&targetUser, targetUserID).Error; err == nil {
				// بررسی وجود نام و شماره تماس
				if targetUser.Name != nil && *targetUser.Name != "" && targetUser.Phone != nil && *targetUser.Phone != "" {
					normalizedPhone := utils.NormalizePhoneNumber(*targetUser.Phone)
					userName := *targetUser.Name
					userPhone := normalizedPhone

					// ارسال SMS با کد پترن 404962
					// پارامترها: نام کاربر و شماره تماس
					err := ctrl.MelipayamakService.SendPatternSMS(userPhone, 404962, userName, userPhone)
					if err != nil {
						log.Printf("❌ Failed to send SMS notification to %s (user ID: %d): %v", userPhone, targetUserID, err)
					} else {
						log.Printf("✅ SMS notification sent to %s (user ID: %d, name: %s)", userPhone, targetUserID, userName)
					}
				} else {
					log.Printf("⚠️  Cannot send SMS notification: user %d missing name or phone (name: %v, phone: %v)", targetUserID, targetUser.Name, targetUser.Phone)
				}
			} else {
				log.Printf("⚠️  Failed to fetch user %d for SMS notification: %v", targetUserID, err)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{"message": message})
}

func (ctrl *AdminTaskMessagesController) GetUnreadCount(c *gin.Context) {
	userIDVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	currentUserID := userIDVal.(uint)
	canManage := HasPermission(c, ctrl.DB, models.PermissionTasksManage)

	var count int64
	if canManage {
		ctrl.DB.Model(&models.TaskMessage{}).
			Where("is_from_manager = ? AND read_by_manager_at IS NULL", false).
			Count(&count)
	} else {
		ctrl.DB.Model(&models.TaskMessage{}).
			Where("user_id = ? AND is_from_manager = ? AND read_by_user_at IS NULL", currentUserID, true).
			Count(&count)
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

func (ctrl *AdminTaskMessagesController) ListParticipants(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionTasksManage) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	userIDVal, _ := c.Get("user_id")
	currentUserID := userIDVal.(uint)

	var users []models.AdminUser
	if err := ctrl.DB.Order("username ASC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	managerMap, err := fetchManagerUserMap(ctrl.DB)
	if err != nil {
		log.Printf("failed to fetch manager map: %v", err)
	}

	type unreadItem struct {
		UserID uint
		Count  int64
	}
	var unreadRows []unreadItem
	ctrl.DB.Model(&models.TaskMessage{}).
		Select("user_id, COUNT(*) as count").
		Where("is_from_manager = ? AND read_by_manager_at IS NULL", false).
		Group("user_id").
		Scan(&unreadRows)

	unreadMap := make(map[uint]int64, len(unreadRows))
	for _, row := range unreadRows {
		unreadMap[row.UserID] = row.Count
	}

	participants := make([]gin.H, 0, len(users))
	for _, user := range users {
		if user.ID == currentUserID {
			continue
		}
		participants = append(participants, gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"is_manager":   managerMap[user.ID],
			"unread_count": unreadMap[user.ID],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"users":            participants,
		"current_user_id":  currentUserID,
		"manager_user_ids": managerMap,
	})
}
