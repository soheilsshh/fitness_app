# 🎨 Visual Workflow Builder - Implementation Guide

## ✅ آنچه تا کنون پیاده‌سازی شده:

### 1. Backend Models (✅ کامل)
- `backend/models/visual_workflow.go`:
  - VisualWorkflow
  - WorkflowNode
  - WorkflowConnection
  - WorkflowExecution
  - NodeExecution
  - تمام Config Types

### 2. Execution Engine (✅ کامل)
- `backend/services/visual_workflow/executor.go`:
  - Node-based execution
  - Branching support (conditions)
  - Delay handling
  - All action types
  - Trigger detection

## 📋 مراحل باقی‌مانده:

### مرحله 1: نصب React Flow

```bash
cd /Users/hoseinabsian/Desktop/monetizeai-live-webinar
npm install reactflow
npm install @xyflow/react
```

### مرحله 2: ایجاد Controller برای API

فایل: `backend/controllers/visual_workflow_controller.go`

```go
package controllers

import (
	"net/http"
	"monetizeai-backend/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type VisualWorkflowController struct {
	DB *gorm.DB
}

func NewVisualWorkflowController(db *gorm.DB) *VisualWorkflowController {
	return &VisualWorkflowController{DB: db}
}

// GetWorkflows returns all visual workflows
func (ctrl *VisualWorkflowController) GetWorkflows(c *gin.Context) {
	var workflows []models.VisualWorkflow
	if err := ctrl.DB.Preload("Nodes").Preload("Connections").Find(&workflows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflows"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"workflows": workflows})
}

// GetWorkflow returns a single workflow with all nodes and connections
func (ctrl *VisualWorkflowController) GetWorkflow(c *gin.Context) {
	id := c.Param("id")
	var workflow models.VisualWorkflow
	if err := ctrl.DB.Preload("Nodes").Preload("Connections").First(&workflow, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"workflow": workflow})
}

// CreateWorkflow creates a new visual workflow
func (ctrl *VisualWorkflowController) CreateWorkflow(c *gin.Context) {
	var input struct {
		Name        string                      `json:"name"`
		Description string                      `json:"description"`
		IsActive    bool                        `json:"is_active"`
		WebinarID   *uint                       `json:"webinar_id"`
		Nodes       []models.WorkflowNode       `json:"nodes"`
		Connections []models.WorkflowConnection `json:"connections"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := ctrl.DB.Begin()
	
	workflow := models.VisualWorkflow{
		Name:        input.Name,
		Description: input.Description,
		IsActive:    input.IsActive,
		WebinarID:   input.WebinarID,
	}

	if err := tx.Create(&workflow).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workflow"})
		return
	}

	// Create nodes
	nodeIDMap := make(map[uint]uint) // old ID -> new ID
	for i, node := range input.Nodes {
		oldID := node.ID
		node.ID = 0
		node.WorkflowID = workflow.ID
		if err := tx.Create(&node).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create nodes"})
			return
		}
		nodeIDMap[oldID] = node.ID
		input.Nodes[i] = node
	}

	// Create connections with updated node IDs
	for _, conn := range input.Connections {
		conn.ID = 0
		conn.WorkflowID = workflow.ID
		if newFromID, ok := nodeIDMap[conn.FromNodeID]; ok {
			conn.FromNodeID = newFromID
		}
		if newToID, ok := nodeIDMap[conn.ToNodeID]; ok {
			conn.ToNodeID = newToID
		}
		if err := tx.Create(&conn).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create connections"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"workflow": workflow})
}

