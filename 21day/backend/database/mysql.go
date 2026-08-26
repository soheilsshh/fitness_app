package database

import (
	"fmt"
	"log"
	"fitino-challenge-backend/config"
	"fitino-challenge-backend/models"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	cfg := config.Config.DB
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.Name)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	DB = db

	db.AutoMigrate(&models.User{}, &models.Video{}, &models.Progress{}, &models.ScheduledSMS{}, &models.AdminSession{})

	seedFakeVideos()
}

func seedFakeVideos() {
	// 21 Fitino sessions. XP aligned with main Fitino economy:
	// ContentView ≈ 10/day, checkpoints a bit higher, finale like a coach session (25).
	videos := []models.Video{
		{ID: 1, Title: "جلسه ۱ · خوش‌آمد به مسیر فیتینو", Description: "با منطق ۲۱ روزه آشنا شو: هدف، قوانین پیشرفت و نقش XP در لول‌آپ حساب فیتینو.", Duration: "08:30", Code: "DAY01", Points: 10},
		{ID: 2, Title: "جلسه ۲ · ثبت وضعیت شروع", Description: "وزن، اندازه‌ها و عکس‌های پایه را چطور ثبت کنی تا پیشرفت واقعی دیده شود.", Duration: "10:15", Code: "DAY02", Points: 10},
		{ID: 3, Title: "جلسه ۳ · گرم‌کردن ۵ دقیقه‌ای", Description: "یک روتین کوتاه قبل از هر تمرین برای کاهش آسیب و آماده‌سازی مفاصل.", Duration: "09:40", Code: "DAY03", Points: 10},
		{ID: 4, Title: "جلسه ۴ · اسکوات درست", Description: "فرم اسکوات را قدم‌به‌قدم یاد بگیر؛ از نسخه بدون وزنه تا هالتر سبک.", Duration: "14:20", Code: "DAY04", Points: 10},
		{ID: 5, Title: "جلسه ۵ · پرس سینه و پوش", Description: "حرکات هل‌دادنی بالاتنه با تمرکز روی کتف پایدار و دامنه کامل.", Duration: "13:50", Code: "DAY05", Points: 10},
		{ID: 6, Title: "جلسه ۶ · پشت و پول", Description: "پارویی و پول‌آپ کمکی برای ساخت پشت قوی و تعادل با پرس‌ها.", Duration: "13:10", Code: "DAY06", Points: 10},
		{ID: 7, Title: "جلسه ۷ · جمع‌بندی هفته ۱", Description: "چک‌پوینت اول: فرم، ریکاوری و عادت تمرین. امتیاز اضافه برای تکمیل هفته.", Duration: "11:00", Code: "DAY07", Points: 15},
		{ID: 8, Title: "جلسه ۸ · پروتئین در زندگی واقعی", Description: "بدون رژیم سخت؛ چطور پروتئین روزانه را با غذاهای در دسترس پوشش بدهی.", Duration: "12:25", Code: "DAY08", Points: 10},
		{ID: 9, Title: "جلسه ۹ · فول‌بادی خانگی", Description: "یک جلسه کامل بدن فقط با وزن بدن یا دمبل سبک، مناسب آپارتمان.", Duration: "16:40", Code: "DAY09", Points: 10},
		{ID: 10, Title: "جلسه ۱۰ · افزایش بار هوشمند", Description: "قانون اضافه‌بار تدریجی؛ چطور وزن یا تکرار را بدون آسیب بالا ببری.", Duration: "11:35", Code: "DAY10", Points: 10},
		{ID: 11, Title: "جلسه ۱۱ · کاردیو کوتاه و مؤثر", Description: "۱۵ دقیقه کاردیوی متناوب برای چربی‌سوزی بدون خستگی مفرط.", Duration: "10:50", Code: "DAY11", Points: 10},
		{ID: 12, Title: "جلسه ۱۲ · خواب؛ موتور ریکاوری", Description: "چرا بدون خواب خوب عضله نمی‌سازی و چطور روتین خواب بسازی.", Duration: "09:55", Code: "DAY12", Points: 10},
		{ID: 13, Title: "جلسه ۱۳ · اصلاح اشتباهات رایج", Description: "قوز کمر، زانو داخل، آرنج باز؛ رفع خطاهایی که پیشرفت را متوقف می‌کنند.", Duration: "15:20", Code: "DAY13", Points: 10},
		{ID: 14, Title: "جلسه ۱۴ · چک‌پوینت میان‌دوره", Description: "اندازه‌گیری دوباره، مقایسه با روز ۲ و تنظیم هدف نیمه دوم مسیر.", Duration: "12:10", Code: "DAY14", Points: 15},
		{ID: 15, Title: "جلسه ۱۵ · چالش قدرت", Description: "ست‌های چالشی کنترل‌شده برای شکستن فلات و حس پیشرفت واقعی.", Duration: "14:45", Code: "DAY15", Points: 10},
		{ID: 16, Title: "جلسه ۱۶ · تغذیه قبل و بعد تمرین", Description: "چه بخوری تا انرژی جلسه حفظ شود و ریکاوری سریع‌تر شروع شود.", Duration: "10:05", Code: "DAY16", Points: 10},
		{ID: 17, Title: "جلسه ۱۷ · موبیلیتی و انعطاف", Description: "دامنه حرکتی بهتر برای اسکوات عمیق‌تر و شانه‌های سالم‌تر.", Duration: "11:30", Code: "DAY17", Points: 10},
		{ID: 18, Title: "جلسه ۱۸ · روزهای بی‌انگیزگی", Description: "ذهنیت ماندگاری: حداقل قابل قبول، نه کمال‌گرایی؛ ادامه بده حتی کوتاه.", Duration: "09:20", Code: "DAY18", Points: 10},
		{ID: 19, Title: "جلسه ۱۹ · ترکیب قدرت و کاردیو", Description: "یک جریان فشرده قدرت + کاردیو برای روزهای کم‌وقت.", Duration: "17:15", Code: "DAY19", Points: 10},
		{ID: 20, Title: "جلسه ۲۰ · برنامه بعد از ۲۱ روز", Description: "چطور دستاوردت را نگه داری و وارد برنامه بلندمدت فیتینو شوی.", Duration: "11:45", Code: "DAY20", Points: 10},
		{ID: 21, Title: "جلسه ۲۱ · پایان مسیر و لول‌آپ", Description: "جمع‌بندی ۲۱ روز، XP نهایی و قدم بعدی در اکوسیستم فیتینو.", Duration: "13:00", Code: "DAY21", Points: 25},
	}

	for _, v := range videos {
		var existing models.Video
		err := DB.First(&existing, v.ID).Error
		if err != nil {
			if createErr := DB.Create(&v).Error; createErr != nil {
				log.Printf("failed to create video %d: %v", v.ID, createErr)
			}
			continue
		}
		if updErr := DB.Model(&existing).Updates(map[string]interface{}{
			"title":       v.Title,
			"description": v.Description,
			"duration":    v.Duration,
			"code":        v.Code,
			"points":      v.Points,
		}).Error; updErr != nil {
			log.Printf("failed to update video %d: %v", v.ID, updErr)
		}
	}

	if err := DB.Where("id > ?", 21).Delete(&models.Video{}).Error; err != nil {
		log.Printf("failed to prune extra videos: %v", err)
	} else {
		log.Println("Synced 21 Fitino sessions (XP aligned with ContentView / checkpoint scale).")
	}
}

func ScheduleSMS(userID uint, pattern string, sendAt time.Time) {
	DB.Create(&models.ScheduledSMS{
		UserID:    userID,
		Pattern:   pattern,
		SendAt:    sendAt,
		Sent:      false,
		CreatedAt: time.Now(),
	})
}

func GetDueScheduledSMS() []models.ScheduledSMS {
	var jobs []models.ScheduledSMS
	DB.Where("sent = ? AND send_at <= ?", false, time.Now()).Find(&jobs)
	return jobs
}

func MarkSMSSent(id uint) {
	DB.Model(&models.ScheduledSMS{}).Where("id = ?", id).Update("sent", true)
}

func CancelScheduledSMS(userID uint, pattern string) {
	DB.Model(&models.ScheduledSMS{}).Where("user_id = ? AND pattern = ? AND sent = ?", userID, pattern, false).Update("sent", true)
}

func Cancel15HourFollowup(userID uint, stepNumber int) {
	pattern := fmt.Sprintf("followup%d_15h", stepNumber)
	DB.Model(&models.ScheduledSMS{}).Where("user_id = ? AND pattern = ? AND sent = ?", userID, pattern, false).Update("sent", true)
}
