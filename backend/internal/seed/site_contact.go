package seed

import (
	"context"
	"encoding/json"
	"log"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
)

// Fitino public contact — used on landing / site settings.
var fitinoContactInfo = map[string]string{
	"address":   "",
	"phone":     "09921906934",
	"email":     "fitinoo.ir@gmail.com",
	"instagram": "https://instagram.com/fiti.noo",
	"telegram":  "https://t.me/fiti_noo",
	"whatsapp":  "https://wa.me/989921906934",
}

// EnsureSiteContact upserts Fitino contact channels into site_settings (id=1).
func EnsureSiteContact(ctx context.Context, db *gorm.DB) error {
	raw, err := json.Marshal(fitinoContactInfo)
	if err != nil {
		return err
	}

	var row models.SiteSettings
	err = db.WithContext(ctx).First(&row, 1).Error
	if err == gorm.ErrRecordNotFound {
		row = models.SiteSettings{
			ContactInfo: raw,
		}
		row.ID = 1
		if err := db.WithContext(ctx).Create(&row).Error; err != nil {
			return err
		}
		log.Println("seeded site_settings contact (Fitino)")
		return nil
	}
	if err != nil {
		return err
	}

	row.ContactInfo = raw
	if err := db.WithContext(ctx).Save(&row).Error; err != nil {
		return err
	}
	log.Println("updated site_settings contact (Fitino)")
	return nil
}
