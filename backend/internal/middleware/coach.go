package middleware

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

const (
	ContextCoachProfileStatusKey = "coachProfileStatus"
	coachApprovalBlockedMessage  = "Profile is under review or incomplete"
)

// CoachOnly ensures the current user has role coach.
func CoachOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get(ContextRoleKey)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		role, ok := roleVal.(string)
		if !ok || role != models.RoleCoach {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

// ApprovedCoachOnly ensures the authenticated coach has an approved profile.
// Use after AuthMiddleware and CoachOnly on routes that require full panel access.
func ApprovedCoachOnly(coachRepo repository.CoachProfileRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserID(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		profile, err := coachRepo.FindByUserID(c.Request.Context(), userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error":  coachApprovalBlockedMessage,
					"status": models.CoachProfileStatusPending,
				})
				return
			}
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		status := profile.Status
		if status == "" {
			status = models.CoachProfileStatusPending
		}
		c.Set(ContextCoachProfileStatusKey, status)

		if status != models.CoachProfileStatusApproved {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":  coachApprovalBlockedMessage,
				"status": status,
			})
			return
		}

		c.Next()
	}
}
