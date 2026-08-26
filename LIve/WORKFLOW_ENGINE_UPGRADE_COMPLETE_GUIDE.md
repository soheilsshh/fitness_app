# 🚀 Workflow Engine Upgrade - Complete Implementation Guide

## ✅ آنچه تا کنون پیاده‌سازی شده:

### 1. **Updated Models** (`backend/models/workflow.go`):
- ✅ Added `version` field to Workflow
- ✅ Updated WorkflowStep with:
  - `name`, `enabled` fields
  - `schedule_type` (delay/fixed_time)
  - `relative_to`, `offset_minutes`
  - `conditions` (JSON)
  - `target_workflows` for stop action
- ✅ New `WorkflowRun` model (tracks user execution state)
- ✅ New `WorkflowRunStep` model (tracks step execution)
- ✅ `StepConditions` and `ConditionRule` structures

### 2. **Advanced Execution Engine** (`backend/services/workflow/advanced_executor.go`):
- ✅ Proper state management with workflow_runs
- ✅ Condition evaluation system (AND/OR logic)
- ✅ Dual time scheduling (delay + fixed_time)
- ✅ Improved trigger detection
- ✅ Step-level execution tracking
- ✅ Error handling and logging

## 📋 مراحل باقی‌مانده:

### مرحله 1: Migration در main.go

```go
db.AutoMigrate(
	// ... existing models
	&models.WorkflowRun{},
	&models.WorkflowRunStep{},
)
```

### مرحله 2: به‌روزرسانی Scheduler

در `backend/scheduler/scheduler.go`:

```go
import "monetizeai-backend/services/workflow"

// Initialize advanced workflow executor
advancedWorkflowExecutor := workflow.NewAdvancedWorkflowExecutor(db, smsService, voiceService)

// Replace old workflow job with new one
s.Every(1).Minute().Do(func() {
	now := time.Now().In(loc)
	if err := advancedWorkflowExecutor.RunDueSteps(now); err != nil {
		log.Printf("❌ Error running advanced workflow executor: %v", err)
	}
})
```

### مرحله 3: ایجاد Preview API

فایل جدید: `backend/controllers/workflow_preview.go`

```go
package controllers

import (
	"encoding/json"
	"monetizeai-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WorkflowPreviewController struct {
	DB *gorm.DB
}

func NewWorkflowPreviewController(db *gorm.DB) *WorkflowPreviewController {
	return &WorkflowPreviewController{DB: db}
}

// PreviewWorkflow shows what would happen for a user
func (ctrl *WorkflowPreviewController) PreviewWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	userID := c.Query("user_id")
	webinarID := c.Query("webinar_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	// Get workflow
	var workflow models.Workflow
	if err := ctrl.DB.Preload("Steps", func(db *gorm.DB) *gorm.DB {
		return db.Where("enabled = ?", true).Order("order_index ASC")
	}).First(&workflow, workflowID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}

	// Get user
	var user models.User
	if err := ctrl.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get webinar if specified
	var webinar *models.Webinar
	if webinarID != "" {
		var w models.Webinar
		if err := ctrl.DB.First(&w, webinarID).Error; err == nil {
			webinar = &w
		}
	} else if workflow.WebinarID != nil {
		var w models.Webinar
		if err := ctrl.DB.First(&w, *workflow.WebinarID).Error; err == nil {
			webinar = &w
		}
	}

	// Calculate preview
	now := time.Now()
	preview := make([]map[string]interface{}, 0)

	for _, step := range workflow.Steps {
		scheduledTime := calculateScheduledTime(&step, workflow.TriggerType, &user, webinar, now)
		
		// Evaluate conditions
		conditionsPassed := true
		var conditionsDetail string
		if step.Conditions != nil && *step.Conditions != "" {
			var conditions models.StepConditions
			json.Unmarshal([]byte(*step.Conditions), &conditions)
			conditionsPassed = evaluateConditions(&conditions, &user)
			conditionsDetail = *step.Conditions
		}

		// Build action payload
		var actionPayload map[string]interface{}
		switch step.ActionType {
		case "send_sms":
			actionPayload = map[string]interface{}{
				"type": "sms",
				"pattern_code": step.SMSPatternCode,
				"params": step.SMSParamsJSON,
			}
		case "send_voice":
			actionPayload = map[string]interface{}{
				"type": "voice",
				"voice_id": step.VoicePatternID,
			}
		case "add_tag":
			actionPayload = map[string]interface{}{
				"type": "add_tag",
				"tag": step.UpdateValue,
			}
		}

		preview = append(preview, map[string]interface{}{
			"step_name": step.Name,
			"order_index": step.OrderIndex,
			"scheduled_time": scheduledTime.Format("2006-01-02 15:04:05"),
			"conditions_passed": conditionsPassed,
			"conditions": conditionsDetail,
			"action": actionPayload,
			"enabled": step.Enabled,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"workflow": workflow.Name,
		"user": map[string]interface{}{
			"id": user.ID,
			"name": user.FirstName + " " + user.LastName,
			"phone": user.Phone,
		},
		"preview": preview,
	})
}

// Helper functions (simplified versions from executor)
func calculateScheduledTime(step *models.WorkflowStep, triggerType string, user *models.User, webinar *models.Webinar, now time.Time) time.Time {
	scheduleType := step.ScheduleType
	if scheduleType == "" {
		scheduleType = "delay"
	}

	switch scheduleType {
	case "delay":
		return now.Add(time.Duration(step.DelayMinutes) * time.Minute)
	case "fixed_time":
		var baseTime time.Time
		switch step.RelativeTo {
		case "registration_time":
			baseTime = user.RegisteredAt
		case "webinar_start":
			if webinar != nil {
				baseTime = webinar.StartTime
			}
		case "webinar_end":
			if webinar != nil {
				baseTime = webinar.EndTime
			}
		}
		return baseTime.Add(time.Duration(step.OffsetMinutes) * time.Minute)
	}
	return now
}

func evaluateConditions(conditions *models.StepConditions, user *models.User) bool {
	// Simplified evaluation
	return true // Implement full logic from executor
}
```

