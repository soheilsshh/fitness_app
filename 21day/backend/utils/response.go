package utils

import "github.com/gin-gonic/gin"

func RespondSuccess(c *gin.Context, data interface{}) {
	c.JSON(200, gin.H{"success": true, "data": data})
}

func RespondError(c *gin.Context, message string) {
	c.JSON(400, gin.H{"success": false, "error": message})
} 