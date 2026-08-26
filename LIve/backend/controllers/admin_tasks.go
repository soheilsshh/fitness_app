package controllers

import (
	"log"
	"fitino-live-backend/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminTasksController struct {
	DB *gorm.DB
}

func NewAdminTasksController(db *gorm.DB) *AdminTasksController {
	return &AdminTasksController{DB: db}
}

func (ctrl *AdminTasksController) ListTasks(c *gin.Context) {
	userID, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	currentUserID := userID.(uint)

	canManage := HasPermission(c, ctrl.DB, models.PermissionTasksManage)
	canCollaborate := HasPermission(c, ctrl.DB, models.PermissionTasksCollaborate) || canManage

	if !canCollaborate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var tasks []models.Task
	query := ctrl.DB.Preload("Assignee").Preload("Creator")

	statusFilter := c.Query("status")
	// For backlog (ideas), show all ideas to everyone with access
	// For other statuses, apply the mine filter if needed
	if statusFilter != "backlog" {
		if !canManage || c.Query("mine") == "1" {
			query = query.Where("(assignee_id = ? OR creator_id = ?)", currentUserID, currentUserID)
		}
	} else {
		// For backlog, only filter by mine if explicitly requested and user is not a manager
		if !canManage && c.Query("mine") == "1" {
			query = query.Where("creator_id = ?", currentUserID)
		}
	}

	if statusFilter != "" {
		query = query.Where("status = ?", statusFilter)
	}

	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}

	if search := c.Query("search"); search != "" {
		query = query.Where("title LIKE ? OR description LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query = query.Order("board_order ASC, updated_at DESC")

	if err := query.Find(&tasks).Error; err != nil {
		log.Printf("Failed to fetch tasks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	managerMap, err := fetchManagerUserMap(ctrl.DB)
	if err != nil {
		log.Printf("Failed to fetch manager user IDs: %v", err)
		managerMap = map[uint]bool{}
	}

	// Add created_by_manager field to each task
	type TaskWithManager struct {
		models.Task
		CreatedByManager bool `json:"created_by_manager"`
	}
	tasksWithManager := make([]TaskWithManager, len(tasks))
	for i, task := range tasks {
		tasksWithManager[i] = TaskWithManager{
			Task:             task,
			CreatedByManager: managerMap[task.CreatorID],
		}
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasksWithManager, "can_manage": canManage})
}

func (ctrl *AdminTasksController) GetMeta(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionTasksManage) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var users []struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		IsActive bool   `json:"is_active"`
	}

	if err := ctrl.DB.Model(&models.AdminUser{}).
		Select("id, username, is_active").
		Where("is_active = ?", true).
		Order("username ASC").
		Scan(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignees"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"assignees": users})
}

func (ctrl *AdminTasksController) CreateTask(c *gin.Context) {
	userID, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	currentUserID := userID.(uint)
	canManage := HasPermission(c, ctrl.DB, models.PermissionTasksManage)
	canCollaborate := HasPermission(c, ctrl.DB, models.PermissionTasksCollaborate) || canManage

	if !canCollaborate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		Title       string              `json:"title" binding:"required"`
		Description string              `json:"description"`
		Status      models.TaskStatus   `json:"status"`
		Priority    models.TaskPriority `json:"priority"`
		AssigneeID  *uint               `json:"assignee_id"`
		DueDate     *time.Time          `json:"due_date"`
		Tags        []string            `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if req.Status == "" {
		req.Status = models.TaskStatusTodo
	}
	if req.Priority == "" {
		req.Priority = models.TaskPriorityMedium
	}

	assigneeID := req.AssigneeID
	if !canManage {
		// For collaborate-only users, assign to themselves (ignore assignee_id from request)
		assigneeID = &currentUserID
	} else if assigneeID == nil && req.Status != models.TaskStatusBacklog {
		// For managers creating non-backlog tasks, if no assignee specified, assign to creator
		assigneeID = &currentUserID
	}

	task := models.Task{
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		AssigneeID:  assigneeID,
		CreatorID:   currentUserID,
		DueDate:     req.DueDate,
		BoardOrder:  int(time.Now().Unix()),
	}
	task.Tags = models.StringArray(req.Tags)

	if err := ctrl.DB.Create(&task).Error; err != nil {
		log.Printf("Failed to create task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	ctrl.DB.Preload("Assignee").Preload("Creator").First(&task, task.ID)
	c.JSON(http.StatusOK, gin.H{"task": task})
}

func (ctrl *AdminTasksController) UpdateTask(c *gin.Context) {
	userIDVal, hasUser := c.Get("user_id")
	if !hasUser {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	currentUserID := userIDVal.(uint)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if err := ctrl.DB.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch task"})
		return
	}

	canManage := HasPermission(c, ctrl.DB, models.PermissionTasksManage)
	canCollaborate := HasPermission(c, ctrl.DB, models.PermissionTasksCollaborate) || canManage

	if !canCollaborate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	type updateRequest struct {
		Title        *string              `json:"title"`
		Description  *string              `json:"description"`
		Status       *models.TaskStatus   `json:"status"`
		Priority     *models.TaskPriority `json:"priority"`
		AssigneeID   *uint                `json:"assignee_id"`
		DueDate      *time.Time           `json:"due_date"`
		Tags         []string             `json:"tags"`
		BoardOrder   *int                 `json:"board_order"`
		ReviewStatus *string              `json:"review_status"`
		ReviewNotes  *string              `json:"review_notes"`
	}
	var req updateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if !canManage && task.AssigneeID != nil && *task.AssigneeID != currentUserID && task.CreatorID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the assignee can update this task"})
		return
	}

	updates := map[string]any{}
	if req.Title != nil && canManage {
		updates["title"] = *req.Title
	}
	if req.Description != nil && canManage {
		updates["description"] = *req.Description
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Priority != nil && canManage {
		updates["priority"] = *req.Priority
	}
	if req.AssigneeID != nil && canManage {
		updates["assignee_id"] = req.AssigneeID
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
	if req.ReviewStatus != nil {
		if canManage {
			// Managers can set review_status to any value
			if *req.ReviewStatus == "" {
				updates["review_status"] = nil
			} else {
				updates["review_status"] = *req.ReviewStatus
			}
		} else if *req.ReviewStatus == "" && task.Status == models.TaskStatusReview {
			// Non-managers can reset review_status to null when requesting re-review
			updates["review_status"] = nil
		}
	}
	// Allow non-managers to update review_notes when requesting re-review
	if req.ReviewNotes != nil {
		if canManage {
			updates["review_notes"] = req.ReviewNotes
		} else if task.Status == models.TaskStatusReview {
			// Non-managers can update review_notes when task is in review status
			updates["review_notes"] = req.ReviewNotes
		}
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No changes provided"})
		return
	}

	if err := ctrl.DB.Model(&task).Updates(updates).Error; err != nil {
		log.Printf("Failed to update task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	ctrl.DB.Preload("Assignee").Preload("Creator").First(&task, task.ID)
	c.JSON(http.StatusOK, gin.H{"task": task})
}

func (ctrl *AdminTasksController) DeleteTask(c *gin.Context) {
	if !HasPermission(c, ctrl.DB, models.PermissionTasksManage) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	taskID := uint(id)

	// Check if task exists
	var task models.Task
	if err := ctrl.DB.First(&task, taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		log.Printf("Failed to find task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find task"})
		return
	}

	// Use transaction to ensure atomicity
	err = ctrl.DB.Transaction(func(tx *gorm.DB) error {
		// First, delete all related task messages
		result := tx.Where("task_id = ?", taskID).Delete(&models.TaskMessage{})
		if result.Error != nil {
			log.Printf("Warning: Failed to delete task messages: %v", result.Error)
			// Continue anyway - messages might not exist or foreign key might not be enforced
		} else {
			log.Printf("Deleted %d task messages for task ID=%d", result.RowsAffected, taskID)
		}

		// Then delete the task
		if err := tx.Delete(&task).Error; err != nil {
			log.Printf("Error deleting task: %v", err)
			return err
		}

		return nil
	})

	if err != nil {
		log.Printf("Failed to delete task in transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task: " + err.Error()})
		return
	}

	log.Printf("✅ Task deleted successfully: ID=%d, Title=%s", taskID, task.Title)
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}
