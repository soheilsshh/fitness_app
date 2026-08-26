package seed

import (
	"encoding/json"
	"log"
	"monetizeai-backend/models"

	"gorm.io/gorm"
)

// SeedWorkflows seeds example workflows into the database
func SeedWorkflows(db *gorm.DB) {
	log.Println("🌱 Seeding workflow examples...")

	// Workflow 1: وارم‌آپ 24 ساعته تا کارگاه
	workflow1 := models.Workflow{
		Name:        "وارم‌آپ 24 ساعته تا کارگاه",
		Description: "ارسال پیامک‌های یادآوری قبل از شروع وبینار",
		IsActive:    false, // Start as inactive
		Version:     1,
		TriggerType: "on_registration",
	}

	if err := db.Create(&workflow1).Error; err != nil {
		log.Printf("❌ Failed to create workflow 1: %v", err)
	} else {
		log.Printf("✅ Created workflow: %s (ID: %d)", workflow1.Name, workflow1.ID)

		// Steps for workflow 1
		steps1 := []models.WorkflowStep{
			{
				WorkflowID:     workflow1.ID,
				OrderIndex:     0,
				Name:          "پیامک خوش‌آمدگویی",
				Enabled:       true,
				ScheduleType:  "delay",
				DelayMinutes:  60, // 1 hour after registration
				ActionType:    "send_sms",
				SegmentType:   "all_registered",
				SMSPatternCode: stringPtr("123456"), // Replace with actual pattern code
				SMSParamsJSON: stringPtr(`{"name":"{{first_name}}","time":"{{webinar_start_time}}"}`),
			},
			{
				WorkflowID:     workflow1.ID,
				OrderIndex:     1,
				Name:          "یادآوری 2 ساعت قبل",
				Enabled:       true,
				ScheduleType:  "delay",
				DelayMinutes:  1320, // 22 hours after registration (2 hours before webinar if registered 24h before)
				ActionType:    "send_sms",
				SegmentType:   "all_registered",
				SMSPatternCode: stringPtr("123457"),
				SMSParamsJSON: stringPtr(`{"name":"{{first_name}}","time":"{{webinar_start_time}}"}`),
			},
			{
				WorkflowID:     workflow1.ID,
				OrderIndex:     2,
				Name:          "یادآوری نهایی 30 دقیقه قبل",
				Enabled:       true,
				ScheduleType:  "delay",
				DelayMinutes:  1410, // 23.5 hours after registration (30 min before webinar)
				ActionType:    "send_sms",
				SegmentType:   "all_registered",
				SMSPatternCode: stringPtr("123458"),
				SMSParamsJSON: stringPtr(`{"name":"{{first_name}}"}`),
			},
		}

		for _, step := range steps1 {
			if err := db.Create(&step).Error; err != nil {
				log.Printf("  ❌ Failed to create step: %v", err)
			} else {
				log.Printf("  ✅ Created step %d", step.OrderIndex+1)
			}
		}
	}

	// Workflow 2: فالوآپ بعد کارگاه - تماشا کرده ولی نخریده
	workflow2 := models.Workflow{
		Name:        "فالوآپ بعد کارگاه - تماشا کرده ولی نخریده",
		Description: "پیگیری کسانی که وبینار را دیدند اما خرید نکردند",
		IsActive:    false,
		Version:     1,
		TriggerType: "on_webinar_end",
	}

	if err := db.Create(&workflow2).Error; err != nil {
		log.Printf("❌ Failed to create workflow 2: %v", err)
	} else {
		log.Printf("✅ Created workflow: %s (ID: %d)", workflow2.Name, workflow2.ID)

		steps2 := []models.WorkflowStep{
			{
				WorkflowID:      workflow2.ID,
				OrderIndex:      0,
				Name:           "پیامک 30 دقیقه بعد",
				Enabled:        true,
				ScheduleType:   "fixed_time",
				RelativeTo:     "webinar_end",
				OffsetMinutes:  30, // 30 minutes after webinar ends
				ActionType:     "send_sms",
				SegmentType:    "attended_not_bought",
				MinWatchMinutes: intPtr(10), // Watched at least 10 minutes
				SMSPatternCode: stringPtr("123459"),
				SMSParamsJSON:  stringPtr(`{"name":"{{first_name}}"}`),
			},
			{
				WorkflowID:      workflow2.ID,
				OrderIndex:      1,
				Name:           "تماس صوتی 24 ساعت بعد",
				Enabled:        true,
				ScheduleType:   "fixed_time",
				RelativeTo:     "webinar_end",
				OffsetMinutes:  1440, // 24 hours after webinar
				ActionType:     "send_voice",
				SegmentType:    "attended_not_bought",
				MinWatchMinutes: intPtr(10),
				VoicePatternID: stringPtr("12345"), // Replace with actual Avanak message ID
			},
			{
				WorkflowID:      workflow2.ID,
				OrderIndex:      2,
				Name:           "پیامک 48 ساعت بعد",
				Enabled:        true,
				ScheduleType:   "fixed_time",
				RelativeTo:     "webinar_end",
				OffsetMinutes:  2880, // 48 hours after webinar
				ActionType:     "send_sms",
				SegmentType:    "attended_not_bought",
				MinWatchMinutes: intPtr(10),
				SMSPatternCode: stringPtr("123460"),
				SMSParamsJSON:  stringPtr(`{"name":"{{first_name}}"}`),
			},
		}

		for _, step := range steps2 {
			if err := db.Create(&step).Error; err != nil {
				log.Printf("  ❌ Failed to create step: %v", err)
			} else {
				log.Printf("  ✅ Created step %d", step.OrderIndex+1)
			}
		}
	}

	// Workflow 3: فالوآپ کسانی که اصلاً نیامدند
	workflow3 := models.Workflow{
		Name:        "فالوآپ کسانی که اصلاً نیامدند",
		Description: "پیگیری کسانی که ثبت‌نام کردند اما وارد وبینار نشدند",
		IsActive:    false,
		Version:     1,
		TriggerType: "on_webinar_end",
	}

	if err := db.Create(&workflow3).Error; err != nil {
		log.Printf("❌ Failed to create workflow 3: %v", err)
	} else {
		log.Printf("✅ Created workflow: %s (ID: %d)", workflow3.Name, workflow3.ID)

		steps3 := []models.WorkflowStep{
			{
				WorkflowID:     workflow3.ID,
				OrderIndex:     0,
				Name:          "پیامک 1 ساعت بعد",
				Enabled:       true,
				ScheduleType:  "fixed_time",
				RelativeTo:    "webinar_end",
				OffsetMinutes: 60, // 1 hour after webinar ends
				ActionType:    "send_sms",
				SegmentType:   "not_attended",
				SMSPatternCode: stringPtr("123461"),
				SMSParamsJSON: stringPtr(`{"name":"{{first_name}}"}`),
			},
			{
				WorkflowID:     workflow3.ID,
				OrderIndex:     1,
				Name:          "تماس صوتی 24 ساعت بعد",
				Enabled:       true,
				ScheduleType:  "fixed_time",
				RelativeTo:    "webinar_end",
				OffsetMinutes: 1440, // 24 hours after webinar
				ActionType:    "send_voice",
				SegmentType:   "not_attended",
				VoicePatternID: stringPtr("12346"),
			},
		}

		for _, step := range steps3 {
			if err := db.Create(&step).Error; err != nil {
				log.Printf("  ❌ Failed to create step: %v", err)
			} else {
				log.Printf("  ✅ Created step %d", step.OrderIndex+1)
			}
		}
	}

	// Workflow 4: تشکر از خریداران
	workflow4 := models.Workflow{
		Name:        "تشکر از خریداران",
		Description: "ارسال پیام تشکر به کسانی که خرید کردند",
		IsActive:    false,
		Version:     1,
		TriggerType: "on_webinar_end",
	}

	if err := db.Create(&workflow4).Error; err != nil {
		log.Printf("❌ Failed to create workflow 4: %v", err)
	} else {
		log.Printf("✅ Created workflow: %s (ID: %d)", workflow4.Name, workflow4.ID)

		steps4 := []models.WorkflowStep{
			{
				WorkflowID:     workflow4.ID,
				OrderIndex:     0,
				Name:          "تشکر از خریداران کامل",
				Enabled:       true,
				ScheduleType:  "fixed_time",
				RelativeTo:    "webinar_end",
				OffsetMinutes: 10, // 10 minutes after webinar
				ActionType:    "send_sms",
				SegmentType:   "buyers_full",
				SMSPatternCode: stringPtr("123462"),
				SMSParamsJSON: stringPtr(`{"name":"{{first_name}}"}`),
			},
			{
				WorkflowID:     workflow4.ID,
				OrderIndex:     1,
				Name:          "تشکر از خریداران اقساطی",
				Enabled:       true,
				ScheduleType:  "fixed_time",
				RelativeTo:    "webinar_end",
				OffsetMinutes: 10,
				ActionType:    "send_sms",
				SegmentType:   "buyers_installment",
				SMSPatternCode: stringPtr("123463"),
				SMSParamsJSON: stringPtr(`{"name":"{{first_name}}"}`),
			},
			{
				WorkflowID:     workflow4.ID,
				OrderIndex:     2,
				Name:          "اضافه کردن تگ تشکر",
				Enabled:       true,
				ScheduleType:  "fixed_time",
				RelativeTo:    "webinar_end",
				OffsetMinutes: 1440, // 24 hours after
				ActionType:    "add_tag",
				SegmentType:   "buyers_full",
				UpdateValue:   stringPtr("thanked"),
			},
		}

		for _, step := range steps4 {
			if err := db.Create(&step).Error; err != nil {
				log.Printf("  ❌ Failed to create step: %v", err)
			} else {
				log.Printf("  ✅ Created step %d", step.OrderIndex+1)
			}
		}
	}

	log.Println("✅ Seeding completed!")
	log.Println("⚠️  Note: All workflows are created as INACTIVE. Activate them from admin panel after configuring SMS pattern codes.")
}

func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

func jsonPtr(data map[string]string) *string {
	bytes, _ := json.Marshal(data)
	str := string(bytes)
	return &str
}