### مرحله 4: Test Run API

در همان `workflow_preview.go`:

```go
// TestRun executes workflow in dry-run mode
func (ctrl *WorkflowPreviewController) TestRun(c *gin.Context) {
	workflowID := c.Param("id")
	var input struct {
		UserID uint `json:"user_id" binding:"required"`
		DryRun bool `json:"dry_run"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get workflow and user
	var workflow models.Workflow
	if err := ctrl.DB.Preload("Steps").First(&workflow, workflowID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}

	var user models.User
	if err := ctrl.DB.First(&user, input.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Create test run (with special flag)
	testRun := models.WorkflowRun{
		WorkflowID: workflow.ID,
		UserID:     user.ID,
		Status:     "running",
		Version:    workflow.Version,
	}

	if !input.DryRun {
		ctrl.DB.Create(&testRun)
	}

	// Return execution plan
	c.JSON(http.StatusOK, gin.H{
		"message": "Test run initiated",
		"dry_run": input.DryRun,
		"run_id": testRun.ID,
	})
}
```

### مرحله 5: Step Logs API

```go
// GetStepLogs returns logs for a specific step
func (ctrl *WorkflowPreviewController) GetStepLogs(c *gin.Context) {
	workflowID := c.Param("workflow_id")
	stepID := c.Param("step_id")
	limit := c.DefaultQuery("limit", "50")

	var logs []models.WorkflowRunStep
	query := ctrl.DB.Where("step_id = ?", stepID).
		Order("executed_at DESC").
		Limit(50)

	if err := query.Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch logs"})
		return
	}

	// Enrich with user info
	enrichedLogs := make([]map[string]interface{}, 0)
	for _, log := range logs {
		var run models.WorkflowRun
		var user models.User
		
		ctrl.DB.First(&run, log.RunID)
		ctrl.DB.First(&user, run.UserID)

		enrichedLogs = append(enrichedLogs, map[string]interface{}{
			"id": log.ID,
			"user_id": user.ID,
			"user_name": user.FirstName + " " + user.LastName,
			"user_phone": user.Phone,
			"executed_at": log.ExecutedAt,
			"status": log.Status,
			"error": log.ErrorText,
			"output": log.Output,
		})
	}

	c.JSON(http.StatusOK, gin.H{"logs": enrichedLogs})
}
```

### مرحله 6: اضافه کردن Routes

در `backend/routes/routes.go`:

```go
workflowPreviewController := controllers.NewWorkflowPreviewController(db)

