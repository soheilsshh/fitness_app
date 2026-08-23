package controllers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// WooCommerceOrder represents the structure of a WooCommerce order webhook payload
type WooCommerceOrder struct {
	ID            int    `json:"id"`
	Status        string `json:"status"`
	Total         string `json:"total"`
	Currency      string `json:"currency"`
	PaymentMethod string `json:"payment_method"`
	Billing       struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
	} `json:"billing"`
}

// WooWebhookHandler_Get handles GET requests to the webhook endpoint
// This prevents 404 errors when users access the URL in a browser
func WooWebhookHandler_Get(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "WooCommerce webhook endpoint is active",
		"method":  "GET",
	})
}

// WooWebhookHandler handles incoming WooCommerce webhook requests (POST)
// It ALWAYS returns HTTP 200, even for invalid JSON or non-order payloads
func WooWebhookHandler(c *gin.Context) {
	// Read raw request body for logging
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		// Even if we can't read the body, return 200 to prevent webhook retries
		log.Printf("[WooCommerce Webhook] Error reading request body: %v", err)
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "received (body read error)",
		})
		return
	}

	// Log raw request body for debugging
	rawBody := string(bodyBytes)
	log.Printf("[WooCommerce Webhook] Raw request body: %s", rawBody)

	// Try to unmarshal into WooCommerceOrder struct
	var order WooCommerceOrder
	if err := json.Unmarshal(bodyBytes, &order); err != nil {
		// JSON parsing failed - return 200 with non-order message
		// This prevents WooCommerce from retrying and marking the webhook as failed
		log.Printf("[WooCommerce Webhook] Received non-order payload or invalid JSON: %v", err)
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "received non-order payload",
		})
		return
	}

	// Check if this looks like an order (has an ID)
	if order.ID == 0 {
		// Parsed successfully but doesn't look like an order
		log.Printf("[WooCommerce Webhook] Received valid JSON but not an order (ID is 0)")
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "received non-order payload",
		})
		return
	}

	// Successfully parsed as order - log key information
	log.Printf("[WooCommerce Webhook] Received order:")
	log.Printf("  Order ID: %d", order.ID)
	log.Printf("  Status: %s", order.Status)
	log.Printf("  Total: %s %s", order.Total, order.Currency)
	log.Printf("  Payment Method: %s", order.PaymentMethod)
	log.Printf("  Billing Info:")
	log.Printf("    Name: %s %s", order.Billing.FirstName, order.Billing.LastName)
	log.Printf("    Email: %s", order.Billing.Email)
	log.Printf("    Phone: %s", order.Billing.Phone)

	// Return success response with order ID
	c.JSON(http.StatusOK, gin.H{
		"status":   "success",
		"order_id": order.ID,
	})
}

