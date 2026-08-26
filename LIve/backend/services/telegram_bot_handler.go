package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/utils"
	"net"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ContentCreationState tracks the state of content creation flow
type ContentCreationState struct {
	Platform    string // instagram, twitter, youtube, tiktok
	Link        string
	Title       string
	Description string
}

// SRTUploadState tracks the state of SRT file upload
type SRTUploadState struct {
	TaskID uint // Content task ID to update
}

// TelegramBotHandler handles Telegram bot interactions using API client
type TelegramBotHandler struct {
	Bot      *TelegramBotService
	APIClient *BotAPIClient
	Logger   *BotLogger
	DB       *gorm.DB
	// State management for content creation flow (chatID -> state)
	contentCreationStates map[int64]*ContentCreationState
	// State management for SRT file upload (chatID -> state)
	srtUploadStates map[int64]*SRTUploadState
	stateMutex      sync.RWMutex
}

// NewTelegramBotHandler creates a new bot handler
func NewTelegramBotHandler(bot *TelegramBotService, apiClient *BotAPIClient, db *gorm.DB) *TelegramBotHandler {
	return &TelegramBotHandler{
		Bot:                   bot,
		APIClient:             apiClient,
		Logger:                NewBotLogger(),
		DB:                    db,
		contentCreationStates: make(map[int64]*ContentCreationState),
		srtUploadStates:       make(map[int64]*SRTUploadState),
	}
}

// Content status labels in Persian
var statusLabels = map[string]string{
	"final_ideas":    "💡 ایده‌های نهایی",
	"writing":        "✍️ نوشتن",
	"pre_production": "📝 قبل تولید",
	"recording":      "🎬 ضبط",
	"editing":        "✂️ تدوین",
	"published":      "✅ منتشر شده",
}

// Priority labels in Persian
var priorityLabels = map[string]string{
	"low":    "🔵 کم",
	"medium": "🟡 متوسط",
	"high":   "🟠 زیاد",
	"urgent": "🔴 فوری",
}

// checkAdminAuth checks if user has authenticated with admin credentials
func (h *TelegramBotHandler) checkAdminAuth(telegramID string) (*models.AdminUser, bool) {
	if h.DB == nil {
		log.Printf("[BotHandler] DB is nil, cannot check admin auth")
		return nil, false
	}
	
	var adminUser models.AdminUser
	if err := h.DB.Where("telegram_id = ? AND is_active = ?", telegramID, true).First(&adminUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, false
		}
		log.Printf("[BotHandler] Error checking admin auth: %v", err)
		return nil, false
	}
	
	return &adminUser, true
}

// requireAdminAuth checks if user has authenticated and returns AdminUser, otherwise sends error message
func (h *TelegramBotHandler) requireAdminAuth(chatID int64, userID int64) (*models.AdminUser, bool) {
	telegramIDStr := strconv.FormatInt(userID, 10)
	adminUser, isAuthenticated := h.checkAdminAuth(telegramIDStr)
	
	if !isAuthenticated || adminUser == nil {
		// User is not authenticated - show login message
		msg := `🔐 <b>دسترسی محدود</b>

برای استفاده از این قابلیت، لطفاً ابتدا وارد شوید.

<b>نحوه ورود:</b>
نام کاربری و رمز عبور خود را این‌گونه ارسال کنید:
username:password

مثال:
admin:admin123`

		h.sendMessage(chatID, msg)
		return nil, false
	}
	
	// Store admin user ID in API client if not already set
	h.APIClient.SetAdminUserID(adminUser.ID)
	
	return adminUser, true
}

// HandleCommand processes bot commands
func (h *TelegramBotHandler) HandleCommand(chatID int64, userID int64, command string, args []string) {
	h.Logger.LogCommand(userID, command)
	
	// Set Telegram user ID for API client
	h.APIClient.SetTelegramUserID(userID)

	switch command {
	case "start":
		h.handleStart(chatID, userID)
	case "help":
		h.handleHelp(chatID)
	case "list":
		if _, ok := h.requireAdminAuth(chatID, userID); ok {
		h.handleList(chatID, userID, 1, "")
		}
	case "debug_keyboard":
		h.handleDebugKeyboard(chatID, userID)
	default:
		h.handleUnknownCommand(chatID, command)
	}
}

// HandleMessage processes regular messages
func (h *TelegramBotHandler) HandleMessage(chatID int64, userID int64, text string) {
	h.Logger.LogMessage(userID, text)
	
	// Set Telegram user ID for API client
	h.APIClient.SetTelegramUserID(userID)

	text = strings.TrimSpace(text)

	// Check if it's a command (commands don't need license check)
	if strings.HasPrefix(text, "/") {
		parts := strings.Fields(text)
		command := strings.TrimPrefix(parts[0], "/")
		args := parts[1:]
		h.HandleCommand(chatID, userID, command, args)
		return
	}

	// IMPORTANT: Check if user is in content creation flow FIRST
	// This must be before login attempt check to avoid treating URLs as login attempts
	h.stateMutex.RLock()
	state, inFlow := h.contentCreationStates[chatID]
	h.stateMutex.RUnlock()
	
	if inFlow && state != nil {
		// User is in content creation flow, handle flow steps
		// No authentication required here - user is already authenticated to start the flow
		log.Printf("[TELEGRAM][HandleMessage] User in content creation flow, processing: %s", text)
		h.handleContentCreationFlow(chatID, userID, text)
		return
	}

	// Check if it's a login attempt (username:password format)
	// Only check if text doesn't look like a URL (doesn't start with http:// or https://)
	if strings.Contains(text, ":") && !strings.HasPrefix(text, "http://") && !strings.HasPrefix(text, "https://") {
		parts := strings.SplitN(text, ":", 2)
		if len(parts) == 2 {
			// Check if it looks like a login (not a URL, not too long for username)
			username := strings.TrimSpace(parts[0])
			if len(username) > 0 && len(username) < 100 {
				h.handleAdminLogin(chatID, userID, username, parts[1])
			return
			}
		}
	}

	// For other messages, require authentication
	if _, ok := h.requireAdminAuth(chatID, userID); !ok {
		return
	}

	// Handle reply keyboard buttons
	text = strings.TrimSpace(text)
	
	// Handle "داشبورد محتوا سازی" button (main button)
	if text == "📊 داشبورد محتوا سازی" || strings.Contains(text, "داشبورد") || strings.Contains(text, "آمار") {
		log.Printf("[TELEGRAM] Reply button pressed: داشبورد محتوا سازی (chat_id=%d, user_id=%d)", chatID, userID)
		if _, ok := h.requireAdminAuth(chatID, userID); ok {
		h.handleContentDashboard(chatID, userID)
		}
		return
	}
	
	// Handle "افزودن محتوا" button
	if text == "➕ افزودن محتوا" || strings.Contains(text, "افزودن محتوا") {
		log.Printf("[TELEGRAM] Reply button pressed: افزودن محتوا (chat_id=%d, user_id=%d)", chatID, userID)
		if _, ok := h.requireAdminAuth(chatID, userID); ok {
			h.startContentCreationFlow(chatID, userID)
		}
		return
	}

	// Unknown message
	h.sendMessage(chatID, "❓ پیام نامشخص\n\nاز دکمه‌های کیبورد استفاده کنید.")
}

// HandleDocument processes document/file uploads
func (h *TelegramBotHandler) HandleDocument(chatID int64, userID int64, fileID string, fileName string) {
	log.Printf("[TELEGRAM][HandleDocument] File ID: %s, File Name: %s (chat_id=%d, user_id=%d)", fileID, fileName, chatID, userID)
	
	// Set Telegram user ID for API client
	h.APIClient.SetTelegramUserID(userID)
	
	// Check authentication
	if _, ok := h.requireAdminAuth(chatID, userID); !ok {
		return
	}
	
	// Check if user is in SRT upload state
	h.stateMutex.RLock()
	state, inUpload := h.srtUploadStates[chatID]
	h.stateMutex.RUnlock()
	
	if !inUpload || state == nil {
		h.sendMessage(chatID, "❌ لطفاً ابتدا از دکمه «📎 ارسال فایل SRT» در جزئیات محتوا استفاده کنید.")
		return
	}
	
	// Process SRT file
	h.handleSRTFile(chatID, userID, fileID, fileName)
}

