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
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: config.CORSAllowCredentials(),
	}))

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	servicePlanRepo := repository.NewServicePlanRepository(db)
	programRepo := repository.NewProgramRepository(db)
	otpRepo := repository.NewOtpRepository(db)
	txRepo := repository.NewTransactionRepository(db)
	siteSettingsRepo := repository.NewSiteSettingsRepository(db)
	feedbackRepo := repository.NewFeedbackRepository(db)
	ticketRepo := repository.NewTicketRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	coachProfileRepo := repository.NewCoachProfileRepository(db)
	exerciseRepo := repository.NewExerciseRepository(db)
	foodRepo := repository.NewFoodRepository(db)
	dailyFoodLogRepo := repository.NewDailyFoodLogRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, coachProfileRepo, refreshTokenRepo, otpRepo)
	coachProfileService := service.NewCoachProfileService(coachProfileRepo, servicePlanRepo)
	coachPlanService := service.NewCoachPlanService(servicePlanRepo)
	paymentService := service.NewPaymentService(db, userRepo, servicePlanRepo, orderRepo, subscriptionRepo)
	checkoutService := service.NewCheckoutService(db, userRepo, servicePlanRepo, orderRepo, subscriptionRepo, coachProfileRepo, paymentService)
	studentService := service.NewStudentService(userRepo, subscriptionRepo, servicePlanRepo, programRepo)
	meService := service.NewMeService(db, userRepo, orderRepo, subscriptionRepo, servicePlanRepo, programRepo, exerciseRepo, foodRepo)
	adminUserService := service.NewAdminUserService(db, subscriptionRepo, txRepo)
	adminDashboardService := service.NewAdminDashboardService(db, subscriptionRepo, txRepo, coachProfileRepo)
	adminStudentService := service.NewAdminStudentService(db, userRepo, subscriptionRepo, servicePlanRepo, coachProfileRepo)
	adminPlanService := service.NewAdminPlanService(servicePlanRepo, coachProfileRepo)
	adminCoachService := service.NewAdminCoachService(coachProfileRepo)
	adminExerciseService := service.NewAdminExerciseService(exerciseRepo)
	siteSettingsService := service.NewSiteSettingsService(siteSettingsRepo)
	feedbackService := service.NewFeedbackService(feedbackRepo)
	ticketService := service.NewTicketService(userRepo, ticketRepo)

	// Initialize handlers
	authController := controllers.NewAuthController(authService, meService)
	studentController := controllers.NewStudentController(studentService)
	meController := controllers.NewMeController(meService)
	meTicketController := controllers.NewMeTicketController(ticketService)
	adminUserController := controllers.NewAdminUserController(adminUserService)
	adminDashboardController := controllers.NewAdminDashboardController(adminDashboardService)
	adminStudentController := controllers.NewAdminStudentController(adminStudentService)
	adminPlanController := controllers.NewAdminPlanController(adminPlanService)
	siteSettingsController := controllers.NewSiteSettingsController(siteSettingsService)
	feedbackController := controllers.NewFeedbackController(feedbackService)
	adminFeedbackController := controllers.NewAdminFeedbackController(feedbackService)
	adminCoachController := controllers.NewAdminCoachController(adminCoachService)
	adminExerciseController := controllers.NewAdminExerciseController(adminExerciseService)
	coachProfileController := controllers.NewCoachProfileController(coachProfileService)
	publicCoachController := controllers.NewPublicCoachController(coachProfileService)
	coachPlanController := controllers.NewCoachPlanController(coachPlanService)
	authzService := service.NewAuthorizationService(db, servicePlanRepo)
	coachStudentService := service.NewCoachStudentService(db, subscriptionRepo, servicePlanRepo, programRepo, authzService)
	coachProgramService := service.NewCoachProgramService(db, subscriptionRepo, programRepo, exerciseRepo, foodRepo, coachStudentService)
	coachDashboardService := service.NewCoachDashboardService(db, subscriptionRepo, orderRepo)
	coachStudentController := controllers.NewCoachStudentController(coachStudentService)
	coachProgramController := controllers.NewCoachProgramController(coachProgramService)
	coachDashboardController := controllers.NewCoachDashboardController(coachDashboardService)
	coachExerciseController := controllers.NewCoachExerciseController(adminExerciseService)
	coachFoodService := service.NewCoachFoodService(foodRepo)
	coachFoodController := controllers.NewCoachFoodController(coachFoodService)
	coachTicketController := controllers.NewCoachTicketController(ticketService)
	checkoutController := controllers.NewCheckoutController(checkoutService)
	paymentController := controllers.NewPaymentController(paymentService)
	trackingService := service.NewTrackingService(db, subscriptionRepo, coachStudentService)
	trackingController := controllers.NewTrackingController(trackingService)
	coachTrackingController := controllers.NewCoachTrackingController(trackingService)
	workoutHistoryService := service.NewWorkoutHistoryService(db, subscriptionRepo, servicePlanRepo, programRepo)
	workoutHistoryController := controllers.NewWorkoutHistoryController(workoutHistoryService)
	dailyFoodLogService := service.NewDailyFoodLogService(dailyFoodLogRepo, foodRepo)
	dailyFoodLogController := controllers.NewDailyFoodLogController(dailyFoodLogService)
	meDashboardService := service.NewMeDashboardService(db, subscriptionRepo)
	meDashboardController := controllers.NewMeDashboardController(meDashboardService)
	notificationService := service.NewNotificationService(notificationRepo)
	notificationController := controllers.NewNotificationController(notificationService)
	funnelLeadRepo := repository.NewFunnelLeadRepository(db)
	funnelService := service.NewFunnelService(funnelLeadRepo)
	funnelController := controllers.NewFunnelController(funnelService)
	adminFunnelController := controllers.NewAdminFunnelController(funnelService)

	// Auth routes
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
	router.POST("/feedbacks", feedbackController.CreateFeedback)
	router.GET("/coaches", publicCoachController.ListCoaches)
	router.GET("/coaches/:slug", publicCoachController.GetCoachBySlug)
	router.GET("/coaches/:slug/plans", publicCoachController.GetCoachPlans)
	router.GET("/public/funnel/config", funnelController.GetConfig)
	router.POST("/public/funnel/leads", funnelController.CreateLead)
	router.GET("/public/funnel/checkout/:token", funnelController.GetCheckout)
	router.POST("/public/funnel/checkout/:token/pay", funnelController.PayDemo)
	router.GET("/payments/zarinpal/callback", paymentController.ZarinpalCallback)
	router.GET("/payments/result", paymentController.PaymentsResultPage)

	// Coach panel routes
	coachGroup := router.Group("/coach")
	coachGroup.Use(middleware.AuthMiddleware(), middleware.CoachOnly())
	{
		coachGroup.GET("/profile", coachProfileController.GetProfile)
		coachGroup.PUT("/profile", coachProfileController.UpdateProfile)
		coachGroup.GET("/profile/slug/check", coachProfileController.CheckSlug)
		coachGroup.POST("/profile/avatar", coachProfileController.UploadAvatar)
		coachGroup.POST("/profile/cover", coachProfileController.UploadCover)
		coachGroup.GET("/plans", coachPlanController.ListPlans)
		coachGroup.POST("/plans", coachPlanController.CreatePlan)
		coachGroup.GET("/plans/:id", coachPlanController.GetPlanByID)
		coachGroup.PATCH("/plans/:id", coachPlanController.UpdatePlan)
		coachGroup.DELETE("/plans/:id", coachPlanController.DeletePlan)
		coachGroup.GET("/students", coachStudentController.ListStudents)
		coachGroup.GET("/students/:id", coachStudentController.GetStudentByID)
		coachGroup.GET("/students/:id/programs", coachProgramController.GetStudentPrograms)
		coachGroup.POST("/students/:id/workout-programs", coachProgramController.AssignWorkoutProgram)
		coachGroup.PATCH("/students/:id/workout-programs/:programId", coachProgramController.UpdateWorkoutProgram)
		coachGroup.POST("/students/:id/nutrition-programs", coachProgramController.AssignNutritionProgram)
		coachGroup.PATCH("/students/:id/nutrition-programs/:programId", coachProgramController.UpdateNutritionProgram)
		coachGroup.GET("/dashboard/stats", coachDashboardController.GetStats)
		coachGroup.GET("/dashboard/recent-students", coachDashboardController.GetRecentStudents)
		coachGroup.GET("/dashboard/top-students", coachDashboardController.GetTopStudents)
		coachGroup.GET("/dashboard/progress-series", coachDashboardController.GetProgressSeries)
		coachGroup.GET("/notifications", notificationController.ListRecent)
		coachGroup.GET("/tickets", coachTicketController.ListTickets)
		coachGroup.GET("/tickets/:id", coachTicketController.GetTicket)
		coachGroup.PATCH("/tickets/:id/answer", coachTicketController.AnswerTicket)
		coachGroup.PATCH("/tickets/:id/status", coachTicketController.UpdateTicketStatus)
		coachGroup.GET("/exercises/categories", coachExerciseController.ListCategories)
		coachGroup.GET("/exercises", coachExerciseController.ListExercises)
		coachGroup.GET("/foods", coachFoodController.ListFoods)
		coachGroup.POST("/exercises", coachExerciseController.CreateExercise)
		coachGroup.GET("/exercises/:id", coachExerciseController.GetExerciseByID)
		coachGroup.GET("/tracking/students", coachTrackingController.ListStudents)
		coachGroup.GET("/tracking/students/:id", coachTrackingController.GetStudentTracking)
	}

	// Student (user panel) routes - all protected
	studentGroup := router.Group("/")
	studentGroup.Use(middleware.AuthMiddleware())
	{
		studentGroup.GET("/me", meController.GetProfile)
		studentGroup.PATCH("/me", meController.UpdateProfile)
		studentGroup.POST("/me/body-photos", meController.UploadBodyPhoto)
		studentGroup.GET("/me/tracking", trackingController.GetMyTracking)
		studentGroup.POST("/me/tracking/weight", trackingController.SubmitWeight)
		studentGroup.POST("/me/tracking/photos", trackingController.UploadTrackingPhoto)
		studentGroup.GET("/me/workout-history", workoutHistoryController.ListHistory)
		studentGroup.POST("/me/workout-sessions", workoutHistoryController.LogSession)
		studentGroup.POST("/user/food-logs", dailyFoodLogController.CreateLog)
		studentGroup.GET("/user/food-logs", dailyFoodLogController.ListByDate)
		studentGroup.DELETE("/user/food-logs/:id", dailyFoodLogController.DeleteLog)
		studentGroup.GET("/user/foods", coachFoodController.ListFoods)
		studentGroup.GET("/me/dashboard", meDashboardController.GetSummary)
		studentGroup.GET("/me/records", meDashboardController.GetRecords)
		studentGroup.POST("/me/change-password", authController.ChangePassword)
		studentGroup.GET("/me/orders", meController.ListMyOrders)
		studentGroup.GET("/me/orders/:id", meController.GetMyOrderByID)
		studentGroup.GET("/me/programs", meController.ListMyPrograms)
		studentGroup.GET("/me/programs/:id", meController.GetMyProgramByID)
		studentGroup.GET("/me/tickets", meTicketController.ListTickets)
		studentGroup.POST("/me/tickets", meTicketController.CreateTicket)
		studentGroup.GET("/me/tickets/:id", meTicketController.GetTicket)
		studentGroup.GET("/subscriptions/current", studentController.GetCurrentSubscription)
		studentGroup.GET("/subscriptions", studentController.ListSubscriptions)
		studentGroup.GET("/programs/current", studentController.GetCurrentPrograms)
		studentGroup.POST("/orders/checkout", checkoutController.Checkout)
		studentGroup.GET("/orders/:id/status", checkoutController.GetOrderStatus)
		studentGroup.POST("/payments/zarinpal/request", paymentController.ZarinpalRequest)
	}

	// Admin routes - protected and admin-only
	adminGroup := router.Group("/admin")
	adminGroup.Use(middleware.AuthMiddleware(), middleware.AdminOnly())
	{
		adminGroup.GET("/dashboard/stats", adminDashboardController.GetStats)
		adminGroup.GET("/dashboard/monthly-sales", adminDashboardController.GetMonthlySales)
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
		adminGroup.GET("/plans/:id", adminPlanController.GetPlanByID)
		adminGroup.GET("/site-settings", siteSettingsController.GetSiteSettingsAdmin)
		adminGroup.PUT("/site-settings", siteSettingsController.UpdateSiteSettings)
		adminGroup.POST("/site-settings/hero-image", siteSettingsController.UploadHeroImage)
		adminGroup.GET("/feedbacks", adminFeedbackController.ListFeedbacks)
		adminGroup.GET("/coaches", adminCoachController.ListCoaches)
		adminGroup.GET("/coaches/:id", adminCoachController.GetCoachByID)
		adminGroup.PATCH("/coaches/:id", adminCoachController.PatchCoach)
		adminGroup.GET("/exercises", adminExerciseController.ListExercises)
		adminGroup.POST("/exercises", adminExerciseController.CreateExercise)
		adminGroup.GET("/exercises/:id", adminExerciseController.GetExerciseByID)
		adminGroup.PATCH("/exercises/:id", adminExerciseController.UpdateExercise)
		adminGroup.DELETE("/exercises/:id", adminExerciseController.DeleteExercise)
		adminGroup.GET("/funnel-stats", adminFunnelController.Stats)
		adminGroup.GET("/funnel-leads", adminFunnelController.ListLeads)
		adminGroup.GET("/funnel-leads/:id", adminFunnelController.GetLead)
		adminGroup.PATCH("/funnel-leads/:id", adminFunnelController.PatchLead)
		adminGroup.DELETE("/funnel-leads/:id", adminFunnelController.DeleteLead)
	}

	// Serve uploaded files (e.g. user body photos) at /uploads/*
	router.Static("/uploads", "./uploads")
	router.Static("/exercises-media", "./exercises-dataset-main")

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
