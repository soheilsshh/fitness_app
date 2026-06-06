package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/models"
)

// AdminOnly ensures the current user has role admin (super-admin).
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get(ContextRoleKey)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		role, ok := roleVal.(string)
		if !ok || role != models.RoleAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

