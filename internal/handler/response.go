package handler

import "github.com/gin-gonic/gin"

// Response is a generic JSON response wrapper for consistent API responses.
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// JSON writes a standard JSON response.
func JSON(c *gin.Context, statusCode int, data interface{}, errMsg string) {
	resp := Response{
		Success: errMsg == "",
		Data:    data,
		Error:   errMsg,
	}
	c.JSON(statusCode, resp)
}


