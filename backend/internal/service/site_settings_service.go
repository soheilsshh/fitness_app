package service

import (
	"context"
	"encoding/json"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
	"gorm.io/gorm"
)

// SiteSettingsDTO matches frontend defaultSiteSettings (admin + public GET).
type SiteSettingsDTO struct {
	HeroImage          *HeroImageDTO     `json:"heroImage"`
	ShowCoachesSection bool              `json:"showCoachesSection"`
	FeatureBullets     FeatureBulletsDTO `json:"featureBullets"`
	Stats              []StatItemDTO     `json:"stats"`
	Steps              []StepItemDTO     `json:"steps"`
	Pillars            []PillarItemDTO   `json:"pillars"`
	ContactInfo        ContactInfoDTO    `json:"contactInfo"`
}

type HeroImageDTO struct {
	URL string `json:"url"`
}

type FeatureBulletsDTO struct {
	Title string   `json:"title"`
	Items []string `json:"items"`
}

type StatItemDTO struct {
	ID    string `json:"id"`
	Value string `json:"value"`
	Label string `json:"label"`
}

type StepItemDTO struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Text  string `json:"text"`
}

// PillarItemDTO is one "why فیتینو" value card. Icon is a string key the
// frontend maps to an actual icon component (e.g. "award", "dumbbell").
type PillarItemDTO struct {
	ID    string `json:"id"`
	Icon  string `json:"icon"`
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

type ContactInfoDTO struct {
	Address   string `json:"address"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Instagram string `json:"instagram"`
	Telegram  string `json:"telegram"`
	Whatsapp  string `json:"whatsapp"`
}

var defaultSiteSettingsDTO = SiteSettingsDTO{
	HeroImage:          nil,
	ShowCoachesSection: false,
	FeatureBullets: FeatureBulletsDTO{
		Title: "بخش",
		Items: []string{
			"برنامه شخصی‌سازی‌شده",
			"پشتیبانی و پیگیری",
			"قابل استفاده روی موبایل",
		},
	},
	Stats: []StatItemDTO{
		{ID: "s1", Value: "12,500+", Label: "کاربر فعال"},
		{ID: "s2", Value: "87%", Label: "رضایت از نتیجه"},
	},
	Steps: []StepItemDTO{
		{ID: "c1", Title: "ثبت پیشرفت", Text: "وزن، دور کمر، رکوردهای تمرینی و عکس‌های دوره‌ای رو ثبت کن."},
		{ID: "c2", Title: "تحلیل روند", Text: "روند تغییراتت رو ببین و پلن رو بر اساس شرایطت تنظیم کن."},
		{ID: "c3", Title: "پایداری نتیجه", Text: "با رویکرد مرحله‌ای، نتیجه رو پایدار نگه دار."},
	},
	Pillars: []PillarItemDTO{
		{ID: "p1", Icon: "award", Title: "مربیان متخصص و تاییدشده", Desc: "تیم مربیان حرفه‌ای و دارای مدرک، همراه شخصی شما در تمام مسیر تمرین."},
		{ID: "p2", Icon: "dumbbell", Title: "برنامه تمرین اختصاصی", Desc: "هر حرکت و هر ست متناسب با بدن، سطح و هدف شما طراحی و به‌روزرسانی می‌شود."},
		{ID: "p3", Icon: "apple", Title: "برنامه تغذیه علمی", Desc: "رژیم غذایی دقیق و قابل اجرا، کاملاً هماهنگ با تمرینات و سبک زندگی شما."},
		{ID: "p4", Icon: "trending", Title: "پیگیری پیشرفت", Desc: "نتایج خود را با عدد و آمار دنبال کنید؛ هر هفته یک قدم به هدف نزدیک‌تر."},
		{ID: "p5", Icon: "message", Title: "پشتیبانی همیشگی مربی", Desc: "هر زمان سوال یا چالشی داشتی، مربی‌ات مستقیماً کنارت است."},
		{ID: "p6", Icon: "heartbeat", Title: "تمرین در باشگاه یا خانه", Desc: "برنامه‌ها برای هر امکانات و شرایطی قابل اجرا هستند، هرجا که باشی."},
	},
	ContactInfo: ContactInfoDTO{
		Address:   "تهران، ...",
		Phone:     "09xxxxxxxxx",
		Email:     "support@example.com",
		Instagram: "https://instagram.com/",
		Telegram:  "https://t.me/",
		Whatsapp:  "https://wa.me/989000000000",
	},
}

type SiteSettingsService interface {
	Get(ctx context.Context) (*SiteSettingsDTO, error)
	Update(ctx context.Context, dto *SiteSettingsDTO) error
}

type siteSettingsService struct {
	repo repository.SiteSettingsRepository
}

func NewSiteSettingsService(repo repository.SiteSettingsRepository) SiteSettingsService {
	return &siteSettingsService{repo: repo}
}

func (s *siteSettingsService) Get(ctx context.Context) (*SiteSettingsDTO, error) {
	row, err := s.repo.FindByID(ctx, 1)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return &defaultSiteSettingsDTO, nil
		}
		return nil, err
	}
	return rowToDTO(row)
}

func rowToDTO(row *models.SiteSettings) (*SiteSettingsDTO, error) {
	dto := &SiteSettingsDTO{
		ShowCoachesSection: row.ShowCoachesSection,
	}
	if row.HeroImageURL != "" {
		dto.HeroImage = &HeroImageDTO{URL: row.HeroImageURL}
	}
	if len(row.FeatureBullets) > 0 {
		_ = json.Unmarshal(row.FeatureBullets, &dto.FeatureBullets)
	}
	if len(row.Stats) > 0 {
		_ = json.Unmarshal(row.Stats, &dto.Stats)
	}
	if len(row.Steps) > 0 {
		_ = json.Unmarshal(row.Steps, &dto.Steps)
	}
	if len(row.Pillars) > 0 {
		_ = json.Unmarshal(row.Pillars, &dto.Pillars)
	}
	if len(row.ContactInfo) > 0 {
		_ = json.Unmarshal(row.ContactInfo, &dto.ContactInfo)
	}
	if dto.FeatureBullets.Items == nil {
		dto.FeatureBullets = defaultSiteSettingsDTO.FeatureBullets
	}
	if dto.Stats == nil {
		dto.Stats = defaultSiteSettingsDTO.Stats
	}
	if dto.Steps == nil {
		dto.Steps = defaultSiteSettingsDTO.Steps
	}
	if dto.Pillars == nil {
		dto.Pillars = defaultSiteSettingsDTO.Pillars
	}
	return dto, nil
}

func (s *siteSettingsService) Update(ctx context.Context, dto *SiteSettingsDTO) error {
	row, err := s.repo.FindByID(ctx, 1)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			row = &models.SiteSettings{}
			row.ID = 1
		} else {
			return err
		}
	}
	heroURL := ""
	if dto.HeroImage != nil && dto.HeroImage.URL != "" {
		heroURL = dto.HeroImage.URL
	}
	row.HeroImageURL = heroURL
	row.ShowCoachesSection = dto.ShowCoachesSection
	if row.FeatureBullets, err = json.Marshal(dto.FeatureBullets); err != nil {
		return err
	}
	if row.Stats, err = json.Marshal(dto.Stats); err != nil {
		return err
	}
	if row.Steps, err = json.Marshal(dto.Steps); err != nil {
		return err
	}
	if row.Pillars, err = json.Marshal(dto.Pillars); err != nil {
		return err
	}
	if row.ContactInfo, err = json.Marshal(dto.ContactInfo); err != nil {
		return err
	}
	if row.ID == 0 {
		return s.repo.FirstOrCreate(ctx, row)
	}
	return s.repo.Save(ctx, row)
}
