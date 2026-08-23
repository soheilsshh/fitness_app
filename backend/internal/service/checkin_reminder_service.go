package service

import (
	"context"
	"log"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// checkinReminderDedupWindow: resend the reminder every 5h until the user
// fills the field in, as requested.
const checkinReminderDedupWindow = 5 * time.Hour

// CheckInReminderService nudges students who haven't filled in today's daily
// check-in, or this week's weekly check-in, with an in-app notification that
// deep-links straight to the input (Notification.ActionPath).
type CheckInReminderService interface {
	RunCheckInReminders(ctx context.Context, now time.Time)
}

type checkInReminderService struct {
	db            *gorm.DB
	subRepo       repository.SubscriptionRepository
	notifications repository.NotificationRepository
	users         repository.UserRepository
}

func NewCheckInReminderService(
	db *gorm.DB,
	subRepo repository.SubscriptionRepository,
	notifications repository.NotificationRepository,
	users repository.UserRepository,
) CheckInReminderService {
	return &checkInReminderService{db: db, subRepo: subRepo, notifications: notifications, users: users}
}

func (s *checkInReminderService) RunCheckInReminders(ctx context.Context, now time.Time) {
	userIDs, err := s.subRepo.FindActiveUserIDs(ctx, now)
	if err != nil {
		log.Printf("checkin reminder scheduler: failed to list active users: %v", err)
		return
	}

	dedupSince := now.Add(-checkinReminderDedupWindow)
	today := startOfDay(now)

	for _, userID := range userIDs {
		user, err := s.users.FindByID(ctx, userID)
		if err != nil || !user.NotificationsEnabled {
			continue
		}
		s.maybeRemindDaily(ctx, userID, today, dedupSince)

		sub, err := s.subRepo.FindCurrentByUserID(ctx, userID, now)
		if err != nil || sub == nil {
			continue
		}
		s.maybeRemindWeekly(ctx, userID, sub, now, dedupSince)
	}
}

func (s *checkInReminderService) maybeRemindDaily(ctx context.Context, userID uint, today, dedupSince time.Time) {
	var count int64
	s.db.WithContext(ctx).Model(&models.DailyCheckIn{}).
		Where("user_id = ? AND date = ? AND (morning_weight_kg IS NOT NULL OR sleep_quality IS NOT NULL)", userID, today).
		Count(&count)
	if count > 0 {
		return
	}
	alreadySent, err := s.notifications.ExistsRecentByUserAndType(ctx, userID, models.NotificationTypeCheckInReminder, dedupSince)
	if err != nil || alreadySent {
		return
	}
	if err := s.notifications.Create(ctx, &models.Notification{
		UserID:     userID,
		Type:       models.NotificationTypeCheckInReminder,
		Title:      "یادت نره وضعیت امروزت رو ثبت کنی",
		Message:    "وزن صبح و کیفیت خوابت رو در بخش پایش روزانه وارد کن.",
		ActionPath: "/user/tracking#daily-checkin",
	}); err != nil {
		log.Printf("checkin reminder scheduler: daily notification insert failed user=%d: %v", userID, err)
	}
}

// maybeRemindWeekly's "designated day" is the weekday the student's current
// subscription started on (mirrors the roll-forward request: nag on that
// weekday, and keep nagging — capped by the dedup window — the day after too
// if still missing).
func (s *checkInReminderService) maybeRemindWeekly(ctx context.Context, userID uint, sub *models.Subscription, now, dedupSince time.Time) {
	targetWeekday := sub.StartsAt.Weekday()
	daysSinceTarget := (int(now.Weekday()) - int(targetWeekday) + 7) % 7
	if daysSinceTarget > 1 {
		return // not their day (or the very next day) yet
	}

	weekStart := startOfWeekSaturday(now)
	var count int64
	s.db.WithContext(ctx).Model(&models.WeeklyCheckIn{}).
		Where("user_id = ? AND week_start = ? AND waist_cm IS NOT NULL", userID, weekStart).
		Count(&count)
	if count > 0 {
		return
	}

	alreadySent, err := s.notifications.ExistsRecentByUserAndType(ctx, userID, models.NotificationTypeWeeklyCheckinReminder, dedupSince)
	if err != nil || alreadySent {
		return
	}
	if err := s.notifications.Create(ctx, &models.Notification{
		UserID:     userID,
		Type:       models.NotificationTypeWeeklyCheckinReminder,
		Title:      "پایش هفتگی رو فراموش نکن",
		Message:    "دور کمرت رو این هفته هنوز ثبت نکردی.",
		ActionPath: "/user/tracking#weekly-checkin",
	}); err != nil {
		log.Printf("checkin reminder scheduler: weekly notification insert failed user=%d: %v", userID, err)
	}
}

// StartCheckInReminderScheduler launches the hourly ticker goroutine — same
// dependency-free pattern as StartScheduler (progress reports) and
// StartReminderScheduler (inactivity nudges).
func StartCheckInReminderScheduler(ctx context.Context, svc CheckInReminderService) {
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case t := <-ticker.C:
				svc.RunCheckInReminders(ctx, t)
			}
		}
	}()
}
