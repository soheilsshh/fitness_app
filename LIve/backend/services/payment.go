package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/models"
	"fitino-live-backend/utils"
	"net/http"
	"time"

	"gorm.io/gorm"
)

// PaymentService handles payment operations with ZarinPal
type PaymentService struct {
	db     *gorm.DB
	config *config.PaymentConfig
}

// PaymentRequest - ساختار درخواست به ZarinPal
type PaymentRequest struct {
	MerchantID  string `json:"merchant_id"`
	Amount      int    `json:"amount"`
	Currency    string `json:"currency,omitempty"` // "IRT" برای تومان
	Description string `json:"description"`
	CallbackURL string `json:"callback_url"`
	Metadata    struct {
		Mobile  string `json:"mobile,omitempty"`
		Email   string `json:"email,omitempty"`
		OrderID string `json:"order_id,omitempty"`
	} `json:"metadata,omitempty"`
}

// PaymentResponse - پاسخ از ZarinPal
type PaymentResponse struct {
	Data struct {
		Code      int    `json:"code"`
		Message   string `json:"message"`
		Authority string `json:"authority"`
		FeeType   string `json:"fee_type"`
		Fee       int    `json:"fee"`
	} `json:"data"`
	Errors []interface{} `json:"errors"`
}

// PaymentVerify - ساختار درخواست تایید
type PaymentVerify struct {
	MerchantID string `json:"merchant_id"`
	Amount     int    `json:"amount"`
	Authority  string `json:"authority"`
}

// PaymentVerifyResponse - پاسخ تایید پرداخت
type PaymentVerifyResponse struct {
	Data struct {
		Code     int    `json:"code"`
		Message  string `json:"message"`
		RefID    int    `json:"ref_id"`
		CardPan  string `json:"card_pan"`
		CardHash string `json:"card_hash"`
		FeeType  string `json:"fee_type"`
		Fee      int    `json:"fee"`
	} `json:"data"`
	Errors []interface{} `json:"errors"`
}

// NewPaymentService creates a new payment service
func NewPaymentService(db *gorm.DB, cfg *config.PaymentConfig) *PaymentService {
	return &PaymentService{
		db:     db,
		config: cfg,
	}
}

