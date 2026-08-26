package controllers

import (
	"fitino-challenge-backend/config"
	"fitino-challenge-backend/database"
	"fitino-challenge-backend/models"
	"fitino-challenge-backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

// CreatePayment starts a Zarinpal payment for the full-program purchase.
// Body: { "phone": "09..." }
func CreatePayment(c *gin.Context) {
	var body struct {
		Phone string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone is required"})
		return
	}

	var user models.User
	if err := database.DB.Where("phone = ?", body.Phone).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found, register first"})
		return
	}

	payment, payURL, err := services.CreatePaymentRequest(user.ID, body.Phone)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payment_url": payURL,
		"authority":   payment.Authority,
	})
}

// PaymentCallback handles Zarinpal's redirect after payment (GET, query
// params Authority + Status per Zarinpal's convention) and redirects the
// user to a frontend success/failure page.
func PaymentCallback(c *gin.Context) {
	authority := c.Query("Authority")
	status := c.Query("Status")
	frontendURL := config.Config.Zarinpal.FrontendURL

	if authority == "" || status != "OK" {
		c.Redirect(http.StatusFound, frontendURL+"/payment/failed")
		return
	}

	payment, err := services.VerifyPayment(authority)
	if err != nil || payment.Status != "success" {
		c.Redirect(http.StatusFound, frontendURL+"/payment/failed")
		return
	}

	c.Redirect(http.StatusFound, frontendURL+"/payment/success")
}
