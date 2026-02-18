package main

import (
	"log"
	"os"

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

// Server is the base application server that wires routes, middleware, and dependencies.
type Server struct {
	engine *gin.Engine
}

// NewServer constructs a new Server with all dependencies initialized.
func NewServer() *Server {
	// Initialize Gin router
	router := gin.Default()

	// Load environment variables from .env file (if present)
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

	// Initialize database
	db, err := config.NewMySQLGORM()
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	if err := config.SetupDatabase(db); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	servicePlanRepo := repository.NewServicePlanRepository(db)
	programRepo := repository.NewProgramRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, refreshTokenRepo)
	studentService := service.NewStudentService(userRepo, subscriptionRepo, servicePlanRepo, programRepo)

	// Initialize handlers
	authController := controllers.NewAuthController(authService)
	studentController := controllers.NewStudentController(studentService)

	// Auth routes
	router.POST("/auth/register", authController.Register)
	router.POST("/auth/login/password", authController.LoginWithPassword)
	router.POST("/auth/otp/request", authController.RequestOTP)
	router.POST("/auth/otp/verify", authController.VerifyOTP)

	// Protected auth routes
	authGroup := router.Group("/auth")
	authGroup.Use(middleware.AuthMiddleware())
	{
		authGroup.POST("/logout", authController.Logout)
		authGroup.GET("/me", authController.Me)
		authGroup.POST("/change-password", authController.ChangePassword)
	}

	// Student (client) routes - all protected
	studentGroup := router.Group("/")
	studentGroup.Use(middleware.AuthMiddleware())
	{
		studentGroup.GET("/me", studentController.GetMe)
		studentGroup.GET("/subscriptions/current", studentController.GetCurrentSubscription)
		studentGroup.GET("/subscriptions", studentController.ListSubscriptions)
		studentGroup.GET("/programs/current", studentController.GetCurrentPrograms)
	}

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
	server := NewServer()
	server.Run()
}