// CreatePaymentRequest creates a payment request and returns transaction & payment URL
func (s *PaymentService) CreatePaymentRequest(
	firstName string,
	lastName string,
	phone string,
	paymentType string,
	amount int,
	description string,
) (*models.PaymentTransaction, string, error) {

	// 1. Normalize phone number (مهم: باید normalize کنیم تا با دیتابیس match شود)
	normalizedPhone := utils.NormalizePhoneNumber(phone)
	log.Printf("📞 Payment request - Original phone: %s, Normalized: %s", phone, normalizedPhone)

	// 2. تولید Authority موقت (بعداً از ZarinPal دریافت می‌شود)
	authority := fmt.Sprintf("A%032d", time.Now().UnixNano())

	// 3. پیدا کردن اولین لید برای این شماره تماس (اولین کسی که لید را گرفته)
	var leadPromoterID *uint
	var firstUser models.User
	if err := s.db.Where("phone = ?", normalizedPhone).Order("registered_at ASC").First(&firstUser).Error; err == nil {
		// اگر کاربر پیدا شد و promoter دارد، آن را به عنوان lead promoter استفاده می‌کنیم
		if firstUser.PromoterID != nil {
			leadPromoterID = firstUser.PromoterID
			log.Printf("✅ Lead promoter found for phone %s: PromoterID=%d", normalizedPhone, *leadPromoterID)
		} else {
			// اگر کاربر پیدا شد اما promoter ندارد، به admin اختصاص می‌دهیم
			var adminUser models.AdminUser
			if err := s.db.Where("username = ?", "admin").First(&adminUser).Error; err == nil {
				leadPromoterID = &adminUser.ID
				log.Printf("✅ User found for phone %s but no promoter, assigned to admin (ID: %d)", normalizedPhone, *leadPromoterID)
			} else {
				log.Printf("⚠️ User found for phone %s but no promoter and admin not found", normalizedPhone)
			}
		}
	} else {
		// اگر کاربری با این شماره تماس پیدا نشد، به admin اختصاص می‌دهیم (ثبت‌نام مستقیم از لینک اصلی)
		var adminUser models.AdminUser
		if err := s.db.Where("username = ?", "admin").First(&adminUser).Error; err == nil {
			leadPromoterID = &adminUser.ID
			log.Printf("✅ No user found for phone %s, assigned to admin (ID: %d) - Direct registration from main link", normalizedPhone, *leadPromoterID)
		} else {
			log.Printf("⚠️ No user found for phone %s and admin not found (error: %v)", normalizedPhone, err)
		}
	}

	// 4. ایجاد رکورد تراکنش در دیتابیس
	transaction := models.PaymentTransaction{
		FirstName:      firstName,
		LastName:       lastName,
		Phone:          normalizedPhone, // استفاده از شماره normalize شده
		Type:           paymentType,     // "subscription" یا "roadmap"
		Amount:         amount,
		Authority:      authority,
		Status:         "pending",
		Description:    description,
		LeadPromoterID: leadPromoterID, // اختصاص promoter به تراکنش
	}

	// Try to find user by phone (با شماره normalize شده)
	var user models.User
	if err := s.db.Where("phone = ?", normalizedPhone).First(&user).Error; err == nil {
		transaction.UserID = &user.ID
	}

	if err := s.db.Create(&transaction).Error; err != nil {
		return nil, "", fmt.Errorf("failed to create payment transaction: %w", err)
	}

	// 3. ساخت درخواست JSON برای ZarinPal
	paymentReq := PaymentRequest{
		MerchantID:  s.config.MerchantID,
		Amount:      amount,
		Currency:    "IRT", // تومان
		Description: description,
		CallbackURL: s.config.CallbackURL,
		Metadata: struct {
			Mobile  string `json:"mobile,omitempty"`
			Email   string `json:"email,omitempty"`
			OrderID string `json:"order_id,omitempty"`
		}{
			Mobile:  normalizedPhone, // استفاده از شماره normalize شده
			OrderID: fmt.Sprintf("%d", transaction.ID),
		},
	}

	// 4. انتخاب URL بر اساس Sandbox Mode
	apiURL := "https://api.zarinpal.com/pg/v4/payment/request.json"
	if s.config.Sandbox {
		apiURL = "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
	}

	// 5. ارسال درخواست به ZarinPal
	response, err := s.sendPaymentRequest(apiURL, paymentReq)
	if err != nil {
		return nil, "", fmt.Errorf("failed to send payment request: %w", err)
	}

	// 6. بررسی پاسخ - Code 100 یعنی موفق
	if response.Data.Code != 100 {
		return nil, "", fmt.Errorf("payment request failed: %s", response.Data.Message)
	}

	// 7. به‌روزرسانی تراکنش با Authority واقعی از ZarinPal
	transaction.Authority = response.Data.Authority
	if err := s.db.Save(&transaction).Error; err != nil {
		return nil, "", fmt.Errorf("failed to update transaction: %w", err)
	}

	// 8. ساخت URL پرداخت برای کاربر
	paymentURL := fmt.Sprintf("https://www.zarinpal.com/pg/StartPay/%s", response.Data.Authority)
	if s.config.Sandbox {
		paymentURL = fmt.Sprintf("https://sandbox.zarinpal.com/pg/StartPay/%s", response.Data.Authority)
	}

	return &transaction, paymentURL, nil
}