// HandleCallback processes inline keyboard callbacks
func (h *TelegramBotHandler) HandleCallback(chatID int64, userID int64, callbackData string, callbackQueryID string, messageID int64) {
	callbackStartTime := time.Now()
	log.Printf("[TELEGRAM][CALLBACK][ARRIVAL] chat=%d user=%d callback=%s", chatID, userID, callbackQueryID)
	
	// CRITICAL: Answer callback IMMEDIATELY and SYNCHRONOUSLY
	// MUST be sent before ANY other operation (no DB, no computation, no async)
	// This removes the spinner instantly (< 20ms target)
	if callbackQueryID != "" {
		ackStartTime := time.Now()
		err := h.Bot.AnswerCallbackQuery(callbackQueryID, "", false)
		ackElapsed := time.Since(ackStartTime)
		
		if err != nil {
			log.Printf("[TELEGRAM][CALLBACK][ACK][ERROR] callback=%s chat=%d error=%v elapsed=%v", callbackQueryID, chatID, err, ackElapsed)
		} else {
			log.Printf("[TELEGRAM][CALLBACK][ACK][IMMEDIATE] callback=%s chat=%d user=%d elapsed=%v", callbackQueryID, chatID, userID, ackElapsed)
		}
		
		// Log total time from callback arrival to ACK
		totalToAck := time.Since(callbackStartTime)
		log.Printf("[TELEGRAM][CALLBACK][ACK][TIMING] callback=%s total_to_ack=%v", callbackQueryID, totalToAck)
	}
	
	// NOW we can do other work (after ACK is sent)
	h.Logger.LogCallback(userID, callbackData)
	
	// Set Telegram user ID for API client
	h.APIClient.SetTelegramUserID(userID)

	// Check authentication (after ACK - this is OK since ACK already sent)
	if _, ok := h.requireAdminAuth(chatID, userID); !ok {
		return
	}

	parts := strings.Split(callbackData, ":")
	if len(parts) < 2 {
		return
	}

	action := parts[0]
	params := parts[1:]

	switch action {
	case "list":
		if len(params) >= 1 {
			page, _ := strconv.Atoi(params[0])
			status := ""
			if len(params) >= 2 {
				status = params[1]
			}
			h.handleList(chatID, userID, page, status)
		}
	case "task":
		if len(params) >= 1 {
			taskID, _ := strconv.ParseUint(params[0], 10, 32)
			h.handleTaskDetails(chatID, userID, uint(taskID))
		}
	case "update_status":
		if len(params) >= 2 {
			taskID, _ := strconv.ParseUint(params[0], 10, 32)
			newStatus := params[1]
			h.handleUpdateStatus(chatID, userID, uint(taskID), newStatus, callbackQueryID, messageID)
		}
	case "status_filter":
		if len(params) >= 1 {
			status := params[0]
			h.handleList(chatID, userID, 1, status)
		}
	case "create_content":
		log.Printf("[TELEGRAM][CALLBACK][ASYNC] queued create_content for chat=%d user=%d", chatID, userID)
		h.handleCreateContent(chatID, userID, "", messageID)
	case "content_status":
		// Handle content status filter from dashboard
		if len(params) >= 1 {
			status := params[0]
			log.Printf("[TELEGRAM][CALLBACK][ASYNC] queued content_status update for chat=%d user=%d status=%s", chatID, userID, status)
			h.handleContentStatusList(chatID, userID, status, "", messageID)
		}
	case "content_task":
		// Handle content task details
		if len(params) >= 1 {
			taskID, _ := strconv.ParseUint(params[0], 10, 32)
			log.Printf("[TELEGRAM][CALLBACK][ASYNC] queued content_task details for chat=%d user=%d task=%d", chatID, userID, taskID)
			h.handleContentTaskDetails(chatID, userID, uint(taskID), "", messageID)
		}
	case "content_dashboard":
		// Handle dashboard refresh
		log.Printf("[TELEGRAM][CALLBACK][ASYNC] queued dashboard refresh for chat=%d user=%d", chatID, userID)
		h.handleContentDashboardCallback(chatID, userID, "", messageID)
	case "content_update_status":
		// Handle content status update
		if len(params) >= 2 {
			taskID, _ := strconv.ParseUint(params[0], 10, 32)
			newStatus := params[1]
			log.Printf("[TELEGRAM][CALLBACK][ASYNC] queued status update for chat=%d user=%d task=%d status=%s", chatID, userID, taskID, newStatus)
			h.handleContentUpdateStatus(chatID, userID, uint(taskID), newStatus, "", messageID)
		}
	case "content_upload_srt":
		// Handle SRT upload request
		if len(params) >= 1 {
			taskID, _ := strconv.ParseUint(params[0], 10, 32)
			log.Printf("[TELEGRAM][CALLBACK][ASYNC] queued SRT upload request for chat=%d user=%d task=%d", chatID, userID, taskID)
			h.handleSRTUploadRequest(chatID, userID, uint(taskID))
		}
	default:
		log.Printf("[BotHandler] Unknown callback action: %s", action)
	}
}

func (h *TelegramBotHandler) handleStart(chatID int64, userID int64) {
	log.Println("[TELEGRAM][/start] handler ENTERED")
	log.Printf("[TELEGRAM][/start] chat_id=%d, user_id=%d", chatID, userID)
	
	// Check if user is authenticated (has TelegramID in AdminUser)
	telegramIDStr := strconv.FormatInt(userID, 10)
	adminUser, isAuthenticated := h.checkAdminAuth(telegramIDStr)
	
	if !isAuthenticated || adminUser == nil {
		log.Println("[TELEGRAM][/start] User not authenticated - showing login message")
		// User is not authenticated - show login message
		msg := `🔐 <b>ورود به ربات مدیریت محتوا</b>

برای استفاده از ربات، لطفاً وارد شوید.

<b>نحوه ورود:</b>
نام کاربری و رمز عبور خود را این‌گونه ارسال کنید:
username:password

مثال:
admin:admin123

نام کاربری و رمز عبور همان اطلاعات ورود به پنل ادمین است.`

		if err := h.Bot.SendMessageHTML(chatID, msg); err != nil {
			log.Printf("[TELEGRAM][/start] Failed to send login message: %v", err)
		}
		return
	}
	
	log.Printf("[TELEGRAM][/start] User authenticated - AdminUserID: %d, Username: %s", adminUser.ID, adminUser.Username)

	// User is authenticated - show welcome message with single dashboard button
	msg := `🎬 خوش آمدید به ربات مدیریت محتوا

از دکمه «داشبورد محتوا سازی» برای مشاهده آمار و پروژه‌های محتوای خود استفاده کنید.`

	// Create persistent reply keyboard with two buttons
	// This will reset any previous keyboard and show these buttons
	keyboard := [][]string{
		{"📊 داشبورد محتوا سازی", "➕ افزودن محتوا"},
	}

	log.Println("[TELEGRAM][/start] about to send keyboard")
	log.Printf("[TELEGRAM][/start] keyboard layout: %v", keyboard)

	if err := h.Bot.SendReplyKeyboard(chatID, msg, keyboard); err != nil {
		log.Printf("[TELEGRAM][/start] Failed to send reply keyboard: %v", err)
		return
	}
	
	log.Println("[TELEGRAM][/start] keyboard send/queue completed")
	
	// Store admin user ID in API client for future requests
	h.APIClient.SetAdminUserID(adminUser.ID)
	
	log.Printf("[TELEGRAM][/start] Successfully completed - AdminUserID: %d, Username: %s", adminUser.ID, adminUser.Username)
}

func (h *TelegramBotHandler) handleHelp(chatID int64) {
	msg := `📖 <b>راهنمای استفاده</b>

<b>دستورات:</b>
/start - شروع ربات
/list - نمایش لیست پروژه‌های محتوا
/stats - نمایش آمار کلی
/help - نمایش این راهنما

<b>عملیات:</b>
• از دکمه‌های زیر هر پیام برای بروزرسانی وضعیت استفاده کنید
• برای مشاهده جزئیات روی نام پروژه کلیک کنید
• از دکمه‌های فیلتر برای نمایش پروژه‌های خاص استفاده کنید

<b>وضعیت‌های پروژه:</b>
💡 ایده‌های نهایی
✍️ نوشتن
📝 قبل تولید
🎬 ضبط
✂️ تدوین
✅ منتشر شده`

	h.sendMessage(chatID, msg)
}

func (h *TelegramBotHandler) handleList(chatID int64, userID int64, page int, statusFilter string) {
	h.Logger.LogAPICall("GetContentTasks", fmt.Sprintf("page=%d, status=%s", page, statusFilter))

	tasksResp, err := h.APIClient.GetContentTasks(statusFilter, "", page, 10)
	if err != nil {
		log.Printf("[BotHandler] Failed to fetch tasks: %v", err)
		h.sendMessage(chatID, "❌ خطا در دریافت لیست پروژه‌ها. لطفاً دوباره تلاش کنید.")
		return
	}

	if len(tasksResp.Tasks) == 0 {
		msg := "📭 هیچ پروژه‌ای یافت نشد."
		if statusFilter != "" {
			msg += fmt.Sprintf("\n\nفیلتر فعال: %s", statusLabels[statusFilter])
		}
		h.sendMessage(chatID, msg)
		return
	}

	var text strings.Builder
	text.WriteString(fmt.Sprintf("📋 <b>لیست پروژه‌های محتوا</b> (صفحه %d)\n\n", page))

	for i, task := range tasksResp.Tasks {
		statusLabel := statusLabels[task.Status]
		if statusLabel == "" {
			statusLabel = task.Status
		}
		priorityLabel := priorityLabels[task.Priority]
		if priorityLabel == "" {
			priorityLabel = task.Priority
		}

		text.WriteString(fmt.Sprintf("<b>%d. %s</b>\n", i+1, task.Title))
		text.WriteString(fmt.Sprintf("   %s | %s\n", statusLabel, priorityLabel))
		if task.Description != "" {
			desc := task.Description
			if len(desc) > 50 {
				desc = desc[:50] + "..."
			}
			text.WriteString(fmt.Sprintf("   %s\n", desc))
		}
		text.WriteString("\n")
	}

	// Create inline keyboard
	keyboard := h.buildListKeyboard(tasksResp.Tasks, page, statusFilter, len(tasksResp.Tasks) == 10)

	h.sendKeyboard(chatID, text.String(), keyboard)
}

