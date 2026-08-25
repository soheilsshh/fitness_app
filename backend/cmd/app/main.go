package main

import (
	"context"
	"log"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	_ "github.com/yourusername/fitness-management/docs"
	"github.com/yourusername/fitness-management/internal/controllers"
	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/seed"
	"github.com/yourusername/fitness-management/internal/service"
)

// @title Fitness CMS API
// @version 1.0
// @description Fitness Management System API documentation.
// @BasePath /
//
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

// Server is the base application server that wires routes, middleware, and dependencies.
type Server struct {
	engine *gin.Engine
}

// NewServer constructs a new Server with all dependencies initialized.
func NewServer(db *gorm.DB) *Server {
	// Initialize Gin router
	router := gin.Default()

	// CORS — origins from config.yaml (cors.allowed_origins) or FRONTEND_ORIGIN env.
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return config.IsOriginAllowed(origin)
		},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
			"Accept",
			"X-Requested-With",
		},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: config.CORSAllowCredentials(),
	}))

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	servicePlanRepo := repository.NewServicePlanRepository(db)
	programRepo := repository.NewProgramRepository(db)
	templateRepo := repository.NewTemplateRepository(db)
	otpRepo := repository.NewOtpRepository(db)
	txRepo := repository.NewTransactionRepository(db)
	siteSettingsRepo := repository.NewSiteSettingsRepository(db)
	feedbackRepo := repository.NewFeedbackRepository(db)
	ticketRepo := repository.NewTicketRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	coachProfileRepo := repository.NewCoachProfileRepository(db)
	coachAchievementRepo := repository.NewCoachAchievementRepository(db)
	exerciseRepo := repository.NewExerciseRepository(db)
	foodRepo := repository.NewFoodRepository(db)
	dailyFoodLogRepo := repository.NewDailyFoodLogRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)
	motivationalQuoteRepo := repository.NewMotivationalQuoteRepository(db)
	mobileDeviceRepo := repository.NewMobileDeviceRepository(db)
	mobileReleaseRepo := repository.NewMobileReleaseRepository(db)
	funnelLeadRepo := repository.NewFunnelLeadRepository(db)
	funnelAIAnalysisRepo := repository.NewFunnelAIAnalysisRepository(db)
	aiRequestLogRepo := repository.NewAIRequestLogRepository(db)
	recipeRepo := repository.NewRecipeRepository(db)
	progressReportRepo := repository.NewProgressReportRepository(db)
	poseBankRepo := repository.NewPoseBankRepository(db)
	achievementRepo := repository.NewAchievementRepository(db)
	gamificationRepo := repository.NewGamificationRepository(db)
	communityPostRepo := repository.NewCommunityPostRepository(db)
	eventRepo := repository.NewEventRepository(db)
	coachSessionRepo := repository.NewCoachSessionRepository(db)
	guaranteeRepo := repository.NewGuaranteeRepository(db)

	// Initialize services
	// Gamification (XP/level/reputation/leaderboard + medals) is constructed
	// first — many other services (payments, AI generate, tracking, community,
	// coach sessions/programs) take achievementService as an optional event hook.
	gamificationService := service.NewGamificationService(gamificationRepo)
	achievementService := service.NewAchievementService(db, achievementRepo, gamificationService)
	achievementService.SeedDefaultRules(context.Background())

	authService := service.NewAuthService(userRepo, coachProfileRepo, refreshTokenRepo, otpRepo)
	coachProfileService := service.NewCoachProfileService(coachProfileRepo, servicePlanRepo, coachAchievementRepo)
	coachAchievementService := service.NewCoachAchievementService(coachAchievementRepo)
	coachPlanService := service.NewCoachPlanService(servicePlanRepo)
	paymentService := service.NewPaymentServiceWithFunnel(db, userRepo, servicePlanRepo, orderRepo, subscriptionRepo, funnelLeadRepo, achievementService)
	checkoutService := service.NewCheckoutService(db, userRepo, servicePlanRepo, orderRepo, subscriptionRepo, coachProfileRepo, paymentService)
	studentService := service.NewStudentService(userRepo, subscriptionRepo, servicePlanRepo, programRepo)
	meService := service.NewMeService(db, userRepo, orderRepo, subscriptionRepo, servicePlanRepo, programRepo, exerciseRepo, foodRepo, achievementService)
	aiChatService := service.NewAIChatService(meService)
	aiGenerateService := service.NewAIGenerateService(db, meService, aiRequestLogRepo, subscriptionRepo, programRepo, foodRepo, achievementService, funnelAIAnalysisRepo)
	recipeService := service.NewRecipeService(recipeRepo)
	streakService := service.NewStreakService(db)
	progressReportService := service.NewProgressReportService(db, progressReportRepo, subscriptionRepo, notificationRepo, streakService)
	service.StartScheduler(context.Background(), progressReportService)
	poseBankService := service.NewPoseBankService(poseBankRepo)
	communityPostService := service.NewCommunityPostService(db, communityPostRepo, achievementService)
	eventService := service.NewEventService(eventRepo)
	adminUserService := service.NewAdminUserService(db, subscriptionRepo, txRepo)
	adminDashboardService := service.NewAdminDashboardService(db, subscriptionRepo, txRepo, coachProfileRepo)
	adminStudentService := service.NewAdminStudentService(db, userRepo, subscriptionRepo, servicePlanRepo, coachProfileRepo)
	adminPlanService := service.NewAdminPlanService(servicePlanRepo, coachProfileRepo)
	adminCoachService := service.NewAdminCoachService(coachProfileRepo, coachAchievementRepo)
	adminExerciseService := service.NewAdminExerciseService(exerciseRepo)
	adminTemplateService := service.NewAdminTemplateService(db, templateRepo, exerciseRepo)
	mobileAppService := service.NewMobileAppService(mobileDeviceRepo, mobileReleaseRepo)
	siteSettingsService := service.NewSiteSettingsService(siteSettingsRepo)
	feedbackService := service.NewFeedbackService(feedbackRepo)
	ticketService := service.NewTicketService(userRepo, ticketRepo)

	// Initialize handlers
	authController := controllers.NewAuthController(authService, meService)
	studentController := controllers.NewStudentController(studentService)
	meController := controllers.NewMeController(meService)
	meTicketController := controllers.NewMeTicketController(ticketService)
	aiChatController := controllers.NewAIChatController(aiChatService)
	aiGenerateController := controllers.NewAIGenerateController(aiGenerateService)
	recipeController := controllers.NewRecipeController(recipeService)
	adminRecipeController := controllers.NewAdminRecipeController(recipeService)
	progressReportController := controllers.NewProgressReportController(progressReportService)
	poseBankController := controllers.NewPoseBankController(poseBankService)
	adminPoseBankController := controllers.NewAdminPoseBankController(poseBankService)
	achievementController := controllers.NewAchievementController(achievementService)
	gamificationController := controllers.NewGamificationController(gamificationService)
	communityPostController := controllers.NewCommunityPostController(communityPostService)
	streakController := controllers.NewStreakController(streakService)
	adminCommunityPostController := controllers.NewAdminCommunityPostController(communityPostService)
	eventController := controllers.NewEventController(eventService)
	adminEventController := controllers.NewAdminEventController(eventService)
	adminUserController := controllers.NewAdminUserController(adminUserService)
	adminDashboardController := controllers.NewAdminDashboardController(adminDashboardService)
	adminStudentController := controllers.NewAdminStudentController(adminStudentService)
	adminPlanController := controllers.NewAdminPlanController(adminPlanService)
	siteSettingsController := controllers.NewSiteSettingsController(siteSettingsService)
	feedbackController := controllers.NewFeedbackController(feedbackService)
	adminFeedbackController := controllers.NewAdminFeedbackController(feedbackService)
	adminCoachController := controllers.NewAdminCoachController(adminCoachService)
	adminExerciseController := controllers.NewAdminExerciseController(adminExerciseService)
	adminTemplateController := controllers.NewAdminTemplateController(adminTemplateService)
	mobileAppController := controllers.NewMobileAppController(mobileAppService)
	coachProfileController := controllers.NewCoachProfileController(coachProfileService)
	coachAchievementController := controllers.NewCoachAchievementController(coachAchievementService)
	publicCoachController := controllers.NewPublicCoachController(coachProfileService)
	coachPlanController := controllers.NewCoachPlanController(coachPlanService)
	authzService := service.NewAuthorizationService(db, servicePlanRepo)
	coachStudentService := service.NewCoachStudentService(db, subscriptionRepo, servicePlanRepo, programRepo, authzService)
	coachProgramService := service.NewCoachProgramService(db, subscriptionRepo, programRepo, templateRepo, exerciseRepo, foodRepo, coachStudentService, achievementService)
	coachDashboardService := service.NewCoachDashboardService(db, subscriptionRepo, orderRepo)
	coachStudentController := controllers.NewCoachStudentController(coachStudentService)
	coachSessionService := service.NewCoachSessionService(coachSessionRepo, notificationRepo, coachStudentService, achievementService)
	coachSessionController := controllers.NewCoachSessionController(coachSessionService)
	meSessionController := controllers.NewMeSessionController(coachSessionService)
	guaranteeService := service.NewGuaranteeService(db, guaranteeRepo, subscriptionRepo, coachSessionRepo)
	guaranteeController := controllers.NewGuaranteeController(guaranteeService)
	adminGuaranteeController := controllers.NewAdminGuaranteeController(guaranteeService)
	coachProgramController := controllers.NewCoachProgramController(coachProgramService)
	coachDashboardController := controllers.NewCoachDashboardController(coachDashboardService)
	coachExerciseController := controllers.NewCoachExerciseController(adminExerciseService)
	coachFoodService := service.NewCoachFoodService(foodRepo)
	coachFoodController := controllers.NewCoachFoodController(coachFoodService)
	adminProgramService := service.NewAdminProgramService(subscriptionRepo, coachProgramService)
	adminProgramController := controllers.NewAdminProgramController(adminProgramService)
	adminFoodController := controllers.NewCoachFoodController(coachFoodService)
	coachTicketController := controllers.NewCoachTicketController(ticketService)
	checkoutController := controllers.NewCheckoutController(checkoutService)
	paymentController := controllers.NewPaymentController(paymentService)
	trackingService := service.NewTrackingService(db, subscriptionRepo, coachStudentService, achievementService)
	trackingController := controllers.NewTrackingController(trackingService)
	coachTrackingController := controllers.NewCoachTrackingController(trackingService)
	checkInService := service.NewCheckInService(db, subscriptionRepo, programRepo, achievementService)
	checkInController := controllers.NewCheckInController(checkInService)
	workoutHistoryService := service.NewWorkoutHistoryService(db, subscriptionRepo, servicePlanRepo, programRepo, achievementService, notificationRepo)
	workoutHistoryController := controllers.NewWorkoutHistoryController(workoutHistoryService)
	dailyFoodLogService := service.NewDailyFoodLogService(dailyFoodLogRepo, foodRepo, achievementService)
	dailyFoodLogController := controllers.NewDailyFoodLogController(dailyFoodLogService)
	meDashboardService := service.NewMeDashboardService(db, subscriptionRepo)
	meDashboardController := controllers.NewMeDashboardController(meDashboardService)
	notificationService := service.NewNotificationService(notificationRepo, userRepo)
	notificationController := controllers.NewNotificationController(notificationService)
	pushNotificationService := service.NewPushNotificationService(mobileDeviceRepo)
	reminderService := service.NewReminderService(mobileDeviceRepo, notificationRepo, userRepo, pushNotificationService)
	service.StartReminderScheduler(context.Background(), reminderService)
	checkInReminderService := service.NewCheckInReminderService(db, subscriptionRepo, notificationRepo, userRepo)
	service.StartCheckInReminderScheduler(context.Background(), checkInReminderService)
	motivationalQuoteService := service.NewMotivationalQuoteService(motivationalQuoteRepo)
	motivationalQuoteController := controllers.NewMotivationalQuoteController(motivationalQuoteService)
	adminMotivationalQuoteController := controllers.NewAdminMotivationalQuoteController(motivationalQuoteService)
	funnelService := service.NewFunnelService(funnelLeadRepo, funnelAIAnalysisRepo, coachProfileRepo, servicePlanRepo, userRepo, orderRepo, paymentService, authService)
	funnelController := controllers.NewFunnelController(funnelService)
	adminFunnelController := controllers.NewAdminFunnelController(funnelService)

	// Auth routes
	router.POST("/auth/check-phone", authController.CheckPhone)
	router.POST("/auth/register", authController.Register)
	router.POST("/auth/register/coach", authController.RegisterCoach)
	router.POST("/auth/login/password", authController.LoginWithPassword)
	router.POST("/auth/otp/request", authController.RequestOTP)
	router.POST("/auth/otp/verify", authController.VerifyOTP)
	router.POST("/auth/forgot/send-otp", authController.ForgotSendOTP)
	router.POST("/auth/reset-password", authController.ResetPasswordWithOTP)

	// Protected auth routes
	authGroup := router.Group("/auth")
	authGroup.Use(middleware.AuthMiddleware())
	{
		authGroup.POST("/logout", authController.Logout)
		authGroup.GET("/me", authController.Me)
		authGroup.POST("/change-password", authController.ChangePassword)
	}

	// Public routes (no auth)
	router.GET("/site-settings", siteSettingsController.GetSiteSettingsPublic)
	router.GET("/academy", siteSettingsController.GetAcademyPublic)
	router.GET("/faq", siteSettingsController.GetFAQPublic)
	router.POST("/mobile/heartbeat", mobileAppController.PublicHeartbeat)
	router.POST("/feedbacks", feedbackController.CreateFeedback)
	router.GET("/recipes", recipeController.ListRecipes)
	router.GET("/recipes/:id", recipeController.GetRecipe)
	router.GET("/poses", poseBankController.ListPoses)
	router.GET("/coaches", publicCoachController.ListCoaches)
	router.GET("/coaches/:slug", publicCoachController.GetCoachBySlug)
	router.GET("/coaches/:slug/plans", publicCoachController.GetCoachPlans)
	router.GET("/public/funnel/config", funnelController.GetConfig)
	router.POST("/public/funnel/analyze", funnelController.Analyze)
	router.POST("/public/funnel/otp/request", funnelController.RequestLeadOTP)
	router.POST("/public/funnel/leads", funnelController.CreateLead)
	router.GET("/public/funnel/checkout/:token", funnelController.GetCheckout)
	router.POST("/public/funnel/checkout/:token/plan", funnelController.SelectPlan)
	router.POST("/public/funnel/checkout/:token/pay", funnelController.PayDemo)
	router.POST("/public/funnel/checkout/:token/free", funnelController.StartFreeAccess)
	router.POST("/public/funnel/checkout/:token/session", funnelController.IssueSession)
	router.GET("/payments/zarinpal/callback", paymentController.ZarinpalCallback)
	router.GET("/payments/result", paymentController.PaymentsResultPage)

	// Coach panel routes
	coachGroup := router.Group("/coach")
	coachGroup.Use(middleware.AuthMiddleware(), middleware.CoachOnly())
	{
		// Accessible before approval (profile completion flow)
		coachGroup.GET("/profile", coachProfileController.GetProfile)
		coachGroup.PUT("/profile", coachProfileController.UpdateProfile)
		coachGroup.POST("/profile/submit-request", coachProfileController.SubmitRequest)
		coachGroup.GET("/profile/slug/check", coachProfileController.CheckSlug)
		coachGroup.POST("/profile/avatar", coachProfileController.UploadAvatar)
		coachGroup.POST("/profile/cover", coachProfileController.UploadCover)
		coachGroup.GET("/profile/achievements", coachAchievementController.ListAchievements)
		coachGroup.POST("/profile/achievements/image", coachAchievementController.UploadImage)
		coachGroup.POST("/profile/achievements", coachAchievementController.CreateAchievement)
		coachGroup.PUT("/profile/achievements/:id", coachAchievementController.UpdateAchievement)
		coachGroup.DELETE("/profile/achievements/:id", coachAchievementController.DeleteAchievement)
	}

	approvedCoachGroup := router.Group("/coach")
	approvedCoachGroup.Use(
		middleware.AuthMiddleware(),
		middleware.CoachOnly(),
		middleware.ApprovedCoachOnly(coachProfileRepo),
	)
	{
		approvedCoachGroup.GET("/plans", coachPlanController.ListPlans)
		approvedCoachGroup.POST("/plans", coachPlanController.CreatePlan)
		approvedCoachGroup.GET("/plans/:id", coachPlanController.GetPlanByID)
		approvedCoachGroup.PATCH("/plans/:id", coachPlanController.UpdatePlan)
		approvedCoachGroup.DELETE("/plans/:id", coachPlanController.DeletePlan)
		approvedCoachGroup.GET("/students", coachStudentController.ListStudents)
		approvedCoachGroup.GET("/students/:id", coachStudentController.GetStudentByID)
		approvedCoachGroup.GET("/students/:id/programs", coachProgramController.GetStudentPrograms)
		approvedCoachGroup.POST("/students/:id/workout-programs", coachProgramController.AssignWorkoutProgram)
		approvedCoachGroup.PATCH("/students/:id/workout-programs/:programId", coachProgramController.UpdateWorkoutProgram)
		approvedCoachGroup.POST("/students/:id/workout-programs/templates/:templateId", coachProgramController.AssignWorkoutFromTemplate)
		approvedCoachGroup.GET("/students/:id/workout-programs", coachProgramController.ListStudentWorkoutPrograms)
		approvedCoachGroup.POST("/students/:id/workout-programs/:programId/approve", coachProgramController.ApproveWorkoutProgram)
		approvedCoachGroup.POST("/students/:id/nutrition-programs", coachProgramController.AssignNutritionProgram)
		approvedCoachGroup.PATCH("/students/:id/nutrition-programs/:programId", coachProgramController.UpdateNutritionProgram)
		approvedCoachGroup.POST("/students/:id/nutrition-programs/templates/:templateId", coachProgramController.AssignNutritionFromTemplate)
		approvedCoachGroup.GET("/students/:id/nutrition-programs", coachProgramController.ListStudentNutritionPrograms)
		approvedCoachGroup.POST("/students/:id/nutrition-programs/:programId/approve", coachProgramController.ApproveNutritionProgram)
		approvedCoachGroup.GET("/workout-templates", coachProgramController.ListWorkoutTemplates)
		approvedCoachGroup.GET("/workout-templates/:id", coachProgramController.GetWorkoutTemplate)
		approvedCoachGroup.GET("/nutrition-templates", coachProgramController.ListNutritionTemplates)
		approvedCoachGroup.GET("/nutrition-templates/:id", coachProgramController.GetNutritionTemplate)
		approvedCoachGroup.GET("/dashboard/stats", coachDashboardController.GetStats)
		approvedCoachGroup.GET("/dashboard/recent-students", coachDashboardController.GetRecentStudents)
		approvedCoachGroup.GET("/dashboard/top-students", coachDashboardController.GetTopStudents)
		approvedCoachGroup.GET("/dashboard/progress-series", coachDashboardController.GetProgressSeries)
		approvedCoachGroup.GET("/notifications", notificationController.ListRecent)
		approvedCoachGroup.GET("/tickets", coachTicketController.ListTickets)
		approvedCoachGroup.GET("/tickets/:id", coachTicketController.GetTicket)
		approvedCoachGroup.PATCH("/tickets/:id/answer", coachTicketController.AnswerTicket)
		approvedCoachGroup.PATCH("/tickets/:id/status", coachTicketController.UpdateTicketStatus)
		approvedCoachGroup.GET("/exercises/categories", coachExerciseController.ListCategories)
		approvedCoachGroup.GET("/exercises", coachExerciseController.ListExercises)
		approvedCoachGroup.GET("/foods", coachFoodController.ListFoods)
		approvedCoachGroup.POST("/exercises", coachExerciseController.CreateExercise)
		approvedCoachGroup.GET("/exercises/:id", coachExerciseController.GetExerciseByID)
		approvedCoachGroup.GET("/tracking/students", coachTrackingController.ListStudents)
		approvedCoachGroup.GET("/tracking/students/:id", coachTrackingController.GetStudentTracking)
		approvedCoachGroup.PATCH("/tracking/photos/:id/review", coachTrackingController.ReviewPhoto)
		approvedCoachGroup.GET("/sessions", coachSessionController.ListSessions)
		approvedCoachGroup.POST("/students/:id/sessions", coachSessionController.ScheduleSession)
		approvedCoachGroup.PATCH("/sessions/:sessionId", coachSessionController.UpdateSession)
		approvedCoachGroup.DELETE("/sessions/:sessionId", coachSessionController.CancelSession)
		approvedCoachGroup.GET("/students/:id/review-status", coachSessionController.ReviewStatus)
		approvedCoachGroup.POST("/students/:id/feedback", coachSessionController.SendFeedback)
	}

	// Student (user panel) routes - all protected
	studentGroup := router.Group("/")
	studentGroup.Use(middleware.AuthMiddleware())
	{
		studentGroup.GET("/me", meController.GetProfile)
		studentGroup.PATCH("/me", meController.UpdateProfile)
		studentGroup.POST("/me/avatar", meController.UploadAvatar)
		studentGroup.POST("/me/body-photos", meController.UploadBodyPhoto)
		studentGroup.GET("/me/tracking", trackingController.GetMyTracking)
		studentGroup.GET("/me/daily-checkin/today", checkInController.GetTodayDailyCheckIn)
		studentGroup.POST("/me/daily-checkin", checkInController.SubmitDailyCheckIn)
		studentGroup.GET("/me/weekly-checkin/current", checkInController.GetCurrentWeeklyCheckIn)
		studentGroup.POST("/me/weekly-checkin", checkInController.SubmitWeeklyCheckIn)
		studentGroup.POST("/me/tracking/photos", trackingController.UploadTrackingPhoto)
		studentGroup.POST("/me/tracking/photos/:id/analyze", trackingController.AnalyzePhoto)
		studentGroup.GET("/me/workout-history", workoutHistoryController.ListHistory)
		studentGroup.GET("/me/personal-records", workoutHistoryController.ListPersonalRecords)
		studentGroup.GET("/me/exercise-categories", workoutHistoryController.ListExerciseTargets)
		studentGroup.POST("/me/personal-records/notify-coach", workoutHistoryController.NotifyCoachOfPersonalRecord)
		studentGroup.POST("/me/workout-sessions", workoutHistoryController.LogSession)
		studentGroup.PATCH("/me/workout-sessions/:id/survey", workoutHistoryController.SubmitSurvey)
		studentGroup.POST("/me/workout-sessions/:id/survey/voice", workoutHistoryController.SubmitSurveyVoiceNote)
		studentGroup.POST("/me/workout/sessions/voice", aiGenerateController.SuggestSetLogFromVoice)
		studentGroup.POST("/me/food-logs/voice", aiGenerateController.SuggestFoodLogFromVoice)
		studentGroup.POST("/user/food-logs", dailyFoodLogController.CreateLog)
		studentGroup.GET("/user/food-logs", dailyFoodLogController.ListByDate)
		studentGroup.DELETE("/user/food-logs/:id", dailyFoodLogController.DeleteLog)
		studentGroup.GET("/user/foods", coachFoodController.ListFoods)
		studentGroup.GET("/me/progress/reports", progressReportController.ListReports)
		studentGroup.POST("/me/progress/reports/generate", progressReportController.GenerateNow) // TEST-ONLY, see handler comment
		studentGroup.GET("/me/achievements", achievementController.GetMyAchievements)
		studentGroup.GET("/me/gamification", gamificationController.GetMySummary)
		studentGroup.GET("/leaderboard", gamificationController.GetLeaderboard)
		studentGroup.GET("/me/dashboard", meDashboardController.GetSummary)
		studentGroup.GET("/me/records", meDashboardController.GetRecords)
		studentGroup.POST("/me/change-password", authController.ChangePassword)
		studentGroup.GET("/me/orders", meController.ListMyOrders)
		studentGroup.GET("/me/orders/:id", meController.GetMyOrderByID)
		studentGroup.GET("/me/programs", meController.ListMyPrograms)
		studentGroup.GET("/me/programs/:id", meController.GetMyProgramByID)
		studentGroup.GET("/me/workout-programs", meController.ListMyWorkoutPrograms)
		studentGroup.POST("/me/workout-programs/:id/activate", meController.ActivateWorkoutProgram)
		studentGroup.POST("/me/workout-programs/:id/deactivate", meController.DeactivateWorkoutProgram)
		studentGroup.GET("/me/nutrition-programs", meController.ListMyNutritionPrograms)
		studentGroup.POST("/me/nutrition-programs/:id/activate", meController.ActivateNutritionProgram)
		studentGroup.POST("/me/nutrition-programs/:id/deactivate", meController.DeactivateNutritionProgram)
		studentGroup.GET("/me/tickets", meTicketController.ListTickets)
		studentGroup.POST("/me/tickets", meTicketController.CreateTicket)
		studentGroup.GET("/me/tickets/:id", meTicketController.GetTicket)
		studentGroup.POST("/me/ai/chat", aiChatController.Chat)
		studentGroup.POST("/me/nutrition/generate", aiGenerateController.GenerateNutrition)
		studentGroup.POST("/me/nutrition/regenerate-meal", aiGenerateController.RegenerateMeal)
		studentGroup.POST("/me/nutrition/generate-week", aiGenerateController.GenerateWeeklyNutrition)
		studentGroup.POST("/me/nutrition/suggest-from-ingredients", aiGenerateController.SuggestFromIngredients)
		studentGroup.POST("/me/ai/transcribe", aiGenerateController.TranscribeVoice)
		studentGroup.POST("/me/workout/generate", aiGenerateController.GenerateWorkout)
		studentGroup.POST("/me/mobile/heartbeat", mobileAppController.MeHeartbeat)
		studentGroup.GET("/subscriptions/current", studentController.GetCurrentSubscription)
		studentGroup.GET("/subscriptions", studentController.ListSubscriptions)
		studentGroup.GET("/programs/current", studentController.GetCurrentPrograms)
		studentGroup.POST("/orders/checkout", checkoutController.Checkout)
		studentGroup.GET("/orders/:id/status", checkoutController.GetOrderStatus)
		studentGroup.POST("/payments/zarinpal/request", paymentController.ZarinpalRequest)
		studentGroup.GET("/me/streak", streakController.GetMyStreak)
		studentGroup.GET("/me/community/posts", communityPostController.ListFeed)
		studentGroup.POST("/me/community/posts", communityPostController.CreatePost)
		studentGroup.POST("/me/community/posts/media", communityPostController.UploadMedia)
		studentGroup.DELETE("/me/community/posts/:id", communityPostController.DeletePost)
		studentGroup.POST("/me/community/posts/:id/like", communityPostController.ToggleLike)
		studentGroup.GET("/me/community/posts/:id/comments", communityPostController.ListComments)
		studentGroup.POST("/me/community/posts/:id/comments", communityPostController.AddComment)
		studentGroup.GET("/me/events", eventController.ListEvents)
		studentGroup.POST("/me/events/:id/join", eventController.JoinEvent)
		studentGroup.POST("/me/events/:id/leave", eventController.LeaveEvent)
		studentGroup.GET("/me/optimal/quote", motivationalQuoteController.RandomQuote)
		studentGroup.GET("/me/notifications", notificationController.ListRecent)
		studentGroup.PATCH("/me/notifications/:id/read", notificationController.MarkRead)
		studentGroup.GET("/me/notifications/settings", notificationController.GetSettings)
		studentGroup.PATCH("/me/notifications/settings", notificationController.UpdateSettings)
		studentGroup.GET("/me/sessions", meSessionController.ListMySessions)
		studentGroup.GET("/me/guarantee/compliance", guaranteeController.Compliance)
		studentGroup.GET("/me/guarantee/requests", guaranteeController.ListMine)
		studentGroup.POST("/me/guarantee/requests", guaranteeController.Submit)
	}

	// Admin routes - protected and admin-only
	adminGroup := router.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(), middleware.AdminOnly())
	{
		adminGroup.GET("/dashboard/stats", adminDashboardController.GetStats)
		adminGroup.GET("/dashboard/monthly-sales", adminDashboardController.GetMonthlySales)
		adminGroup.GET("/ai/usage", aiGenerateController.AdminUsageSummary)
		adminGroup.GET("/users", adminUserController.ListUsers)
		adminGroup.GET("/users/:id", adminUserController.GetUserDetails)
		adminGroup.GET("/users/:id/programs", adminUserController.GetUserPrograms)
		adminGroup.GET("/users/:id/body", adminUserController.GetUserBody)
		adminGroup.POST("/users/:id/body/photos", adminUserController.UploadUserBodyPhoto)
		adminGroup.DELETE("/users/:id/body/photos/:photoId", adminUserController.DeleteUserBodyPhoto)
		adminGroup.GET("/students", adminStudentController.ListStudents)
		adminGroup.GET("/students/:id", adminStudentController.GetStudentByID)
		adminGroup.PATCH("/students/:id", adminStudentController.UpdateStudent)
		adminGroup.GET("/plans", adminPlanController.ListPlans)
		adminGroup.POST("/plans", adminPlanController.CreatePlan)
		adminGroup.GET("/plans/:id", adminPlanController.GetPlanByID)
		adminGroup.PATCH("/plans/:id", adminPlanController.UpdatePlan)
		adminGroup.DELETE("/plans/:id", adminPlanController.DeletePlan)
		adminGroup.GET("/site-settings", siteSettingsController.GetSiteSettingsAdmin)
		adminGroup.PUT("/site-settings", siteSettingsController.UpdateSiteSettings)
		adminGroup.POST("/site-settings/hero-image", siteSettingsController.UploadHeroImage)
		adminGroup.GET("/academy", siteSettingsController.GetAcademyAdmin)
		adminGroup.PUT("/academy", siteSettingsController.UpdateAcademyAdmin)
		adminGroup.GET("/faq", siteSettingsController.GetFAQAdmin)
		adminGroup.PUT("/faq", siteSettingsController.UpdateFAQAdmin)
		adminGroup.POST("/content-media", siteSettingsController.UploadContentMedia)
		adminGroup.GET("/feedbacks", adminFeedbackController.ListFeedbacks)
		adminGroup.GET("/coaches", adminCoachController.ListCoaches)
		adminGroup.GET("/coaches/:id", adminCoachController.GetCoachByID)
		adminGroup.PATCH("/coaches/:id", adminCoachController.PatchCoach)
		adminGroup.GET("/exercises", adminExerciseController.ListExercises)
		adminGroup.GET("/exercises/categories", adminExerciseController.ListCategories)
		adminGroup.POST("/exercises", adminExerciseController.CreateExercise)
		adminGroup.GET("/exercises/:id", adminExerciseController.GetExerciseByID)
		adminGroup.PATCH("/exercises/:id", adminExerciseController.UpdateExercise)
		adminGroup.DELETE("/exercises/:id", adminExerciseController.DeleteExercise)
		adminGroup.GET("/foods", adminFoodController.ListFoods)
		adminGroup.GET("/recipes", adminRecipeController.ListRecipes)
		adminGroup.POST("/recipes", adminRecipeController.CreateRecipe)
		adminGroup.PATCH("/recipes/:id", adminRecipeController.UpdateRecipe)
		adminGroup.DELETE("/recipes/:id", adminRecipeController.DeleteRecipe)
		adminGroup.GET("/poses", adminPoseBankController.ListPoses)
		adminGroup.POST("/poses", adminPoseBankController.CreatePose)
		adminGroup.PATCH("/poses/:id", adminPoseBankController.UpdatePose)
		adminGroup.DELETE("/poses/:id", adminPoseBankController.DeletePose)
		adminGroup.GET("/workout-templates", adminTemplateController.ListWorkoutTemplates)
		adminGroup.POST("/workout-templates", adminTemplateController.CreateWorkoutTemplate)
		adminGroup.GET("/workout-templates/:id", adminTemplateController.GetWorkoutTemplate)
		adminGroup.PUT("/workout-templates/:id", adminTemplateController.UpdateWorkoutTemplate)
		adminGroup.DELETE("/workout-templates/:id", adminTemplateController.DeleteWorkoutTemplate)
		adminGroup.GET("/nutrition-templates", adminTemplateController.ListNutritionTemplates)
		adminGroup.POST("/nutrition-templates", adminTemplateController.CreateNutritionTemplate)
		adminGroup.GET("/nutrition-templates/:id", adminTemplateController.GetNutritionTemplate)
		adminGroup.PUT("/nutrition-templates/:id", adminTemplateController.UpdateNutritionTemplate)
		adminGroup.DELETE("/nutrition-templates/:id", adminTemplateController.DeleteNutritionTemplate)
		adminGroup.GET("/students/:id/programs", adminProgramController.GetStudentPrograms)
		adminGroup.POST("/students/:id/workout-programs", adminProgramController.AssignWorkoutProgram)
		adminGroup.PATCH("/students/:id/workout-programs/:programId", adminProgramController.UpdateWorkoutProgram)
		adminGroup.POST("/students/:id/workout-programs/templates/:templateId", adminProgramController.AssignWorkoutFromTemplate)
		adminGroup.POST("/students/:id/nutrition-programs", adminProgramController.AssignNutritionProgram)
		adminGroup.PATCH("/students/:id/nutrition-programs/:programId", adminProgramController.UpdateNutritionProgram)
		adminGroup.POST("/students/:id/nutrition-programs/templates/:templateId", adminProgramController.AssignNutritionFromTemplate)
		adminGroup.GET("/assignable-workout-templates", adminProgramController.ListWorkoutTemplates)
		adminGroup.GET("/assignable-nutrition-templates", adminProgramController.ListNutritionTemplates)
		adminGroup.GET("/funnel-stats", adminFunnelController.Stats)
		adminGroup.GET("/funnel-leads", adminFunnelController.ListLeads)
		adminGroup.GET("/funnel-leads/:id", adminFunnelController.GetLead)
		adminGroup.PATCH("/funnel-leads/:id", adminFunnelController.PatchLead)
		adminGroup.DELETE("/funnel-leads/:id", adminFunnelController.DeleteLead)
		adminGroup.GET("/mobile/overview", mobileAppController.Overview)
		adminGroup.GET("/mobile/devices", mobileAppController.ListDevices)
		adminGroup.GET("/mobile/releases", mobileAppController.ListReleases)
		adminGroup.POST("/mobile/releases", mobileAppController.CreateRelease)
		adminGroup.PATCH("/mobile/releases/:id", mobileAppController.UpdateRelease)
		adminGroup.DELETE("/mobile/releases/:id", mobileAppController.DeleteRelease)
		adminGroup.PATCH("/community/posts/:id/hide", adminCommunityPostController.SetHidden)
		adminGroup.DELETE("/community/posts/:id", adminCommunityPostController.DeletePost)
		adminGroup.GET("/events", adminEventController.ListEvents)
		adminGroup.POST("/events", adminEventController.CreateEvent)
		adminGroup.PATCH("/events/:id", adminEventController.UpdateEvent)
		adminGroup.DELETE("/events/:id", adminEventController.DeleteEvent)
		adminGroup.GET("/optimal/quotes", adminMotivationalQuoteController.ListQuotes)
		adminGroup.POST("/optimal/quotes", adminMotivationalQuoteController.CreateQuote)
		adminGroup.PATCH("/optimal/quotes/:id", adminMotivationalQuoteController.UpdateQuote)
		adminGroup.DELETE("/optimal/quotes/:id", adminMotivationalQuoteController.DeleteQuote)
		adminGroup.GET("/guarantee/requests", adminGuaranteeController.ListAll)
		adminGroup.PATCH("/guarantee/requests/:id", adminGuaranteeController.Review)
	}

	// Serve uploaded files (e.g. user body photos) at /uploads/*
	router.Static("/uploads", "./uploads")
	// Exercise catalog media: data/exercises-fa/{images,videos} → /exercises-media/...
	router.Static("/exercises-media", seed.ExercisesMediaDir())
	// Template media kept separate so filenames never collide with the catalog.
	router.Static("/exercise-templates-media", seed.ExerciseTemplatesMediaDir())
	router.Static("/diet-templates-media", seed.DietTemplatesMediaDir())

	// Swagger endpoint
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return &Server{
		engine: router,
	}
}