// sendPaymentRequest ارسال درخواست HTTP POST به ZarinPal
func (s *PaymentService) sendPaymentRequest(url string, req PaymentRequest) (*PaymentResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var response PaymentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// VerifyPayment تایید پرداخت با ZarinPal
func (s *PaymentService) VerifyPayment(authority string, amount int) (*models.PaymentTransaction, error) {
	// 1. پیدا کردن تراکنش از دیتابیس
	var transaction models.PaymentTransaction
	if err := s.db.Where("authority = ?", authority).First(&transaction).Error; err != nil {
		return nil, fmt.Errorf("transaction not found: %w", err)
	}

	// 2. ساخت درخواست تایید
	verifyReq := PaymentVerify{
		MerchantID: s.config.MerchantID,
		Amount:     amount,
		Authority:  authority,
	}

	// 3. انتخاب URL
	apiURL := "https://api.zarinpal.com/pg/v4/payment/verify.json"
	if s.config.Sandbox {
		apiURL = "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
	}

	// 4. ارسال درخواست تایید
	response, err := s.sendVerifyRequest(apiURL, verifyReq)
	if err != nil {
		return nil, fmt.Errorf("failed to verify payment: %w", err)
	}

	// 5. بررسی کد پاسخ - 100 یا 101 = موفق
	if response.Data.Code == 100 || response.Data.Code == 101 {
		transaction.Status = "success"
		transaction.RefID = fmt.Sprintf("%d", response.Data.RefID)

		// اگر LeadPromoterID هنوز تنظیم نشده، آن را پیدا کن (اولین کسی که لید را گرفته)
		if transaction.LeadPromoterID == nil {
			// Normalize phone number before query
			normalizedPhone := utils.NormalizePhoneNumber(transaction.Phone)
			var firstUser models.User
			if err := s.db.Where("phone = ?", normalizedPhone).Order("registered_at ASC").First(&firstUser).Error; err == nil {
				if firstUser.PromoterID != nil {
					transaction.LeadPromoterID = firstUser.PromoterID
					log.Printf("✅ Lead promoter assigned to payment during verify: PromoterID=%d, Phone=%s", *transaction.LeadPromoterID, normalizedPhone)
				} else {
					// اگر کاربر پیدا شد اما promoter ندارد، به admin اختصاص می‌دهیم
					var adminUser models.AdminUser
					if err := s.db.Where("username = ?", "admin").First(&adminUser).Error; err == nil {
						transaction.LeadPromoterID = &adminUser.ID
						log.Printf("✅ User found for phone %s but no promoter, assigned to admin during verify (ID: %d)", normalizedPhone, *transaction.LeadPromoterID)
					} else {
						log.Printf("⚠️ User found for phone %s but no promoter and admin not found during verify", normalizedPhone)
					}
				}
			} else {
				// اگر کاربری با این شماره تماس پیدا نشد، به admin اختصاص می‌دهیم
				var adminUser models.AdminUser
				if err := s.db.Where("username = ?", "admin").First(&adminUser).Error; err == nil {
					transaction.LeadPromoterID = &adminUser.ID
					log.Printf("✅ No user found for phone %s, assigned to admin during verify (ID: %d) - Direct registration from main link", normalizedPhone, *transaction.LeadPromoterID)
				} else {
					log.Printf("⚠️ No user found for phone %s and admin not found during verify (error: %v)", normalizedPhone, err)
				}
			}
		} else {
			log.Printf("✅ Lead promoter already assigned: PromoterID=%d, Phone=%s", *transaction.LeadPromoterID, transaction.Phone)
		}
	} else {
		transaction.Status = "failed"
	}

	// 6. ذخیره وضعیت نهایی
	if err := s.db.Save(&transaction).Error; err != nil {
		log.Printf("Failed to update transaction status: %v", err)
	}

	return &transaction, nil
}

// sendVerifyRequest ارسال درخواست تایید به ZarinPal
func (s *PaymentService) sendVerifyRequest(url string, req PaymentVerify) (*PaymentVerifyResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var response PaymentVerifyResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// GetPaymentsList returns list of all payments for admin
// If promoterID is provided (non-nil), only returns payments where lead_promoter_id matches
// If promoterID is nil, returns all payments (for main admin)
func (s *PaymentService) GetPaymentsList(promoterID *uint) ([]models.PaymentTransaction, error) {
	return s.GetPaymentsListWithFilters(promoterID, "all", "", "", "", "", "all", "all")
}

// GetPaymentsListWithFilters returns list of payments with filters
// statusFilter: "all", "success", "failed", "pending"
// landingActivityStatusFilter: filter by landing activity status (e.g., "clicked_card_to_card", "payment_initiated")
// paymentMethodFilter: "all", "installment", "full" - filter by payment method (installment vs full payment)
// date/time filters: customStartDate, customStartTime, customEndDate, customEndTime
func (s *PaymentService) GetPaymentsListWithFilters(
	promoterID *uint,
	statusFilter string,
	customStartDate string,
	customStartTime string,
	customEndDate string,
	customEndTime string,
	landingActivityStatusFilter string,
	paymentMethodFilter string,
) ([]models.PaymentTransaction, error) {
	var transactions []models.PaymentTransaction
	query := s.db.Preload("LeadPromoter").Preload("LeadPromoter.Permissions")
	
	// If promoterID is provided, filter by lead_promoter_id
	if promoterID != nil {
		query = query.Where("lead_promoter_id = ?", *promoterID)
		log.Printf("📊 Filtering payments by lead_promoter_id=%d", *promoterID)
	} else {
		log.Printf("📊 Fetching all payments (main admin)")
	}
	
	// Apply status filter
	if statusFilter != "all" && statusFilter != "" {
		query = query.Where("status = ?", statusFilter)
		log.Printf("📊 Filtering payments by status=%s", statusFilter)
	}

	// Apply landing activity status filter
	if landingActivityStatusFilter != "" && landingActivityStatusFilter != "all" {
		// Join with landing_activities table and filter by status
		query = query.Joins("INNER JOIN landing_activities ON landing_activities.phone = payment_transactions.phone").
			Where("landing_activities.status = ?", landingActivityStatusFilter)
		log.Printf("📊 Filtering payments by landing_activity_status=%s", landingActivityStatusFilter)
	}

	// Apply payment method filter (installment vs full payment)
	if paymentMethodFilter != "" && paymentMethodFilter != "all" {
		if paymentMethodFilter == "installment" {
			// Show only installment payments: amount = 2,450,000 (first installment)
			query = query.Where("amount = ?", 2450000)
			log.Printf("📊 Filtering payments by payment_method=installment (only installment payments - amount 2,450,000)")
		} else if paymentMethodFilter == "full" {
			// Show only full payments: amount = 4,900,000 (full payment)
			query = query.Where("amount = ?", 4900000)
			log.Printf("📊 Filtering payments by payment_method=full (only full payments - amount 4,900,000)")
		}
	}

	// Apply date/time filters
	if customStartDate != "" && customEndDate != "" {
		// Parse start date/time
		startTimeStr := customStartTime
		if startTimeStr == "" {
			startTimeStr = "00:00"
		}
		startDateTimeStr := fmt.Sprintf("%s %s", customStartDate, startTimeStr)
		parsedStart, err := time.Parse("2006-01-02 15:04", startDateTimeStr)
		if err != nil {
			log.Printf("⚠️ Failed to parse start date/time '%s': %v", startDateTimeStr, err)
		} else {
			query = query.Where("payment_transactions.created_at >= ?", parsedStart)
			log.Printf("📊 Filtering payments from: %s", parsedStart.Format("2006-01-02 15:04:05"))
		}

		// Parse end date/time
		endTimeStr := customEndTime
		if endTimeStr == "" {
			endTimeStr = "23:59"
		}
		endDateTimeStr := fmt.Sprintf("%s %s", customEndDate, endTimeStr)
		parsedEnd, err := time.Parse("2006-01-02 15:04", endDateTimeStr)
		if err != nil {
			log.Printf("⚠️ Failed to parse end date/time '%s': %v", endDateTimeStr, err)
		} else {
			// Add 59 seconds to include the full minute
			parsedEnd = parsedEnd.Add(59 * time.Second)
			query = query.Where("payment_transactions.created_at <= ?", parsedEnd)
			log.Printf("📊 Filtering payments until: %s", parsedEnd.Format("2006-01-02 15:04:05"))
		}
	}

	err := query.Order("payment_transactions.created_at DESC").Find(&transactions).Error
	if err != nil {
		log.Printf("❌ Error fetching payments list: %v", err)
		return nil, err
	}

	log.Printf("✅ Fetched %d payments with filters", len(transactions))
	return transactions, nil
}
