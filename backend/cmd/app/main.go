package main

import (
	"log"
	"os"
	"regexp"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/yourusername/fitness-management/config"
	_ "github.com/yourusername/fitness-management/docs"
	"github.com/yourusername/fitness-management/internal/controllers"
	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/repository"
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
func NewServer() *Server {
	// Initialize Gin router
	router := gin.Default()

	// CORS configuration for frontend <-> backend communication.
	// FRONTEND_ORIGIN may be a comma-separated list. When unset, default to the
	// common Next.js dev ports (3000-3002) so a dev-server port bounce doesn't
	// break preflight with a 403.
	var allowOrigins []string
	if env := os.Getenv("FRONTEND_ORIGIN"); env != "" {
		for _, o := range strings.Split(env, ",") {
			if o = strings.TrimSpace(o); o != "" {
				allowOrigins = append(allowOrigins, o)
			}
		}
	} else {
		allowOrigins = []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
		}
	}
	// Allow any local port so a dev-server port bounce never breaks preflight.
	localOriginRe := regexp.MustCompile(`^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$`)
	allowed := make(map[string]struct{}, len(allowOrigins))
	for _, o := range allowOrigins {
		allowed[o] = struct{}{}
	}
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			if _, ok := allowed[origin]; ok {
				return true
			}
			return localOriginRe.MatchString(origin)
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false, // we send JWT via Authorization header, not cookies
	}))

	// Initialize database
	db, err := config.NewMySQLGORM()
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	if err := config.SetupDatabase(db); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}
	if err := config.MaybeSeedDevData(db); err != nil {
		log.Fatalf("failed to seed development data: %v", err)
	}

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
	notificationRepo := repository.NewNotificationRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, coachProfileRepo, refreshTokenRepo, otpRepo)
	coachProfileService := service.NewCoachProfileService(coachProfileRepo, servicePlanRepo)
	coachPlanService := service.NewCoachPlanService(servicePlanRepo)
	checkoutService := service.NewCheckoutService(db, userRepo, servicePlanRepo, orderRepo, subscriptionRepo, coachProfileRepo)
	studentService := service.NewStudentService(userRepo, subscriptionRepo, servicePlanRepo, programRepo)
	meService := service.NewMeService(db, userRepo, orderRepo, subscriptionRepo, servicePlanRepo, programRepo, exerciseRepo)
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
	coachProgramService := service.NewCoachProgramService(db, subscriptionRepo, programRepo, exerciseRepo, coachStudentService)
	coachDashboardService := service.NewCoachDashboardService(db, subscriptionRepo, orderRepo)
	coachStudentController := controllers.NewCoachStudentController(coachStudentService)
	coachProgramController := controllers.NewCoachProgramController(coachProgramService)
	coachDashboardController := controllers.NewCoachDashboardController(coachDashboardService)
	coachExerciseController := controllers.NewCoachExerciseController(adminExerciseService)
	coachTicketController := controllers.NewCoachTicketController(ticketService)
	checkoutController := controllers.NewCheckoutController(checkoutService)
	trackingService := service.NewTrackingService(db, subscriptionRepo, coachStudentService)
	trackingController := controllers.NewTrackingController(trackingService)
	coachTrackingController := controllers.NewCoachTrackingController(trackingService)
	workoutHistoryService := service.NewWorkoutHistoryService(db, subscriptionRepo, servicePlanRepo, programRepo)
	workoutHistoryController := controllers.NewWorkoutHistoryController(workoutHistoryService)
	notificationService := service.NewNotificationService(notificationRepo)
	notificationController := controllers.NewNotificationController(notificationService)

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
		coachGroup.GET("/notifications", notificationController.ListRecent)
		coachGroup.GET("/tickets", coachTicketController.ListTickets)
		coachGroup.GET("/tickets/:id", coachTicketController.GetTicket)
		coachGroup.PATCH("/tickets/:id/answer", coachTicketController.AnswerTicket)
		coachGroup.PATCH("/tickets/:id/status", coachTicketController.UpdateTicketStatus)
		coachGroup.GET("/exercises/categories", coachExerciseController.ListCategories)
		coachGroup.GET("/exercises", coachExerciseController.ListExercises)
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
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := s.engine.Run(":" + port); err != nil {
		log.Fatalf("failed to run server: %v", err)
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found or failed to load, falling back to existing environment variables")
	} else {
		log.Println(".env file loaded successfully")
		log.Printf("DB_HOST=%s DB_PORT=%s DB_USER=%s DB_NAME=%s\n",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_USER"),
			os.Getenv("DB_NAME"),
		)
	}

	server := NewServer()
	server.Run()
}
