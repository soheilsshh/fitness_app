package service

import (
	"context"
	"encoding/json"
	"strings"

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
	AcademyItems       []AcademyItemDTO  `json:"academyItems"`
	FAQGroups          []FAQGroupDTO     `json:"faqGroups"`
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

type AcademyItemDTO struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // podcast | video | text
	Title       string `json:"title"`
	Description string `json:"description"`
	Body        string `json:"body,omitempty"` // full text for type=text
	Category    string `json:"category"`
	Featured    bool   `json:"featured"`
	Duration    string `json:"duration,omitempty"`
	Src         string `json:"src,omitempty"`
	Cover       string `json:"cover,omitempty"`
	SortOrder   int    `json:"sortOrder,omitempty"`
}

type FAQItemDTO struct {
	Q string `json:"q"`
	A string `json:"a"`
}

type FAQGroupDTO struct {
	ID    string       `json:"id"`
	Title string       `json:"title"`
	Items []FAQItemDTO `json:"items"`
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
		Address:   "",
		Phone:     "09921906934",
		Email:     "fitinoo.ir@gmail.com",
		Instagram: "https://instagram.com/fiti.noo",
		Telegram:  "https://t.me/fiti_noo",
		Whatsapp:  "https://wa.me/989921906934",
	},
	AcademyItems: []AcademyItemDTO{
		{
			ID:          "p-1",
			Type:        "podcast",
			Title:       "شروع اصولی مسیر تغییر بدن",
			Description: "قدم‌های اول برای شروع درست در فیتینو، خطاهای رایج هفته اول و نحوه ارتباط موثر با مربی.",
			Category:    "شروع مسیر",
			Featured:    true,
			Duration:    "12:40",
			SortOrder:   1,
			Src:         "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
			Cover:       "linear-gradient(145deg, rgba(38,252,227,0.55), rgba(24,114,114,0.85) 55%, rgba(12,58,58,0.95))",
		},
		{
			ID:          "p-2",
			Type:        "podcast",
			Title:       "پایش پیشرفت بدون وسواس",
			Description: "چطور وزن و عکس‌های پایش را درست ثبت کنیم و از داده‌ها برای بهتر شدن استفاده کنیم.",
			Category:    "پایش",
			Featured:    true,
			Duration:    "16:05",
			SortOrder:   2,
			Src:         "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
			Cover:       "linear-gradient(150deg, rgba(108,234,222,0.65), rgba(42,156,150,0.85) 50%, rgba(24,114,114,0.95))",
		},
		{
			ID:          "p-3",
			Type:        "podcast",
			Title:       "اشتباهات رایج ارتباط با مربی",
			Description: "با چند نکته کوتاه، سوالاتت را بهتر مطرح کن تا پاسخ دقیق‌تری بگیری.",
			Category:    "ارتباط با مربی",
			Featured:    false,
			Duration:    "08:30",
			SortOrder:   3,
			Src:         "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
			Cover:       "linear-gradient(150deg, rgba(88,202,192,0.65), rgba(24,114,114,0.85) 52%, rgba(18,66,66,0.95))",
		},
		{
			ID:          "v-1",
			Type:        "video",
			Title:       "آموزش کامل کار با پنل کاربر فیتینو",
			Description: "از تکمیل پروفایل تا ثبت پایش و پیگیری سفارش‌ها. یک مرور سریع و کاربردی از تمام بخش‌ها.",
			Category:    "راهنمای پنل",
			Featured:    true,
			Duration:    "04:33",
			SortOrder:   4,
			Src:         "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
			Cover:       "linear-gradient(160deg, rgba(38,252,227,0.3), rgba(16,24,24,0.15)), linear-gradient(145deg, rgba(24,114,114,0.95), rgba(12,58,58,0.95))",
		},
		{
			ID:          "v-2",
			Type:        "video",
			Title:       "چطور تیکت حرفه‌ای برای مربی ارسال کنیم",
			Description: "ساختار مناسب پیام، چه اطلاعاتی بنویسیم و چطور پاسخ سریع‌تر و دقیق‌تر بگیریم.",
			Category:    "ارتباط با مربی",
			Featured:    true,
			Duration:    "03:20",
			SortOrder:   5,
			Src:         "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
			Cover:       "linear-gradient(155deg, rgba(108,234,222,0.2), rgba(24,114,114,0.2)), linear-gradient(145deg, rgba(32,72,72,0.95), rgba(18,42,42,0.95))",
		},
		{
			ID:          "v-3",
			Type:        "video",
			Title:       "ثبت صحیح وعده‌های غذایی",
			Description: "با یک روش ساده، کالری‌شمار را دقیق‌تر ثبت کن تا مربی تحلیل بهتری داشته باشد.",
			Category:    "تغذیه",
			Featured:    false,
			Duration:    "05:12",
			SortOrder:   6,
			Src:         "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
			Cover:       "linear-gradient(150deg, rgba(108,234,222,0.24), rgba(24,114,114,0.22)), linear-gradient(145deg, rgba(26,82,82,0.95), rgba(14,40,40,0.95))",
		},
		{
			ID:          "a-1",
			Type:        "text",
			Title:       "راهنمای تکمیل پروفایل برای برنامه دقیق‌تر",
			Description: "کدام فیلدها بیشترین اثر را روی کیفیت برنامه دارند و چرا ثبت دقیق اطلاعات مهم است.",
			Body:        "برای برنامه دقیق‌تر، حداقل قد، وزن فعلی، هدف اصلی و سطح فعالیت را تکمیل کنید. سوابق پزشکی و محدودیت‌ها را صادقانه بنویسید تا مربی برنامه امن‌تری بدهد. عکس بدن اختیاری است ولی برای اصلاح فرم بدن بسیار کمک می‌کند.",
			Category:    "پروفایل",
			Featured:    true,
			SortOrder:   7,
			Cover:       "linear-gradient(155deg,#2a9c96,#145e5a)",
		},
		{
			ID:          "a-2",
			Type:        "text",
			Title:       "بهترین روش ثبت وعده غذایی در کالری‌شمار",
			Description: "چند نکته ساده برای اینکه داده‌های تغذیه‌ای شما واقعی و قابل استفاده برای مربی باشند.",
			Body:        "وعده‌ها را همان روز ثبت کنید. اگر دقیق نمی‌دانید، حدود منطقی بزنید و یادداشت کنید «تخمینی». برای وعده‌های پرحجم، وزن یا حجم تقریبی بنویسید. ثبت منظم مهم‌تر از ثبت ۱۰۰٪ دقیق است.",
			Category:    "تغذیه",
			Featured:    true,
			SortOrder:   8,
			Cover:       "linear-gradient(155deg,#58cac0,#187272)",
		},
		{
			ID:          "a-3",
			Type:        "text",
			Title:       "چک‌لیست هفتگی برای حفظ نظم تمرین",
			Description: "یک چارچوب کوتاه برای اینکه از برنامه عقب نمانید و پیوستگی خود را حفظ کنید.",
			Body:        "هر هفته: ۱) جلسات انجام‌شده را در تاریخچه چک کنید. ۲) یک پایش وزن ثبت کنید. ۳) اگر دو جلسه پشت‌سرهم از دست رفت، به مربی تیکت بزنید. ۴) خواب و آب را هم در یادداشت تیکت بنویسید.",
			Category:    "تمرین",
			Featured:    false,
			SortOrder:   9,
			Cover:       "linear-gradient(155deg,#2a9c96,#0e2828)",
		},
	},
	FAQGroups: []FAQGroupDTO{
		{
			ID:    "start",
			Title: "شروع و حساب کاربری",
			Items: []FAQItemDTO{
				{Q: "چطور وارد پنل می‌شوم؟", A: "با شماره موبایل وارد شوید. اگر حساب دارید، با رمز عبور یا کد پیامکی وارد می‌شوید. اگر شماره جدید باشد، بعد از تایید OTP و تعیین رمز، حساب ساخته می‌شود."},
				{Q: "چرا دیگر همه اطلاعات را موقع ثبت‌نام نمی‌خواهید؟", A: "عمداً مسیر را کوتاه کردیم تا زودتر وارد پنل شوید. قد، وزن، سوابق پزشکی و عکس بدن اختیاری‌اند و هر وقت آماده بودید از بخش پروفایل تکمیل می‌کنید."},
				{Q: "رمز عبورم را فراموش کرده‌ام. چه کار کنم؟", A: "از صفحه ورود، مسیر بازیابی با کد پیامکی را بزنید. کد به همان شماره‌ای که با آن ثبت‌نام کرده‌اید ارسال می‌شود."},
			},
		},
		{
			ID:    "programs",
			Title: "برنامه تمرین و تغذیه",
			Items: []FAQItemDTO{
				{Q: "برنامه تمرینی‌ام کجا نمایش داده می‌شود؟", A: "از تب تمرین → برنامه‌های من برنامه فعال و روزهای تمرین را می‌بینید."},
				{Q: "تفاوت برنامه تمرین با کالری‌شمار چیست؟", A: "برنامه تمرین حرکات، ست و تکرار را مشخص می‌کند. کالری‌شمار برای ثبت وعده‌های غذایی روزانه است."},
			},
		},
		{
			ID:    "tracking",
			Title: "پایش، وزن و عکس بدن",
			Items: []FAQItemDTO{
				{Q: "پایش پیشرفت برای چیست؟", A: "بخش پایش روند وزن، اندازه‌ها و وضعیت چک‌این‌ها را نشان می‌دهد تا هم شما و هم مربی ببینید مسیر درست پیش می‌رود یا نه."},
				{Q: "عکس بدن اجباری است؟", A: "خیر. عکس‌ها اختیاری‌اند و می‌توانید بعداً از پروفایل آپلود کنید."},
			},
		},
		{
			ID:    "coach",
			Title: "ارتباط با مربی و پشتیبانی",
			Items: []FAQItemDTO{
				{Q: "چطور با مربی‌ام حرف بزنم؟", A: "از تب حساب من → ارتباط با مربی تیکت بسازید و موضوع را دقیق بنویسید."},
				{Q: "پاسخ تیکت چقدر طول می‌کشد؟", A: "بستگی به مربی دارد. معمولاً در ساعات روز پاسخ داده می‌شود."},
			},
		},
		{
			ID:    "payment",
			Title: "سفارش، پرداخت و اشتراک",
			Items: []FAQItemDTO{
				{Q: "سفارش من کجا پیگیری می‌شود؟", A: "از حساب من → سفارش‌ها وضعیت پرداخت و جزئیات هر سفارش را ببینید."},
				{Q: "پرداخت انجام شد ولی برنامه نیامد. چرا؟", A: "گاهی فعال‌سازی سمت مربی چند ساعت طول می‌کشد. اگر بعد از ۲۴ ساعت هنوز برنامه‌ای نیست، تیکت بزنید."},
			},
		},
		{
			ID:    "privacy",
			Title: "حریم خصوصی و امنیت",
			Items: []FAQItemDTO{
				{Q: "چه داده‌هایی از من نگه داشته می‌شود؟", A: "شماره موبایل، نام، هدف و هر اطلاعاتی که خودتان در پروفایل/پایش وارد کنید، به‌علاوه لاگ تمرین و سفارش‌ها. این داده‌ها برای ارائه خدمت مربی‌گری و بهبود برنامه استفاده می‌شود."},
				{Q: "چطور حسابم را امن نگه دارم؟", A: "رمز قوی بگذارید، آن را با دیگران به اشتراک نگذارید، و روی دستگاه عمومی «خروج» را بزنید. اگر پیامک OTP مشکوک گرفتید و خودتان درخواست نداده بودید، سریع رمز را عوض کنید و به پشتیبانی خبر دهید."},
			},
		},
	},
}