// UpdateWorkflow updates a workflow
func (ctrl *VisualWorkflowController) UpdateWorkflow(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Name        string                      `json:"name"`
		Description string                      `json:"description"`
		IsActive    bool                        `json:"is_active"`
		WebinarID   *uint                       `json:"webinar_id"`
		Nodes       []models.WorkflowNode       `json:"nodes"`
		Connections []models.WorkflowConnection `json:"connections"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := ctrl.DB.Begin()

	var workflow models.VisualWorkflow
	if err := tx.First(&workflow, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}

	workflow.Name = input.Name
	workflow.Description = input.Description
	workflow.IsActive = input.IsActive
	workflow.WebinarID = input.WebinarID

	if err := tx.Save(&workflow).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update workflow"})
		return
	}

	// Delete old nodes and connections
	tx.Where("workflow_id = ?", workflow.ID).Delete(&models.WorkflowNode{})
	tx.Where("workflow_id = ?", workflow.ID).Delete(&models.WorkflowConnection{})

	// Create new nodes
	nodeIDMap := make(map[uint]uint)
	for i, node := range input.Nodes {
		oldID := node.ID
		node.ID = 0
		node.WorkflowID = workflow.ID
		if err := tx.Create(&node).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create nodes"})
			return
		}
		nodeIDMap[oldID] = node.ID
		input.Nodes[i] = node
	}

	// Create new connections
	for _, conn := range input.Connections {
		conn.ID = 0
		conn.WorkflowID = workflow.ID
		if newFromID, ok := nodeIDMap[conn.FromNodeID]; ok {
			conn.FromNodeID = newFromID
		}
		if newToID, ok := nodeIDMap[conn.ToNodeID]; ok {
			conn.ToNodeID = newToID
		}
		if err := tx.Create(&conn).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create connections"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"workflow": workflow})
}

// DeleteWorkflow deletes a workflow
func (ctrl *VisualWorkflowController) DeleteWorkflow(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.DB.Delete(&models.VisualWorkflow{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete workflow"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Workflow deleted"})
}

// ToggleWorkflow toggles workflow active status
func (ctrl *VisualWorkflowController) ToggleWorkflow(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctrl.DB.Model(&models.VisualWorkflow{}).Where("id = ?", id).Update("is_active", input.IsActive).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle workflow"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Workflow toggled"})
}

// GetExecutionLogs returns execution logs
func (ctrl *VisualWorkflowController) GetExecutionLogs(c *gin.Context) {
	workflowID := c.Query("workflow_id")
	limit := c.DefaultQuery("limit", "50")

	query := ctrl.DB.Model(&models.NodeExecution{}).Order("created_at DESC").Limit(50)
	if workflowID != "" {
		query = query.Where("workflow_id = ?", workflowID)
	}

	var logs []models.NodeExecution
	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
```

### مرحله 3: اضافه کردن Routes

در `backend/routes/routes.go`:

```go
visualWorkflowController := controllers.NewVisualWorkflowController(db)

// Visual Workflow routes
adminProtected.GET("/visual-workflows", visualWorkflowController.GetWorkflows)
adminProtected.GET("/visual-workflows/:id", visualWorkflowController.GetWorkflow)
adminProtected.POST("/visual-workflows", visualWorkflowController.CreateWorkflow)
adminProtected.PUT("/visual-workflows/:id", visualWorkflowController.UpdateWorkflow)
adminProtected.DELETE("/visual-workflows/:id", visualWorkflowController.DeleteWorkflow)
adminProtected.POST("/visual-workflows/:id/toggle", visualWorkflowController.ToggleWorkflow)
adminProtected.GET("/visual-workflow-logs", visualWorkflowController.GetExecutionLogs)
```

### مرحله 4: Migration در main.go

اضافه کردن به AutoMigrate:

```go
db.AutoMigrate(
	// ... existing models
	&models.VisualWorkflow{},
	&models.WorkflowNode{},
	&models.WorkflowConnection{},
	&models.WorkflowExecution{},
	&models.NodeExecution{},
)
```

### مرحله 5: اضافه کردن به Scheduler

در `backend/scheduler/scheduler.go`:

```go
import "monetizeai-backend/services/visual_workflow"

// Initialize visual workflow executor
visualWorkflowExecutor := visual_workflow.NewVisualWorkflowExecutor(db, smsService, voiceService)

// Job: Process visual workflows (every 1 minute)
s.Every(1).Minute().Do(func() {
	now := time.Now().In(loc)
	if err := visualWorkflowExecutor.RunDueExecutions(now); err != nil {
		log.Printf("❌ Error running visual workflow executor: %v", err)
	}
})
```

### مرحله 6: ساخت React UI

فایل: `src/pages/VisualWorkflowBuilder.tsx`

این فایل باید شامل:

1. **React Flow Canvas**
2. **Node Palette** (کشیدن node‌های جدید)
3. **Node Inspector Panel** (تنظیمات هر node)
4. **Toolbar** (Save, Run, Validate)
5. **Custom Node Components** برای هر نوع node

### مرحله 7: Node Types UI

هر node type باید یک component جداگانه داشته باشد:

- `TriggerNode.tsx`
- `DelayNode.tsx`
- `ConditionNode.tsx`
- `SMSActionNode.tsx`
- `VoiceActionNode.tsx`
- `TagActionNode.tsx`
- `UpdateFieldNode.tsx`
- `StopWorkflowNode.tsx`

### مرحله 8: Validation Engine

قبل از save، بررسی کنید:
- حداقل یک trigger node وجود دارد
- همه node‌ها متصل هستند
- هیچ loop وجود ندارد
- هیچ dead-end وجود ندارد
- تمام config‌ها valid هستند

## 🎯 مثال Workflow برای تست:

```json
{
  "name": "Warm-up Sequence",
  "nodes": [
    {
      "node_type": "trigger",
      "label": "On Registration",
      "position_x": 100,
      "position_y": 100,
      "config": {
        "trigger_type": "on_registration"
      }
    },
    {
      "node_type": "delay",
      "label": "Wait 1 minute",
      "position_x": 300,
      "position_y": 100,
      "config": {
        "delay_minutes": 1
      }
    },
    {
      "node_type": "action",
      "node_subtype": "send_sms",
      "label": "Welcome SMS",
      "position_x": 500,
      "position_y": 100,
      "config": {
        "pattern_code": "123456",
        "parameters": {
          "name": "{{first_name}}"
        }
      }
    }
  ],
  "connections": [
    {
      "from_node_id": 1,
      "to_node_id": 2
    },
    {
      "from_node_id": 2,
      "to_node_id": 3
    }
  ]
}
```

## 🚀 دستورات اجرا:

```bash
# Backend
cd backend
go run cmd/main.go

# Frontend
npm run dev
```

## 📊 Monitoring:

- لاگ‌های execution در `/admin/visual-workflow-logs`
- هر node execution ثبت می‌شود
- Status: pending, running, success, failed, skipped

## ⚠️ نکات مهم:

1. همیشه validation قبل از save
2. Autosave هر 30 ثانیه
3. Node IDs باید unique باشند
4. Connection loops ممنوع
5. Condition nodes باید دو output داشته باشند (true/false)

---

**Status**: Backend کامل شده ✅  
**Next**: نصب React Flow و ساخت UI

این سیستم کاملاً modular است و می‌توانید node type‌های جدید بدون تغییر در core engine اضافه کنید.