// Run starts the HTTP server.
func (s *Server) Run() {
	addr := config.ServerAddr()
	log.Printf("API listening on %s", addr)
	if err := s.engine.Run(addr); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}

func main() {
	if err := config.Load(); err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	cfg := config.Get()
	log.Printf("config: app.env=%s server.port=%s db=%s@%s:%s/%s cors_origins=%d",
		cfg.App.Env,
		cfg.Server.Port,
		cfg.Database.User,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
		len(cfg.CORS.AllowedOrigins),
	)
	log.Printf("config: sms_delivery=%s zarinpal_sandbox=%v zarinpal_merchant=%v callback=%s openai_configured=%v",
		service.SMSDeliveryMode(),
		cfg.Payments.Zarinpal.Sandbox,
		strings.TrimSpace(cfg.Payments.Zarinpal.MerchantID) != "",
		cfg.Payments.Zarinpal.CallbackBaseURL,
		strings.TrimSpace(cfg.OpenAI.APIKey) != "",
	)

	db, err := config.NewMySQLGORM()
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	if err := runMigrations(db); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}
	if err := seedDefaultAdmin(db); err != nil {
		log.Fatalf("failed to seed default admin: %v", err)
	}
	if err := seed.EnsureSiteContact(context.Background(), db); err != nil {
		log.Fatalf("failed to seed site contact: %v", err)
	}
	if err := seed.EnsureAliFunnel(context.Background(), db); err != nil {
		log.Fatalf("failed to seed Ali funnel (funnel_1): %v", err)
	}
	if config.Get().Seed.DemoData {
		if err := seed.EnsureDemoData(context.Background(), db); err != nil {
			log.Fatalf("failed to seed demo accounts: %v", err)
		}
		seed.LogDemoCredentials()
	}
	if err := seed.SeedCatalogsFromConfig(context.Background(), db); err != nil {
		log.Printf("WARNING: catalog seed failed: %v", err)
	}
	if err := maybeSeedDevData(db); err != nil {
		log.Fatalf("failed to seed development data: %v", err)
	}

	server := NewServer(db)
	server.Run()
}

