package seed

import (
	"context"
	"log"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/pkg/slug"
)

const (
	AliFunnelKey         = "funnel_1"
	AliFunnelCoachSlug   = "ali-rashidabadi"
	aliFunnelCoachEmail  = "ali.rashidabadi@fitino.ir"
	aliFunnelCoachPhone  = "09151111111"
	aliFunnelCoachPass   = "12345678"
	aliFunnelDisplayName = "علی رشیدآبادی"
	aliVIPPlanName       = "پلن VIP"
	aliCIPPlanName       = "پلن CIP"
)

// EnsureAliFunnel seeds Funnel 1 coach (علی رشیدآبادی) + VIP/CIP ServicePlans.
// Idempotent — safe on every API / seed startup (production included).
func EnsureAliFunnel(ctx context.Context, db *gorm.DB) error {
	_ = ctx
	coachSlug := AliFunnelCoachSlug
	if v := strings.TrimSpace(config.Get().Funnel.CoachSlug); v != "" {
		coachSlug = slug.Normalize(v)
	}

	user, err := ensureAliFunnelUser(db, coachSlug)
	if err != nil {
		return err
	}
	if err := ensureAliFunnelProfile(db, user.ID, coachSlug); err != nil {
		return err
	}
	if err := ensureAliFunnelPlans(db, user.ID); err != nil {
		return err
	}

	log.Printf("funnel_1 ready: coach=%s slug=%s plans=VIP(%d)+CIP(%d)",
		aliFunnelDisplayName, coachSlug, 1_490_000, 2_900_000)
	return nil
}

