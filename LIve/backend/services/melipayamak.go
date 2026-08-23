package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"monetizeai-backend/config"
)

const meliPayamakBaseURL = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber"

type MelipayamakService struct {
	config *config.MelipayamakConfig
}

func NewMelipayamakService(cfg *config.MelipayamakConfig) *MelipayamakService {
	return &MelipayamakService{config: cfg}
}

// GetConfig returns the service's configuration.
func (s *MelipayamakService) GetConfig() *config.MelipayamakConfig {
	return s.config
}

type MeliPayamakResponse struct {
	Value        string `json:"Value"`
	RetStatus    int    `json:"RetStatus"`
	StrRetStatus string `json:"StrRetStatus"`
}

// SendPatternSMS sends a pattern-based SMS using the SendByBaseNumber2 method.
func (s *MelipayamakService) SendPatternSMS(to string, bodyId int, params ...string) error {
	// Block sending SMS with disabled pattern codes
	if bodyId == 395350 || bodyId == 395323 {
		log.Printf("⏭️  Blocked: SMS with disabled pattern code %d attempted to %s", bodyId, to)
		return nil
	}

	if !s.config.Enabled {
		log.Printf("MeliPayamak service is disabled. Skipping SMS to %s", to)
		return nil
	}

	data := url.Values{}
	data.Set("username", s.config.Username)
	// The documentation says to use ApiKey instead of password for this method.
	data.Set("password", s.config.ApiKey)
	data.Set("to", to)
	data.Set("bodyId", fmt.Sprintf("%d", bodyId))
	data.Set("text", strings.Join(params, ";"))

	// Use the REST endpoint
	resp, err := http.PostForm(meliPayamakBaseURL, data)
	if err != nil {
		log.Printf("Failed to send MeliPayamak request to %s: %v", to, err)
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read MeliPayamak response for %s: %v", to, err)
		return err
	}

	// Parse the JSON response
	var apiResp MeliPayamakResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		log.Printf("Failed to parse MeliPayamak JSON response for %s: %v. Body: %s", to, err, string(respBody))
		return fmt.Errorf("invalid JSON response from MeliPayamak: %s", string(respBody))
	}

	// Check the status
	if apiResp.RetStatus == 1 { // 1 indicates success
		log.Printf("Successfully sent SMS to %s. RecId: %s", to, apiResp.Value)
		return nil
	}

	// Handle error codes from the 'Value' field if RetStatus is not 1
	errorCode, convErr := strconv.Atoi(apiResp.Value)
	if convErr != nil {
		log.Printf("MeliPayamak returned an unknown error for %s: %s", to, apiResp.StrRetStatus)
		return fmt.Errorf("melipayamak unknown error: %s", apiResp.StrRetStatus)
	}

	errorMsg := getErrorMessage(errorCode)
	log.Printf("MeliPayamak error for %s: %s (code: %d)", to, errorMsg, errorCode)
	return fmt.Errorf("melipayamak error: %s (code: %d)", errorMsg, errorCode)
}

// getErrorMessage translates MeliPayamak error codes into human-readable messages.
func getErrorMessage(code int) string {
	switch code {
	case -1:
		return "دسترسی برای استفاده از این وبسرویس غیرفعال است"
	case -2:
		return "محدودیت تعداد شماره، محدودیت هربار ارسال یک شماره موبایل می‌باشد"
	case -3:
		return "خط ارسالی در سیستم تعریف نشده است"
	case -4:
		return "کد متن ارسالی صحیح نمی‌باشد و یا توسط مدیر سامانه تأیید نشده است"
	case -5:
		return "متن ارسالی باتوجه به متغیرهای مشخص شده در متن پیشفرض همخوانی ندارد"
	case -6:
		return "خطای داخلی رخ داده است"
	case -7:
		return "خطایی در شماره فرستنده رخ داده است"
	case -10:
		return "در میان متغییر های ارسالی ، لینک وجود دارد"
	case 0:
		return "نام کاربری یا رمزعبور صحیح نمی‌باشد"
	case 2:
		return "اعتبار کافی نمی‌باشد"
	case 6:
		return "سامانه درحال بروزرسانی می‌باشد"
	case 7:
		return "متن حاوی کلمه فیلتر شده می‌باشد"
	case 10:
		return "کاربر موردنظر فعال نمی‌باشد"
	case 11:
		return "ارسال نشده"
	case 12:
		return "مدارک کاربر کامل نمی‌باشد"
	case 16:
		return "شماره گیرنده ای یافت نشد"
	case 17:
		return "متن پیامک خالی می باشد"
	case 18:
		return "شماره گیرنده نامعتبر است"
	case 19:
		return "از محدودیت ساعتی فراتر رفته اید"
	case 35:
		return "شماره موبایل گیرنده در لیست سیاه مخابرات است"
	case -108:
		return "مسدود شدن IP به دلیل تلاش ناموفق"
	case -109:
		return "الزام تنظیم IP مجاز"
	case -110:
		return "الزام استفاده از ApiKey به جای رمز عبور"
	default:
		return fmt.Sprintf("خطای نامشخص (کد: %d)", code)
	}
}
