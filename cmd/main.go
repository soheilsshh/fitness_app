package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/controllers"
	"github.com/yourusername/fitness-management/internal/repository"
	"github.com/yourusername/fitness-management/internal/service"
)

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
		log.Println("no .env file found or failed to load, falling back to environment variables")
	}

	// Initialize database
	db, err := config.NewPostgresGORM()
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	if err := config.SetupDatabase(db); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)

	// Initialize services
	authService := service.NewAuthService(userRepo, refreshTokenRepo)

	// Initialize handlers
	authController := controllers.NewAuthController(authService)

	// Auth routes
	router.POST("/auth/register", authController.Register)
	router.POST("/auth/login/password", authController.LoginWithPassword)
	router.POST("/auth/otp/request", authController.RequestOTP)
	router.POST("/auth/otp/verify", authController.VerifyOTP)

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