func ensureAliFunnelUser(db *gorm.DB, coachSlug string) (*models.User, error) {
	var user models.User
	err := db.Where("email = ?", aliFunnelCoachEmail).First(&user).Error
	if err == nil {
		return syncAliFunnelUser(db, &user)
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// Reuse the coach who already owns the funnel slug (legacy / demo seed).
	var existing models.CoachProfile
	if e := db.Where("slug = ?", coachSlug).First(&existing).Error; e == nil && existing.UserID > 0 {
		if err := db.First(&user, existing.UserID).Error; err != nil {
			return nil, err
		}
		user.Email = aliFunnelCoachEmail
		user.Phone = aliFunnelCoachPhone
		hashed, herr := bcrypt.GenerateFromPassword([]byte(aliFunnelCoachPass), bcrypt.DefaultCost)
		if herr != nil {
			return nil, herr
		}
		user.Password = string(hashed)
		log.Printf("reclaimed funnel_1 coach user id=%d for slug=%s → %s", user.ID, coachSlug, aliFunnelCoachEmail)
		return syncAliFunnelUser(db, &user)
	} else if e != nil && e != gorm.ErrRecordNotFound {
		return nil, e
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(aliFunnelCoachPass), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user = models.User{
		Model:       gorm.Model{ID: 10}, // keep IDs 2–7 free for optional classic fixture dump
		Name:        aliFunnelDisplayName,
		Email:       aliFunnelCoachEmail,
		Phone:       aliFunnelCoachPhone,
		Password:    string(hashed),
		Role:        models.RoleCoach,
		CoachStatus: "approved",
		Goals:       "[]",
	}
	if err := db.Create(&user).Error; err != nil {
		return nil, err
	}
	log.Printf("seeded funnel_1 coach user %s (password: %s)", aliFunnelCoachEmail, aliFunnelCoachPass)
	return &user, nil
}

func syncAliFunnelUser(db *gorm.DB, user *models.User) (*models.User, error) {
	changed := false
	if user.Role != models.RoleCoach {
		user.Role = models.RoleCoach
		changed = true
	}
	if user.CoachStatus != "approved" {
		user.CoachStatus = "approved"
		changed = true
	}
	if user.Name != aliFunnelDisplayName {
		user.Name = aliFunnelDisplayName
		changed = true
	}
	if changed {
		if err := db.Save(user).Error; err != nil {
			return nil, err
		}
	}
	return user, nil
}

func ensureAliFunnelProfile(db *gorm.DB, userID uint, coachSlug string) error {
	var profile models.CoachProfile

	err := db.Where("user_id = ?", userID).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		// Slug already taken by another coach → reclaim for funnel user.
		err = db.Where("slug = ?", coachSlug).First(&profile).Error
		if err == nil {
			log.Printf("reclaimed funnel_1 coach_profile id=%d slug=%s → user_id=%d", profile.ID, coachSlug, userID)
			profile.UserID = userID
		} else if err == gorm.ErrRecordNotFound {
			profile = models.CoachProfile{
				UserID:      userID,
				Slug:        coachSlug,
				DisplayName: aliFunnelDisplayName,
				Title:       "مربی بدنسازی و فیتنس",
				Bio:         "مربی اختصاصی فانل ۱ فیتینو — برنامه تمرین، تغذیه و پایش هوشمند.",
				AboutCoach:  "این پروفایل برای فانل فروش اختصاصی علی رشیدآبادی (فانل ۱) طراحی شده است.",
				Specialty:   "بدنسازی، کاهش وزن، عضله‌سازی",
				City:        "تهران",
				Status:      models.CoachProfileStatusApproved,
				IsPublished: true,
				IsActive:    true,
			}
			return db.Create(&profile).Error
		} else {
			return err
		}
	} else if err != nil {
		return err
	}

	// If this user's profile has a different slug, free the target slug first.
	if profile.Slug != coachSlug {
		var conflict models.CoachProfile
		if e := db.Where("slug = ? AND id <> ?", coachSlug, profile.ID).First(&conflict).Error; e == nil {
			conflict.Slug = coachSlug + "-legacy-" + strings.TrimSpace(strings.ReplaceAll(
				strings.ToLower(conflict.DisplayName), " ", "-"))
			if len(conflict.Slug) > 80 {
				conflict.Slug = conflict.Slug[:80]
			}
			if err := db.Save(&conflict).Error; err != nil {
				// Last resort: soft-clear slug uniqueness by appending id.
				conflict.Slug = coachSlug + "-old-" + strconv.FormatUint(uint64(conflict.ID), 10)
				if err := db.Save(&conflict).Error; err != nil {
					return err
				}
			}
		} else if e != gorm.ErrRecordNotFound {
			return e
		}
		profile.Slug = coachSlug
	}

	profile.UserID = userID
	profile.DisplayName = aliFunnelDisplayName
	profile.Status = models.CoachProfileStatusApproved
	profile.IsPublished = true
	profile.IsActive = true
	if strings.TrimSpace(profile.Title) == "" {
		profile.Title = "مربی بدنسازی و فیتنس"
	}
	if strings.TrimSpace(profile.Bio) == "" {
		profile.Bio = "مربی اختصاصی فانل ۱ فیتینو — برنامه تمرین، تغذیه و پایش هوشمند."
	}
	return db.Save(&profile).Error
}

func ensureAliFunnelPlans(db *gorm.DB, coachUserID uint) error {
	// Card UI shows first 2 lines — both plans must surface support;
	// only the support channel differs (panel/ticket vs direct coach).
	vipFeatures := strings.Join([]string{
		"برنامه تمرین و تغذیه اختصاصی",
		"پشتیبانی از طریق پنل و تیکت",
		"پایش هوش مصنوعی پیشرفت",
		"دسترسی کامل به اپ و پنل کاربری",
	}, "\n")
	cipFeatures := strings.Join([]string{
		"همه امکانات پلن VIP",
		"پشتیبانی اختصاصی مربی علی رشیدآبادی",
		"پایش هوش مصنوعی پیشرفته",
		"جلسات مشاوره حضوری",
		"جلسات ویدیویی اختصاصی",
	}, "\n")

	plans := []struct {
		name        string
		subtitle    string
		courseName  string
		description string
		features    string
		price       int64
		popular     bool
	}{
		{
			name:        aliVIPPlanName,
			subtitle:    "سه ماهه — تمرین + تغذیه + پایش هوشمند",
			courseName:  "دوره VIP علی رشیدآبادی",
			description: "پلن VIP سه‌ماهه فانل ۱ علی رشیدآبادی.",
			features:    vipFeatures,
			price:       1_490_000,
			popular:     true,
		},
		{
			name:        aliCIPPlanName,
			subtitle:    "سه ماهه — پشتیبانی اختصاصی + مشاوره حضوری و ویدیو",
			courseName:  "دوره CIP علی رشیدآبادی",
			description: "پلن CIP سه‌ماهه با پشتیبانی اختصاصی علی، پایش هوش مصنوعی، جلسات حضوری و ویدیویی.",
			features:    cipFeatures,
			price:       2_900_000,
			popular:     false,
		},
	}

	for _, spec := range plans {
		if err := upsertAliPlan(db, coachUserID, spec.name, spec.subtitle, spec.courseName, spec.description, spec.features, spec.price, spec.popular); err != nil {
			return err
		}
	}
	return nil
}

func upsertAliPlan(
	db *gorm.DB,
	coachUserID uint,
	name, subtitle, courseName, description, features string,
	price int64,
	popular bool,
) error {
	var plan models.ServicePlan
	err := db.Where("coach_id = ? AND name = ?", coachUserID, name).First(&plan).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}
	if err == gorm.ErrRecordNotFound {
		// Name is globally unique — reclaim orphaned row with same name if any.
		var orphan models.ServicePlan
		if e := db.Where("name = ?", name).First(&orphan).Error; e == nil {
			plan = orphan
			plan.CoachID = coachUserID
		} else if e != gorm.ErrRecordNotFound {
			return e
		} else {
			plan = models.ServicePlan{
				CoachID: coachUserID,
				Name:    name,
				Type:    "both",
			}
		}
	}

	plan.CoachID = coachUserID
	plan.Name = name
	plan.Subtitle = subtitle
	plan.CourseName = courseName
	plan.Description = description
	plan.FeaturesText = features
	plan.Type = "both"
	plan.PriceCents = price
	plan.DiscountPriceCents = 0
	plan.DiscountPercent = 0
	plan.DurationDays = 90
	plan.IsPopular = popular
	plan.IsActive = true

	if plan.ID == 0 {
		return db.Create(&plan).Error
	}
	return db.Save(&plan).Error
}