func runMigrations(db *gorm.DB) error {
	log.Println("starting GORM AutoMigrate for core models")
	if err := db.AutoMigrate(models.AllModels()...); err != nil {
		log.Printf("AutoMigrate encountered an error: %v", err)
		return err
	}
	log.Println("GORM AutoMigrate completed successfully")

	if err := db.Exec("UPDATE users SET goals = '[]' WHERE goals IS NULL OR goals = ''").Error; err != nil {
		log.Printf("failed backfilling users.goals: %v", err)
		return err
	}

	// Unpaid funnel leads must not store '' under unique tracking_code (MySQL duplicate).
	if err := db.Exec("UPDATE funnel_leads SET tracking_code = NULL WHERE tracking_code = ''").Error; err != nil {
		log.Printf("failed backfilling funnel_leads.tracking_code: %v", err)
		return err
	}

	if err := db.Exec(
		"UPDATE coach_profiles SET status = ? WHERE status IS NULL OR status = ''",
		models.CoachProfileStatusPending,
	).Error; err != nil {
		log.Printf("failed normalizing coach_profiles.status: %v", err)
		return err
	}

	// Legacy coaches that were already published before approval workflow existed.
	if err := db.Exec(
		"UPDATE coach_profiles SET status = ? WHERE status = ? AND is_published = ? AND is_active = ?",
		models.CoachProfileStatusApproved,
		models.CoachProfileStatusPending,
		true,
		true,
	).Error; err != nil {
		log.Printf("failed backfilling coach_profiles.status: %v", err)
		return err
	}

	return nil
}

func seedDefaultAdmin(db *gorm.DB) error {
	const (
		adminName     = "admin"
		adminEmail    = "admin@gmail.com"
		adminPhone    = "09150000000"
		adminPassword = "12345678"
	)

	var count int64
	if err := db.Model(&models.User{}).Where("email = ?", adminEmail).Count(&count).Error; err != nil {
		log.Printf("failed counting admin user: %v", err)
		return err
	}

	if count > 0 {
		log.Println("admin user already exists, skipping seeding")
		return nil
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("failed hashing admin password: %v", err)
		return err
	}

	admin := &models.User{
		Name:     adminName,
		Email:    adminEmail,
		Phone:    adminPhone,
		Password: string(hashed),
		Role:     models.RoleAdmin,
	}

	if err := db.Create(admin).Error; err != nil {
		log.Printf("failed creating admin user: %v", err)
		return err
	}

	log.Println("seeded default admin user with email admin@gmail.com")
	return nil
}

func maybeSeedDevData(db *gorm.DB) error {
	if !config.Get().Seed.DevData {
		return nil
	}

	_, err := seed.RunDev(context.Background(), db, seed.RunDevOptions{})
	if err != nil && strings.Contains(err.Error(), "dev seed blocked") {
		return nil
	}
	return err
}
