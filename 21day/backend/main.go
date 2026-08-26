package main

import (
	"fitino-challenge-backend/config"
	"fitino-challenge-backend/database"
	"fitino-challenge-backend/models"
	"fitino-challenge-backend/routes"
	"fitino-challenge-backend/services"
	"strconv"
	"strings"
	"time"

	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func startSMSScheduler() {
	go func() {
		for {
			jobs := database.GetDueScheduledSMS()
			for _, job := range jobs {
				var user models.User
				database.DB.First(&user, job.UserID)
				smsParams := map[string]string{"name": user.FirstName}
				services.SendSMS(user.Phone, smsParams, job.Pattern)
				database.MarkSMSSent(job.ID)
			}
			time.Sleep(1 * time.Minute)
		}
	}()
}

func extractStepNumber(pattern string) int {
	// Extract step number from pattern like "followup1_3h" -> 1
	if strings.Contains(pattern, "followup") {
		parts := strings.Split(pattern, "followup")
		if len(parts) > 1 {
			stepPart := strings.Split(parts[1], "_")[0]
			if step, err := strconv.Atoi(stepPart); err == nil {
				return step
			}
		}
	}
	return 1
}

func main() {
	config.LoadConfig()
	log.Printf("Loaded config: %+v", config.Config)
	database.Connect()
	startSMSScheduler()
	r := gin.Default()

	// Add CORS middleware for frontend integration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://challenge.fitinoo.ir", "http://localhost:3000", "http://localhost:8080", "http://localhost:5183"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	routes.RegisterRoutes(r)

	r.Run(":" + config.Config.ServerPort)
}
