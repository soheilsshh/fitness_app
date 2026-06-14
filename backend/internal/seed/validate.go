package seed

import (
	"context"
	"fmt"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

var devTrackingCodes = []string{"TRX-DEV-001", "TRX-DEV-002", "TRX-DEV-003", "TRX-DEV-PENDING"}
var devTransactionRefs = []string{"TXN-DEV-001", "TXN-DEV-002", "TXN-DEV-003"}
var devCoachSlugs = []string{"ali-rezaei", "sara-karimi"}
var devPlanNames = []string{
	"پکیج کاهش وزن ۹۰ روزه",
	"برنامه تمرینی ۸ هفته",
	"رژیم تخصصی",
	"عضله‌سازی پیشرفته",
}

// validatePreconditions ensures fixture IDs and natural keys are free or already
// owned by dev data. Prevents silent FK corruption on shared databases.
func validatePreconditions(ctx context.Context, db *gorm.DB) error {
	for email, wantID := range DevFixtureEmails {
		var user models.User
		err := db.WithContext(ctx).Where("email = ?", email).First(&user).Error
		if err == gorm.ErrRecordNotFound {
			continue
		}
		if err != nil {
			return fmt.Errorf("check dev user %q: %w", email, err)
		}
		if user.ID != wantID {
			return fmt.Errorf("dev user %q exists at id=%d but fixtures expect id=%d", email, user.ID, wantID)
		}
	}

	for id := uint(2); id <= 7; id++ {
		var user models.User
		err := db.WithContext(ctx).First(&user, id).Error
		if err == gorm.ErrRecordNotFound {
			continue
		}
		if err != nil {
			return fmt.Errorf("check user id=%d: %w", id, err)
		}
		if _, ok := DevFixtureEmails[user.Email]; !ok {
			return fmt.Errorf("user id=%d is occupied by %q (not a dev fixture account)", id, user.Email)
		}
	}

	for _, slug := range devCoachSlugs {
		var profile models.CoachProfile
		err := db.WithContext(ctx).Where("slug = ?", slug).First(&profile).Error
		if err == gorm.ErrRecordNotFound {
			continue
		}
		if err != nil {
			return fmt.Errorf("check coach slug %q: %w", slug, err)
		}
		if profile.Slug != slug {
			continue
		}
		// slug matched; ensure it belongs to a dev coach account
		var coach models.User
		if err := db.WithContext(ctx).First(&coach, profile.UserID).Error; err != nil {
			return fmt.Errorf("coach profile %q references missing user id=%d: %w", slug, profile.UserID, err)
		}
		if _, ok := DevFixtureEmails[coach.Email]; !ok {
			return fmt.Errorf("coach slug %q belongs to non-dev user %q", slug, coach.Email)
		}
	}

	for _, name := range devPlanNames {
		var plan models.ServicePlan
		err := db.WithContext(ctx).Where("name = ?", name).First(&plan).Error
		if err == gorm.ErrRecordNotFound {
			continue
		}
		if err != nil {
			return fmt.Errorf("check plan %q: %w", name, err)
		}
		var coach models.User
		if err := db.WithContext(ctx).First(&coach, plan.CoachID).Error; err != nil {
			return fmt.Errorf("plan %q references missing coach id=%d: %w", name, plan.CoachID, err)
		}
		if plan.CoachID != 0 {
			if _, ok := DevFixtureEmails[coach.Email]; !ok {
				return fmt.Errorf("plan %q belongs to non-dev coach %q", name, coach.Email)
			}
		}
	}

	for _, code := range devTrackingCodes {
		var order models.Order
		err := db.WithContext(ctx).Where("tracking_code = ?", code).First(&order).Error
		if err == gorm.ErrRecordNotFound {
			continue
		}
		if err != nil {
			return fmt.Errorf("check order tracking code %q: %w", code, err)
		}
		var buyer models.User
		if err := db.WithContext(ctx).First(&buyer, order.UserID).Error; err != nil {
			return fmt.Errorf("order %q references missing user id=%d: %w", code, order.UserID, err)
		}
		if _, ok := DevFixtureEmails[buyer.Email]; !ok {
			return fmt.Errorf("order %q belongs to non-dev user %q", code, buyer.Email)
		}
	}

	for _, ref := range devTransactionRefs {
		var tx models.Transaction
		err := db.WithContext(ctx).Where("reference = ?", ref).First(&tx).Error
		if err == gorm.ErrRecordNotFound {
			continue
		}
		if err != nil {
			return fmt.Errorf("check transaction reference %q: %w", ref, err)
		}
		var user models.User
		if err := db.WithContext(ctx).First(&user, tx.UserID).Error; err != nil {
			return fmt.Errorf("transaction %q references missing user id=%d: %w", ref, tx.UserID, err)
		}
		if _, ok := DevFixtureEmails[user.Email]; !ok {
			return fmt.Errorf("transaction %q belongs to non-dev user %q", ref, user.Email)
		}
	}

	return nil
}
