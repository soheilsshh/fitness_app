package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// GuaranteeController exposes the student-facing guarantee flow (roadmap I1/I2, FE-10.4).
type GuaranteeController struct {
	svc service.GuaranteeService
}

func NewGuaranteeController(svc service.GuaranteeService) *GuaranteeController {
	return &GuaranteeController{svc: svc}
}

// Compliance godoc
// @Summary Get my current compliance snapshot (nutrition/workout/coach sessions)
// @Tags guarantee
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.ComplianceSnapshotDTO
// @Router /me/guarantee/compliance [get]
func (h *GuaranteeController) Compliance(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	dto, err := h.svc.ComputeCompliance(c.Request.Context(), userID)
	if err != nil {
		writeGuaranteeError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto)
}

// Submit godoc
// @Summary Submit a guarantee claim
// @Tags guarantee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body service.GuaranteeRequest true "Guarantee claim"
// @Success 201 {object} service.GuaranteeCaseDTO
// @Router /me/guarantee/requests [post]
func (h *GuaranteeController) Submit(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req service.GuaranteeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Submit(c.Request.Context(), userID, &req)
	if err != nil {
		writeGuaranteeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto)
}

// ListMine godoc
// @Summary List my guarantee claims
// @Tags guarantee
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.GuaranteeListResponse
// @Router /me/guarantee/requests [get]
func (h *GuaranteeController) ListMine(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.ListMine(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست‌ها"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func writeGuaranteeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrGuaranteeTypeInvalid):
		c.JSON(http.StatusBadRequest, gin.H{"error": "نوع تضمین باید result یا quality باشد"})
	case errors.Is(err, service.ErrGuaranteeReasonRequired):
		c.JSON(http.StatusBadRequest, gin.H{"error": "شرح دلیل الزامی است"})
	case errors.Is(err, service.ErrGuaranteeNoSubscription):
		c.JSON(http.StatusBadRequest, gin.H{"error": "اشتراک فعالی یافت نشد"})
	case errors.Is(err, service.ErrGuaranteeAlreadyOpen):
		c.JSON(http.StatusConflict, gin.H{"error": "یک درخواست تضمین باز برای این اشتراک وجود دارد"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای داخلی"})
	}
}

// AdminGuaranteeController reviews guarantee claims (roadmap Admin-10.3).
type AdminGuaranteeController struct {
	svc service.GuaranteeService
}

func NewAdminGuaranteeController(svc service.GuaranteeService) *AdminGuaranteeController {
	return &AdminGuaranteeController{svc: svc}
}

// ListAll godoc
// @Summary List guarantee claims (admin)
// @Tags admin-guarantee
// @Produce json
// @Security BearerAuth
// @Param status query string false "pending|approved|rejected|all"
// @Success 200 {object} service.GuaranteeListResponse
// @Router /admin/guarantee/requests [get]
func (h *AdminGuaranteeController) ListAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.ListAll(c.Request.Context(), c.Query("status"), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت درخواست‌ها"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// Review godoc
// @Summary Approve/reject a guarantee claim
// @Tags admin-guarantee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Guarantee case ID"
// @Param body body service.GuaranteeReviewRequest true "Review decision"
// @Success 200 {object} service.GuaranteeCaseDTO
// @Router /admin/guarantee/requests/{id} [patch]
func (h *AdminGuaranteeController) Review(c *gin.Context) {
	adminID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.GuaranteeReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Review(c.Request.Context(), adminID, uint(id), &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrGuaranteeNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "درخواست پیدا نشد"})
		case errors.Is(err, service.ErrGuaranteeResolutionInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "وضعیت یا نوع جبران نامعتبر است"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای داخلی"})
		}
		return
	}
	c.JSON(http.StatusOK, dto)
}
