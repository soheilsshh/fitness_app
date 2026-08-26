package notification

import (
	"fmt"
	"log"
	"fitino-live-backend/config"
	"fitino-live-backend/services"
	"strconv"
)

// VoiceProvider interface for voice call sending
type VoiceProvider interface {
	SendVoicePattern(phone string, patternID string, params map[string]string) error
}

// AvanakVoiceProvider implements VoiceProvider using Avanak service
type AvanakVoiceProvider struct {
	service *services.AvanakService
}

// NewAvanakVoiceProvider creates a new Avanak voice provider
func NewAvanakVoiceProvider(cfg *config.AvanakConfig) *AvanakVoiceProvider {
	return &AvanakVoiceProvider{
		service: services.NewAvanakService(cfg),
	}
}

// SendVoicePattern sends a voice call using Avanak
// Note: Avanak doesn't support dynamic parameters in the same way as SMS
// The patternID is the MessageID in Avanak system
func (p *AvanakVoiceProvider) SendVoicePattern(phone string, patternID string, params map[string]string) error {
	// Convert patternID string to int
	messageID, err := strconv.Atoi(patternID)
	if err != nil {
		log.Printf("Invalid voice pattern ID '%s': %v", patternID, err)
		return fmt.Errorf("invalid voice pattern ID: %v", err)
	}

	return p.service.SendVoiceCall(phone, messageID)
}

// VoiceService is a wrapper service for voice call operations
type VoiceService struct {
	Provider VoiceProvider
}

// NewVoiceService creates a new voice service
func NewVoiceService(provider VoiceProvider) *VoiceService {
	return &VoiceService{
		Provider: provider,
	}
}

// SendWorkflowPattern sends a workflow voice call
func (s *VoiceService) SendWorkflowPattern(phone string, patternID string, params map[string]string) error {
	log.Printf("📞 Sending workflow voice call to %s with pattern %s", phone, patternID)
	
	err := s.Provider.SendVoicePattern(phone, patternID, params)
	if err != nil {
		log.Printf("❌ Failed to send voice call to %s: %v", phone, err)
		return err
	}
	
	log.Printf("✅ Successfully sent voice call to %s", phone)
	return nil
}