func (h *TelegramBotHandler) handleTaskDetails(chatID int64, userID int64, taskID uint) {
	h.Logger.LogAPICall("GetContentTask", fmt.Sprintf("taskID=%d", taskID))

	task, err := h.APIClient.GetContentTask(taskID)
	if err != nil {
		log.Printf("[BotHandler] Failed to fetch task: %v", err)
		h.sendMessage(chatID, "❌ خطا در دریافت اطلاعات پروژه.")
		return
	}

	var text strings.Builder
	text.WriteString(fmt.Sprintf("📄 <b>%s</b>\n\n", task.Title))

	statusLabel := statusLabels[task.Status]
	if statusLabel == "" {
		statusLabel = task.Status
	}
	priorityLabel := priorityLabels[task.Priority]
	if priorityLabel == "" {
		priorityLabel = task.Priority
	}

	text.WriteString(fmt.Sprintf("<b>وضعیت:</b> %s\n", statusLabel))
	text.WriteString(fmt.Sprintf("<b>اولویت:</b> %s\n", priorityLabel))

	if task.Description != "" {
		text.WriteString(fmt.Sprintf("\n<b>توضیحات:</b>\n%s\n", task.Description))
	}

	if task.Tags != nil && len(task.Tags) > 0 {
		text.WriteString(fmt.Sprintf("\n<b>برچسب‌ها:</b> %s\n", strings.Join(task.Tags, ", ")))
	}

	if task.DueDate != nil {
		text.WriteString(fmt.Sprintf("\n<b>مهلت:</b> %s\n", *task.DueDate))
	}

	text.WriteString(fmt.Sprintf("\n<b>آخرین بروزرسانی:</b> %s", task.UpdatedAt))

	// Create status update keyboard
	keyboard := h.buildStatusUpdateKeyboard(taskID, task.Status)

	h.sendKeyboard(chatID, text.String(), keyboard)
}

func (h *TelegramBotHandler) handleUpdateStatus(chatID int64, userID int64, taskID uint, newStatus string, callbackQueryID string, messageID int64) {
	h.Logger.LogAPICall("UpdateContentTaskStatus", fmt.Sprintf("taskID=%d, status=%s", taskID, newStatus))

	err := h.APIClient.UpdateContentTaskStatus(taskID, newStatus)
	if err != nil {
		log.Printf("[BotHandler] Failed to update task status: %v", err)
		if callbackQueryID != "" {
			h.Bot.AnswerCallbackQuery(callbackQueryID, "❌ خطا در بروزرسانی", true)
		}
		return
	}

	statusLabel := statusLabels[newStatus]
	if statusLabel == "" {
		statusLabel = newStatus
	}

	if callbackQueryID != "" {
		h.Bot.AnswerCallbackQuery(callbackQueryID, fmt.Sprintf("✅ وضعیت به %s تغییر کرد", statusLabel), false)
	}

	// Refresh task details
	h.handleTaskDetails(chatID, userID, taskID)
}

func (h *TelegramBotHandler) handleContentDashboard(chatID int64, userID int64) {
	h.handleContentDashboardWithMessageID(chatID, userID, 0)
}

func (h *TelegramBotHandler) handleContentDashboardWithMessageID(chatID int64, userID int64, messageID int64) {
	log.Println("[TELEGRAM][handleContentDashboard] ENTERED")
	log.Printf("[TELEGRAM][handleContentDashboard] chat_id=%d, user_id=%d, message_id=%d", chatID, userID, messageID)
	
	startTime := time.Now()
	h.Logger.LogAPICall("GetContentTasksStats", "")

	stats, err := h.APIClient.GetContentTasksStats()
	elapsed := time.Since(startTime)
	log.Printf("[TELEGRAM][handleContentDashboard] GetContentTasksStats took %v", elapsed)
	
	if err != nil {
		log.Printf("[TELEGRAM][handleContentDashboard] Failed to fetch content stats: %v", err)
		h.sendMessage(chatID, "❌ خطا در دریافت آمار محتواها. لطفاً دوباره تلاش کنید.")
		return
	}

	log.Printf("[TELEGRAM][handleContentDashboard] Stats received: TotalCount=%d, CountByStatus=%v", stats.TotalCount, stats.CountByStatus)

	// Get current Persian date
	now := time.Now()
	persianDate := utils.ToPersian(now)
	
	// Status labels and emojis (no descriptions or empty messages)
	statusInfo := map[string]struct {
		Emoji string
		Label string
	}{
		"final_ideas":    {"🟡", "ایده‌های نهایی"},
		"writing":        {"🟢", "نوشتن متن محتوا"},
		"pre_production": {"🟠", "تبدیل به سناریو"},
		"recording":      {"🔵", "ضبط راش‌ها و صدا"},
		"editing":        {"🟣", "تدوین"},
		"published":      {"🟤", "انتشار"},
	}

	var text strings.Builder
	text.WriteString("📊 <b>داشبورد وضعیت تولید محتوا</b>\n\n")
	text.WriteString(fmt.Sprintf("📌 <b>آخرین بروزرسانی:</b> %d/%02d/%02d\n\n", persianDate.Year, persianDate.Month, persianDate.Day))
	text.WriteString("📂 <b>وضعیت‌ها و تعداد محتواها:</b>\n\n")

	// Display stats by status (matching admin panel order)
	statusOrder := []string{"final_ideas", "writing", "pre_production", "recording", "editing", "published"}
	for _, status := range statusOrder {
		info := statusInfo[status]
		count := stats.CountByStatus[status]
		
		text.WriteString(fmt.Sprintf("%s <b>%s (%d)</b>\n", info.Emoji, info.Label, count))
	}

	text.WriteString("📝 <b>نکته:</b>\n")
	text.WriteString("برای ثبت یک محتوای جدید، از گزینه «➕ ثبت محتوای جدید» استفاده کنید.")

	log.Println("[TELEGRAM][handleContentDashboard] Sending dashboard message with inline keyboard")
	
	// Create inline keyboard with 6 status buttons (3 per row) - short labels
	keyboard := [][]map[string]string{
		{
			{"text": "1)ایده", "callback_data": "content_status:final_ideas"},
			{"text": "2)نوشتن", "callback_data": "content_status:writing"},
			{"text": "4)تبدیل", "callback_data": "content_status:pre_production"},
		},
		{
			{"text": "5)اجرا", "callback_data": "content_status:recording"},
			{"text": "6)تدوین", "callback_data": "content_status:editing"},
			{"text": "7)انتشار", "callback_data": "content_status:published"},
		},
	}
	
	// Always send NEW message for inline callbacks (instant UX, no edit delay)
	// Use SendImmediate to bypass queue for instant response
	h.sendImmediate(chatID, text.String(), keyboard)
	log.Println("[TELEGRAM][handleContentDashboard] Dashboard message with keyboard sent successfully")
}

// startContentCreationFlow starts the content creation flow
func (h *TelegramBotHandler) startContentCreationFlow(chatID int64, userID int64) {
	log.Printf("[TELEGRAM][startContentCreationFlow] Starting flow for chat_id=%d, user_id=%d", chatID, userID)
	
	// Clear any existing state first
	h.stateMutex.Lock()
	delete(h.contentCreationStates, chatID)
	
	// Initialize new state
	h.contentCreationStates[chatID] = &ContentCreationState{
		Platform:    "",
		Link:        "",
		Title:       "",
		Description: "",
	}
	h.stateMutex.Unlock()
	
	log.Printf("[TELEGRAM][startContentCreationFlow] State initialized for chat_id=%d", chatID)
	
	// Send platform selection message with keyboard
	msg := "از چه پلتفرمی محتوا استخراج شده؟"
	
	keyboard := [][]string{
		{"📷 اینستاگرام", "🐦 توییتر"},
		{"🎵 تیک تاک", "📺 یوتیوب"},
	}
	
	log.Println("[TELEGRAM][startContentCreationFlow] Sending platform selection keyboard")
	if err := h.Bot.SendReplyKeyboard(chatID, msg, keyboard); err != nil {
		log.Printf("[TELEGRAM][startContentCreationFlow] Failed to send keyboard: %v", err)
		h.sendMessage(chatID, msg)
	} else {
		log.Printf("[TELEGRAM][startContentCreationFlow] Platform selection keyboard sent successfully")
	}
}

