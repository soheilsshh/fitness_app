package seed

import (
	"fmt"
	"log"
	"time"

	"monetizeai-backend/models"

	"gorm.io/gorm"
)

type landingSample struct {
	phone         string
	lastName      string
	status        models.LandingActivityStatus
	withPayment   bool
	paymentStatus string
	amount        int
	durationMin   int
}

var landingActivitySamples = []landingSample{
	{phone: "09129990001", lastName: "کلیک ثبت‌نام", status: models.LandingStatusClickedRegistrationLink, durationMin: 0},
	{phone: "09129990002", lastName: "ورود به لندینگ", status: models.LandingStatusEnteredLanding, durationMin: 1},
	{phone: "09129990003", lastName: "در لندینگ", status: models.LandingStatusInLanding, durationMin: 14},
	{phone: "09129990004", lastName: "خارج شده", status: models.LandingStatusLeftLanding, durationMin: 6},
	{phone: "09129990005", lastName: "کلیک درگاه", status: models.LandingStatusClickedPaymentButton, withPayment: true, paymentStatus: "pending", amount: 4_900_000},
	{phone: "09129990006", lastName: "کلیک کارت به کارت", status: models.LandingStatusClickedCardToCard, withPayment: true, paymentStatus: "pending", amount: 4_900_000},
	{phone: "09129990007", lastName: "کپی کارت به کارت", status: models.LandingStatusCopiedCardToCard, withPayment: true, paymentStatus: "pending", amount: 4_900_000},
	{phone: "09129990008", lastName: "کلیک قسطی", status: models.LandingStatusClickedInstallment, withPayment: true, paymentStatus: "pending", amount: 2_450_000},
	{phone: "09129990009", lastName: "کپی کارت قسطی", status: models.LandingStatusCopiedInstallmentCard, withPayment: true, paymentStatus: "pending", amount: 2_450_000},
	{phone: "09129990010", lastName: "شروع پرداخت", status: models.LandingStatusPaymentInitiated, withPayment: true, paymentStatus: "pending", amount: 4_900_000},
	{phone: "09129990011", lastName: "پرداخت موفق", status: models.LandingStatusPaymentSuccess, withPayment: true, paymentStatus: "success", amount: 4_900_000},
	{phone: "09129990012", lastName: "پرداخت ناموفق", status: models.LandingStatusPaymentFailed, withPayment: true, paymentStatus: "failed", amount: 4_900_000},
}

// SeedLandingActivitySamples inserts demo rows for each landing activity filter option.
func SeedLandingActivitySamples(db *gorm.DB) (int, error) {
	samplePhones := make([]string, 0, len(landingActivitySamples))
	for _, s := range landingActivitySamples {
		samplePhones = append(samplePhones, s.phone)
	}

	if err := db.Where("phone IN ?", samplePhones).Delete(&models.LandingActivity{}).Error; err != nil {
		return 0, fmt.Errorf("clear landing samples: %w", err)
	}
	if err := db.Where("phone IN ?", samplePhones).Delete(&models.PaymentTransaction{}).Error; err != nil {
		return 0, fmt.Errorf("clear payment samples: %w", err)
	}

	now := time.Now()
	created := 0

	for i, sample := range landingActivitySamples {
		var paymentID *uint

		if sample.withPayment {
			authority := fmt.Sprintf("SAMPLE-LA-%02d-%d", i+1, now.Unix())
			payment := models.PaymentTransaction{
				FirstName:   "نمونه",
				LastName:    sample.lastName,
				Phone:       sample.phone,
				Type:        "subscription",
				Amount:      sample.amount,
				Authority:   authority,
				Status:      sample.paymentStatus,
				Description: "داده نمونه — " + sample.lastName,
				PaymentMethod: "gateway",
			}
			if sample.amount == 2_450_000 {
				payment.IsInstallment = true
				installment := 1
				total := 2
				payment.InstallmentNumber = &installment
				payment.TotalInstallments = &total
			}
			if err := db.Create(&payment).Error; err != nil {
				return created, fmt.Errorf("create payment sample %s: %w", sample.phone, err)
			}
			paymentID = &payment.ID
		}

		startTime := now.Add(-time.Duration(sample.durationMin+2) * time.Minute)
		activity := models.LandingActivity{
			Phone:                  sample.phone,
			FirstName:              "نمونه",
			LastName:               sample.lastName,
			Status:                 sample.status,
			LandingStartTime:       &startTime,
			LandingDurationMinutes: sample.durationMin,
			LastStatusUpdate:       now,
			PaymentTransactionID:   paymentID,
			Metadata:               `{"sample":true,"note":"داده نمایشی برای تست فیلتر فعالیت"}`,
			CreatedAt:              now,
			UpdatedAt:              now,
		}

		if err := db.Create(&activity).Error; err != nil {
			return created, fmt.Errorf("create landing sample %s: %w", sample.phone, err)
		}
		created++
	}

	log.Printf("✅ Seeded %d landing activity samples (phones 09129990001–09129990012)", created)
	return created, nil
}
