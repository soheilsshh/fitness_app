package service

import (
	"context"
	"log"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

const (
	inactivityReminderWindow = 24 * time.Hour  // roadmap BE-8.3: 24h "come back" nudge
	longInactivitySMSWindow  = 7 * 24 * time.Hour // roadmap BE-8.4: SMS only for real drop-off
	reminderDedupWindow      = 20 * time.Hour     // don't re-notify inside the same day's run
)

// ReminderService implements the inactivity/motivation nudges (roadmap E1-E3,
// BE-8.3/BE-8.4): in-app notification always, push when a device token
// exists, SMS only past a week of inactivity to avoid spamming a paid channel.
type ReminderService interface {
	RunInactivityReminders(ctx context.Context, now time.Time)
}

type reminderService struct {
	devices       repository.MobileDeviceRepository
	notifications repository.NotificationRepository
	users         repository.UserRepository
	push          PushNotificationService
}

func NewReminderService(
	devices repository.MobileDeviceRepository,
	notifications repository.NotificationRepository,
	users repository.UserRepository,
	push PushNotificationService,
) ReminderService {
	return &reminderService{devices: devices, notifications: notifications, users: users, push: push}
}

func (s *reminderService) RunInactivityReminders(ctx context.Context, now time.Time) {
	userIDs, err := s.devices.UsersInactiveSince(ctx, now.Add(-inactivityReminderWindow))
	if err != nil {
		log.Printf("reminder scheduler: inactive user query failed: %v", err)
		return
	}
	longInactiveIDs, err := s.devices.UsersInactiveSince(ctx, now.Add(-longInactivitySMSWindow))
	if err != nil {
		log.Printf("reminder scheduler: long-inactive user query failed: %v", err)
		longInactiveIDs = nil
	}
	longInactive := make(map[uint]bool, len(longInactiveIDs))
	for _, id := range longInactiveIDs {
		longInactive[id] = true
	}

	dedupSince := now.Add(-reminderDedupWindow)
	for _, userID := range userIDs {
		alreadySent, err := s.notifications.ExistsRecentByUserAndType(ctx, userID, models.NotificationTypeInactivityReminder, dedupSince)
		if err != nil {
			log.Printf("reminder scheduler: dedup check failed user=%d: %v", userID, err)
			continue
		}
		if alreadySent {
			continue
		}
		s.notifyOne(ctx, userID, longInactive[userID])
	}
}

func (s *reminderService) notifyOne(ctx context.Context, userID uint, sendSMS bool) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		log.Printf("reminder scheduler: user lookup failed user=%d: %v", userID, err)
		return
	}
	if !user.NotificationsEnabled {
		return
	}

	title := "دلمون برات تنگ شده!"
	body := "چند روزیه سر نزدی — یه نگاه به برنامه و پیشرفتت بنداز، ادامه بده 💪"

	if err := s.notifications.Create(ctx, &models.Notification{
		UserID: userID, Type: models.NotificationTypeInactivityReminder, Title: title, Message: body,
	}); err != nil {
		log.Printf("reminder scheduler: notification insert failed user=%d: %v", userID, err)
	}

	if s.push != nil {
		if err := s.push.SendToUser(ctx, userID, title, body, map[string]string{"type": models.NotificationTypeInactivityReminder}); err != nil {
			log.Printf("reminder scheduler: push failed user=%d: %v", userID, err)
		}
	}

	// Long inactivity (>=7 days) also gets an SMS — a paid channel, reserved
	// for real drop-off rather than every daily nudge.
	if sendSMS && user.Phone != "" {
		if err := SendInactivityReminderSMS(user.Phone, firstNameOf(user.Name)); err != nil {
			log.Printf("reminder scheduler: sms failed user=%d: %v", userID, err)
		}
	}
}

func firstNameOf(fullName string) string {
	for i, r := range fullName {
		if r == ' ' {
			return fullName[:i]
		}
	}
	return fullName
}

// StartReminderScheduler launches a background goroutine that checks hourly
// for inactive users to nudge (roadmap BE-8.3). Same dependency-free ticker
// pattern as StartScheduler (progress reports) — no external cron library.
func StartReminderScheduler(ctx context.Context, svc ReminderService) {
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case t := <-ticker.C:
				svc.RunInactivityReminders(ctx, t)
			}
		}
	}()
}
