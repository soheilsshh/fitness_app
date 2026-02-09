package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// JWTClaims represents the custom claims stored in JWT tokens.
// The structure is defined as part of the architecture; behavior will be added later.
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
}

// GenerateToken creates a JWT token for a given user ID and role.
// Implementation is intentionally omitted for now.
func GenerateToken(userID uint, role string) (string, error) {
	return "", nil
}

// JWTAuthMiddleware validates JWT tokens and injects claims into the Gin context.
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Token extraction and validation logic will be implemented later.
		c.Next()
	}
}

// GetClaimsFromContext extracts JWTClaims from the Gin context.
func GetClaimsFromContext(c *gin.Context) (*JWTClaims, bool) {
	val, exists := c.Get("claims")
	if !exists {
		return nil, false
	}
	claims, ok := val.(*JWTClaims)
	return claims, ok
}


