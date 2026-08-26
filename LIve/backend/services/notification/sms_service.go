package notification

import (
	"fmt"
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/services"
)

// SmsProvider interface for SMS sending
type SmsProvider interface {
	SendPatternSms(phone string, patternCode string, params map[string]string) error
}

// MeliPayamakSmsProvider implements SmsProvider using MeliPayamak service
type MeliPayamakSmsProvider struct {
	service *services.MelipayamakService
}

// NewMeliPayamakSmsProvider creates a new MeliPayamak SMS provider
func NewMeliPayamakSmsProvider(cfg *config.MelipayamakConfig) *MeliPayamakSmsProvider {
	return &MeliPayamakSmsProvider{
		service: services.NewMelipayamakService(cfg),
	}
}

// SendPatternSms sends a pattern-based SMS using MeliPayamak
func (p *MeliPayamakSmsProvider) SendPatternSms(phone string, patternCode string, params map[string]string) error {
	// Convert patternCode string to int
	var bodyID int
	_, err := fmt.Sscanf(patternCode, "%d", &bodyID)
	if err != nil {
		log.Printf("Invalid pattern code '%s': %v", patternCode, err)
		return fmt.Errorf("invalid pattern code: %v", err)
	}

	// Convert params map to ordered string array
	// MeliPayamak expects params in order, separated by semicolon
	var paramValues []string
	for _, value := range params {
		paramValues = append(paramValues, value)
	}

	return p.service.SendPatternSMS(phone, bodyID, paramValues...)
}

// SmsService is a wrapper service for SMS operations
type SmsService struct {
	Provider SmsProvider
}

// NewSmsService creates a new SMS service
func NewSmsService(provider SmsProvider) *SmsService {
	return &SmsService{
		Provider: provider,
	}
}

// SendWorkflowPattern sends a workflow pattern SMS
func (s *SmsService) SendWorkflowPattern(phone string, patternCode string, params map[string]string) error {
	log.Printf("📤 Sending workflow SMS to %s with pattern %s", phone, patternCode)
	
	err := s.Provider.SendPatternSms(phone, patternCode, params)
	if err != nil {
		log.Printf("❌ Failed to send SMS to %s: %v", phone, err)
		return err
	}
	
	log.Printf("✅ Successfully sent SMS to %s", phone)
	return nil
}

