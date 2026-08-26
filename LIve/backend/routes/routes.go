package routes

import (
	"log"
	"monetizeai-backend/config"
	"monetizeai-backend/controllers"
	"monetizeai-backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB, melipayamakService *services.MelipayamakService, avanakService *services.AvanakService, farazSMSService *services.FarazSMSService, fileConfig *config.Config, telegramBotService *services.TelegramBotService, telegramAPIKey string, serverBaseURL string) {
	// Create video controller with videos directory
	videoController := controllers.NewVideoController("./videos")
	webinarController := controllers.NewWebinarController(db, melipayamakService, fileConfig)
	trackingController := controllers.NewTrackingController(db)
	adminStatsController := controllers.NewAdminStatsController(db)
	configController := controllers.NewConfigController(db, fileConfig)
	smsMessageController := controllers.NewSMSMessageController(db, melipayamakService, farazSMSService)
	triggeredSMSController := controllers.NewTriggeredSMSMessageController(db, melipayamakService)
	avanakMessageController := controllers.NewAvanakMessageController(db, avanakService)
	workflowController := controllers.NewAdminWorkflowController(db)
	adminUsersController := controllers.NewAdminUsersController(db)
	adminTasksController := controllers.NewAdminTasksController(db)
	adminTaskMessagesController := controllers.NewAdminTaskMessagesController(db, melipayamakService)
	adminContentTasksController := controllers.NewAdminContentTasksController(db)
	telegramAdminController := controllers.NewTelegramAdminController(db, telegramBotService)
	telegramWebhookControllerV2 := controllers.NewTelegramWebhookControllerV2(
		db,
		telegramBotService,
		serverBaseURL,
		telegramAPIKey,
	)
	controllers.SetTelegramWebhookControllerV2(telegramWebhookControllerV2)
	debugController := controllers.NewDebugController(db)
	licenseController := controllers.NewLicenseController(db, triggeredSMSController)
	appointmentSlotController := controllers.NewAppointmentSlotController(db)
	paymentSMSMessageController := controllers.NewPaymentSMSMessageController(db, farazSMSService)
	analyticsController := controllers.NewAdminAnalyticsController(db)
	smartSMSController := controllers.NewSmartSMSController(db, avanakService, melipayamakService, farazSMSService)
	groqChatController := controllers.NewGroqChatController(fileConfig)

	api := r.Group("/api")
	log.Println("[ROUTES] Group registered at /api")
	{
		api.POST("/register", webinarController.RegisterUser)
		api.POST("/find-user", webinarController.FindUserByPhone) // Find user by phone (for login without registration)
		api.GET("/webinar", func(c *gin.Context) { webinarController.GetWebinarInfo(c, db) })
		api.GET("/webinar/active", func(c *gin.Context) { webinarController.GetActiveWebinar(c, db) })
		api.GET("/chat", func(c *gin.Context) { controllers.GetChatMessages(c, db) })
		api.POST("/chat", func(c *gin.Context) { controllers.PostChatMessage(c, db) })

		// Tracking routes (public - no auth required)
		api.POST("/track/click", trackingController.TrackClick)
		api.POST("/track/view", trackingController.TrackView)
		api.POST("/track/view-time", trackingController.UpdateViewTime)
		api.POST("/track/heartbeat", trackingController.Heartbeat)    // Heartbeat for online status (only when page is visible)
		api.POST("/track/end-session", trackingController.EndSession) // End session - mark user as offline immediately

		// Landing activity tracking routes (public)
		api.POST("/landing/track", func(c *gin.Context) { controllers.TrackLandingActivity(c, db) })
		api.POST("/landing/update-duration", func(c *gin.Context) { controllers.UpdateLandingDuration(c, db) })

		// Payment routes (public - for payment requests)
		api.GET("/payment/config", func(c *gin.Context) { configController.GetPaymentConfig(c) })
		api.GET("/payment/verify", func(c *gin.Context) { controllers.VerifyPayment(c, db, fileConfig) })
		api.POST("/payment/create", func(c *gin.Context) { controllers.CreatePaymentRequest(c, db, fileConfig) })

		// License assignment route (public - called after successful payment)
		api.POST("/license/assign", licenseController.AssignLicense)

		// WooCommerce webhook routes (public - called by WooCommerce)
		// GET endpoint prevents 404 when accessing URL in browser
		api.GET("/webhook/woocommerce", controllers.WooWebhookHandler_Get)
		// POST endpoint handles actual webhook payloads
		api.POST("/webhook/woocommerce", controllers.WooWebhookHandler)
	}

	// Admin routes (protected with authentication)
	admin := r.Group("/api/admin")
	log.Println("[ROUTES] Group registered at /api/admin")
	{
		// Public admin routes (login)
		admin.POST("/login", func(c *gin.Context) { controllers.AdminLogin(c, db) })

		// Protected admin routes (require authentication)
		adminProtected := admin.Group("")
		adminProtected.Use(controllers.AuthMiddleware())
		// Add DB to context for permission checking
		adminProtected.Use(func(c *gin.Context) {
			c.Set("db", db)
			c.Next()
		})
		{
			// Payment config routes - Add multiple routes for maximum compatibility
			// Route 1: Direct route at the beginning
			adminProtected.PUT("/payment/subscription-price", configController.UpdatePaymentConfig)
			// Route 2: Simple route
			adminProtected.PUT("/update-price", configController.UpdatePaymentConfig)
			// Route 3: Another simple route
			adminProtected.PUT("/set-price", configController.UpdatePaymentConfig)
			adminProtected.GET("/stats", adminStatsController.GetDashboardStats)
			adminProtected.GET("/stats/daily-registrations", adminStatsController.GetDailyRegistrations)
			adminProtected.GET("/stats/online-viewers", adminStatsController.GetOnlineViewersCount)
			adminProtected.GET("/stats/online-viewers/list", adminStatsController.GetOnlineViewersList)
			adminProtected.GET("/stats/users-by-registration-range", adminStatsController.GetUsersByRegistrationRange)
			adminProtected.GET("/users", adminStatsController.GetUsersList)
			adminProtected.POST("/users/by-phones", adminStatsController.GetUsersByPhoneNumbers)
			adminProtected.DELETE("/users", adminStatsController.DeleteUser)
			adminProtected.GET("/export/viewers", adminStatsController.ExportViewersExcel)
			adminProtected.GET("/export/non-viewers", adminStatsController.ExportNonViewersExcel)
			adminProtected.GET("/export/users", adminStatsController.ExportAllUsersExcel)

			// Analytics routes
			adminProtected.GET("/analytics/thankyou-funnel", analyticsController.GetThankYouFunnel)
			adminProtected.GET("/analytics/behavior-funnel", analyticsController.GetBehaviorFunnel)

			// Smart SMS center routes
			adminProtected.GET("/smart-sms/today", smartSMSController.GetTodaySmartSMS)
			adminProtected.GET("/smart-sms/popup-followups", smartSMSController.GetPopupFollowups)
			adminProtected.GET("/smart-sms/eligible-users", smartSMSController.GetEligibleUsers)
			adminProtected.GET("/smart-sms/sent-users", smartSMSController.GetSentUsers)
			adminProtected.POST("/smart-sms/cancel", smartSMSController.CancelTodaySmartSMS)
			adminProtected.GET("/smart-sms/scheduled-messages", smartSMSController.GetScheduledMessages)
			adminProtected.PUT("/smart-sms/scheduled-messages", smartSMSController.UpdateScheduledMessage)
			adminProtected.POST("/smart-sms/reset-status", smartSMSController.ResetScheduledMessageStatus)
			adminProtected.GET("/smart-sms/scheduler-logs", smartSMSController.GetSchedulerLogs)
			adminProtected.POST("/smart-sms/test-avanak", smartSMSController.TestSendAvanakScheduledMessage)

			// Landing activity routes
			adminProtected.GET("/landing/activities", func(c *gin.Context) { controllers.GetUserLandingActivities(c, db) })

			// Config management routes
			adminProtected.GET("/config", configController.GetConfig)

			// Appointment slot management routes
			adminProtected.GET("/appointment-slots/scheduling-mode", appointmentSlotController.GetSchedulingMode)
			adminProtected.PUT("/appointment-slots/scheduling-mode", appointmentSlotController.SetSchedulingMode)
			adminProtected.GET("/appointment-slots", appointmentSlotController.GetAppointmentSlots)
			adminProtected.GET("/appointment-slots/current-month", appointmentSlotController.GetCurrentMonthSlots)
			adminProtected.GET("/appointment-slots/all", appointmentSlotController.GetAllSlots) // Debug endpoint
			adminProtected.GET("/appointment-slots/today", appointmentSlotController.GetTodaySlot)
			adminProtected.POST("/appointment-slots/create-month", appointmentSlotController.CreateAppointmentSlotsForMonth)
			adminProtected.GET("/appointment-slots/:id/stats", appointmentSlotController.GetSlotStats)
			adminProtected.GET("/appointment-slots/:id/presence", appointmentSlotController.GetSlotMinuteByMinutePresence)
			adminProtected.PUT("/appointment-slots/:id", appointmentSlotController.UpdateAppointmentSlot)
			adminProtected.POST("/appointment-slots/fix-start-datetime", appointmentSlotController.FixAppointmentSlotsStartDateTime) // Fix StartDateTime for all slots
			adminProtected.DELETE("/appointment-slots", appointmentSlotController.DeleteAppointmentSlots)
			adminProtected.DELETE("/appointment-slots/all", appointmentSlotController.DeleteAllAppointmentSlots) // Delete ALL slots
			// Payment config route - MUST be before /config/webinar to avoid route conflicts
			adminProtected.PUT("/config/payment", configController.UpdatePaymentConfig)
			// Fallback: PUT /config also handles payment updates
			adminProtected.PUT("/config", configController.GetConfig)
			adminProtected.PUT("/config/webinar", configController.UpdateWebinarConfig)
			adminProtected.PUT("/config/webinar/capacity", configController.UpdateWebinarCapacity)
			adminProtected.POST("/config/webinar/stop-stream", configController.StopStream)
			adminProtected.POST("/config/webinar/pre-generate-hls", configController.PreGenerateHLS)
			adminProtected.GET("/config/webinar/pre-generate-hls/status", configController.CheckPreGeneratedHLSStatus)
			adminProtected.GET("/config/hls/files", configController.ListHLSFiles)
			adminProtected.DELETE("/config/hls/files", configController.DeleteHLSFiles)
			adminProtected.PUT("/config/thankyou/display-time", configController.UpdateThankYouDisplayTime)
			adminProtected.PUT("/config/melipayamak", configController.UpdateMelipayamakConfig)
			adminProtected.PUT("/config/avanak", configController.UpdateAvanakConfig)
			adminProtected.PUT("/config/faraz-sms", configController.UpdateFarazConfig)

			// Chat management routes
			adminProtected.DELETE("/chat/reset", func(c *gin.Context) { controllers.ResetChatMessages(c, db) })

			// SMS Message management routes
			adminProtected.GET("/sms-messages", smsMessageController.GetSMSMessages)
			adminProtected.GET("/sms-messages/:id", smsMessageController.GetSMSMessage)
			adminProtected.POST("/sms-messages", smsMessageController.CreateSMSMessage)
			adminProtected.PUT("/sms-messages/:id", smsMessageController.UpdateSMSMessage)
			adminProtected.DELETE("/sms-messages/:id", smsMessageController.DeleteSMSMessage)
			adminProtected.GET("/sms-messages/:id/logs", smsMessageController.GetSMSMessageLogs)
			adminProtected.GET("/sms-messages/:id/auto-cycle-info", smsMessageController.GetAutoCycleInfo)
			adminProtected.POST("/sms-messages/test", smsMessageController.TestSMSMessage)
			adminProtected.POST("/sms-messages/:id/toggle-auto-cycle", smsMessageController.ToggleAutoCycle)
			adminProtected.GET("/sms-messages/bulk-send/preview", smsMessageController.BulkSendPreview)
			adminProtected.POST("/sms-messages/bulk-send", smsMessageController.BulkSend)
			adminProtected.POST("/sms-messages/instant-send", smsMessageController.InstantSend)
			adminProtected.POST("/sms-messages/faraz-send", smsMessageController.SendFarazSMS)

			// Triggered SMS Message management routes
			adminProtected.GET("/triggered-sms-messages", triggeredSMSController.GetTriggeredSMSMessages)
			adminProtected.GET("/triggered-sms-messages/:id", triggeredSMSController.GetTriggeredSMSMessage)
			adminProtected.POST("/triggered-sms-messages", triggeredSMSController.CreateTriggeredSMSMessage)
			adminProtected.PUT("/triggered-sms-messages/:id", triggeredSMSController.UpdateTriggeredSMSMessage)
			adminProtected.DELETE("/triggered-sms-messages/:id", triggeredSMSController.DeleteTriggeredSMSMessage)
			adminProtected.GET("/triggered-sms-messages/:id/logs", triggeredSMSController.GetTriggeredSMSMessageLogs)
			adminProtected.POST("/triggered-sms-messages/test", triggeredSMSController.TestTriggeredSMSMessage)

			// Timed Comments management routes
			adminProtected.GET("/timed-comments", controllers.GetTimedComments)
			adminProtected.PUT("/timed-comments", controllers.UpdateTimedComments)

			// Avanak Message management routes
			adminProtected.GET("/avanak-messages", avanakMessageController.GetAvanakMessages)
			adminProtected.GET("/avanak-messages/:id", avanakMessageController.GetAvanakMessage)
			adminProtected.POST("/avanak-messages", avanakMessageController.CreateAvanakMessage)
			adminProtected.PUT("/avanak-messages/:id", avanakMessageController.UpdateAvanakMessage)
			adminProtected.DELETE("/avanak-messages/:id", avanakMessageController.DeleteAvanakMessage)
			adminProtected.GET("/avanak-messages/:id/logs", avanakMessageController.GetAvanakMessageLogs)
			adminProtected.GET("/avanak/logs", avanakMessageController.ListAvanakLogs)
			adminProtected.GET("/avanak-messages/:id/auto-cycle-info", avanakMessageController.GetAutoCycleInfo)
			adminProtected.POST("/avanak-messages/test", avanakMessageController.TestAvanakMessage)
			adminProtected.POST("/avanak-messages/:id/toggle-auto-cycle", avanakMessageController.ToggleAutoCycle)
			adminProtected.POST("/avanak/test", avanakMessageController.QuickTestAvanak)

			// Workflow management routes
			adminProtected.GET("/workflows", workflowController.GetWorkflows)
			adminProtected.GET("/workflows/:id", workflowController.GetWorkflow)
			adminProtected.GET("/workflows/:id/preview", workflowController.PreviewWorkflowRun)
			adminProtected.GET("/workflows/:id/preview-run", workflowController.PreviewWorkflowRun) // Legacy
			adminProtected.POST("/workflows/:id/test-run", workflowController.TestWorkflowRun)
			adminProtected.GET("/workflows/:id/steps/:step_id/logs", workflowController.GetStepLogs) // Use :id instead of :workflow_id
			adminProtected.POST("/workflows", workflowController.CreateWorkflow)
			adminProtected.PUT("/workflows/:id", workflowController.UpdateWorkflow)
			adminProtected.DELETE("/workflows/:id", workflowController.DeleteWorkflow)
			adminProtected.POST("/workflows/:id/toggle", workflowController.ToggleWorkflow)
			adminProtected.GET("/workflow-logs", workflowController.GetWorkflowLogs)

			// Admin Users Management
			adminProtected.GET("/admin-users", adminUsersController.GetAdminUsers)
			adminProtected.GET("/admin-users/me/permissions", adminUsersController.GetMyPermissions)
			adminProtected.POST("/admin-users/grant-all-to-admin", adminUsersController.GrantAllPermissionsToAdmin) // Utility endpoint
			adminProtected.GET("/admin-users/:id", adminUsersController.GetAdminUser)
			adminProtected.POST("/admin-users", adminUsersController.CreateAdminUser)
			adminProtected.PUT("/admin-users/:id", adminUsersController.UpdateAdminUser)
			adminProtected.DELETE("/admin-users/:id", adminUsersController.DeleteAdminUser)

			// Sync permissions endpoint (moved here to avoid route conflicts)
			adminProtected.POST("/sync-permissions", adminUsersController.SyncPermissions)                 // Sync permissions to database
			adminProtected.GET("/debug/payment-permissions", adminUsersController.DebugPaymentPermissions) // Debug payment permissions

			// Debug endpoint for permissions
			adminProtected.GET("/debug/permissions", debugController.DebugUserPermissions)

			// Task management
			adminProtected.GET("/tasks", adminTasksController.ListTasks)
			adminProtected.GET("/tasks/meta", adminTasksController.GetMeta)
			adminProtected.POST("/tasks", adminTasksController.CreateTask)
			adminProtected.PUT("/tasks/:id", adminTasksController.UpdateTask)
			adminProtected.DELETE("/tasks/:id", adminTasksController.DeleteTask)

			// Task manager messages
			adminProtected.GET("/task-messages", adminTaskMessagesController.ListMessages)
			adminProtected.POST("/task-messages", adminTaskMessagesController.CreateMessage)
			adminProtected.GET("/task-messages/unread-count", adminTaskMessagesController.GetUnreadCount)
			adminProtected.GET("/task-messages/participants", adminTaskMessagesController.ListParticipants)

			// Content tasks management (personal workspace)
			// Support both JWT auth (admin panel) and API key auth (bot)
			contentTasks := adminProtected.Group("/content-tasks")
			contentTasks.Use(func(c *gin.Context) {
				// Check if it's a bot request (API key auth)
				if isBot, exists := c.Get("is_bot_request"); exists && isBot.(bool) {
					// Bot requests are already authenticated by BotAPIAuthMiddleware
					c.Next()
					return
				}
				// Otherwise, use existing JWT auth middleware (already applied by adminProtected)
				c.Next()
			})
			{
				contentTasks.GET("", adminContentTasksController.ListContentTasks)
				contentTasks.POST("", adminContentTasksController.CreateContentTask)
				contentTasks.PUT("/:id", adminContentTasksController.UpdateContentTask)
				contentTasks.DELETE("/:id", adminContentTasksController.DeleteContentTask)
			}

			// Groq AI Chat routes
			adminProtected.POST("/groq/chat", groqChatController.Chat)

			// Bot API routes (API key authentication)
			if telegramBotService != nil && telegramAPIKey != "" {
				botAPI := r.Group("/api/bot")
				log.Println("[ROUTES] Group registered at /api/bot (with auth middleware)")
				botAPI.Use(controllers.BotAPIAuthMiddleware(telegramAPIKey, db))
				{
					// Content tasks endpoints for bot
					botAPI.GET("/content-tasks", adminContentTasksController.ListContentTasks)
					botAPI.GET("/content-tasks/stats", adminContentTasksController.GetContentTasksStats)
					botAPI.GET("/content-tasks/:id", adminContentTasksController.GetContentTask)
					botAPI.POST("/content-tasks", adminContentTasksController.CreateContentTask)
					botAPI.PUT("/content-tasks/:id", adminContentTasksController.UpdateContentTask)
				}
			}

			// Telegram admin management
			if telegramBotService != nil {
				adminProtected.POST("/telegram/set-webhook", telegramAdminController.SetWebhook)
				adminProtected.GET("/telegram/webhook-info", telegramAdminController.GetWebhookInfo)
				adminProtected.POST("/telegram/test", telegramAdminController.TestWebhook)
			}

			// Payments management routes
			adminProtected.GET("/payments", func(c *gin.Context) { controllers.GetPaymentsList(c, db, fileConfig) })
			adminProtected.GET("/payments/export", func(c *gin.Context) { controllers.ExportPaymentsExcel(c, db, fileConfig) })
			adminProtected.GET("/payments/daily-sales", func(c *gin.Context) { controllers.GetDailySalesStats(c, db, fileConfig) })
			adminProtected.POST("/payments/manual", func(c *gin.Context) { controllers.CreateManualPayment(c, db, fileConfig) })

			// License management routes
			adminProtected.GET("/licenses/stats", licenseController.GetLicensesStats)
			adminProtected.GET("/licenses", licenseController.GetLicensesList)
			adminProtected.POST("/licenses/upload", licenseController.UploadLicenses)
			adminProtected.DELETE("/licenses/all", licenseController.DeleteAllLicenses)

			// Affiliate management routes
			affiliateController := controllers.NewAffiliateController(db)
			adminProtected.GET("/affiliates", affiliateController.GetAffiliatesList)
			adminProtected.POST("/affiliates", affiliateController.CreateAffiliate)
			adminProtected.PUT("/affiliates/:id", affiliateController.UpdateAffiliate)
			adminProtected.DELETE("/affiliates/:id", affiliateController.DeleteAffiliate)

			// Payment SMS Message management routes
			adminProtected.GET("/payment-sms-messages", paymentSMSMessageController.GetPaymentSMSMessages)
			adminProtected.GET("/payment-sms-messages/:id", paymentSMSMessageController.GetPaymentSMSMessage)
			adminProtected.POST("/payment-sms-messages", paymentSMSMessageController.CreatePaymentSMSMessage)
			adminProtected.PUT("/payment-sms-messages/:id", paymentSMSMessageController.UpdatePaymentSMSMessage)
			adminProtected.DELETE("/payment-sms-messages/:id", paymentSMSMessageController.DeletePaymentSMSMessage)
			adminProtected.GET("/payment-sms-messages/logs", paymentSMSMessageController.GetPaymentSMSMessageLogs)
			adminProtected.POST("/payment-sms-messages/test-trigger", paymentSMSMessageController.TestTrigger) // Test endpoint

			// License SMS Message management routes
			licenseSMSMessageController := controllers.NewLicenseSMSMessageController(db)
			adminProtected.GET("/license-sms-message", licenseSMSMessageController.GetLicenseSMSMessage)
			adminProtected.PUT("/license-sms-message", licenseSMSMessageController.UpdateLicenseSMSMessage)
			adminProtected.GET("/license-sms-message/logs", licenseSMSMessageController.GetLicenseSMSMessageLogs)
		}
	}

	// Payment callback route (public - called by ZarinPal)
	r.GET("/payment/callback", func(c *gin.Context) { controllers.HandlePaymentCallback(c, db, fileConfig) })

	// Telegram webhook routes - root level, no middleware
	// POST: actual Telegram updates
	r.POST("/webhook/telegram", controllers.TelegramWebhookHandlerV2)

	// GET: simple health check
	r.GET("/webhook/telegram", func(c *gin.Context) {
		log.Println("[Webhook] GET /webhook/telegram -> ok")
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Video streaming routes
	video := r.Group("/video")
	log.Println("[ROUTES] Group registered at /video")
	{
		video.GET("/:video", videoController.StreamLiveVideo) // Live streaming (no seeking)
		video.GET("/", videoController.StreamLiveVideo)       // Default video
	}

	// Regular video routes (with seeking support) - for non-live content
	regularVideo := r.Group("/video-regular")
	log.Println("[ROUTES] Group registered at /video-regular")
	{
		regularVideo.GET("/:video", videoController.StreamVideo)
		regularVideo.GET("/", videoController.StreamVideo)
	}

	// Debug endpoint to dump all routes
	r.GET("/__routes", func(c *gin.Context) {
		routes := []gin.H{}
		for _, ri := range r.Routes() {
			routes = append(routes, gin.H{
				"method": ri.Method,
				"path":   ri.Path,
			})
		}
		c.JSON(200, routes)
	})

	// Log all registered routes for debugging
	log.Println("[Routes] ========== Registered Routes ==========")
	for _, ri := range r.Routes() {
		log.Printf("[ROUTE] %s -> %s", ri.Method, ri.Path)
	}
	log.Println("[Routes] =======================================")
}