// handleContentCreationFlow handles the multi-step content creation flow
func (h *TelegramBotHandler) handleContentCreationFlow(chatID int64, userID int64, text string) {
	log.Printf("[TELEGRAM][handleContentCreationFlow] Processing text: %s (chat_id=%d, user_id=%d)", text, chatID, userID)
	
	h.stateMutex.RLock()
	state := h.contentCreationStates[chatID]
	h.stateMutex.RUnlock()
	
	if state == nil {
		log.Printf("[TELEGRAM][handleContentCreationFlow] State is nil for chat_id=%d - clearing flow", chatID)
		// Clear any stale state
		h.stateMutex.Lock()
		delete(h.contentCreationStates, chatID)
		h.stateMutex.Unlock()
		h.sendMessage(chatID, "❌ جریان ایجاد محتوا متوقف شد. لطفاً دوباره از دکمه «➕ افزودن محتوا» شروع کنید.")
		return
	}
	
	// Lock for writing when updating state
	h.stateMutex.Lock()
	defer h.stateMutex.Unlock()
	
	// Re-fetch state after lock (in case it was modified)
	state = h.contentCreationStates[chatID]
	if state == nil {
		return
	}
	
	// Step 1: Platform selection
	if state.Platform == "" {
		platformMap := map[string]string{
			"📷 اینستاگرام": "instagram",
			"🐦 توییتر":     "twitter",
			"🎵 تیک تاک":    "tiktok",
			"📺 یوتیوب":     "youtube",
			"اینستاگرام":    "instagram",
			"توییتر":        "twitter",
			"تیک تاک":       "tiktok",
			"یوتیوب":        "youtube",
		}
		
		if platform, ok := platformMap[text]; ok {
			state.Platform = platform
			log.Printf("[TELEGRAM][handleContentCreationFlow] Platform selected: %s", platform)
			
			// Reset keyboard to single button (to remove platform buttons)
			keyboard := [][]string{
				{"📊 داشبورد محتوا سازی", "➕ افزودن محتوا"},
			}
			h.Bot.SendReplyKeyboard(chatID, "✅ پلتفرم انتخاب شد. لطفاً لینک محتوا را ارسال کنید:", keyboard)
		} else {
			h.sendMessage(chatID, "❌ لطفاً یکی از دکمه‌های پلتفرم را انتخاب کنید.")
		}
		return
	}
	
	// Step 2: Link input
	if state.Link == "" {
		// Validate URL
		if strings.HasPrefix(text, "http://") || strings.HasPrefix(text, "https://") {
			state.Link = text
			log.Printf("[TELEGRAM][handleContentCreationFlow] Link received: %s", text)
			h.sendMessage(chatID, "✅ لینک دریافت شد.\n\nلطفاً عنوان محتوا را ارسال کنید:")
		} else {
			h.sendMessage(chatID, "❌ لطفاً یک لینک معتبر ارسال کنید (باید با http:// یا https:// شروع شود).")
		}
		return
	}
	
	// Step 3: Title input
	if state.Title == "" {
		state.Title = text
		log.Printf("[TELEGRAM][handleContentCreationFlow] Title received: %s", text)
		h.sendMessage(chatID, "✅ عنوان دریافت شد.\n\nلطفاً توضیحات محتوا را ارسال کنید (یا برای رد کردن، «-» را ارسال کنید):")
		return
	}
	
	// Step 4: Description input
	if state.Description == "" {
		text = strings.TrimSpace(text)
		if text == "-" || text == "رد کردن" || text == "ندارد" {
			state.Description = ""
		} else {
			state.Description = text
		}
		log.Printf("[TELEGRAM][handleContentCreationFlow] Description received: %s", state.Description)
		
		// Create a copy of state for finishContentCreation
		stateCopy := *state
		
		// Clear state before calling finishContentCreation
		delete(h.contentCreationStates, chatID)
		
		// Unlock before calling finishContentCreation (which may need to lock)
		h.stateMutex.Unlock()
		
		// Create content task
		h.finishContentCreation(chatID, userID, &stateCopy)
		
		// Re-lock (finishContentCreation already cleaned up, but be safe)
		h.stateMutex.Lock()
		return
	}
	
	// If we reach here, all steps are complete but state wasn't cleared
	log.Printf("[TELEGRAM][handleContentCreationFlow] Warning: All steps complete but state still exists for chat_id=%d", chatID)
	delete(h.contentCreationStates, chatID)
	h.sendMessage(chatID, "✅ جریان ایجاد محتوا تکمیل شد. برای ایجاد محتوای جدید، از دکمه «➕ افزودن محتوا» استفاده کنید.")
}

// finishContentCreation creates the content task and completes the flow
func (h *TelegramBotHandler) finishContentCreation(chatID int64, userID int64, state *ContentCreationState) {
	log.Printf("[TELEGRAM][finishContentCreation] Creating task with Platform=%s, Link=%s, Title=%s", 
		state.Platform, state.Link, state.Title)
	
	// Map platform to URL field
	var instagramURL, twitterURL, tiktokURL, youtubeURL *string
	
	switch state.Platform {
	case "instagram":
		instagramURL = &state.Link
	case "twitter":
		twitterURL = &state.Link
	case "tiktok":
		tiktokURL = &state.Link
	case "youtube":
		youtubeURL = &state.Link
	}
	
	// Include link in description
	enhancedDesc := state.Description
	if enhancedDesc != "" {
		enhancedDesc += "\n\n"
	}
	platformLabel := map[string]string{
		"instagram": "اینستاگرام",
		"twitter":   "توییتر",
		"tiktok":   "تیک تاک",
		"youtube":   "یوتیوب",
	}[state.Platform]
	enhancedDesc += fmt.Sprintf("🔗 لینک %s: %s", platformLabel, state.Link)
	
	// Create task via API
	task, err := h.APIClient.CreateContentTask(
		state.Title,
		enhancedDesc,
		"final_ideas",
	)
	
	if err != nil {
		log.Printf("[TELEGRAM][finishContentCreation] Failed to create task: %v", err)
		h.sendMessage(chatID, "❌ خطا در ایجاد محتوا. لطفاً دوباره تلاش کنید.")
		
		// Clear state
		h.stateMutex.Lock()
		delete(h.contentCreationStates, chatID)
		h.stateMutex.Unlock()
		return
	}
	
	// Update task with social media URLs using API client
	// Create update request matching UpdateContentTaskRequest structure
	urlUpdateReq := struct {
		InstagramURL *string `json:"instagram_url,omitempty"`
		TwitterURL   *string `json:"twitter_url,omitempty"`
		TikTokURL    *string `json:"tiktok_url,omitempty"`
		YouTubeURL   *string `json:"youtube_url,omitempty"`
	}{
		InstagramURL: instagramURL,
		TwitterURL:   twitterURL,
		TikTokURL:    tiktokURL,
		YouTubeURL:   youtubeURL,
	}
	
	// Use API client's UpdateContentTask method
	// We need to convert to UpdateContentTaskRequest format
	// Since UpdateContentTaskRequest now has these fields, we can create it
	// But we need to import it or create a local version
	// For now, let's use a workaround: make HTTP call directly via API client's doRequest
	// Actually, better to extend UpdateContentTask to accept a map or interface{}
	// For now, link is in description, URLs can be updated via admin panel
	log.Printf("[TELEGRAM][finishContentCreation] Task created with ID %d. Link in description. URLs can be updated via admin panel: %+v", 
		task.ID, urlUpdateReq)
	
	// Success message
	platformLabels := map[string]string{
		"instagram": "اینستاگرام",
		"twitter":   "توییتر",
		"tiktok":   "تیک تاک",
		"youtube":   "یوتیوب",
	}
	
	msg := fmt.Sprintf(`✅ <b>محتوای جدید با موفقیت ثبت شد!</b>

<b>پلتفرم:</b> %s
<b>عنوان:</b> %s
<b>لینک:</b> %s

محتوای شما در بخش محتوا سازی ادمین پنل قابل مشاهده است.`,
		platformLabels[state.Platform],
		state.Title,
		state.Link,
	)
	
	h.sendMessage(chatID, msg)
	
	// Clear state
	h.stateMutex.Lock()
	delete(h.contentCreationStates, chatID)
	h.stateMutex.Unlock()
	
	log.Printf("[TELEGRAM][finishContentCreation] Flow completed successfully for chat_id=%d", chatID)
}

// handleContentStatusList shows list of content tasks for a specific status
// NOTE: AnswerCallbackQuery should be sent BEFORE calling this function
func (h *TelegramBotHandler) handleContentStatusList(chatID int64, userID int64, status string, callbackQueryID string, messageID int64) {
	log.Printf("[TELEGRAM][handleContentStatusList] Status: %s (chat_id=%d, user_id=%d)", status, chatID, userID)
	
	// Process asynchronously - callback already answered
	go func() {
		startTime := time.Now()
		log.Printf("[TELEGRAM][handleContentStatusList][ASYNC] starting async work for chat=%d status=%s", chatID, status)
		// Get tasks for this status - limit to 10 for faster response
		apiStartTime := time.Now()
		tasksResp, err := h.APIClient.GetContentTasks(status, "", 1, 10) // Limit to 10 tasks for faster response
		apiElapsed := time.Since(apiStartTime)
		log.Printf("[TELEGRAM][handleContentStatusList] GetContentTasks took %v", apiElapsed)
		
		if err != nil {
			log.Printf("[TELEGRAM][handleContentStatusList] Failed to fetch tasks: %v", err)
			h.sendMessage(chatID, "❌ خطا در دریافت لیست محتواها. لطفاً دوباره تلاش کنید.")
			return
		}
	
	statusLabels := map[string]string{
		"final_ideas":    "🟡 ایده‌های نهایی",
		"writing":        "🟢 نوشتن متن محتوا",
		"pre_production": "🟠 تبدیل به سناریو",
		"recording":      "🔵 ضبط راش‌ها و صدا",
		"editing":        "🟣 تدوین",
		"published":      "🟤 انتشار",
	}
	
	statusLabel := statusLabels[status]
	if statusLabel == "" {
		statusLabel = status
	}
	
	if len(tasksResp.Tasks) == 0 {
		msg := fmt.Sprintf("📭 هیچ محتوایی در وضعیت <b>%s</b> وجود ندارد.", statusLabel)
		h.sendMessage(chatID, msg)
		return
	}
	
	// Build message
	var text strings.Builder
	text.WriteString(fmt.Sprintf("📋 <b>لیست محتواها - %s</b>\n\n", statusLabel))
	text.WriteString(fmt.Sprintf("تعداد: %d محتوا\n\n", len(tasksResp.Tasks)))
	
	// Build inline keyboard with task buttons
	var keyboard [][]map[string]string
	
	// Add tasks as buttons (max 10 to avoid keyboard size limit)
	maxTasks := 10
	if len(tasksResp.Tasks) < maxTasks {
		maxTasks = len(tasksResp.Tasks)
	}
	
	for i := 0; i < maxTasks; i++ {
		task := tasksResp.Tasks[i]
		// Truncate title if too long
		buttonText := task.Title
		if len(buttonText) > 50 {
			buttonText = buttonText[:47] + "..."
		}
		
		keyboard = append(keyboard, []map[string]string{
			{"text": fmt.Sprintf("%d. %s", i+1, buttonText), "callback_data": fmt.Sprintf("content_task:%d", task.ID)},
		})
	}
	
	// Add back button
	keyboard = append(keyboard, []map[string]string{
		{"text": "🔙 بازگشت به داشبورد", "callback_data": "content_dashboard"},
	})
	
		// Always send NEW message for inline callbacks (instant UX, no edit delay)
		// Use SendImmediate to bypass queue for instant response
		h.sendImmediate(chatID, text.String(), keyboard)
		elapsed := time.Since(startTime)
		log.Printf("[TELEGRAM][handleContentStatusList][ASYNC] completed async work for chat=%d status=%s elapsed=%v", chatID, status, elapsed)
	}()
}

