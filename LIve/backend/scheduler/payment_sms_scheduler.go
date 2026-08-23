package scheduler

import (
	"log"
	"monetizeai-backend/models"
	"monetizeai-backend/services"
	"time"

	"gorm.io/gorm"
)

// processPaymentSMSMessages processes scheduled payment SMS messages and sends them via Faraz SMS
func processPaymentSMSMessages(db *gorm.DB, farazSMSService *services.FarazSMSService, loc *time.Location) {
	now := time.Now().In(loc)

	// Find all payment SMS message logs that are scheduled to be sent and haven't been sent yet
	var logs []models.PaymentSMSMessageLog
	if err := db.Where("scheduled_send_time <= ? AND sent_at IS NULL", now).Find(&logs).Error; err != nil {
		log.Printf("❌ Failed to fetch scheduled payment SMS logs: %v", err)
		return
	}

	if len(logs) == 0 {
		return // No messages to send
	}

	log.Printf("📨 Found %d scheduled payment SMS message(s) ready to send", len(logs))

	// Check if Faraz SMS service is available
	if farazSMSService == nil {
		log.Printf("⚠️  Faraz SMS service is not available, skipping payment SMS sending")
		return
	}

	if !farazSMSService.GetConfig().Enabled {
		log.Printf("⚠️  Faraz SMS service is disabled, skipping payment SMS sending")
		return
	}

	if farazSMSService.GetConfig().ApiKey == "" || farazSMSService.GetConfig().FromNumber == "" {
		log.Printf("⚠️  Faraz SMS API Key or FromNumber is not configured, skipping payment SMS sending")
		return
	}

	// Process each log entry
	for _, logEntry := range logs {
		// Check if message is still active
		var message models.PaymentSMSMessage
		if err := db.First(&message, logEntry.PaymentSMSMessageID).Error; err != nil {
			log.Printf("⚠️  Payment SMS message %d not found, skipping log entry %d", logEntry.PaymentSMSMessageID, logEntry.ID)
			// Mark as failed
			sentAt := time.Now().In(loc)
			logEntry.SentAt = &sentAt
			logEntry.Success = false
			logEntry.Error = "Payment SMS message not found"
			db.Save(&logEntry)
			continue
		}

		if !message.IsActive {
			log.Printf("⚠️  Payment SMS message %d is not active, skipping log entry %d", logEntry.PaymentSMSMessageID, logEntry.ID)
			// Mark as failed
			sentAt := time.Now().In(loc)
			logEntry.SentAt = &sentAt
			logEntry.Success = false
			logEntry.Error = "Payment SMS message is not active"
			db.Save(&logEntry)
			continue
		}

		// Send SMS via Faraz SMS
		recipients := []string{logEntry.Phone}
		err := farazSMSService.SendSimpleSMS(recipients, logEntry.MessageText)

		// Update log entry
		sentAt := time.Now().In(loc)
		logEntry.SentAt = &sentAt
		if err != nil {
			logEntry.Success = false
			logEntry.Error = err.Error()
			log.Printf("❌ Failed to send payment SMS to %s (log ID: %d): %v", logEntry.Phone, logEntry.ID, err)
		} else {
			logEntry.Success = true
			logEntry.Error = ""
			log.Printf("✅ Successfully sent payment SMS to %s (log ID: %d, trigger: %s, delay: %d minutes)",
				logEntry.Phone, logEntry.ID, logEntry.TriggerType, message.DelayMinutes)
		}

		if err := db.Save(&logEntry).Error; err != nil {
			log.Printf("❌ Failed to update payment SMS log entry %d: %v", logEntry.ID, err)
		}
	}
}