type SiteSettingsService interface {
	Get(ctx context.Context) (*SiteSettingsDTO, error)
	Update(ctx context.Context, dto *SiteSettingsDTO) error
	GetAcademy(ctx context.Context) ([]AcademyItemDTO, error)
	UpdateAcademy(ctx context.Context, items []AcademyItemDTO) error
	GetFAQ(ctx context.Context) ([]FAQGroupDTO, error)
	UpdateFAQ(ctx context.Context, groups []FAQGroupDTO) error
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
	if strings.TrimSpace(dto.ContactInfo.Phone) == "" && strings.TrimSpace(dto.ContactInfo.Email) == "" {
		dto.ContactInfo = defaultSiteSettingsDTO.ContactInfo
	}
	if len(row.AcademyItems) > 0 {
		_ = json.Unmarshal(row.AcademyItems, &dto.AcademyItems)
	}
	if len(row.FAQGroups) > 0 {
		_ = json.Unmarshal(row.FAQGroups, &dto.FAQGroups)
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
	if dto.AcademyItems == nil {
		dto.AcademyItems = defaultSiteSettingsDTO.AcademyItems
	}
	if dto.FAQGroups == nil {
		dto.FAQGroups = defaultSiteSettingsDTO.FAQGroups
	}
	return dto, nil
}

func (s *siteSettingsService) ensureRow(ctx context.Context) (*models.SiteSettings, error) {
	row, err := s.repo.FindByID(ctx, 1)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			row = &models.SiteSettings{}
			row.ID = 1
			if err := s.repo.FirstOrCreate(ctx, row); err != nil {
				return nil, err
			}
			return row, nil
		}
		return nil, err
	}
	return row, nil
}

