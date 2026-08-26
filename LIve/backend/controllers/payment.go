package controllers

import (
	"crypto/md5"
	"fmt"
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/models"
	"fitino-live-backend/services"
	"fitino-live-backend/utils"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// generateLicenseKey creates a unique license key based on ref_id and phone
func generateLicenseKey(refID, phone string) string {
	// Create a unique string from ref_id and phone
	data := fmt.Sprintf("%s-%s-MONETIZEAI-2024", refID, phone)
	hash := md5.Sum([]byte(data))

	// Format as XXXXX-XXXXX-XXXXX-XXXXX
	hashStr := fmt.Sprintf("%x", hash)
	parts := []string{
		strings.ToUpper(hashStr[0:5]),
		strings.ToUpper(hashStr[5:10]),
		strings.ToUpper(hashStr[10:15]),
		strings.ToUpper(hashStr[15:20]),
	}

	return strings.Join(parts, "-")
}

// getSubscriptionPriceFromDB reads subscription price from database
// Returns 0 if not found or error occurred
func getSubscriptionPriceFromDB(db *gorm.DB, cfg *config.Config) int {
	// Default fallback to config file
	defaultPrice := cfg.Payment.SubscriptionPrice
	utils.LogDebug("💰 getSubscriptionPriceFromDB: Starting with file config price: %d", defaultPrice)

	// Use direct raw SQL query to bypass any caching
	// FIXED: Use proper struct for Scan instead of anonymous struct
	type priceResult struct {
		ID    uint
		Value string
	}
	var priceRes priceResult
	err := db.Raw("SELECT id, value FROM system_configs WHERE `key` = ? LIMIT 1", "payment.subscription_price").
		Scan(&priceRes).Error

	if err == nil && priceRes.Value != "" {
		if intVal, parseErr := strconv.Atoi(priceRes.Value); parseErr == nil {
			utils.LogDebug("💰 getSubscriptionPriceFromDB: Using DB value: %d (ID: %d, Raw DB string: '%s')", intVal, priceRes.ID, priceRes.Value)
			return intVal
		} else {
			utils.LogWarn("getSubscriptionPriceFromDB: Failed to parse DB value '%s': %v, using file config: %d", priceRes.Value, parseErr, defaultPrice)
		}
	} else {
		utils.LogDebug("💰 getSubscriptionPriceFromDB: No DB value found (err: %v), using file config: %d", err, defaultPrice)
	}

	return defaultPrice
}

// CreatePaymentRequest handles payment creation request from frontend
func CreatePaymentRequest(c *gin.Context, db *gorm.DB, cfg *config.Config) {
	var req struct {
		FirstName   string `json:"first_name" binding:"required"`
		LastName    string `json:"last_name" binding:"required"`
		Phone       string `json:"phone" binding:"required"`
		Amount      int    `json:"amount" binding:"required"`
		Type        string `json:"type" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request data: " + err.Error(),
		})
		return
	}

	// Validate payment type
	if req.Type != "subscription" && req.Type != "roadmap" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid payment type. Must be 'subscription' or 'roadmap'",
		})
		return
	}

	// CRITICAL: For subscription payments, always use price from database
	// Frontend might send old cached price, so we override it with database value
	finalAmount := req.Amount
	if req.Type == "subscription" {
		dbPrice := getSubscriptionPriceFromDB(db, cfg)
		if dbPrice > 0 {
			// OPTIMIZED: Only log in debug mode (this happens on every payment request)
			utils.LogDebug("💰 Payment: Using subscription price from database: %d (frontend sent: %d)", dbPrice, req.Amount)
			finalAmount = dbPrice
		} else {
			utils.LogWarn("Payment: Could not read subscription price from database, using frontend value: %d", req.Amount)
		}
	}

	// Validate amount
	if finalAmount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Amount must be greater than 0",
		})
		return
	}

	// Set default description if not provided
	description := req.Description
	if description == "" {
		if req.Type == "subscription" {
			description = "اشتراک مادام‌العمر MonetizeAI"
		} else {
			description = "رودمپ اختصاصی MonetizeAI"
		}
	}

	// Create payment service
	paymentService := services.NewPaymentService(db, &cfg.Payment)

	// Create payment request - use finalAmount (from database for subscription)
	transaction, paymentURL, err := paymentService.CreatePaymentRequest(
		req.FirstName,
		req.LastName,
		req.Phone,
		req.Type,
		finalAmount, // CRITICAL: Use price from database for subscription
		description,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Link payment to landing activity
	if err := LinkPaymentToActivity(db, req.Phone, transaction.ID); err != nil {
		// Log error but don't fail the payment request
		fmt.Printf("Warning: Failed to link payment to landing activity: %v\n", err)
	}

	// Update landing activity status to payment_initiated
	if err := UpdateActivityPaymentStatus(db, req.Phone, string(models.LandingStatusPaymentInitiated), &transaction.ID); err != nil {
		fmt.Printf("Warning: Failed to update landing activity status: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"payment_url": paymentURL,
		"authority":   transaction.Authority,
		"message":     "Payment request created successfully",
	})
}

// HandlePaymentCallback handles callback from ZarinPal
// This only redirects to frontend with Authority, frontend will verify payment
func HandlePaymentCallback(c *gin.Context, db *gorm.DB, cfg *config.Config) {
	// دریافت پارامترها از Query String
	authority := c.Query("Authority")
	status := c.Query("Status")

	// تعیین Frontend URL برای redirect
	frontendURL := cfg.Payment.FrontendURL
	if frontendURL == "" {
		// Fallback: استخراج از callback URL
		frontendURL = "https://webinar.sianacademy.com"
	}

	// بررسی وجود Authority
	if authority == "" {
		c.Redirect(http.StatusSeeOther, frontendURL+"/payment/failed?authority=&error=کد پیگیری یافت نشد&code=NO_AUTHORITY")
		return
	}

	// اگر Status != "OK" یعنی کاربر پرداخت را لغو کرده - redirect به failed با Authority
	if status != "OK" {
		c.Redirect(http.StatusSeeOther, frontendURL+"/payment/failed?authority="+authority+"&error=پرداخت لغو شد&code=CANCELLED")
		return
	}

	// اگر Status == "OK" - redirect به success با Authority (frontend خودش verify می‌کند)
	c.Redirect(http.StatusSeeOther, frontendURL+"/payment/success?authority="+authority)
}

// VerifyPayment verifies payment by Authority and returns transaction details
func VerifyPayment(c *gin.Context, db *gorm.DB, cfg *config.Config) {
	authority := c.Query("authority")
	if authority == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Authority is required",
		})
		return
	}

	// پیدا کردن تراکنش در دیتابیس
	var transaction models.PaymentTransaction
	if err := db.Where("authority = ?", authority).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Transaction not found",
			"code":    "NOT_FOUND",
		})
		return
	}

	// اگر قبلاً verify شده و موفق بوده، اطلاعات را برمی‌گردانیم
	if transaction.Status == "success" {
		// Get license code from database if assigned
		var licenseCode *string
		if transaction.LicenseCode != nil && *transaction.LicenseCode != "" {
			licenseCode = transaction.LicenseCode
		}

		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"status":      "success",
			"ref_id":      transaction.RefID,
			"amount":      transaction.Amount,
			"type":        transaction.Type,
			"first_name":  transaction.FirstName,
			"last_name":   transaction.LastName,
			"phone":       transaction.Phone,
			"license_key": licenseCode,
		})
		return
	}

	// اگر pending است، باید verify کنیم
	if transaction.Status == "pending" {
		// تایید پرداخت با ZarinPal
		paymentService := services.NewPaymentService(db, &cfg.Payment)
		verifiedTransaction, err := paymentService.VerifyPayment(authority, transaction.Amount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Payment verification failed: " + err.Error(),
				"code":    "VERIFICATION_FAILED",
			})
			return
		}

		// بررسی نتیجه تایید
		if verifiedTransaction.Status != "success" {
			// Update landing activity status to payment_failed
			if err := UpdateActivityPaymentStatus(db, verifiedTransaction.Phone, string(models.LandingStatusPaymentFailed), &verifiedTransaction.ID); err != nil {
				fmt.Printf("Warning: Failed to update landing activity status: %v\n", err)
			}

			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"status":  "failed",
				"error":   "Payment not verified",
				"code":    "NOT_VERIFIED",
			})
			return
		}

		// موفق بود - Generate and assign license code if not already assigned
		var licenseCode *string
		if verifiedTransaction.LicenseCode != nil && *verifiedTransaction.LicenseCode != "" {
			licenseCode = verifiedTransaction.LicenseCode
		} else {
			// Generate license code if not exists
			if verifiedTransaction.RefID != "" {
				generatedLicense := generateLicenseKey(verifiedTransaction.RefID, verifiedTransaction.Phone)
				licenseCode = &generatedLicense
				// Update transaction with license code
				if err := db.Model(&verifiedTransaction).Update("license_code", generatedLicense).Error; err != nil {
					log.Printf("⚠️ Failed to update license code for transaction %d: %v", verifiedTransaction.ID, err)
				} else {
					log.Printf("✅ License code generated and assigned: %s for transaction %d", generatedLicense, verifiedTransaction.ID)
				}
			} else {
				log.Printf("⚠️ Cannot generate license code: RefID is empty for transaction %d", verifiedTransaction.ID)
			}
		}

		// Update landing activity status to payment_success
		if err := UpdateActivityPaymentStatus(db, verifiedTransaction.Phone, string(models.LandingStatusPaymentSuccess), &verifiedTransaction.ID); err != nil {
			fmt.Printf("Warning: Failed to update landing activity status: %v\n", err)
		}

		// Send license SMS immediately after successful gateway payment
		go func() {
			if err := SendLicenseSMS(db, cfg, verifiedTransaction.Phone, verifiedTransaction.FirstName, verifiedTransaction.LastName, licenseCode); err != nil {
				log.Printf("❌ Failed to send license SMS to %s: %v", verifiedTransaction.Phone, err)
			}
		}()

		c.JSON(http.StatusOK, gin.H{
			"success":     true,
			"status":      "success",
			"ref_id":      verifiedTransaction.RefID,
			"amount":      verifiedTransaction.Amount,
			"type":        verifiedTransaction.Type,
			"first_name":  verifiedTransaction.FirstName,
			"last_name":   verifiedTransaction.LastName,
			"phone":       verifiedTransaction.Phone,
			"license_key": licenseCode,
		})
		return
	}

	// اگر failed است
	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"status":  "failed",
		"error":   "Payment failed",
		"code":    "PAYMENT_FAILED",
	})
}

// GetPaymentsList returns list of payments for admin with filters
func GetPaymentsList(c *gin.Context, db *gorm.DB, cfg *config.Config) {
	// Check permission
	if !HasPermission(c, db, "payments.view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Get current user info from JWT token
	username, _ := c.Get("username")
	userID, _ := c.Get("user_id")

	// Check if current user is the main admin (username == "admin")
	isMainAdmin := false
	if usernameStr, ok := username.(string); ok {
		isMainAdmin = usernameStr == "admin"
	}

	var currentUserID *uint
	var userPermissions []string
	if !isMainAdmin {
		// Check if user is affiliate - only filter by user ID if they are affiliate
		var currentUser models.AdminUser
		if userIDVal, ok := userID.(uint); ok {
			if err := db.Preload("Permissions").Where("id = ?", userIDVal).First(&currentUser).Error; err == nil {
				// Only filter by user ID if user is affiliate
				// If user is NOT affiliate (is_affiliate = false), show all payments
				if currentUser.IsAffiliate {
					currentUserID = &userIDVal
					log.Printf("📊 User %s (ID: %d) is affiliate - filtering payments by lead_promoter_id", currentUser.Username, userIDVal)
				} else {
					currentUserID = nil
					log.Printf("📊 User %s (ID: %d) is NOT affiliate - showing all payments", currentUser.Username, userIDVal)
				}
				// Get user permissions
				for _, perm := range currentUser.Permissions {
					userPermissions = append(userPermissions, perm.Key)
				}
			} else {
				log.Printf("⚠️ Failed to fetch user info for ID %d: %v", userIDVal, err)
				// If we can't fetch user info, don't filter (show all)
				currentUserID = nil
			}
		}
	}

	// Get filter parameters from query (but may be overridden by permissions)
	statusFilter := c.DefaultQuery("status", "all")                        // "all", "success", "failed", "pending"
	landingActivityStatusFilter := c.DefaultQuery("landing_status", "all") // Filter by landing activity status
	paymentMethodFilter := c.DefaultQuery("payment_method", "all")        // "all", "installment", "full"

	// Apply automatic filters based on user permissions (override query parameters)
	// These permissions force specific filters regardless of what user selects
	if !isMainAdmin {
		hasInstallmentOnly := false
		hasFullOnly := false
		hasSuccessOnly := false
		hasPendingOnly := false
		hasViewPermission := false
		hasLandingActivity := false
		
		for _, perm := range userPermissions {
			if perm == "payments.view" {
				hasViewPermission = true
			}
			if perm == "payments.view.installment_only" {
				hasInstallmentOnly = true
			}
			if perm == "payments.view.full_only" {
				hasFullOnly = true
			}
			if perm == "payments.view.success_only" {
				hasSuccessOnly = true
			}
			if perm == "payments.view.pending_only" {
				hasPendingOnly = true
			}
			if perm == "payments.view.landing_activity" {
				hasLandingActivity = true
			}
		}

		// If user doesn't have payments.view permission and doesn't have any specific view permission, show nothing
		if !hasViewPermission && !hasInstallmentOnly && !hasFullOnly && !hasSuccessOnly && !hasPendingOnly {
			log.Printf("📊 User has no payment view permissions - returning empty list")
			c.JSON(http.StatusOK, gin.H{
				"payments": []models.PaymentTransaction{},
				"pagination": gin.H{
					"page":       1,
					"page_size":  1000,
					"total":      0,
					"total_pages": 0,
				},
			})
			return
		}

		// SPECIAL CASE: If user has all 4 permissions (view, installment_only, full_only, landing_activity),
		// show ALL payments without any filters (full access)
		// Otherwise, apply filters based on which permissions are missing
		hasAllFourPermissions := hasViewPermission && hasInstallmentOnly && hasFullOnly && hasLandingActivity
		if hasAllFourPermissions {
			log.Printf("📊 User has all 4 payment permissions (view, installment_only, full_only, landing_activity) - showing ALL payments without filters")
			// Don't apply any filters - show everything
		} else {
			// Apply payment method filter based on which permissions are missing
			// If user has installment_only but NOT full_only → show only installment
			// If user has full_only but NOT installment_only → show only full
			// If user has both → show all (but this case is handled above)
			if hasInstallmentOnly && !hasFullOnly {
				paymentMethodFilter = "installment"
				log.Printf("📊 User has 'payments.view.installment_only' but NOT 'payments.view.full_only' - showing only installment payments")
			} else if hasFullOnly && !hasInstallmentOnly {
				paymentMethodFilter = "full"
				log.Printf("📊 User has 'payments.view.full_only' but NOT 'payments.view.installment_only' - showing only full payments")
			}

			// Apply status filter based on which permissions are missing
			if hasSuccessOnly && !hasPendingOnly {
				statusFilter = "success"
				log.Printf("📊 User has 'payments.view.success_only' but NOT 'payments.view.pending_only' - showing only success payments")
			} else if hasPendingOnly && !hasSuccessOnly {
				statusFilter = "pending"
				log.Printf("📊 User has 'payments.view.pending_only' but NOT 'payments.view.success_only' - showing only pending payments")
			}
		}
	}

	// Get date/time filter parameters
	customStartDate := c.Query("start_date")
	customStartTime := c.Query("start_time")
	customEndDate := c.Query("end_date")
	customEndTime := c.Query("end_time")

	// Get payments with filters
	paymentService := services.NewPaymentService(db, &cfg.Payment)
	payments, err := paymentService.GetPaymentsListWithFilters(currentUserID, statusFilter, customStartDate, customStartTime, customEndDate, customEndTime, landingActivityStatusFilter, paymentMethodFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch payments",
		})
		return
	}

	// Filter test phone number (09103946748) - only show one payment (latest successful, or latest)
	// This prevents cluttering the payment list during testing
	testPhoneNumbers := []string{"09103946748", "009103946748", "+989103946748"}
	filteredPayments := []models.PaymentTransaction{}
	testPhonePayments := []models.PaymentTransaction{}

	log.Printf("📊 [GetPaymentsList] Received %d payments before filtering", len(payments))

	for _, payment := range payments {
		normalizedPhone := utils.NormalizePhoneNumber(payment.Phone)
		isTestPhone := false

		// Normalize test phone numbers once
		testPhoneNormalized := []string{}
		for _, testPhone := range testPhoneNumbers {
			testPhoneNormalized = append(testPhoneNormalized, utils.NormalizePhoneNumber(testPhone))
		}

		// Check if this payment's phone matches any test phone
		for _, normalizedTestPhone := range testPhoneNormalized {
			if normalizedPhone == normalizedTestPhone {
				isTestPhone = true
				break
			}
		}

		if isTestPhone {
			testPhonePayments = append(testPhonePayments, payment)
		} else {
			filteredPayments = append(filteredPayments, payment)
		}
	}

	log.Printf("📊 [GetPaymentsList] Found %d test phone payments, %d other payments", len(testPhonePayments), len(filteredPayments))

	// For test phone, only include the latest successful payment, or latest if no successful
	if len(testPhonePayments) > 0 {
		// Sort by created_at DESC (newest first)
		sort.Slice(testPhonePayments, func(i, j int) bool {
			return testPhonePayments[i].CreatedAt.After(testPhonePayments[j].CreatedAt)
		})

		// Prefer successful payment, otherwise latest
		var selectedTestPayment *models.PaymentTransaction
		for i := range testPhonePayments {
			if testPhonePayments[i].Status == "success" {
				selectedTestPayment = &testPhonePayments[i]
				break
			}
		}

		// If no successful payment, use latest
		if selectedTestPayment == nil && len(testPhonePayments) > 0 {
			selectedTestPayment = &testPhonePayments[0]
		}

		if selectedTestPayment != nil {
			filteredPayments = append(filteredPayments, *selectedTestPayment)
			log.Printf("📱 Filtered test phone payments: showing 1 out of %d payments for %s", len(testPhonePayments), selectedTestPayment.Phone)
		}
	}

	log.Printf("📊 [GetPaymentsList] Final filtered payments count: %d", len(filteredPayments))

	// Also include users with landing activities but no payment transactions
	// Get all unique phones from existing payments
	existingPhones := make(map[string]bool)
	for _, payment := range filteredPayments {
		normalizedPhone := utils.NormalizePhoneNumber(payment.Phone)
		existingPhones[normalizedPhone] = true
	}

	// Find landing activities that don't have payment transactions
	landingQuery := db.Model(&models.LandingActivity{})

	// Apply promoter filter if needed (join with users table)
	if currentUserID != nil {
		landingQuery = landingQuery.Joins("INNER JOIN users ON users.phone = landing_activities.phone").
			Where("users.promoter_id = ?", *currentUserID)
	}

	// Apply landing activity status filter if specified
	if landingActivityStatusFilter != "" && landingActivityStatusFilter != "all" {
		landingQuery = landingQuery.Where("landing_activities.status = ?", landingActivityStatusFilter)
	}

	// Apply date filters if specified
	if customStartDate != "" && customEndDate != "" {
		if startTimeStr := customStartTime; startTimeStr == "" {
			startTimeStr = "00:00"
		}
		startDateTimeStr := fmt.Sprintf("%s %s", customStartDate, customStartTime)
		if parsedStart, err := time.Parse("2006-01-02 15:04", startDateTimeStr); err == nil {
			landingQuery = landingQuery.Where("landing_activities.created_at >= ?", parsedStart)
		}

		if endTimeStr := customEndTime; endTimeStr == "" {
			endTimeStr = "23:59"
		}
		endDateTimeStr := fmt.Sprintf("%s %s", customEndDate, customEndTime)
		if parsedEnd, err := time.Parse("2006-01-02 15:04", endDateTimeStr); err == nil {
			parsedEnd = parsedEnd.Add(59 * time.Second)
			landingQuery = landingQuery.Where("landing_activities.created_at <= ?", parsedEnd)
		}
	}

	// Exclude all thankyou_* statuses from landing activities query
	// All thankyou_* statuses (thankyou_step_1, thankyou_step_2, ..., thankyou_step_7, thankyou_complete, thankyou_open)
	// are not payment-related statuses, they're just ThankYou page tracking
	landingQuery = landingQuery.Where("landing_activities.status NOT LIKE ?", "thankyou_%")

	// Get distinct phones with landing activities
	var distinctPhones []string
	landingQuery.Select("DISTINCT landing_activities.phone").Pluck("phone", &distinctPhones)

	// Filter out phones that already have payment transactions
	landingOnlyPhones := []string{}
	for _, phone := range distinctPhones {
		normalizedPhone := utils.NormalizePhoneNumber(phone)
		if !existingPhones[normalizedPhone] {
			landingOnlyPhones = append(landingOnlyPhones, normalizedPhone)
		}
	}

	// Get the most recent landing activity for each phone without payment
	// CRITICAL: Exclude users who have ANY thankyou_* activity (even if they also have payment-related activities)
	// This ensures no ThankYou page data/behavior is shown in payment list
	if len(landingOnlyPhones) > 0 {
		addedCount := 0
		// Get most recent activity for each phone (excluding all thankyou_* statuses)
		for _, phone := range landingOnlyPhones {
			// CRITICAL CHECK: If user has ANY thankyou_* activity, exclude them completely
			var thankyouCount int64
			if err := db.Model(&models.LandingActivity{}).
				Where("phone = ? AND status LIKE ?", phone, "thankyou_%").
				Count(&thankyouCount).Error; err == nil && thankyouCount > 0 {
				// User has thankyou_* activity - exclude them completely
				continue
			}

			// User has no thankyou_* activity - get their most recent payment-related activity
			var latestActivity models.LandingActivity
			if err := db.Where("phone = ? AND status NOT LIKE ?", phone, "thankyou_%").
				Order("last_status_update DESC, created_at DESC").
				First(&latestActivity).Error; err == nil {
				// Create a dummy PaymentTransaction for this landing-only user
				dummyPayment := models.PaymentTransaction{
					FirstName: latestActivity.FirstName,
					LastName:  latestActivity.LastName,
					Phone:     latestActivity.Phone,
					Status:    "landing_only", // Special status to indicate no payment
					CreatedAt: latestActivity.CreatedAt,
					UpdatedAt: latestActivity.LastStatusUpdate,
				}
				dummyPayment.LandingActivity = &latestActivity
				filteredPayments = append(filteredPayments, dummyPayment)
				addedCount++
			}
		}
		log.Printf("📊 [GetPaymentsList] Added %d landing-only users (no payment transactions, excluding users with ANY thankyou_* activity)", addedCount)
	}

	// CRITICAL: Always load landing activities FRESH from database for each payment
	// This ensures real-time updates when users perform actions (click payment button, etc.)
	// Exclude all thankyou_* activities - only show payment-related activities
	for i := range filteredPayments {
		// Always reload landing activities from database (fresh, not cached)
		var landingActivities []models.LandingActivity
		if err := db.Where("phone = ? AND status NOT LIKE ?", filteredPayments[i].Phone, "thankyou_%").
			Order("last_status_update DESC, created_at DESC").
			Find(&landingActivities).Error; err == nil && len(landingActivities) > 0 {
			// Set the most recent activity (which is payment-related, not thankyou_*)
			filteredPayments[i].LandingActivity = &landingActivities[0]
		} else {
			// No landing activity found - set to nil
			filteredPayments[i].LandingActivity = nil
		}
	}

	// CRITICAL: Sort all payments by last action time (most recent first)
	// Last action is the most recent of: UpdatedAt (payment update) or LandingActivity.LastStatusUpdate
	// This ensures users with recent activities (payment or landing) appear at the top
	sort.Slice(filteredPayments, func(i, j int) bool {
		// Get last action time for payment i
		lastActionI := filteredPayments[i].UpdatedAt
		if filteredPayments[i].LandingActivity != nil && !filteredPayments[i].LandingActivity.LastStatusUpdate.IsZero() {
			if filteredPayments[i].LandingActivity.LastStatusUpdate.After(lastActionI) {
				lastActionI = filteredPayments[i].LandingActivity.LastStatusUpdate
			}
		}

		// Get last action time for payment j
		lastActionJ := filteredPayments[j].UpdatedAt
		if filteredPayments[j].LandingActivity != nil && !filteredPayments[j].LandingActivity.LastStatusUpdate.IsZero() {
			if filteredPayments[j].LandingActivity.LastStatusUpdate.After(lastActionJ) {
				lastActionJ = filteredPayments[j].LandingActivity.LastStatusUpdate
			}
		}

		// Sort by last action time (most recent first)
		return lastActionI.After(lastActionJ)
	})

	// Get pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "6") // Default: 6 items per page

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 {
		pageSize = 6
	}

	// Calculate pagination
	totalCount := len(filteredPayments)
	totalPages := (totalCount + pageSize - 1) / pageSize // Ceiling division
	if totalPages == 0 {
		totalPages = 1
	}

	// Ensure page is within valid range
	if page > totalPages {
		page = totalPages
	}

	// Calculate start and end indices
	start := (page - 1) * pageSize
	end := start + pageSize
	if end > totalCount {
		end = totalCount
	}

	// Get paginated payments
	var paginatedPayments []models.PaymentTransaction
	if start < totalCount {
		paginatedPayments = filteredPayments[start:end]
	}

	log.Printf("📊 [GetPaymentsList] Pagination: page=%d, pageSize=%d, totalCount=%d, totalPages=%d, showing %d-%d",
		page, pageSize, totalCount, totalPages, start+1, end)

	c.JSON(http.StatusOK, gin.H{
		"payments": paginatedPayments,
		"pagination": gin.H{
			"page":        page,
			"page_size":   pageSize,
			"total_count": totalCount,
			"total_pages": totalPages,
		},
	})
}

// GetDailySalesStats returns daily sales statistics for chart
// GET /api/admin/payments/daily-sales
func GetDailySalesStats(c *gin.Context, db *gorm.DB, cfg *config.Config) {
	// Check permission
	if !HasPermission(c, db, "payments.view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Get filter parameter (month, week, all)
	filter := c.DefaultQuery("filter", "month") // "month", "week", "all"

	// Get date range based on filter
	now := time.Now()
	var startDate, endDate time.Time

	switch filter {
	case "week":
		// Last 7 days
		endDate = now
		startDate = now.AddDate(0, 0, -6)
	case "month":
		// Current month
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = now
	case "all":
		// All time
		startDate = time.Time{}
		endDate = now
	default:
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		endDate = now
	}

	// Get current user info for promoter filter
	username, _ := c.Get("username")
	userID, _ := c.Get("user_id")
	isMainAdmin := false
	if usernameStr, ok := username.(string); ok {
		isMainAdmin = usernameStr == "admin"
	}

	var currentUserID *uint
	if !isMainAdmin {
		// Check if user is affiliate - only filter by user ID if they are affiliate
		var currentUser models.AdminUser
		if userIDVal, ok := userID.(uint); ok {
			if err := db.Where("id = ?", userIDVal).First(&currentUser).Error; err == nil {
				// Only filter by user ID if user is affiliate
				// If user is NOT affiliate (is_affiliate = false), show all payments
				if currentUser.IsAffiliate {
					currentUserID = &userIDVal
					log.Printf("📊 [DailySales] User %s (ID: %d) is affiliate - filtering by promoter_id", currentUser.Username, userIDVal)
				} else {
					currentUserID = nil
					log.Printf("📊 [DailySales] User %s (ID: %d) is NOT affiliate - showing all payments", currentUser.Username, userIDVal)
				}
			} else {
				log.Printf("⚠️ [DailySales] Failed to fetch user info for ID %d: %v", userIDVal, err)
				// If we can't fetch user info, don't filter (show all)
				currentUserID = nil
			}
		}
	}

	// Query to get daily sales statistics
	// Only count successful payments
	// NOTE: Test phone filter does NOT apply to chart - chart shows all payments
	// Use Raw SQL for better compatibility with MySQL SUM and DATE_FORMAT

	baseQuery := "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(amount) as total_amount, COUNT(*) as count FROM payment_transactions WHERE status = ?"
	args := []interface{}{"success"}

	// Apply promoter filter if not main admin and user is affiliate
	if currentUserID != nil {
		baseQuery += " AND lead_promoter_id = ?"
		args = append(args, *currentUserID)
		log.Printf("📊 [DailySales] Filtering by promoter_id=%d", *currentUserID)
	}

	// Apply date filter if not "all"
	if !startDate.IsZero() {
		baseQuery += " AND created_at >= ? AND created_at <= ?"
		args = append(args, startDate, endDate)
		log.Printf("📊 [DailySales] Date filter: %s to %s", startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
	} else {
		log.Printf("📊 [DailySales] No date filter (all time)")
	}

	baseQuery += " GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY date ASC"

	type DailySalesResult struct {
		Date        string  `json:"date"`
		TotalAmount float64 `json:"total_amount"` // Sum returns float64 in MySQL
		Count       int64   `json:"count"`
	}

	var results []DailySalesResult
	if err := db.Raw(baseQuery, args...).Scan(&results).Error; err != nil {
		log.Printf("❌ Error fetching daily sales stats: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch daily sales statistics",
		})
		return
	}

	log.Printf("📊 Daily sales query returned %d results", len(results))
	if len(results) > 0 {
		log.Printf("📊 Sample result: %+v", results[0])
		if len(results) > 3 {
			log.Printf("📊 First 3 results: %+v", results[:3])
		} else {
			log.Printf("📊 All results: %+v", results)
		}
	} else {
		log.Printf("⚠️ No results found in daily sales query")
	}

	// Convert to daily stats format
	type DailySalesStat struct {
		Date         string `json:"date"`
		PersianDate  string `json:"persian_date"`
		DayName      string `json:"day_name"`
		DayNumber    int    `json:"day_number"`
		Amount       int64  `json:"amount"`
		Count        int64  `json:"count"`
		PersianMonth string `json:"persian_month"`
		PersianYear  int    `json:"persian_year"`
	}

	dailyStats := []DailySalesStat{}

	// Create a map for quick lookup
	resultMap := make(map[string]DailySalesResult)
	for _, result := range results {
		resultMap[result.Date] = result
	}

	// Fill in all days in the date range
	currentDate := startDate
	if startDate.IsZero() {
		// For "all" filter, start from earliest payment
		var earliestPayment models.PaymentTransaction
		if err := db.Where("status = ?", "success").Order("created_at ASC").First(&earliestPayment).Error; err == nil {
			currentDate = earliestPayment.CreatedAt
		} else {
			currentDate = now.AddDate(0, 0, -30) // Default to last 30 days if no payments
		}
	}

	for currentDate.Before(endDate) || currentDate.Equal(endDate) {
		dateStr := currentDate.Format("2006-01-02")

		var amount int64
		var count int64
		if val, exists := resultMap[dateStr]; exists {
			amount = int64(val.TotalAmount) // Convert float64 to int64
			count = val.Count
		}

		// Convert to Persian date
		persianDate := utils.ToPersian(currentDate)
		persianDateStr := fmt.Sprintf("%d/%02d/%02d", persianDate.Year, persianDate.Month, persianDate.Day)

		// Get Persian day name using utility function
		dayName := utils.GetPersianDayName(currentDate)

		dailyStats = append(dailyStats, DailySalesStat{
			Date:         dateStr,
			PersianDate:  persianDateStr,
			DayName:      dayName,
			DayNumber:    persianDate.Day,
			Amount:       amount,
			Count:        count,
			PersianMonth: utils.GetPersianMonthName(persianDate.Month),
			PersianYear:  persianDate.Year,
		})

		currentDate = currentDate.AddDate(0, 0, 1)
	}

	c.JSON(http.StatusOK, gin.H{
		"filter":      filter,
		"start_date":  startDate.Format("2006-01-02"),
		"end_date":    endDate.Format("2006-01-02"),
		"daily_stats": dailyStats,
	})
}

// ExportPaymentsExcel exports payments to Excel (CSV format) with filters
func ExportPaymentsExcel(c *gin.Context, db *gorm.DB, cfg *config.Config) {
	// Check permission
	if !HasPermission(c, db, "payments.view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	// Get current user info from JWT token
	username, _ := c.Get("username")
	userID, _ := c.Get("user_id")

	// Check if current user is the main admin (username == "admin")
	isMainAdmin := false
	if usernameStr, ok := username.(string); ok {
		isMainAdmin = usernameStr == "admin"
	}

	var currentUserID *uint
	var userPermissions []string
	if !isMainAdmin {
		// Check if user is affiliate - only filter by user ID if they are affiliate
		var currentUser models.AdminUser
		if userIDVal, ok := userID.(uint); ok {
			if err := db.Preload("Permissions").Where("id = ?", userIDVal).First(&currentUser).Error; err == nil {
				// Only filter by user ID if user is affiliate
				// If user is NOT affiliate (is_affiliate = false), show all payments
				if currentUser.IsAffiliate {
					currentUserID = &userIDVal
					log.Printf("📊 [Export] User %s (ID: %d) is affiliate - filtering payments by lead_promoter_id", currentUser.Username, userIDVal)
				} else {
					currentUserID = nil
					log.Printf("📊 [Export] User %s (ID: %d) is NOT affiliate - showing all payments", currentUser.Username, userIDVal)
				}
				// Get user permissions
				for _, perm := range currentUser.Permissions {
					userPermissions = append(userPermissions, perm.Key)
				}
			} else {
				log.Printf("⚠️ [Export] Failed to fetch user info for ID %d: %v", userIDVal, err)
				// If we can't fetch user info, don't filter (show all)
				currentUserID = nil
			}
		}
	}

	// Get filter parameters from query (but may be overridden by permissions)
	statusFilter := c.DefaultQuery("status", "all")                        // "all", "success", "failed", "pending"
	landingActivityStatusFilter := c.DefaultQuery("landing_status", "all") // Filter by landing activity status
	paymentMethodFilter := c.DefaultQuery("payment_method", "all")          // "all", "installment", "full"

	// Apply automatic filters based on user permissions (override query parameters)
	// These permissions force specific filters regardless of what user selects
	if !isMainAdmin {
		hasInstallmentOnly := false
		hasFullOnly := false
		hasSuccessOnly := false
		hasPendingOnly := false
		hasViewPermission := false
		hasLandingActivity := false
		
		for _, perm := range userPermissions {
			if perm == "payments.view" {
				hasViewPermission = true
			}
			if perm == "payments.view.installment_only" {
				hasInstallmentOnly = true
			}
			if perm == "payments.view.full_only" {
				hasFullOnly = true
			}
			if perm == "payments.view.success_only" {
				hasSuccessOnly = true
			}
			if perm == "payments.view.pending_only" {
				hasPendingOnly = true
			}
			if perm == "payments.view.landing_activity" {
				hasLandingActivity = true
			}
		}

		// SPECIAL CASE: If user has all 4 permissions (view, installment_only, full_only, landing_activity),
		// show ALL payments without any filters (full access)
		// Otherwise, apply filters based on which permissions are missing
		hasAllFourPermissions := hasViewPermission && hasInstallmentOnly && hasFullOnly && hasLandingActivity
		if hasAllFourPermissions {
			log.Printf("📊 [Export] User has all 4 payment permissions (view, installment_only, full_only, landing_activity) - showing ALL payments without filters")
			// Don't apply any filters - show everything
		} else {
			// Apply payment method filter based on which permissions are missing
			// If user has installment_only but NOT full_only → show only installment
			// If user has full_only but NOT installment_only → show only full
			// If user has both → show all (but this case is handled above)
			if hasInstallmentOnly && !hasFullOnly {
				paymentMethodFilter = "installment"
				log.Printf("📊 [Export] User has 'payments.view.installment_only' but NOT 'payments.view.full_only' - showing only installment payments")
			} else if hasFullOnly && !hasInstallmentOnly {
				paymentMethodFilter = "full"
				log.Printf("📊 [Export] User has 'payments.view.full_only' but NOT 'payments.view.installment_only' - showing only full payments")
			}

			// Apply status filter based on which permissions are missing
			if hasSuccessOnly && !hasPendingOnly {
				statusFilter = "success"
				log.Printf("📊 [Export] User has 'payments.view.success_only' but NOT 'payments.view.pending_only' - showing only success payments")
			} else if hasPendingOnly && !hasSuccessOnly {
				statusFilter = "pending"
				log.Printf("📊 [Export] User has 'payments.view.pending_only' but NOT 'payments.view.success_only' - showing only pending payments")
			}
		}
	}
	exportMode := c.DefaultQuery("export_mode", "current")                  // "current" or "all_history"

	// Get date/time filter parameters
	customStartDate := c.Query("start_date")
	customStartTime := c.Query("start_time")
	customEndDate := c.Query("end_date")
	customEndTime := c.Query("end_time")

	// Get payments with filters
	paymentService := services.NewPaymentService(db, &cfg.Payment)
	payments, err := paymentService.GetPaymentsListWithFilters(currentUserID, statusFilter, customStartDate, customStartTime, customEndDate, customEndTime, landingActivityStatusFilter, paymentMethodFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch payments",
		})
		return
	}

	// Load all landing activities for each payment to show all statuses
	for i := range payments {
		var landingActivities []models.LandingActivity
		if err := db.Where("phone = ?", payments[i].Phone).
			Order("last_status_update DESC, created_at DESC").
			Find(&landingActivities).Error; err == nil {
			// Store all activities (we'll use them in CSV)
			payments[i].LandingActivity = nil
			if len(landingActivities) > 0 {
				payments[i].LandingActivity = &landingActivities[0]
			}
		}
	}

	// Generate CSV
	var csvBuilder strings.Builder
	csvBuilder.WriteString("\xEF\xBB\xBF") // UTF-8 BOM for Excel

	// Header row based on export mode
	if exportMode == "all_history" {
		// All history mode: show status counts with detailed breakdown
		csvBuilder.WriteString("نام,نام خانوادگی,شماره تماس,مبلغ,نوع,وضعیت پرداخت,کد پیگیری,کد لایسنس,مدت حضور (دقیقه),کلیک لینک ثبت‌نام (تعداد),ورود به لندینگ (تعداد),در لندینگ (تعداد),خارج شده از لندینگ (تعداد),کلیک ورود به درگاه (تعداد),کلیک کارت به کارت (تعداد),کپی کارت به کارت (تعداد),کلیک قسطی (تعداد),کپی کارت قسطی (تعداد),شروع پرداخت (تعداد),پرداخت موفق (تعداد),پرداخت ناموفق (تعداد),مجموع اقدامات,تاریخ ایجاد\n")
	} else {
		// Current mode: show current status
		csvBuilder.WriteString("نام,نام خانوادگی,شماره تماس,مبلغ,نوع,وضعیت پرداخت,کد پیگیری,کد لایسنس,وضعیت فعلی لندینگ,تمام وضعیت‌های لندینگ,مدت حضور (دقیقه),تاریخ ایجاد\n")
	}

	// Helper function to translate status to Persian
	translateStatus := func(status string) string {
		statusMap := map[string]string{
			"clicked_registration_link": "کلیک لینک ثبت‌نام",
			"entered_landing":           "ورود به لندینگ",
			"in_landing":                "در لندینگ",
			"left_landing":              "خارج شده از لندینگ",
			"clicked_payment_button":    "کلیک ورود به درگاه",
			"clicked_card_to_card":      "کلیک کارت به کارت",
			"copied_card_to_card":       "کپی کارت به کارت",
			"clicked_installment":       "کلیک قسطی",
			"copied_installment_card":   "کپی کارت قسطی",
			"payment_initiated":         "شروع پرداخت",
			"payment_success":           "پرداخت موفق",
			"payment_failed":            "پرداخت ناموفق",
		}
		if translated, ok := statusMap[status]; ok {
			return translated
		}
		return status
	}

	// Data rows
	for _, payment := range payments {
		firstName := strings.ReplaceAll(payment.FirstName, ",", "،")
		lastName := strings.ReplaceAll(payment.LastName, ",", "،")
		phone := payment.Phone
		amount := fmt.Sprintf("%d", payment.Amount)

		paymentType := payment.Type
		if paymentType == "subscription" {
			paymentType = "اشتراک"
		} else if paymentType == "roadmap" {
			paymentType = "رودمپ"
		}

		status := payment.Status
		if status == "success" {
			status = "موفق"
		} else if status == "failed" {
			status = "ناموفق"
		} else if status == "pending" {
			status = "در انتظار"
		}

		refID := payment.RefID
		if refID == "" {
			refID = "-"
		}

		licenseCode := ""
		if payment.LicenseCode != nil && *payment.LicenseCode != "" {
			licenseCode = *payment.LicenseCode
		} else {
			licenseCode = "-"
		}

		// Get all landing activities for this payment
		// IMPORTANT: Get ALL activities, not just the most recent one
		var allActivities []models.LandingActivity
		if err := db.Where("phone = ?", payment.Phone).
			Order("last_status_update ASC, created_at ASC"). // Order by ASC to get chronological order
			Find(&allActivities).Error; err != nil {
			log.Printf("⚠️ Failed to fetch landing activities for phone %s: %v", payment.Phone, err)
			allActivities = []models.LandingActivity{}
		}

		// Count occurrences of each status (for all_history mode)
		statusCounts := make(map[string]int)
		for _, activity := range allActivities {
			statusCounts[string(activity.Status)]++
		}

		// Landing duration
		landingDuration := "-"
		if payment.LandingActivity != nil && payment.LandingActivity.LandingDurationMinutes > 0 {
			landingDuration = fmt.Sprintf("%d", payment.LandingActivity.LandingDurationMinutes)
		}

		// Format date in Jalali (Persian) format: YYYY/MM/DD HH:mm:ss
		createdAt := utils.FormatPersianDate(payment.CreatedAt) + " " + payment.CreatedAt.Format("15:04:05")

		if exportMode == "all_history" {
			// All history mode: show status counts
			csvBuilder.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%s\n",
				firstName, lastName, phone, amount, paymentType, status, refID, licenseCode, landingDuration,
				statusCounts["clicked_registration_link"],
				statusCounts["entered_landing"],
				statusCounts["in_landing"],
				statusCounts["left_landing"],
				statusCounts["clicked_payment_button"],
				statusCounts["clicked_card_to_card"],
				statusCounts["copied_card_to_card"],
				statusCounts["clicked_installment"],
				statusCounts["copied_installment_card"],
				statusCounts["payment_initiated"],
				statusCounts["payment_success"],
				statusCounts["payment_failed"],
				len(allActivities),
				createdAt))
		} else {
			// Current mode: show current status
			currentLandingStatus := "-"
			if payment.LandingActivity != nil {
				currentLandingStatus = translateStatus(string(payment.LandingActivity.Status))
			}

			// All landing statuses (comma-separated)
			allStatuses := []string{}
			for _, activity := range allActivities {
				translated := translateStatus(string(activity.Status))
				// Avoid duplicates
				found := false
				for _, s := range allStatuses {
					if s == translated {
						found = true
						break
					}
				}
				if !found {
					allStatuses = append(allStatuses, translated)
				}
			}
			allStatusesStr := strings.Join(allStatuses, " | ")
			if allStatusesStr == "" {
				allStatusesStr = "-"
			}

			csvBuilder.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
				firstName, lastName, phone, amount, paymentType, status, refID, licenseCode,
				currentLandingStatus, allStatusesStr, landingDuration, createdAt))
		}
	}

	// Set response headers
	c.Header("Content-Type", "text/csv; charset=utf-8")
	// Use Jalali date in filename
	currentJalali := utils.FormatPersianDate(time.Now())
	filenameDate := strings.ReplaceAll(currentJalali, "/", "")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=payments_%s_%s.csv", filenameDate, time.Now().Format("150405")))

	c.Data(http.StatusOK, "text/csv; charset=utf-8", []byte(csvBuilder.String()))
}

// CreateManualPayment handles manual payment creation (card-to-card or installment)
// POST /api/admin/payments/manual
func CreateManualPayment(c *gin.Context, db *gorm.DB, cfg *config.Config) {
	// Check permission
	if !HasPermission(c, db, "payments.view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		FirstName     string `json:"first_name" binding:"required"`
		LastName      string `json:"last_name" binding:"required"`
		Phone         string `json:"phone" binding:"required"`
		PaymentMethod string `json:"payment_method" binding:"required"` // "card_to_card" or "installment"
		Installment   *struct {
			InstallmentNumber int `json:"installment_number"` // 1 or 2
		} `json:"installment,omitempty"`
		Description    string     `json:"description,omitempty"`
		PaymentDate    *time.Time `json:"payment_date,omitempty"`     // Optional payment date (for manual entry)
		LeadPromoterID *uint      `json:"lead_promoter_id,omitempty"` // Optional lead promoter ID
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request data: " + err.Error(),
		})
		return
	}

	// Validate payment method
	if req.PaymentMethod != "card_to_card" && req.PaymentMethod != "installment" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid payment method. Must be 'card_to_card' or 'installment'",
		})
		return
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(req.Phone)

	// Constants for installment payments
	const (
		INSTALLMENT_AMOUNT = 2450000 // 2,450,000 تومان per installment
		TOTAL_AMOUNT       = 4900000 // 4,900,000 تومان for full payment
	)
	totalInstallments := 2 // Total number of installments

	var transaction models.PaymentTransaction
	var nextInstallmentDate *time.Time

	// Handle installment payments
	if req.PaymentMethod == "installment" {
		if req.Installment == nil || (req.Installment.InstallmentNumber != 1 && req.Installment.InstallmentNumber != 2) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Installment number must be 1 or 2",
			})
			return
		}

		installmentNumber := req.Installment.InstallmentNumber

		// Check if this is the first installment
		if installmentNumber == 1 {
			// Check if first installment already exists
			var existingFirstInstallment models.PaymentTransaction
			err := db.Where("phone = ? AND is_installment = ? AND installment_number = ? AND payment_method = ?",
				normalizedPhone, true, 1, "installment").First(&existingFirstInstallment).Error

			if err == nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error":   "قبلاً قسط اول برای این کاربر ثبت شده است",
				})
				return
			}

			// Create first installment
			amount := INSTALLMENT_AMOUNT
			nextDate := time.Now().AddDate(0, 1, 0) // One month from now
			nextInstallmentDate = &nextDate

			transaction = models.PaymentTransaction{
				FirstName:           req.FirstName,
				LastName:            req.LastName,
				Phone:               normalizedPhone,
				Type:                "subscription",
				Amount:              amount,
				Authority:           fmt.Sprintf("MANUAL-INST-%d-%d", time.Now().UnixNano(), installmentNumber),
				RefID:               fmt.Sprintf("MANUAL-INST-%d", time.Now().UnixNano()),
				Status:              "success", // Manual payments are immediately successful
				Description:         req.Description,
				PaymentMethod:       "installment",
				IsInstallment:       true,
				InstallmentNumber:   &installmentNumber,
				TotalInstallments:   &totalInstallments,
				NextInstallmentDate: nextInstallmentDate,
			}
		} else {
			// This is the second installment
			// Find the first installment
			var firstInstallment models.PaymentTransaction
			err := db.Where("phone = ? AND is_installment = ? AND installment_number = ? AND payment_method = ?",
				normalizedPhone, true, 1, "installment").First(&firstInstallment).Error

			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error":   "قسط اول برای این کاربر یافت نشد. لطفاً ابتدا قسط اول را ثبت کنید",
				})
				return
			}

			// Check if second installment already exists
			var existingSecondInstallment models.PaymentTransaction
			err = db.Where("phone = ? AND is_installment = ? AND installment_number = ? AND payment_method = ?",
				normalizedPhone, true, 2, "installment").First(&existingSecondInstallment).Error

			if err == nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"error":   "قسط دوم برای این کاربر قبلاً ثبت شده است",
				})
				return
			}

			// Create second installment
			amount := INSTALLMENT_AMOUNT
			installmentNumber := 2

			transaction = models.PaymentTransaction{
				FirstName:           req.FirstName,
				LastName:            req.LastName,
				Phone:               normalizedPhone,
				Type:                "subscription",
				Amount:              amount,
				Authority:           fmt.Sprintf("MANUAL-INST-%d-%d", time.Now().UnixNano(), installmentNumber),
				RefID:               fmt.Sprintf("MANUAL-INST-%d", time.Now().UnixNano()),
				Status:              "success",
				Description:         req.Description,
				PaymentMethod:       "installment",
				IsInstallment:       true,
				InstallmentNumber:   &installmentNumber,
				TotalInstallments:   &totalInstallments,
				ParentInstallmentID: &firstInstallment.ID,
			}

			// Update first installment to remove next_installment_date and update amount to total (4,900,000)
			firstInstallment.NextInstallmentDate = nil
			firstInstallment.Amount = TOTAL_AMOUNT // Update to 4,900,000 (total amount)
			if err := db.Save(&firstInstallment).Error; err != nil {
				log.Printf("Warning: Failed to update first installment: %v", err)
			} else {
				log.Printf("✅ Updated first installment amount from 2,450,000 to 4,900,000 (total amount)")
			}

			// Note: After second installment, the first installment amount is updated to 4,900,000
			// The second installment transaction will be created separately with amount 2,450,000
		}
	} else {
		// Card-to-card payment (full payment)
		amount := TOTAL_AMOUNT

		// Check if user already has a successful payment
		var existingPayment models.PaymentTransaction
		err := db.Where("phone = ? AND status = ? AND payment_method = ?",
			normalizedPhone, "success", "card_to_card").First(&existingPayment).Error

		if err == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "قبلاً پرداخت کارت به کارت برای این کاربر ثبت شده است",
			})
			return
		}

		transaction = models.PaymentTransaction{
			FirstName:     req.FirstName,
			LastName:      req.LastName,
			Phone:         normalizedPhone,
			Type:          "subscription",
			Amount:        amount,
			Authority:     fmt.Sprintf("MANUAL-C2C-%d", time.Now().UnixNano()),
			RefID:         fmt.Sprintf("MANUAL-C2C-%d", time.Now().UnixNano()),
			Status:        "success",
			Description:   req.Description,
			PaymentMethod: "card_to_card",
			IsInstallment: false,
		}
	}

	// Try to find user by phone
	var user models.User
	if err := db.Where("phone = ?", normalizedPhone).First(&user).Error; err == nil {
		transaction.UserID = &user.ID
	}

	// Get lead promoter ID from request, or fallback to current admin user, or admin
	var leadPromoterID *uint
	if req.LeadPromoterID != nil {
		// Use provided lead promoter ID from request
		// Validate that the admin user exists
		var adminUser models.AdminUser
		if err := db.First(&adminUser, *req.LeadPromoterID).Error; err == nil {
			leadPromoterID = req.LeadPromoterID
			nameDisplay := adminUser.Username
			if adminUser.Name != nil && *adminUser.Name != "" {
				nameDisplay = *adminUser.Name
			}
			log.Printf("✅ Using provided lead promoter ID: %d (%s)", *leadPromoterID, nameDisplay)
		} else {
			log.Printf("⚠️ Provided lead promoter ID %d not found, falling back to current user", *req.LeadPromoterID)
		}
	}

	// If no lead promoter ID was provided or validation failed, use current admin user
	if leadPromoterID == nil {
		userID, _ := c.Get("user_id")
		if userIDVal, ok := userID.(uint); ok {
			leadPromoterID = &userIDVal
			log.Printf("✅ Using current admin user as lead promoter: %d", *leadPromoterID)
		} else {
			// Fallback to admin
			var adminUser models.AdminUser
			if err := db.Where("username = ?", "admin").First(&adminUser).Error; err == nil {
				leadPromoterID = &adminUser.ID
				log.Printf("✅ Using admin as lead promoter: %d", *leadPromoterID)
			}
		}
	}
	transaction.LeadPromoterID = leadPromoterID

	// Set payment date if provided (for manual entry)
	if req.PaymentDate != nil {
		transaction.CreatedAt = *req.PaymentDate
		transaction.UpdatedAt = *req.PaymentDate
	}

	// Create transaction
	if err := db.Create(&transaction).Error; err != nil {
		log.Printf("Failed to create manual payment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create payment: " + err.Error(),
		})
		return
	}

	// Update landing activity status to payment_success
	if err := UpdateActivityPaymentStatus(db, normalizedPhone, string(models.LandingStatusPaymentSuccess), &transaction.ID); err != nil {
		log.Printf("Warning: Failed to update landing activity status: %v", err)
	}

	log.Printf("✅ Manual payment created: ID=%d, Phone=%s, Method=%s, Amount=%d, Status=%s",
		transaction.ID, normalizedPhone, req.PaymentMethod, transaction.Amount, transaction.Status)

	// Send license SMS immediately after successful manual payment (card_to_card)
	// Only send if payment method is card_to_card (gateway payments are handled in VerifyPayment)
	if req.PaymentMethod == "card_to_card" && transaction.Status == "success" {
		cfg := config.LoadConfig()
		var licenseCode *string
		if transaction.LicenseCode != nil && *transaction.LicenseCode != "" {
			licenseCode = transaction.LicenseCode
		} else {
			// Generate license code if not exists (for manual payments, use transaction ID as ref_id)
			refID := fmt.Sprintf("MANUAL-%d", transaction.ID)
			generatedLicense := generateLicenseKey(refID, transaction.Phone)
			licenseCode = &generatedLicense
			// Update transaction with license code
			if err := db.Model(&transaction).Update("license_code", generatedLicense).Error; err != nil {
				log.Printf("⚠️ Failed to update license code for manual transaction %d: %v", transaction.ID, err)
			} else {
				log.Printf("✅ License code generated and assigned: %s for manual transaction %d", generatedLicense, transaction.ID)
			}
		}
		go func() {
			if err := SendLicenseSMS(db, cfg, transaction.Phone, transaction.FirstName, transaction.LastName, licenseCode); err != nil {
				log.Printf("❌ Failed to send license SMS to %s: %v", transaction.Phone, err)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "پرداخت با موفقیت ثبت شد",
		"payment": transaction,
	})
}

// SendLicenseSMS sends license SMS via Melipayamak after successful payment
func SendLicenseSMS(db *gorm.DB, cfg *config.Config, phone, firstName, lastName string, licenseCode *string) error {
	// Check if license SMS is enabled
	var licenseSMS models.LicenseSMSMessage
	if err := db.Where("is_active = ?", true).First(&licenseSMS).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("⚠️ License SMS is not configured or disabled, skipping SMS to %s", phone)
			return nil // Not an error, just disabled
		}
		return fmt.Errorf("failed to check license SMS config: %v", err)
	}

	// Normalize phone number
	normalizedPhone := utils.NormalizePhoneNumber(phone)

	// Prepare license code
	licenseCodeStr := ""
	if licenseCode != nil && *licenseCode != "" {
		licenseCodeStr = *licenseCode
	} else {
		// Try to get license code from database
		var transaction models.PaymentTransaction
		if err := db.Where("phone = ? AND status = ?", normalizedPhone, "success").
			Order("created_at DESC").
			First(&transaction).Error; err == nil && transaction.LicenseCode != nil {
			licenseCodeStr = *transaction.LicenseCode
		}
	}

	if licenseCodeStr == "" {
		log.Printf("⚠️ No license code found for %s, skipping license SMS", normalizedPhone)
		return nil // Not an error, just no license code
	}

	// Prepare full name
	fullName := strings.TrimSpace(fmt.Sprintf("%s %s", firstName, lastName))
	if fullName == "" {
		fullName = "کاربر"
	}

	// Send SMS via Melipayamak
	melipayamakService := services.NewMelipayamakService(&cfg.Melipayamak)
	patternCode := licenseSMS.PatternCode
	if patternCode == 0 {
		patternCode = 403249 // Default pattern code
	}

	// Send pattern SMS with variables: {0} = full name, {1} = license code
	err := melipayamakService.SendPatternSMS(normalizedPhone, patternCode, fullName, licenseCodeStr)

	// Log the result
	logEntry := models.LicenseSMSMessageLog{
		LicenseSMSMessageID: &licenseSMS.ID,
		Phone:               normalizedPhone,
		FullName:            fullName,
		LicenseCode:         licenseCodeStr,
		PatternCode:         patternCode,
		SentAt:              time.Now(),
		Success:             err == nil,
	}
	if err != nil {
		logEntry.Error = err.Error()
		log.Printf("❌ Failed to send license SMS to %s: %v", normalizedPhone, err)
	} else {
		log.Printf("✅ License SMS sent to %s (Pattern: %d, Name: %s, License: %s)", normalizedPhone, patternCode, fullName, licenseCodeStr)
	}

	// Save log entry
	if dbErr := db.Create(&logEntry).Error; dbErr != nil {
		log.Printf("⚠️ Failed to save license SMS log: %v", dbErr)
	}

	return err
}
