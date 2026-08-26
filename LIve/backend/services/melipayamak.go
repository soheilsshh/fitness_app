package services

import (
	"fmt"
	"log"

	"fitino-live-backend/config"
)

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

// SendPatternSMS sends a templated SMS via Kavenegar Verify Lookup.
//
// This used to call MeliPayamak directly (SendByBaseNumber2). The account
// only works with Kavenegar now, so this resolves the same numeric
// "pattern code"/"body ID" every caller already passes (DB-driven admin
// message templates, scheduler reminders, license/payment SMS) to a
// Kavenegar template name via config.yaml's kavenegar.templates map, then
// sends through Kavenegar instead. The method name and signature are
// unchanged on purpose — every call site in controllers/scheduler still
// just passes a phone, a numeric code, and up to a few string params.
// The struct keeps its MelipayamakConfig field (some callers still build
// one just to pass in) but no longer uses it to actually send anything.
func (s *MelipayamakService) SendPatternSMS(to string, bodyId int, params ...string) error {
	// Block sending SMS with disabled pattern codes
	if bodyId == 395350 || bodyId == 395323 {
		log.Printf("⏭️  Blocked: SMS with disabled pattern code %d attempted to %s", bodyId, to)
		return nil
	}

	template, ok := kavenegarTemplateFor(bodyId)
	if !ok {
		err := fmt.Errorf("no kavenegar template mapped for pattern code %d — add it to config.yaml kavenegar.templates", bodyId)
		log.Printf("❌ %v (phone=%s)", err, to)
		return err
	}

	if err := sendKavenegarVerifyLookup(to, template, params...); err != nil {
		log.Printf("❌ Kavenegar send failed for %s (pattern=%d, template=%s): %v", to, bodyId, template, err)
		return err
	}

	log.Printf("✅ Sent SMS to %s via Kavenegar template %q (pattern=%d)", to, template, bodyId)
	return nil
}