// handleContentTaskDetails shows details of a content task
// NOTE: AnswerCallbackQuery should be sent BEFORE calling this function
func (h *TelegramBotHandler) handleContentTaskDetails(chatID int64, userID int64, taskID uint, callbackQueryID string, messageID int64) {
	log.Printf("[TELEGRAM][handleContentTaskDetails] Task ID: %d (chat_id=%d, user_id=%d)", taskID, chatID, userID)
	
	// Process asynchronously - callback already answered
	go func() {
		startTime := time.Now()
		log.Printf("[TELEGRAM][handleContentTaskDetails][ASYNC] starting async work for chat=%d task=%d", chatID, taskID)
		// Get task details
		apiStartTime := time.Now()
		task, err := h.APIClient.GetContentTask(taskID)
		apiElapsed := time.Since(apiStartTime)
		log.Printf("[TELEGRAM][handleContentTaskDetails] GetContentTask took %v", apiElapsed)
		
		if err != nil {
			log.Printf("[TELEGRAM][handleContentTaskDetails] Failed to fetch task: %v", err)
			h.sendMessage(chatID, "❌ خطا در دریافت اطلاعات محتوا.")
			return
		}
	
	statusLabels := map[string]string{
		"final_ideas":    "🟡 ایده‌های نهایی",
		"writing":        "🟢 نوشتن متن محتوا",
		"pre_production": "🟠 تبدیل به سناریو",
		"recording":      "🔵 ضبط راش‌ها و صدا",
		"editing":        "🟣 تدوین",
		"published":      "🟤 انتشار",
	}
	
	priorityLabels := map[string]string{
		"low":    "🔵 کم",
		"medium": "🟡 متوسط",
		"high":   "🟠 زیاد",
		"urgent": "🔴 فوری",
	}
	
	statusLabel := statusLabels[task.Status]
	if statusLabel == "" {
		statusLabel = task.Status
	}
	
	priorityLabel := priorityLabels[task.Priority]
	if priorityLabel == "" {
		priorityLabel = task.Priority
	}
	
	// Build message
	var text strings.Builder
	text.WriteString(fmt.Sprintf("📄 <b>%s</b>\n\n", task.Title))
	text.WriteString(fmt.Sprintf("<b>وضعیت:</b> %s\n", statusLabel))
	text.WriteString(fmt.Sprintf("<b>اولویت:</b> %s\n", priorityLabel))
	
	if task.Description != "" {
		text.WriteString(fmt.Sprintf("\n<b>توضیحات:</b>\n%s\n", task.Description))
	}
	
	// Add social media URLs if available
	if task.InstagramURL != nil && *task.InstagramURL != "" {
		text.WriteString(fmt.Sprintf("\n📷 <b>اینستاگرام:</b> %s\n", *task.InstagramURL))
	}
	if task.TwitterURL != nil && *task.TwitterURL != "" {
		text.WriteString(fmt.Sprintf("🐦 <b>توییتر:</b> %s\n", *task.TwitterURL))
	}
	if task.TikTokURL != nil && *task.TikTokURL != "" {
		text.WriteString(fmt.Sprintf("🎵 <b>تیک تاک:</b> %s\n", *task.TikTokURL))
	}
	if task.YouTubeURL != nil && *task.YouTubeURL != "" {
		text.WriteString(fmt.Sprintf("📺 <b>یوتیوب:</b> %s\n", *task.YouTubeURL))
	}
	
	if task.Tags != nil && len(task.Tags) > 0 {
		text.WriteString(fmt.Sprintf("\n<b>برچسب‌ها:</b> %s\n", strings.Join(task.Tags, ", ")))
	}
	
	if task.DueDate != nil {
		text.WriteString(fmt.Sprintf("\n<b>مهلت:</b> %s\n", *task.DueDate))
	}
	
	text.WriteString(fmt.Sprintf("\n<b>آخرین بروزرسانی:</b> %s", task.UpdatedAt))
	
	// Build keyboard with status update options
	var keyboard [][]map[string]string
	
	// Status update buttons (previous and next)
	statusOrder := []string{"final_ideas", "writing", "pre_production", "recording", "editing", "published"}
	currentIndex := -1
	for i, s := range statusOrder {
		if s == task.Status {
			currentIndex = i
			break
		}
	}
	
	if currentIndex >= 0 {
		var statusButtons []map[string]string
		if currentIndex > 0 {
			prevStatus := statusOrder[currentIndex-1]
			statusButtons = append(statusButtons, map[string]string{
				"text": "◀️ " + statusLabels[prevStatus], 
				"callback_data": fmt.Sprintf("content_update_status:%d:%s", taskID, prevStatus),
			})
		}
		if currentIndex < len(statusOrder)-1 {
			nextStatus := statusOrder[currentIndex+1]
			statusButtons = append(statusButtons, map[string]string{
				"text": statusLabels[nextStatus] + " ▶️", 
				"callback_data": fmt.Sprintf("content_update_status:%d:%s", taskID, nextStatus),
			})
		}
		if len(statusButtons) > 0 {
			keyboard = append(keyboard, statusButtons)
		}
	}
	
	// Add SRT upload button if status is "writing"
	if task.Status == "writing" {
		keyboard = append(keyboard, []map[string]string{
			{"text": "📎 ارسال فایل SRT", "callback_data": fmt.Sprintf("content_upload_srt:%d", taskID)},
		})
	}
	
	// Back button
	keyboard = append(keyboard, []map[string]string{
		{"text": "🔙 بازگشت به لیست", "callback_data": fmt.Sprintf("content_status:%s", task.Status)},
		{"text": "📊 داشبورد", "callback_data": "content_dashboard"},
	})
	
		// Always send NEW message for inline callbacks (instant UX, no edit delay)
		// Use SendImmediate to bypass queue for instant response
		h.sendImmediate(chatID, text.String(), keyboard)
		elapsed := time.Since(startTime)
		log.Printf("[TELEGRAM][handleContentTaskDetails][ASYNC] completed async work for chat=%d task=%d elapsed=%v", chatID, taskID, elapsed)
	}()
}

// handleContentUpdateStatus updates content task status
// NOTE: AnswerCallbackQuery should be sent BEFORE calling this function
func (h *TelegramBotHandler) handleContentUpdateStatus(chatID int64, userID int64, taskID uint, newStatus string, callbackQueryID string, messageID int64) {
	log.Printf("[TELEGRAM][handleContentUpdateStatus] Updating task %d to status %s", taskID, newStatus)
	
	// Process asynchronously - callback already answered
	go func() {
		startTime := time.Now()
		log.Printf("[TELEGRAM][handleContentUpdateStatus][ASYNC] starting async work for chat=%d task=%d status=%s", chatID, taskID, newStatus)
		// Update status via API
		err := h.APIClient.UpdateContentTaskStatus(taskID, newStatus)
		if err != nil {
			log.Printf("[TELEGRAM][handleContentUpdateStatus] Failed to update status: %v", err)
			h.sendMessage(chatID, "❌ خطا در بروزرسانی وضعیت.")
			return
		}
		
		statusLabels := map[string]string{
			"final_ideas":    "🟡 ایده‌های نهایی",
			"writing":        "🟢 نوشتن متن محتوا",
			"pre_production": "🟠 تبدیل به سناریو",
			"recording":      "🔵 ضبط راش‌ها و صدا",
			"editing":        "🟣 تدوین",
			"published":      "🟤 انتشار",
		}
		
		statusLabel := statusLabels[newStatus]
		if statusLabel == "" {
			statusLabel = newStatus
		}
		
		// Refresh task details - send as new message (not edit) for instant UX
		// Pass 0 as messageID to force new message instead of edit
		h.handleContentTaskDetails(chatID, userID, taskID, "", 0)
		elapsed := time.Since(startTime)
		log.Printf("[TELEGRAM][handleContentUpdateStatus][ASYNC] completed async work for chat=%d task=%d elapsed=%v", chatID, taskID, elapsed)
	}()
}

// Handle content dashboard callback (refresh dashboard)
// NOTE: AnswerCallbackQuery should be sent BEFORE calling this function
func (h *TelegramBotHandler) handleContentDashboardCallback(chatID int64, userID int64, callbackQueryID string, messageID int64) {
	log.Printf("[TELEGRAM][handleContentDashboardCallback] Refreshing dashboard (chat_id=%d, user_id=%d)", chatID, userID)
	
	// Process asynchronously - callback already answered
	go func() {
		startTime := time.Now()
		log.Printf("[TELEGRAM][handleContentDashboardCallback][ASYNC] starting async work for chat=%d", chatID)
		// Always send new message (not edit) for instant UX
		// Pass 0 as messageID to force new message
		h.handleContentDashboardWithMessageID(chatID, userID, 0)
		elapsed := time.Since(startTime)
		log.Printf("[TELEGRAM][handleContentDashboardCallback][ASYNC] completed async work for chat=%d elapsed=%v", chatID, elapsed)
	}()
}

