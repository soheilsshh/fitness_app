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

type PaymentController struct {
	paymentService service.PaymentService
}

func NewPaymentController(s service.PaymentService) *PaymentController {
	return &PaymentController{paymentService: s}
}

type zarinpalRequestBody struct {
	PlanID uint `json:"plan_id"`
}

// ZarinpalRequest starts a ZarinPal payment for a plan (mobile / direct API).
func (h *PaymentController) ZarinpalRequest(c *gin.Context) {
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

	var req zarinpalRequestBody
	if err := c.ShouldBindJSON(&req); err != nil || req.PlanID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plan_id is required"})
		return
	}

	resp, err := h.paymentService.RequestZarinpalByPlanID(c.Request.Context(), userID, req.PlanID)
	if err != nil {
		h.writePaymentError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// ZarinpalCallback handles the redirect from ZarinPal after payment.
func (h *PaymentController) ZarinpalCallback(c *gin.Context) {
	txID, err := strconv.ParseUint(c.Query("tx_id"), 10, 64)
	if err != nil || txID == 0 {
		c.Redirect(http.StatusFound, service.BuildMobilePaymentDeepLink("failed", 0, ""))
		return
	}

	authority := c.Query("Authority")
	if authority == "" {
		authority = c.Query("authority")
	}
	status := c.Query("Status")
	if status == "" {
		status = c.Query("status")
	}

	resultURL, err := h.paymentService.HandleZarinpalCallback(
		c.Request.Context(),
		uint(txID),
		authority,
		status,
	)
	if err != nil || resultURL == "" {
		c.Redirect(http.StatusFound, service.BuildMobilePaymentDeepLink("failed", uint(txID), ""))
		return
	}
	c.Redirect(http.StatusFound, resultURL)
}

// PaymentsResultPage redirects users back to the web app or mobile deep link.
func (h *PaymentController) PaymentsResultPage(c *gin.Context) {
	status := c.Query("status")
	if status == "" {
		status = "failed"
	}
	txID, _ := strconv.ParseUint(c.Query("tx_id"), 10, 64)
	refID := c.Query("ref_id")

	platform := c.Query("platform")
	webURL := ""
	if platform == "web" {
		webURL = c.Query("redirect")
	}

	mobileDeepLink := service.BuildMobilePaymentDeepLink(status, uint(txID), refID)

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>نتیجه پرداخت فیتینو</title>
  <style>
    body { font-family: Tahoma, sans-serif; background:#0b1020; color:#fff; display:flex; min-height:100vh; align-items:center; justify-content:center; margin:0; }
    .card { background:#151a2d; border:1px solid rgba(255,255,255,.1); border-radius:20px; padding:32px; max-width:420px; text-align:center; }
    a { color:#34d399; }
    .btn { display:inline-block; margin-top:16px; padding:12px 20px; border-radius:12px; background:#fff; color:#111; text-decoration:none; font-weight:bold; }
  </style>
</head>
<body>
  <div class="card">
    <h1>در حال بازگشت به فیتینو...</h1>
    <p>اگر به‌صورت خودکار منتقل نشدید، یکی از گزینه‌های زیر را انتخاب کنید.</p>
    <a class="btn" href="%s">بازگشت به اپ موبایل</a>
    %s
  </div>
  <script>
    (function () {
      var mobile = %q;
      var web = %q;
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && mobile) {
        window.location.href = mobile;
        setTimeout(function () { window.location.href = mobile; }, 1200);
      } else if (web) {
        window.location.href = web;
      }
    })();
  </script>
</body>
</html>`, mobileDeepLink, webResultButton(webURL), mobileDeepLink, webURL)
}

func webResultButton(webURL string) string {
	if webURL == "" {
		return ""
	}
	return `<a class="btn" style="margin-right:8px;background:#10b981;color:#fff" href="` + webURL + `">بازگشت به وب</a>`
}

func (h *PaymentController) writePaymentError(c *gin.Context, err error) {
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
		errors.Is(err, service.ErrCheckoutInvalidQty),
		errors.Is(err, service.ErrPaymentPlanNotFound):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case errors.Is(err, service.ErrPaymentGatewayFailed):
		c.JSON(http.StatusBadGateway, gin.H{"error": "خطا در اتصال به درگاه پرداخت"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
