package routes

import (
	"fitino/challenge21/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/register", controllers.RegisterUser)
		api.GET("/videos", controllers.GetVideos)
		api.POST("/videos/:id/complete", controllers.CompleteVideo)
		api.POST("/videos/:id/unlock", controllers.UnlockVideo)
		api.GET("/progress", controllers.GetUserProgress)

		api.POST("/admin/login", controllers.AdminLogin)

		admin := api.Group("/admin")
		admin.Use(controllers.AdminAuthMiddleware)
		{
			admin.POST("/logout", controllers.AdminLogout)
			admin.GET("/stats", controllers.GetAdminStats)
			admin.GET("/users", controllers.GetAdminUsersList)
			admin.GET("/users/csv", controllers.GetAdminUsersCSV)
		}
	}
}