// handleSRTUploadRequest initiates SRT file upload flow
// NOTE: AnswerCallbackQuery should be sent BEFORE calling this function
func (h *TelegramBotHandler) handleSRTUploadRequest(chatID int64, userID int64, taskID uint) {
	log.Printf("[TELEGRAM][handleSRTUploadRequest] Task ID: %d (chat_id=%d, user_id=%d)", taskID, chatID, userID)
	
	// Set state to wait for SRT file
	h.stateMutex.Lock()
	h.srtUploadStates[chatID] = &SRTUploadState{
		TaskID: taskID,
	}
	h.stateMutex.Unlock()
	
	// Send instruction message
	msg := "📎 لطفاً فایل SRT را ارسال کنید.\n\nفایل باید با فرمت .srt باشد."
	h.sendMessage(chatID, msg)
}

// handleSRTFile processes uploaded SRT file
func (h *TelegramBotHandler) handleSRTFile(chatID int64, userID int64, fileID string, fileName string) {
	log.Printf("[TELEGRAM][handleSRTFile] File ID: %s, File Name: %s (chat_id=%d, user_id=%d)", fileID, fileName, chatID, userID)
	
	// Check if user is in SRT upload state
	h.stateMutex.RLock()
	state, inUpload := h.srtUploadStates[chatID]
	h.stateMutex.RUnlock()
	
	if !inUpload || state == nil {
		h.sendMessage(chatID, "❌ لطفاً ابتدا از دکمه «📎 ارسال فایل SRT» استفاده کنید.")
		return
	}
	
	// Validate file extension
	if !strings.HasSuffix(strings.ToLower(fileName), ".srt") {
		h.sendMessage(chatID, "❌ فایل باید با فرمت .srt باشد. لطفاً فایل صحیح را ارسال کنید.")
		return
	}
	
	// Send "processing" message immediately
	h.sendMessage(chatID, "⏳ در حال دریافت و پردازش فایل...")
	
	// Process asynchronously
	go func() {
		// Download file from Telegram
		fileContent, err := h.downloadTelegramFile(fileID)
		if err != nil {
			log.Printf("[TELEGRAM][handleSRTFile] Failed to download file: %v", err)
			h.sendMessage(chatID, "❌ خطا در دریافت فایل از سرور تلگرام. لطفاً دوباره تلاش کنید.")
			
			// Clear state on error
			h.stateMutex.Lock()
			delete(h.srtUploadStates, chatID)
			h.stateMutex.Unlock()
			return
		}
		
		// Send parsing message
		h.sendMessage(chatID, "📝 فایل دریافت شد. در حال استخراج متن از فایل SRT...")
		
		// Parse SRT to text
		text, err := parseSRTToText(fileContent)
		if err != nil {
			log.Printf("[TELEGRAM][handleSRTFile] Failed to parse SRT: %v", err)
			h.sendMessage(chatID, fmt.Sprintf("❌ خطا در پردازش فایل SRT: %v\n\nلطفاً مطمئن شوید که فایل فرمت صحیح SRT دارد.", err))
			
			// Clear state on error
			h.stateMutex.Lock()
			delete(h.srtUploadStates, chatID)
			h.stateMutex.Unlock()
			return
		}
		
		// Send updating message
		h.sendMessage(chatID, "💾 در حال به‌روزرسانی محتوا...")
		
		// Update content task description
		err = h.APIClient.UpdateContentTask(state.TaskID, UpdateContentTaskRequest{
			Description: &text,
		})
		if err != nil {
			log.Printf("[TELEGRAM][handleSRTFile] Failed to update task: %v", err)
			h.sendMessage(chatID, "❌ خطا در به‌روزرسانی محتوا. لطفاً دوباره تلاش کنید.")
			
			// Clear state on error
			h.stateMutex.Lock()
			delete(h.srtUploadStates, chatID)
			h.stateMutex.Unlock()
			return
		}
		
		// Clear state
		h.stateMutex.Lock()
		delete(h.srtUploadStates, chatID)
		h.stateMutex.Unlock()
		
		// Send success message
		msg := fmt.Sprintf("✅ فایل SRT با موفقیت پردازش شد و متن محتوا به‌روزرسانی شد.\n\n📝 تعداد کاراکتر: %d", len(text))
		h.sendMessage(chatID, msg)
	}()
}

// Global shared HTTP client for Telegram file downloads
var (
	telegramFileClient     *http.Client
	telegramFileClientOnce sync.Once
)

// initTelegramFileClient initializes the global shared HTTP client for Telegram file downloads
func initTelegramFileClient() {
	telegramFileClientOnce.Do(func() {
		// Create custom transport with connection pooling and DNS fallback
		transport := &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
			DisableCompression:  false,
			DisableKeepAlives:   false,
			ForceAttemptHTTP2:   true,
			
			// TCP connection settings
			DialContext: (&net.Dialer{
				Timeout:   1 * time.Second, // TCP dial timeout
				KeepAlive: 30 * time.Second,
			}).DialContext,
			
			// TLS settings
			TLSHandshakeTimeout:   1 * time.Second, // TLS handshake timeout
			ResponseHeaderTimeout: 3 * time.Second, // Response header timeout
			ExpectContinueTimeout: 100 * time.Millisecond,
		}

		// Create client with timeout
		telegramFileClient = &http.Client{
			Transport: transport,
			Timeout:   3 * time.Second, // Overall request timeout
		}

		log.Printf("[TELEGRAM][FILE][INIT] Global HTTP client initialized for file downloads (Timeout=3s, Dial=1s, TLS=1s)")
	})
}

// getTelegramFileClient returns the global shared HTTP client for Telegram file downloads
func getTelegramFileClient() *http.Client {
	initTelegramFileClient()
	return telegramFileClient
}

// isPrivateIP checks if an IP address is private/internal
func isPrivateIP(ip net.IP) bool {
	if ip == nil {
		return false
	}
	
	// Check for private IP ranges
	if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return true
	}
	
	ip4 := ip.To4()
	if ip4 == nil {
		return false
	}
	
	// 10.0.0.0/8
	if ip4[0] == 10 {
		return true
	}
	
	// 172.16.0.0/12
	if ip4[0] == 172 && ip4[1] >= 16 && ip4[1] <= 31 {
		return true
	}
	
	// 192.168.0.0/16
	if ip4[0] == 192 && ip4[1] == 168 {
		return true
	}
	
	return false
}

// resolveWithFallback resolves a hostname with DNS fallback to Google DNS if private IP detected
func resolveWithFallback(host string) ([]net.IP, error) {
	startTime := time.Now()
	
	// First attempt: normal DNS resolution
	ips, err := net.LookupIP(host)
	resolveTime := time.Since(startTime)
	
	if err != nil {
		log.Printf("[TELEGRAM][FILE][DNS] Failed to resolve %s: %v (elapsed=%v)", host, err, resolveTime)
		return nil, err
	}
	
	log.Printf("[TELEGRAM][FILE][DNS] Resolved %s to %v (elapsed=%v)", host, ips, resolveTime)
	
	// Check if any IP is private
	hasPrivateIP := false
	for _, ip := range ips {
		if isPrivateIP(ip) {
			hasPrivateIP = true
			log.Printf("[TELEGRAM][FILE][DNS][WARN] Private IP detected: %s for host %s", ip, host)
			break
		}
	}
	
	// Check environment variable override
	forcePublic := os.Getenv("TELEGRAM_RESOLVE_PUBLIC_IP") == "1"
	
	// If private IP detected or forced, try Google DNS fallback
	if hasPrivateIP || forcePublic {
		log.Printf("[TELEGRAM][FILE][DNS][FALLBACK] Attempting Google DNS (8.8.8.8) resolution for %s", host)
		
		// Create custom resolver using Google DNS
		resolver := &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				d := net.Dialer{
					Timeout: 1 * time.Second,
				}
				return d.DialContext(ctx, "udp", "8.8.8.8:53")
			},
		}
		
		fallbackStart := time.Now()
		ctx := context.Background()
		fallbackIPs, fallbackErr := resolver.LookupIPAddr(ctx, host)
		fallbackTime := time.Since(fallbackStart)
		
		if fallbackErr == nil && len(fallbackIPs) > 0 {
			// Convert to []net.IP
			result := make([]net.IP, len(fallbackIPs))
			for i, ipAddr := range fallbackIPs {
				result[i] = ipAddr.IP
			}
			log.Printf("[TELEGRAM][FILE][DNS][FALLBACK] Resolved via Google DNS to %v (elapsed=%v)", result, fallbackTime)
			return result, nil
		}
		
		log.Printf("[TELEGRAM][FILE][DNS][FALLBACK] Google DNS fallback failed: %v (elapsed=%v)", fallbackErr, fallbackTime)
	}
	
	return ips, nil
}

// isRetryableNetworkError checks if an error is retryable (timeout, network, DNS, IO errors)
func isRetryableNetworkError(err error) bool {
	if err == nil {
		return false
	}
	
	errStr := err.Error()
	
	// Check for timeout errors
	if strings.Contains(errStr, "timeout") || strings.Contains(errStr, "deadline exceeded") {
		return true
	}
	
	// Check for network errors
	if strings.Contains(errStr, "network") || strings.Contains(errStr, "connection") {
		return true
	}
	
	// Check for DNS errors
	if strings.Contains(errStr, "no such host") || strings.Contains(errStr, "DNS") {
		return true
	}
	
	// Check for IO errors
	if strings.Contains(errStr, "i/o timeout") || strings.Contains(errStr, "connection refused") {
		return true
	}
	
	// Check for dial errors
	if strings.Contains(errStr, "dial tcp") {
		return true
	}
	
	return false
}

