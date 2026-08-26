package controllers

import (
	"log"
	"monetizeai-backend/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminContentTasksController struct {
	DB *gorm.DB
}

func NewAdminContentTasksController(db *gorm.DB) *AdminContentTasksController {
	return &AdminContentTasksController{DB: db}
}

// getCurrentUserID gets the current user ID from context (supports both JWT and bot API auth)
func (ctrl *AdminContentTasksController) getCurrentUserID(c *gin.Context) (uint, bool) {
	// Both JWT and bot API auth set user_id in context
	userID, hasUser := c.Get("user_id")
	if !hasUser {
		return 0, false
	}
	return userID.(uint), true
}

func (ctrl *AdminContentTasksController) ListContentTasks(c *gin.Context) {
	userID, hasUser := ctrl.getCurrentUserID(c)
	
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	currentUserID := userID

	// Content tasks are always personal - only show current user's tasks
	// OPTIMIZED: Select only necessary fields for faster queries
	var tasks []models.ContentTask
	query := ctrl.DB.Select("id, title, status, priority, creator_id, board_order, updated_at").Where("creator_id = ?", currentUserID)

	statusFilter := c.Query("status")
	if statusFilter != "" {
		query = query.Where("status = ?", statusFilter)
	}

	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}

	if search := c.Query("search"); search != "" {
		query = query.Where("title LIKE ? OR description LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Pagination support
	page := 1
	limit := 10
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	offset := (page - 1) * limit

	// OPTIMIZED: Use indexed columns for ordering (creator_id, status, updated_at should be indexed)
	query = query.Order("board_order ASC, updated_at DESC").Offset(offset).Limit(limit)

	if err := query.Find(&tasks).Error; err != nil {
		log.Printf("Failed to fetch content tasks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch content tasks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// GetContentTask gets a single content task by ID
func (ctrl *AdminContentTasksController) GetContentTask(c *gin.Context) {
	userID, hasUser := ctrl.getCurrentUserID(c)
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.ContentTask
	// OPTIMIZED: Remove Preload("Creator") for faster query - we don't need creator info in detail view
	if err := ctrl.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Content task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch content task"})
		return
	}

	// Only creator can view their own content task
	if task.CreatorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only view your own content tasks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"task": task})
}

func (ctrl *AdminContentTasksController) CreateContentTask(c *gin.Context) {
	userID, hasUser := ctrl.getCurrentUserID(c)
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	currentUserID := userID

	var req struct {
		Title        string                     `json:"title" binding:"required"`
		Description  string                     `json:"description"`
		Status       models.ContentTaskStatus   `json:"status"`
		Priority     models.ContentTaskPriority  `json:"priority"`
		DueDate      *time.Time                 `json:"due_date"`
		Tags         []string                   `json:"tags"`
		InstagramURL *string                    `json:"instagram_url"`
		TwitterURL   *string                     `json:"twitter_url"`
		TikTokURL    *string                    `json:"tiktok_url"`
		YouTubeURL   *string                    `json:"youtube_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if req.Status == "" {
		req.Status = models.ContentTaskStatusFinalIdeas
	}
	if req.Priority == "" {
		req.Priority = models.ContentTaskPriorityMedium
	}

	task := models.ContentTask{
		Title:        req.Title,
		Description:  req.Description,
		Status:       req.Status,
		Priority:     req.Priority,
		CreatorID:    currentUserID, // Always assigned to creator
		DueDate:      req.DueDate,
		BoardOrder:   int(time.Now().Unix()),
		InstagramURL: req.InstagramURL,
		TwitterURL:   req.TwitterURL,
		TikTokURL:    req.TikTokURL,
		YouTubeURL:   req.YouTubeURL,
	}
	task.Tags = models.StringArray(req.Tags)

	if err := ctrl.DB.Create(&task).Error; err != nil {
		log.Printf("Failed to create content task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create content task"})
		return
	}

	ctrl.DB.Preload("Creator").First(&task, task.ID)
	c.JSON(http.StatusOK, gin.H{"task": task})
}

func (ctrl *AdminContentTasksController) UpdateContentTask(c *gin.Context) {
	userIDVal, hasUser := ctrl.getCurrentUserID(c)
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	currentUserID := userIDVal

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.ContentTask
	if err := ctrl.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Content task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch content task"})
		return
	}

	// Only creator can update their own content task
	if task.CreatorID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own content tasks"})
		return
	}

	type updateRequest struct {
		Title        *string                    `json:"title"`
		Description  *string                    `json:"description"`
		Status       *models.ContentTaskStatus  `json:"status"`
		Priority     *models.ContentTaskPriority `json:"priority"`
		DueDate      *time.Time                 `json:"due_date"`
		Tags         []string                   `json:"tags"`
		BoardOrder   *int                       `json:"board_order"`
		InstagramURL *string                    `json:"instagram_url"`
		TwitterURL   *string                    `json:"twitter_url"`
		TikTokURL    *string                    `json:"tiktok_url"`
		YouTubeURL   *string                    `json:"youtube_url"`
	}
	var req updateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	updates := map[string]any{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Priority != nil {
		updates["priority"] = *req.Priority
	}
	if req.DueDate != nil {
		updates["due_date"] = req.DueDate
	}
	if req.BoardOrder != nil {
		updates["board_order"] = *req.BoardOrder
	}

	if req.Tags != nil {
		updates["tags"] = models.StringArray(req.Tags)
	}
	if req.InstagramURL != nil {
		updates["instagram_url"] = *req.InstagramURL
	}
	if req.TwitterURL != nil {
		updates["twitter_url"] = *req.TwitterURL
	}
	if req.TikTokURL != nil {
		updates["tiktok_url"] = *req.TikTokURL
	}
	if req.YouTubeURL != nil {
		updates["youtube_url"] = *req.YouTubeURL
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No changes provided"})
		return
	}

	if err := ctrl.DB.Model(&task).Updates(updates).Error; err != nil {
		log.Printf("Failed to update content task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update content task"})
		return
	}

	ctrl.DB.Preload("Creator").First(&task, task.ID)
	c.JSON(http.StatusOK, gin.H{"task": task})
}

func (ctrl *AdminContentTasksController) DeleteContentTask(c *gin.Context) {
	userIDVal, hasUser := ctrl.getCurrentUserID(c)
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}
	currentUserID := userIDVal

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	taskID := uint(id)

	var task models.ContentTask
	if err := ctrl.DB.First(&task, taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Content task not found"})
			return
		}
		log.Printf("Failed to find content task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find content task"})
		return
	}

	// Only creator can delete their own content task
	if task.CreatorID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own content tasks"})
		return
	}

	if err := ctrl.DB.Delete(&task).Error; err != nil {
		log.Printf("Error deleting content task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete content task"})
		return
	}

	log.Printf("✅ Content task deleted successfully: ID=%d, Title=%s", taskID, task.Title)
	c.JSON(http.StatusOK, gin.H{"message": "Content task deleted"})
}

// GetContentTasksStats returns statistics about content tasks for the current user
func (ctrl *AdminContentTasksController) GetContentTasksStats(c *gin.Context) {
	userID, hasUser := ctrl.getCurrentUserID(c)
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	currentUserID := userID

	// OPTIMIZED: Get count by status in a single query (more efficient than separate queries)
	type StatusCount struct {
		Status string
		Count  int64
	}
	var statusCounts []StatusCount
	
	// Single query to get all status counts
	if err := ctrl.DB.Model(&models.ContentTask{}).
		Select("status, COUNT(*) as count").
		Where("creator_id = ?", currentUserID).
		Group("status").
		Scan(&statusCounts).Error; err != nil {
		log.Printf("Failed to count content tasks by status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics"})
		return
	}

	// Convert to map and calculate total (faster than separate COUNT query)
	statsByStatus := make(map[string]int64)
	var totalCount int64
	for _, sc := range statusCounts {
		statsByStatus[sc.Status] = sc.Count
		totalCount += sc.Count
	}

	// Ensure all statuses are present (even if count is 0)
	allStatuses := []string{
		string(models.ContentTaskStatusFinalIdeas),
		string(models.ContentTaskStatusWriting),
		string(models.ContentTaskStatusPreProduction),
		string(models.ContentTaskStatusRecording),
		string(models.ContentTaskStatusEditing),
		string(models.ContentTaskStatusPublished),
	}
	for _, status := range allStatuses {
		if _, exists := statsByStatus[status]; !exists {
			statsByStatus[status] = 0
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_count":     totalCount,
		"count_by_status": statsByStatus,
	})
}
