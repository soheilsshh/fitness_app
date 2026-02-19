package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/auth"
)

const (
	ContextUserIDKey = "userID"
	ContextRoleKey   = "role"
)

var ErrNoUserID = errors.New("user id not in context")

// GetUserID returns the authenticated user ID from context. Use after AuthMiddleware.
func GetUserID(c *gin.Context) (uint, error) {
	val, exists := c.Get(ContextUserIDKey)
	if !exists {
		return 0, ErrNoUserID
	}
	id, ok := val.(uint)
	if !ok {
		return 0, ErrNoUserID
	}
	return id, nil
}

// AuthMiddleware validates the access token and injects user id and role into Gin context.
// Accepts "Authorization: Bearer <token>" or "Authorization: <token>" (for Swagger / clients that send only the token).
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}

		var tokenStr string
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			tokenStr = strings.TrimSpace(parts[1])
		} else {
			// Only token (e.g. from Swagger Authorize box)
			tokenStr = authHeader
		}
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization header format"})
			return
		}
		claims, err := auth.ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextRoleKey, claims.Role)

		c.Next()
	}
}
