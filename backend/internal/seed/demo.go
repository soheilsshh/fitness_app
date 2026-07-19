package seed

import (
	"context"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
)

const demoPassword = "12345678"

// DemoAccounts documents system/demo logins (password always 12345678 unless noted).
var DemoAccounts = []struct {
	Role  string
	Name  string
	Email string
	Phone string
	Note  string
}{
	{Role: "admin", Name: "admin", Email: "admin@gmail.com", Phone: "09150000000", Note: "پنل ادمین"},
	{Role: "coach", Name: "علی رشیدآبادی", Email: "ali.rashidabadi@fitino.ir", Phone: "09151111111", Note: "فانل ۱ · slug=ali-rashidabadi"},
	{Role: "coach", Name: "علی رضایی", Email: "coach.ali@fitness.dev", Phone: "09121111111", Note: "مربی دمو · slug=ali-rezaei"},
	{Role: "coach", Name: "سارا کریمی", Email: "coach.sara@fitness.dev", Phone: "09122222222", Note: "مربی دمو · slug=sara-karimi"},
	{Role: "student", Name: "رضا محمدی", Email: "student.reza@fitness.dev", Phone: "09123333333", Note: "شاگرد دمو با اشتراک (مربی علی رضایی)"},
	{Role: "student", Name: "مریم احمدی", Email: "student.maryam@fitness.dev", Phone: "09124444444", Note: "شاگرد دمو با اشتراک (مربی علی رضایی)"},
	{Role: "student", Name: "امیر حسینی", Email: "student.amir@fitness.dev", Phone: "09125555555", Note: "شاگرد دمو با اشتراک (مربی سارا)"},
	{Role: "student", Name: "ندا جعفری", Email: "student.neda@fitness.dev", Phone: "09126666666", Note: "شاگرد بدون اشتراک (تست تهیه برنامه)"},
	{Role: "student", Name: "سارا شاگرد علی", Email: "student.ali@fitness.dev", Phone: "09127777777", Note: "شاگرد با اشتراک VIP علی رشیدآبادی"},
}

