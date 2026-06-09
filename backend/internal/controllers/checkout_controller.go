package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service"
)

type CheckoutController struct {
	checkoutService service.CheckoutService
}

func NewCheckoutController(s service.CheckoutService) *CheckoutController {
	return &CheckoutController{checkoutService: s}
}

func (h *CheckoutController) Checkout(c *gin.Context) {
	roleVal, _ := c.Get(middleware.ContextRoleKey)
	role, _ := roleVal.(string)
	if role != models.RoleStudent {
		c.JSON(http.StatusForbidden, gin.H{"error": "only students can checkout"})
		return
	}

	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	resp, err := h.checkoutService.Checkout(c.Request.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCheckoutAlreadyHasCoach):
			c.JSON(http.StatusConflict, gin.H{"error": "شما قبلاً زیر نظر یک مربی هستید"})
		case errors.Is(err, service.ErrCheckoutNotStudent):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrCheckoutEmptyCart),
			errors.Is(err, service.ErrCheckoutInvalidPlan),
			errors.Is(err, service.ErrCheckoutMixedCoaches),
			errors.Is(err, service.ErrCheckoutPlanInactive),
			errors.Is(err, service.ErrCheckoutMultipleItems),
			errors.Is(err, service.ErrCheckoutInvalidQty):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *CheckoutController) GetOrderStatus(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
		return
	}
	resp, err := h.checkoutService.GetOrderStatus(c.Request.Context(), userID, uint(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
		return
	}
	c.JSON(http.StatusOK, resp)
}