func (s *siteSettingsService) GetAcademy(ctx context.Context) ([]AcademyItemDTO, error) {
	row, err := s.ensureRow(ctx)
	if err != nil {
		return nil, err
	}
	dto, err := rowToDTO(row)
	if err != nil {
		return nil, err
	}
	if dto.AcademyItems == nil {
		return []AcademyItemDTO{}, nil
	}
	return dto.AcademyItems, nil
}

func (s *siteSettingsService) UpdateAcademy(ctx context.Context, items []AcademyItemDTO) error {
	if items == nil {
		items = []AcademyItemDTO{}
	}
	row, err := s.ensureRow(ctx)
	if err != nil {
		return err
	}
	if row.AcademyItems, err = json.Marshal(items); err != nil {
		return err
	}
	return s.repo.Save(ctx, row)
}

func (s *siteSettingsService) GetFAQ(ctx context.Context) ([]FAQGroupDTO, error) {
	row, err := s.ensureRow(ctx)
	if err != nil {
		return nil, err
	}
	dto, err := rowToDTO(row)
	if err != nil {
		return nil, err
	}
	if dto.FAQGroups == nil {
		return []FAQGroupDTO{}, nil
	}
	return dto.FAQGroups, nil
}

func (s *siteSettingsService) UpdateFAQ(ctx context.Context, groups []FAQGroupDTO) error {
	if groups == nil {
		groups = []FAQGroupDTO{}
	}
	row, err := s.ensureRow(ctx)
	if err != nil {
		return err
	}
	if row.FAQGroups, err = json.Marshal(groups); err != nil {
		return err
	}
	return s.repo.Save(ctx, row)
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
	if row.AcademyItems, err = json.Marshal(dto.AcademyItems); err != nil {
		return err
	}
	if row.FAQGroups, err = json.Marshal(dto.FAQGroups); err != nil {
		return err
	}
	if row.ID == 0 {
		return s.repo.FirstOrCreate(ctx, row)
	}
	return s.repo.Save(ctx, row)
}