// EnsureDemoData creates mock coaches/students/plans/subscriptions for video demos.
// Idempotent by email/slug/name — safe alongside Funnel 1 (علی رشیدآبادی).
func EnsureDemoData(ctx context.Context, db *gorm.DB) error {
	_ = ctx
	hash, err := bcrypt.GenerateFromPassword([]byte(demoPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	pass := string(hash)

	aliRezaei, err := ensureDemoUser(db, "علی رضایی", "coach.ali@fitness.dev", "09121111111", pass, models.RoleCoach, "approved", nil)
	if err != nil {
		return err
	}
	sara, err := ensureDemoUser(db, "سارا کریمی", "coach.sara@fitness.dev", "09122222222", pass, models.RoleCoach, "approved", nil)
	if err != nil {
		return err
	}
	aliRashid, err := findUserByEmail(db, aliFunnelCoachEmail)
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	if err := ensureDemoCoachProfile(db, aliRezaei.ID, "ali-rezaei", "علی رضایی", "مربی بدنسازی و فیتنس", "بدنسازی، کاهش وزن"); err != nil {
		return err
	}
	if err := ensureDemoCoachProfile(db, sara.ID, "sara-karimi", "سارا کریمی", "مربی تغذیه و فیتنس بانوان", "تغذیه، فرم‌دهی"); err != nil {
		return err
	}

	planWeight, err := ensureDemoPlan(db, aliRezaei.ID, "پکیج کاهش وزن ۹۰ روزه", "تمرین + رژیم هدفمند", "دوره لاغری",
		"برنامه تمرین\nبرنامه غذایی\nچک‌این هفتگی\nپشتیبانی تلگرام", 3_990_000, 4_500_000, 90, true)
	if err != nil {
		return err
	}
	planWorkout, err := ensureDemoPlan(db, aliRezaei.ID, "برنامه تمرینی ۸ هفته", "فقط تمرین", "دوره تمرین",
		"برنامه ۸ هفته\nویدیو حرکات\nبه‌روزرسانی ماهانه", 2_500_000, 0, 56, false)
	if err != nil {
		return err
	}
	if _, err := ensureDemoPlan(db, aliRezaei.ID, "رژیم تخصصی", "فقط تغذیه", "دوره تغذیه",
		"منوی هفتگی\nجایگزین غذا\nپیگیری ماکرو", 1_800_000, 0, 30, false); err != nil {
		return err
	}
	planMuscle, err := ensureDemoPlan(db, sara.ID, "عضله‌سازی پیشرفته", "حجم و قدرت", "دوره حجم",
		"اسplit تخصصی\nتغذیه حجم\nچک‌این دو هفته‌ای", 2_880_000, 3_200_000, 70, true)
	if err != nil {
		return err
	}

	rezaID := aliRezaei.ID
	saraID := sara.ID
	reza, err := ensureDemoUser(db, "رضا محمدی", "student.reza@fitness.dev", "09123333333", pass, models.RoleStudent, "", &rezaID)
	if err != nil {
		return err
	}
	maryam, err := ensureDemoUser(db, "مریم احمدی", "student.maryam@fitness.dev", "09124444444", pass, models.RoleStudent, "", &rezaID)
	if err != nil {
		return err
	}
	amir, err := ensureDemoUser(db, "امیر حسینی", "student.amir@fitness.dev", "09125555555", pass, models.RoleStudent, "", &saraID)
	if err != nil {
		return err
	}
	if _, err := ensureDemoUser(db, "ندا جعفری", "student.neda@fitness.dev", "09126666666", pass, models.RoleStudent, "", nil); err != nil {
		return err
	}

	if err := ensureDemoSubscription(db, reza.ID, planWeight.ID, aliRezaei.ID, 90); err != nil {
		return err
	}
	if err := ensureDemoSubscription(db, maryam.ID, planWorkout.ID, aliRezaei.ID, 56); err != nil {
		return err
	}
	if err := ensureDemoSubscription(db, amir.ID, planMuscle.ID, sara.ID, 70); err != nil {
		return err
	}

	// Paid student under Funnel 1 coach (علی رشیدآبادی) when available.
	if aliRashid != nil && aliRashid.ID > 0 {
		var vip models.ServicePlan
		if err := db.Where("coach_id = ? AND name = ?", aliRashid.ID, aliVIPPlanName).First(&vip).Error; err == nil {
			aliStudent, err := ensureDemoUser(db, "سارا شاگرد علی", "student.ali@fitness.dev", "09127777777", pass, models.RoleStudent, "", &aliRashid.ID)
			if err != nil {
				return err
			}
			if err := ensureDemoSubscription(db, aliStudent.ID, vip.ID, aliRashid.ID, 90); err != nil {
				return err
			}
		}
	}

	_ = planWorkout
	log.Println("demo accounts ready (password: 12345678) — see seed.DemoAccounts / seed -demo")
	return nil
}

// LogDemoCredentials prints a concise login sheet for demos/videos.
func LogDemoCredentials() {
	log.Println("========== demo logins (password: 12345678) ==========")
	for _, a := range DemoAccounts {
		log.Printf("  [%s] %s | %s | %s — %s", a.Role, a.Email, a.Phone, a.Name, a.Note)
	}
	log.Println("======================================================")
}

func findUserByEmail(db *gorm.DB, email string) (*models.User, error) {
	var u models.User
	if err := db.Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func ensureDemoUser(
	db *gorm.DB,
	name, email, phone, passHash, role, coachStatus string,
	assignedCoachID *uint,
) (*models.User, error) {
	var user models.User
	err := db.Where("email = ?", email).First(&user).Error
	if err == nil {
		changed := false
		if user.Role != role {
			user.Role = role
			changed = true
		}
		if role == models.RoleCoach && user.CoachStatus != "approved" {
			user.CoachStatus = "approved"
			changed = true
		}
		if assignedCoachID != nil && (user.AssignedCoachID == nil || *user.AssignedCoachID != *assignedCoachID) {
			user.AssignedCoachID = assignedCoachID
			changed = true
		}
		if changed {
			if err := db.Save(&user).Error; err != nil {
				return nil, err
			}
		}
		return &user, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	user = models.User{
		Name:            name,
		Email:           email,
		Phone:           phone,
		Password:        passHash,
		Role:            role,
		CoachStatus:     coachStatus,
		AssignedCoachID: assignedCoachID,
		Goals:           "[]",
	}
	if err := db.Create(&user).Error; err != nil {
		return nil, err
	}
	log.Printf("seeded demo user %s (%s)", email, role)
	return &user, nil
}

func ensureDemoCoachProfile(db *gorm.DB, userID uint, slug, displayName, title, specialty string) error {
	var profile models.CoachProfile
	err := db.Where("user_id = ?", userID).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		profile = models.CoachProfile{
			UserID:      userID,
			Slug:        slug,
			DisplayName: displayName,
			Title:       title,
			Bio:         "اکانت دمو برای نمایش سیستم در ویدیو و تست.",
			AboutCoach:  "این پروفایل برای دموی فیتینو ساخته شده است.",
			Specialty:   specialty,
			City:        "تهران",
			Status:      models.CoachProfileStatusApproved,
			IsPublished: true,
			IsActive:    true,
		}
		// Reclaim slug if orphaned.
		var orphan models.CoachProfile
		if e := db.Where("slug = ?", slug).First(&orphan).Error; e == nil && orphan.UserID != userID {
			orphan.UserID = userID
			orphan.DisplayName = displayName
			orphan.Status = models.CoachProfileStatusApproved
			orphan.IsPublished = true
			orphan.IsActive = true
			return db.Save(&orphan).Error
		}
		return db.Create(&profile).Error
	}
	if err != nil {
		return err
	}
	profile.Slug = slug
	profile.DisplayName = displayName
	profile.Title = title
	profile.Specialty = specialty
	profile.Status = models.CoachProfileStatusApproved
	profile.IsPublished = true
	profile.IsActive = true
	return db.Save(&profile).Error
}

func ensureDemoPlan(
	db *gorm.DB,
	coachID uint,
	name, subtitle, course, features string,
	price, listPrice int64,
	days int,
	popular bool,
) (*models.ServicePlan, error) {
	base := listPrice
	if base <= 0 {
		base = price
	}
	discount := int64(0)
	if listPrice > price && price > 0 {
		discount = price
	} else {
		base = price
	}

	var plan models.ServicePlan
	err := db.Where("name = ?", name).First(&plan).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	if err == gorm.ErrRecordNotFound {
		plan = models.ServicePlan{
			CoachID:            coachID,
			Name:               name,
			Subtitle:           subtitle,
			CourseName:         course,
			Description:        "پلن دمو برای تست خرید و پنل.",
			FeaturesText:       features,
			Type:               "both",
			PriceCents:         base,
			DiscountPriceCents: discount,
			DurationDays:       days,
			IsPopular:          popular,
			IsActive:           true,
		}
		if err := db.Create(&plan).Error; err != nil {
			return nil, err
		}
		return &plan, nil
	}
	plan.CoachID = coachID
	plan.Subtitle = subtitle
	plan.CourseName = course
	plan.FeaturesText = features
	plan.PriceCents = base
	plan.DiscountPriceCents = discount
	plan.DurationDays = days
	plan.IsPopular = popular
	plan.IsActive = true
	if err := db.Save(&plan).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func ensureDemoSubscription(db *gorm.DB, userID, planID, coachID uint, durationDays int) error {
	var count int64
	if err := db.Model(&models.Subscription{}).
		Where("user_id = ? AND service_plan_id = ? AND deleted_at IS NULL AND (ends_at IS NULL OR ends_at > ?)",
			userID, planID, time.Now()).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	now := time.Now()
	ends := now.AddDate(0, 0, durationDays)
	sub := &models.Subscription{
		UserID:        userID,
		ServicePlanID: planID,
		CoachID:       coachID,
		StartsAt:      now,
		EndsAt:        &ends,
	}
	return db.Create(sub).Error
}