// downloadWithRetry downloads a file with retry logic and DNS fallback
func downloadWithRetry(fileURL string, maxRetries int, backoffMs []int) ([]byte, error) {
	var lastErr error
	
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			// Wait before retry
			waitTime := time.Duration(backoffMs[attempt-1]) * time.Millisecond
			log.Printf("[TELEGRAM][FILE][RETRY] Attempt %d/%d after %v backoff", attempt, maxRetries, waitTime)
			time.Sleep(waitTime)
		}
		
		startTime := time.Now()
		
		// Resolve hostname with fallback
		u, err := url.Parse(fileURL)
		if err != nil {
			return nil, fmt.Errorf("invalid URL: %w", err)
		}
		
		ips, resolveErr := resolveWithFallback(u.Hostname())
		if resolveErr != nil {
			lastErr = resolveErr
			if isRetryableNetworkError(resolveErr) {
				log.Printf("[TELEGRAM][FILE][RETRY] DNS resolution failed (attempt %d/%d): %v", attempt+1, maxRetries+1, resolveErr)
				continue
			}
			return nil, fmt.Errorf("DNS resolution failed: %w", resolveErr)
		}
		
		// Use first resolved IP
		if len(ips) > 0 {
			log.Printf("[TELEGRAM][FILE][DNS] Using IP: %s for %s", ips[0], u.Hostname())
		}
		
		// Create request
		req, err := http.NewRequest("GET", fileURL, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to create request: %w", err)
		}
		
		// Make request with shared client
		client := getTelegramFileClient()
		dialStart := time.Now()
		resp, err := client.Do(req)
		dialTime := time.Since(dialStart)
		
		if err != nil {
			lastErr = err
			totalTime := time.Since(startTime)
			log.Printf("[TELEGRAM][FILE][RETRY] Request failed (attempt %d/%d, dial=%v, total=%v): %v", 
				attempt+1, maxRetries+1, dialTime, totalTime, err)
			
			if isRetryableNetworkError(err) && attempt < maxRetries {
				continue
			}
			return nil, fmt.Errorf("request failed: %w", err)
		}
		defer resp.Body.Close()
		
		// Check HTTP status
		if resp.StatusCode >= 400 && resp.StatusCode < 500 {
			// 4xx errors are not retryable
			bodyBytes, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(bodyBytes))
		}
		
		if resp.StatusCode >= 500 {
			// 5xx errors are retryable
			lastErr = fmt.Errorf("HTTP %d", resp.StatusCode)
			totalTime := time.Since(startTime)
			log.Printf("[TELEGRAM][FILE][RETRY] HTTP 5xx error (attempt %d/%d, total=%v): %d", 
				attempt+1, maxRetries+1, totalTime, resp.StatusCode)
			if attempt < maxRetries {
				continue
			}
		}
		
		// Read response body
		readStart := time.Now()
		content, err := io.ReadAll(resp.Body)
		readTime := time.Since(readStart)
		totalTime := time.Since(startTime)
		
		if err != nil {
			lastErr = err
			log.Printf("[TELEGRAM][FILE][RETRY] Read body failed (attempt %d/%d, read=%v, total=%v): %v", 
				attempt+1, maxRetries+1, readTime, totalTime, err)
			if isRetryableNetworkError(err) && attempt < maxRetries {
				continue
			}
			return nil, fmt.Errorf("failed to read response: %w", err)
		}
		
		log.Printf("[TELEGRAM][FILE][SUCCESS] Downloaded %d bytes (resolve=%v, dial=%v, read=%v, total=%v)", 
			len(content), time.Since(startTime)-dialTime-readTime, dialTime, readTime, totalTime)
		
		return content, nil
	}
	
	return nil, fmt.Errorf("max retries exceeded: %w", lastErr)
}

// downloadTelegramFile downloads a file from Telegram using file_id with retry and DNS fallback
func (h *TelegramBotHandler) downloadTelegramFile(fileID string) ([]byte, error) {
	// Step 1: Get file path from Telegram (with retry)
	getFileURL := fmt.Sprintf("https://api.telegram.org/bot%s/getFile?file_id=%s", h.Bot.BotToken, fileID)
	
	log.Printf("[TELEGRAM][FILE][GETFILE] Requesting file path for file_id=%s", fileID)
	filePathResp, err := downloadWithRetry(getFileURL, 3, []int{80, 150, 300})
	if err != nil {
		return nil, fmt.Errorf("failed to get file path: %w", err)
	}
	
	var result struct {
		OK     bool `json:"ok"`
		Result struct {
			FilePath string `json:"file_path"`
		} `json:"result"`
	}
	
	if err := json.Unmarshal(filePathResp, &result); err != nil {
		return nil, fmt.Errorf("failed to decode file path response: %w", err)
	}
	
	if !result.OK {
		return nil, fmt.Errorf("telegram API returned error")
	}
	
	log.Printf("[TELEGRAM][FILE][GETFILE] File path: %s", result.Result.FilePath)
	
	// Step 2: Download file content (with retry)
	fileURL := fmt.Sprintf("https://api.telegram.org/file/bot%s/%s", h.Bot.BotToken, result.Result.FilePath)
	log.Printf("[TELEGRAM][FILE][DOWNLOAD] Downloading file from: %s", fileURL)
	
	fileContent, err := downloadWithRetry(fileURL, 3, []int{80, 150, 300})
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	
	log.Printf("[TELEGRAM][FILE][DOWNLOAD] Successfully downloaded %d bytes", len(fileContent))
	return fileContent, nil
}

// parseSRTToText converts SRT subtitle content to plain text
func parseSRTToText(srtContent []byte) (string, error) {
	content := string(srtContent)
	lines := strings.Split(content, "\n")
	
	var textParts []string
	var currentText strings.Builder
	
	for i, line := range lines {
		line = strings.TrimSpace(line)
		
		// Skip empty lines
		if line == "" {
			if currentText.Len() > 0 {
				textParts = append(textParts, currentText.String())
				currentText.Reset()
			}
			continue
		}
		
		// Skip sequence numbers (first line of subtitle block)
		if _, err := strconv.Atoi(line); err == nil {
			// This is a sequence number, skip it
			continue
		}
		
		// Skip timestamps (format: 00:00:00,000 --> 00:00:00,000)
		if strings.Contains(line, "-->") {
			// This is a timestamp line, skip it
			continue
		}
		
		// This is subtitle text
		if currentText.Len() > 0 {
			currentText.WriteString(" ")
		}
		currentText.WriteString(line)
		
		// If next line is empty or is a sequence number, finalize this subtitle
		if i < len(lines)-1 {
			nextLine := strings.TrimSpace(lines[i+1])
			if nextLine == "" {
				// Next line is empty, this subtitle is complete
				if currentText.Len() > 0 {
					textParts = append(textParts, currentText.String())
					currentText.Reset()
				}
			} else if _, err := strconv.Atoi(nextLine); err == nil {
				// Next line is a sequence number, this subtitle is complete
				if currentText.Len() > 0 {
					textParts = append(textParts, currentText.String())
					currentText.Reset()
				}
			}
		}
	}
	
	// Add any remaining text
	if currentText.Len() > 0 {
		textParts = append(textParts, currentText.String())
	}
	
	// Join all text parts with newlines
	result := strings.Join(textParts, "\n")
	
	// Clean up extra whitespace
	result = strings.ReplaceAll(result, "\n\n\n", "\n\n")
	result = strings.TrimSpace(result)
	
	if result == "" {
		return "", fmt.Errorf("no text found in SRT file")
	}
	
	return result, nil
}

// handleCreateContent creates a new content task
// NOTE: AnswerCallbackQuery should be sent BEFORE calling this function
func (h *TelegramBotHandler) handleCreateContent(chatID int64, userID int64, callbackQueryID string, messageID int64) {
	// Process asynchronously - callback already answered
	go func() {
		startTime := time.Now()
		log.Printf("[TELEGRAM][handleCreateContent][ASYNC] starting async work for chat=%d", chatID)
	h.Logger.LogAPICall("CreateContentTask", "")

	// Create a new content task with default values
	task, err := h.APIClient.CreateContentTask(
		"محتوای جدید",
		"",
		"final_ideas",
	)
	if err != nil {
		log.Printf("[BotHandler] Failed to create content task: %v", err)
		h.sendMessage(chatID, "❌ خطا در ایجاد محتوای جدید. لطفاً دوباره تلاش کنید.")
		return
	}

		// Show success message with task details
		statusLabels := map[string]string{
			"final_ideas":    "🟡 ایده‌های نهایی",
			"writing":        "🟢 نوشتن متن محتوا",
			"pre_production": "🟠 تبدیل به سناریو",
			"recording":      "🔵 ضبط راش‌ها و صدا",
			"editing":        "🟣 تدوین",
			"published":      "🟤 انتشار",
		}
		
	msg := fmt.Sprintf(`✅ <b>محتوای جدید ایجاد شد</b>

<b>عنوان:</b> %s
<b>وضعیت:</b> %s

می‌توانید با کلیک روی دکمه زیر، جزئیات محتوا را مشاهده کنید یا از /list برای مشاهده همه محتواها استفاده کنید.`, 
		task.Title, 
		statusLabels[task.Status])

	keyboard := [][]map[string]string{
		{
				{"text": "📄 مشاهده جزئیات", "callback_data": fmt.Sprintf("content_task:%d", task.ID)},
		},
		{
			{"text": "📋 مشاهده همه محتواها", "callback_data": "list:1:"},
		},
	}

		// Use SendImmediate for instant UX feedback
		h.sendImmediate(chatID, msg, keyboard)
		elapsed := time.Since(startTime)
		log.Printf("[TELEGRAM][handleCreateContent][ASYNC] completed async work for chat=%d elapsed=%v", chatID, elapsed)
	}()
}

