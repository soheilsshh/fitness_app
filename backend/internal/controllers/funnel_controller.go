package controllers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/service"
)

type FunnelController struct {
	funnelService service.FunnelService
}

func NewFunnelController(s service.FunnelService) *FunnelController {
	return &FunnelController{funnelService: s}
}

func (h *FunnelController) GetConfig(c *gin.Context) {
	cfg := h.funnelService.GetConfig(c.Request.Context())
	c.JSON(http.StatusOK, cfg)
}

func (h *FunnelController) RequestLeadOTP(c *gin.Context) {
	var req service.FunnelOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.funnelService.RequestLeadOTP(c.Request.Context(), req.Phone); err != nil {
		var cooldownErr *service.OTPCooldownError
		if errors.As(err, &cooldownErr) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":               "لطفاً کمی بعد دوباره تلاش کنید",
				"retry_after_seconds": cooldownErr.RetryAfterSeconds,
			})
			return
		}
		if errors.Is(err, service.ErrFunnelInvalidInput) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "شماره موبایل نامعتبر است"})
			return
		}
		if errors.Is(err, service.ErrSMSSendFailed) {
			c.JSON(http.StatusBadGateway, gin.H{"error": service.SMSErrorMessage(err)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "کد تایید ارسال شد"})
}

func (h *FunnelController) CreateLead(c *gin.Context) {
	var req service.CreateFunnelLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	resp, err := h.funnelService.CreateLead(c.Request.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelInvalidOTP):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "کد تایید نامعتبر یا منقضی است", "code": "invalid_otp"})
		case errors.Is(err, service.ErrFunnelInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "اطلاعات وارد شده نامعتبر است"})
		case errors.Is(err, service.ErrFunnelAlreadySubscribed):
			c.JSON(http.StatusConflict, gin.H{
				"error":    "شما قبلاً برنامه فعال دارید",
				"code":     "already_subscribed",
				"panelUrl": "/user/dashboard",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *FunnelController) GetCheckout(c *gin.Context) {
	token := c.Param("token")
	resp, err := h.funnelService.GetCheckout(c.Request.Context(), token)
	if err != nil {
		if errors.Is(err, service.ErrFunnelLeadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FunnelController) SelectPlan(c *gin.Context) {
	token := c.Param("token")
	var req service.SelectFunnelPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	resp, err := h.funnelService.SelectPlan(c.Request.Context(), token, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelLeadNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
		case errors.Is(err, service.ErrFunnelAlreadyPaid):
			c.JSON(http.StatusConflict, gin.H{"error": "already paid"})
		case errors.Is(err, service.ErrFunnelInvalidInput), errors.Is(err, service.ErrFunnelInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plan selection"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *FunnelController) PayDemo(c *gin.Context) {
	token := c.Param("token")
	resp, err := h.funnelService.StartPayment(c.Request.Context(), token)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelLeadNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
		case errors.Is(err, service.ErrFunnelAlreadyPaid):
			c.JSON(http.StatusConflict, gin.H{"error": "already paid"})
		case errors.Is(err, service.ErrFunnelInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment status"})
		case errors.Is(err, service.ErrFunnelInvalidInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": "پلن پرداخت انتخاب نشده است"})
		case errors.Is(err, service.ErrCheckoutAlreadyHasCoach), errors.Is(err, service.ErrCheckoutNotStudent):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case errors.Is(err, service.ErrPaymentGatewayFailed):
			log.Printf("funnel pay gateway error: %v", err)
			msg := "اتصال به درگاه زرین‌پال ناموفق بود"
			if raw := err.Error(); strings.Contains(raw, "message=") {
				if i := strings.LastIndex(raw, "message="); i >= 0 {
					if detail := strings.TrimSpace(raw[i+len("message="):]); detail != "" {
						msg = detail
					}
				}
			}
			c.JSON(http.StatusBadGateway, gin.H{"error": msg})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

func writeFunnelAuthSession(c *gin.Context, result *service.AuthResult) {
	user := result.User
	c.JSON(http.StatusOK, gin.H{
		"access_token":  result.AccessToken,
		"refresh_token": result.RefreshToken,
		"user": gin.H{
			"id":                user.ID,
			"name":              user.Name,
			"email":             user.Email,
			"phone":             user.Phone,
			"role":              user.Role,
			"avatarUrl":         user.AvatarURL,
			"isProfileComplete": models.IsStudentProfileComplete(user, nil),
		},
	})
}

func (h *FunnelController) StartFreeAccess(c *gin.Context) {
	token := c.Param("token")
	result, err := h.funnelService.StartFreeAccess(c.Request.Context(), token)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelLeadNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "سفارش یافت نشد"})
		case errors.Is(err, service.ErrFunnelInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "امکان شروع رایگان برای این سفارش نیست"})
		case errors.Is(err, service.ErrCheckoutNotStudent):
			c.JSON(http.StatusConflict, gin.H{"error": "این شماره مربوط به حساب دانشجو نیست"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	writeFunnelAuthSession(c, result)
}

func (h *FunnelController) IssueSession(c *gin.Context) {
	token := c.Param("token")
	result, err := h.funnelService.IssueSession(c.Request.Context(), token)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelLeadNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "سفارش یافت نشد"})
		case errors.Is(err, service.ErrFunnelInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": "پرداخت هنوز تایید نشده است"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	writeFunnelAuthSession(c, result)
}

type AdminFunnelController struct {
	funnelService service.FunnelService
}

func NewAdminFunnelController(s service.FunnelService) *AdminFunnelController {
	return &AdminFunnelController{funnelService: s}
}

func (h *AdminFunnelController) ListLeads(c *gin.Context) {
	page := 1
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	pageSize := 20
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	status := c.Query("status")
	if status == "" {
		status = "all"
	}

	query := c.Query("query")

	resp, err := h.funnelService.ListLeads(c.Request.Context(), status, query, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminFunnelController) GetLead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	resp, err := h.funnelService.GetLeadByID(c.Request.Context(), uint(id))
	if err != nil {
		if errors.Is(err, service.ErrFunnelLeadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminFunnelController) PatchLead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.PatchFunnelLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	if err := h.funnelService.PatchLead(c.Request.Context(), uint(id), &req); err != nil {
		switch {
		case errors.Is(err, service.ErrFunnelLeadNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
		case errors.Is(err, service.ErrFunnelInvalidInput), errors.Is(err, service.ErrFunnelInvalidStatus):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AdminFunnelController) DeleteLead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.funnelService.DeleteLead(c.Request.Context(), uint(id)); err != nil {
		if errors.Is(err, service.ErrFunnelLeadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "lead not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AdminFunnelController) Stats(c *gin.Context) {
	stats, err := h.funnelService.GetStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