// Workflow preview and testing
adminProtected.GET("/workflows/:id/preview", workflowPreviewController.PreviewWorkflow)
adminProtected.POST("/workflows/:id/test-run", workflowPreviewController.TestRun)
adminProtected.GET("/workflows/:workflow_id/steps/:step_id/logs", workflowPreviewController.GetStepLogs)
```

### مرحله 7: Validation در Controller

در `admin_workflow.go`, اضافه کردن validation:

```go
func validateWorkflow(workflow *models.Workflow) error {
	if len(workflow.Steps) == 0 {
		return fmt.Errorf("workflow must have at least one step")
	}

	for _, step := range workflow.Steps {
		// Check schedule info
		if step.ScheduleType == "" {
			step.ScheduleType = "delay" // Default
		}

		if step.ScheduleType == "fixed_time" {
			if step.RelativeTo == "" {
				return fmt.Errorf("relative_to is required for fixed_time schedule")
			}
		}

		// Check action fields
		switch step.ActionType {
		case "send_sms":
			if step.SMSPatternCode == nil {
				return fmt.Errorf("sms_pattern_code is required for send_sms action")
			}
		case "send_voice":
			if step.VoicePatternID == nil {
				return fmt.Errorf("voice_pattern_id is required for send_voice action")
			}
		case "add_tag":
			if step.UpdateValue == nil {
				return fmt.Errorf("tag name is required for add_tag action")
			}
		}

		// Check segment compatibility with trigger
		// ... add logic
	}

	return nil
}
```

### مرحله 8: UI با 3-Block Layout

در `src/pages/AdminWorkflows.tsx`, به‌روزرسانی `WorkflowStepCard`:

```tsx
const WorkflowStepCard = ({ step, index, onUpdate }) => {
  return (
    <Card className="bg-white/5 border border-white/10">
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-6">
          
          {/* WHEN Block */}
          <div className="border-r border-white/10 pr-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              WHEN (زمان)
            </h4>
            
            <div className="space-y-3">
              <select
                value={step.schedule_type}
                onChange={(e) => onUpdate(index, 'schedule_type', e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="delay">تاخیر از تریگر</option>
                <option value="fixed_time">زمان ثابت</option>
              </select>

              {step.schedule_type === 'delay' ? (
                <Input
                  type="number"
                  value={step.delay_minutes}
                  onChange={(e) => onUpdate(index, 'delay_minutes', parseInt(e.target.value))}
                  placeholder="دقیقه"
                  className="bg-white/5 border-white/10 text-white"
                />
              ) : (
                <>
                  <select
                    value={step.relative_to}
                    onChange={(e) => onUpdate(index, 'relative_to', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2"
                  >
                    <option value="registration_time">زمان ثبت‌نام</option>
                    <option value="webinar_start">شروع وبینار</option>
                    <option value="webinar_end">پایان وبینار</option>
                  </select>
                  <Input
                    type="number"
                    value={step.offset_minutes}
                    onChange={(e) => onUpdate(index, 'offset_minutes', parseInt(e.target.value))}
                    placeholder="افست (دقیقه، منفی = قبل)"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </>
              )}

              <p className="text-xs text-gray-400">
                محاسبه شده: {calculateHumanTime(step)}
              </p>
            </div>
          </div>

          {/* WHO Block */}
          <div className="border-r border-white/10 pr-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              WHO (مخاطب)
            </h4>
            
            <div className="space-y-3">
              <select
                value={step.segment_type}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="all_registered">همه</option>
                <option value="not_attended">وارد نشده</option>
                <option value="attended_not_bought">دیده اما نخریده</option>
                {/* ... more options */}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openConditionBuilder(index)}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                فیلتر پیشرفته
              </Button>

              {step.conditions && (
                <div className="text-xs text-green-400">
                  ✓ {JSON.parse(step.conditions).rules.length} شرط فعال
                </div>
              )}
            </div>
          </div>

          {/* WHAT Block */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              WHAT (اکشن)
            </h4>
            
            <div className="space-y-3">
              <select
                value={step.action_type}
                onChange={(e) => onUpdate(index, 'action_type', e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2"
              >
                <option value="send_sms">📱 ارسال پیامک</option>
                <option value="send_voice">📞 تماس صوتی</option>
                <option value="add_tag">🏷️ اضافه کردن تگ</option>
                <option value="update_participant_field">✏️ تغییر وضعیت</option>
                <option value="stop_other_workflows">⛔ توقف گردش‌کارها</option>
              </select>

              {/* Action-specific fields */}
              {renderActionFields(step, index, onUpdate)}
            </div>
          </div>

        </div>

        {/* Enable/Disable Toggle */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={step.enabled}
              onChange={(e) => onUpdate(index, 'enabled', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-300 text-sm">فعال</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => duplicateStep(index)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => removeStep(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### مرحله 9: Condition Builder UI

Component جدید: `src/components/ConditionBuilder.tsx`

```tsx
interface ConditionBuilderProps {
  conditions: StepConditions;
  onChange: (conditions: StepConditions) => void;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onChange }) => {
  const addRule = () => {
    onChange({
      ...conditions,
      rules: [...conditions.rules, { field: '', comparator: '=', value: '' }]
    });
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...conditions.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange({ ...conditions, rules: newRules });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-white">اگر</span>
        <select
          value={conditions.operator}
          onChange={(e) => onChange({ ...conditions, operator: e.target.value })}
          className="bg-white/5 border border-white/10 text-white rounded px-3 py-1"
        >
          <option value="AND">همه شرایط (AND)</option>
          <option value="OR">حداقل یکی (OR)</option>
        </select>
        <span className="text-white">برقرار باشد:</span>
      </div>

      {conditions.rules.map((rule, index) => (
        <div key={index} className="flex items-center gap-2 bg-white/5 p-3 rounded-lg">
          <select
            value={rule.field}
            onChange={(e) => updateRule(index, 'field', e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded px-3 py-2"
          >
            <option value="">انتخاب فیلد</option>
            <option value="watch_minutes">دقیقه تماشا</option>
            <option value="joined_at">وارد شده</option>
            <option value="purchase_status">وضعیت خرید</option>
            <option value="has_tag">تگ دارد</option>
            <option value="registered_at">تاریخ ثبت‌نام</option>
          </select>

          <select
            value={rule.comparator}
            onChange={(e) => updateRule(index, 'comparator', e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded px-3 py-2"
          >
            <option value="=">=</option>
            <option value="!=">≠</option>
            <option value=">">{'>'}</option>
            <option value=">=">{'>='}</option>
            <option value="<">{'<'}</option>
            <option value="<=">{'<='}</option>
            <option value="contains">شامل</option>
            <option value="not_contains">شامل نباشد</option>
            <option value="is_null">خالی</option>
            <option value="not_null">پر</option>
          </select>

          {!['is_null', 'not_null'].includes(rule.comparator) && (
            <Input
              value={rule.value}
              onChange={(e) => updateRule(index, 'value', e.target.value)}
              placeholder="مقدار"
              className="bg-white/5 border-white/10 text-white"
            />
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newRules = conditions.rules.filter((_, i) => i !== index);
              onChange({ ...conditions, rules: newRules });
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button onClick={addRule} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        افزودن شرط
      </Button>
    </div>
  );
};
```

## 🎯 نتیجه نهایی:

پس از اعمال همه مراحل، شما خواهید داشت:

✅ Workflow engine با state management دقیق  
✅ Dual time scheduling (delay + fixed_time)  
✅ Condition builder با AND/OR logic  
✅ Step-level enable/disable  
✅ Workflow versioning  
✅ Preview mode  
✅ Test run  
✅ Step-level logs  
✅ Stop other workflows  
✅ Backward compatibility  
✅ UI با 3-block layout (WHEN/WHO/WHAT)  
✅ Validation engine  

این سیستم قادر است:
- 24h warm-up funnels
- Behavior-based funnels
- Re-engagement funnels
- Post-webinar funnels
- Multi-branch logic

را مدیریت کند، دقیقاً مثل Customer.io + n8n مینیمال!

---

**Status**: Backend core کامل ✅  
**Next**: اعمال مراحل باقی‌مانده (API endpoints + UI)