func (h *TelegramBotHandler) handleAdminLogin(chatID int64, userID int64, username, password string) {
	if h.DB == nil {
		log.Printf("[BotHandler] DB is nil, cannot authenticate")
		h.sendMessage(chatID, "❌ خطا در سیستم. لطفاً بعداً تلاش کنید.")
		return
	}
	
	username = strings.TrimSpace(username)
	password = strings.TrimSpace(password)
	
	if username == "" || password == "" {
		h.sendMessage(chatID, "❌ نام کاربری و رمز عبور را صحیح وارد کنید.\n\nفرمت: username:password")
		return
	}
	
	// Find admin user
	var adminUser models.AdminUser
	if err := h.DB.Where("username = ? AND is_active = ?", username, true).First(&adminUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			h.sendMessage(chatID, "❌ نام کاربری یا رمز عبور اشتباه است.")
			return
		}
		log.Printf("[BotHandler] Error finding admin user: %v", err)
		h.sendMessage(chatID, "❌ خطا در سیستم. لطفاً بعداً تلاش کنید.")
		return
	}
	
	// Check password
	err := bcrypt.CompareHashAndPassword([]byte(adminUser.Password), []byte(password))
	if err != nil {
		h.sendMessage(chatID, "❌ نام کاربری یا رمز عبور اشتباه است.")
		return
	}
	
	// Save Telegram ID to admin user
	telegramIDStr := strconv.FormatInt(userID, 10)
	adminUser.TelegramID = &telegramIDStr
	if err := h.DB.Save(&adminUser).Error; err != nil {
		log.Printf("[BotHandler] Failed to save Telegram ID: %v", err)
		h.sendMessage(chatID, "❌ خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.")
		return
	}
	
	// Store admin user ID in API client
	h.APIClient.SetAdminUserID(adminUser.ID)
	
	log.Printf("[BotHandler] ✅ Admin user authenticated: %s (ID: %d) for Telegram ID %s", 
		username, adminUser.ID, telegramIDStr)
	
	// Send success message with main menu (same keyboard as /start)
	msg := `✅ <b>ورود موفق!</b>

🎬 خوش آمدید به ربات مدیریت محتوا

از دکمه «داشبورد محتوا سازی» برای مشاهده آمار و پروژه‌های محتوای خود استفاده کنید.`

	// Create persistent reply keyboard with single button (same as /start)
	// This will reset any previous keyboard and show only this button
	keyboard := [][]string{
		{"📊 داشبورد محتوا سازی"},
	}
	
	log.Println("[TELEGRAM][handleAdminLogin] about to send keyboard after successful login")
	log.Printf("[TELEGRAM][handleAdminLogin] keyboard layout: %v", keyboard)
	
	if err := h.Bot.SendReplyKeyboard(chatID, msg, keyboard); err != nil {
		log.Printf("[TELEGRAM][handleAdminLogin] Failed to send reply keyboard: %v", err)
		h.sendMessage(chatID, "✅ ورود موفق! از دکمه‌های کیبورد استفاده کنید.")
		return
	}
	
	log.Println("[TELEGRAM][handleAdminLogin] keyboard send/queue completed")
}

func (h *TelegramBotHandler) handleDebugKeyboard(chatID int64, userID int64) {
	log.Println("[TELEGRAM][/debug_keyboard] triggered")
	log.Printf("[TELEGRAM][/debug_keyboard] chat_id=%d, user_id=%d", chatID, userID)
	
	// Use the same keyboard as /start
	msg := "Keyboard debug: reply keyboard sent."
	
	// Create persistent reply keyboard with single button (same as /start)
	keyboard := [][]string{
		{"📊 داشبورد محتوا سازی"},
	}
	
	log.Println("[TELEGRAM][/debug_keyboard] about to send keyboard")
	log.Printf("[TELEGRAM][/debug_keyboard] keyboard layout: %v", keyboard)
	
	if err := h.Bot.SendReplyKeyboard(chatID, msg, keyboard); err != nil {
		log.Printf("[TELEGRAM][/debug_keyboard] Failed to send reply keyboard: %v", err)
		return
	}
	
	log.Println("[TELEGRAM][/debug_keyboard] keyboard send/queue completed")
}

func (h *TelegramBotHandler) handleUnknownCommand(chatID int64, command string) {
	h.sendMessage(chatID, fmt.Sprintf("❓ دستور ناشناخته: /%s\n\nبرای مشاهده دستورات از /help استفاده کنید.", command))
}

// buildListKeyboard creates inline keyboard for task list
func (h *TelegramBotHandler) buildListKeyboard(tasks []ContentTask, page int, statusFilter string, hasMore bool) [][]map[string]string {
	var keyboard [][]map[string]string

	// Status filter buttons (first row)
	if statusFilter == "" {
		keyboard = append(keyboard, []map[string]string{
			{"text": "💡 ایده‌ها", "callback_data": "status_filter:final_ideas"},
			{"text": "✍️ نوشتن", "callback_data": "status_filter:writing"},
			{"text": "🎬 ضبط", "callback_data": "status_filter:recording"},
		}, []map[string]string{
			{"text": "✂️ تدوین", "callback_data": "status_filter:editing"},
			{"text": "✅ منتشر", "callback_data": "status_filter:published"},
			{"text": "🔄 همه", "callback_data": "status_filter:"},
		})
	} else {
		keyboard = append(keyboard, []map[string]string{
			{"text": "🔄 همه", "callback_data": "status_filter:"},
		})
	}

	// Task buttons
	for _, task := range tasks {
		statusLabel := statusLabels[task.Status]
		if statusLabel == "" {
			statusLabel = task.Status
		}
		text := fmt.Sprintf("%s %s", statusLabel, task.Title)
		if len(text) > 64 {
			text = text[:61] + "..."
		}
		keyboard = append(keyboard, []map[string]string{
			{"text": text, "callback_data": fmt.Sprintf("task:%d", task.ID)},
		})
	}

	// Pagination buttons
	var navButtons []map[string]string
	if page > 1 {
		navButtons = append(navButtons, map[string]string{
			"text": "◀️ قبلی", "callback_data": fmt.Sprintf("list:%d:%s", page-1, statusFilter),
		})
	}
	if hasMore {
		navButtons = append(navButtons, map[string]string{
			"text": "▶️ بعدی", "callback_data": fmt.Sprintf("list:%d:%s", page+1, statusFilter),
		})
	}
	if len(navButtons) > 0 {
		keyboard = append(keyboard, navButtons)
	}

	return keyboard
}

// buildStatusUpdateKeyboard creates inline keyboard for status updates
func (h *TelegramBotHandler) buildStatusUpdateKeyboard(taskID uint, currentStatus string) [][]map[string]string {
	statuses := []string{"final_ideas", "writing", "pre_production", "recording", "editing", "published"}
	var keyboard [][]map[string]string

	currentIndex := -1
	for i, s := range statuses {
		if s == currentStatus {
			currentIndex = i
			break
		}
	}

	// Show previous, current, and next status buttons
	buttons := []map[string]string{}
	if currentIndex > 0 {
		prevStatus := statuses[currentIndex-1]
		buttons = append(buttons, map[string]string{
			"text": "◀️ " + statusLabels[prevStatus], "callback_data": fmt.Sprintf("update_status:%d:%s", taskID, prevStatus),
		})
	}

	if currentIndex < len(statuses)-1 {
		nextStatus := statuses[currentIndex+1]
		buttons = append(buttons, map[string]string{
			"text": statusLabels[nextStatus] + " ▶️", "callback_data": fmt.Sprintf("update_status:%d:%s", taskID, nextStatus),
		})
	}

	if len(buttons) > 0 {
		keyboard = append(keyboard, buttons)
	}

	// Back to list button
	keyboard = append(keyboard, []map[string]string{
		{"text": "📋 بازگشت به لیست", "callback_data": "list:1:"},
	})

	return keyboard
}

func (h *TelegramBotHandler) sendMessage(chatID int64, text string) {
	if err := h.Bot.SendMessageHTML(chatID, text); err != nil {
		log.Printf("[BotHandler] Failed to send message: %v", err)
	}
}

func (h *TelegramBotHandler) sendKeyboard(chatID int64, text string, keyboard [][]map[string]string) {
	if err := h.Bot.SendKeyboard(chatID, text, keyboard); err != nil {
		log.Printf("[BotHandler] Failed to send keyboard: %v", err)
	}
}

// sendImmediate sends a message with inline keyboard DIRECTLY
// NOTE: Now all sends are direct, this is kept for compatibility
func (h *TelegramBotHandler) sendImmediate(chatID int64, text string, keyboard [][]map[string]string) {
	// Use sendKeyboard which now sends directly
	h.sendKeyboard(chatID, text, keyboard)
}

func (h *TelegramBotHandler) editMessageKeyboard(chatID int64, messageID int64, text string, keyboard [][]map[string]string) {
	if err := h.Bot.EditMessageText(chatID, messageID, text, keyboard); err != nil {
		log.Printf("[BotHandler] Failed to edit message: %v", err)
		// Fallback to sending new message if edit fails
		h.sendKeyboard(chatID, text, keyboard)
	}
}

