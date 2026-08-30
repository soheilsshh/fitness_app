package service

import (
	"strings"
	"testing"
)

func TestBuildWeeklyCheckInContext_empty(t *testing.T) {
	if got := buildWeeklyCheckInContext(WeeklyNutritionCheckIn{}); got != "" {
		t.Fatalf("empty weekly check-in should add nothing, got %q", got)
	}
}

func TestBuildWeeklyCheckInContext_rules(t *testing.T) {
	got := buildWeeklyCheckInContext(WeeklyNutritionCheckIn{
		WeeklyGoal:           "عضله‌سازی",
		MealCount:            "۴",
		TrainingDays:         []string{"شنبه", "دوشنبه", "شنبه"},
		TrainingIntensity:    "متوسط",
		LikedFoods:           []string{"ایرانی"},
		FavoriteFood:         "قیمه",
		Avoid:                []string{"غذاهای چرب"},
		AvoidExtra:           []string{"بادمجان"},
		Available:            []string{"پروتئین", "حبوبات"},
		AvailableExtra:       []string{"عدس"},
		Budget:               "اقتصادی",
		EatingPlace:          "محل کار",
		PrepTime:             "۱۵–۳۰ دقیقه",
		RepeatPreference:     "کمی تکرار",
		SpecialCircumstances: "پنجشنبه مهمونی دارم",
		Style:                "تمرکز روی پروتئین",
	})

	wantSnippets := []string{
		"چک‌این هفتگی تغذیه",
		"وعدهٔ تک‌تک روزها را از کاربر نپرسیده‌ایم",
		"هدف این هفته (نیت کاربر): عضله‌سازی",
		"تعداد وعده در روز: ۴ (هر روز آرایه meals باید دقیقاً 4 عضو داشته باشد)",
		"روزهای تمرین: شنبه، دوشنبه",
		"شدت تمرین هفته: متوسط",
		"سبک غذاهای مورد علاقه: ایرانی",
		"غذای موردعلاقه: قیمه",
		"نمی‌خواهد بخورد: غذاهای چرب",
		"غذاهای اضافه‌ای که نمی‌خواهد: بادمجان",
		"مواد غذایی معمولاً در دسترس: پروتئین، حبوبات",
		"مواد غذایی اضافه‌شده: عدس",
		"بودجه خرید: اقتصادی",
		"محل غذا خوردن: محل کار",
		"وقت آشپزی: ۱۵–۳۰ دقیقه",
		"ترجیح تکرار غذا در هفته: کمی تکرار",
		"شرایط خاص این هفته: پنجشنبه مهمونی دارم",
		"سبک برنامه هفتگی: تمرکز روی پروتئین",
	}
	for _, snippet := range wantSnippets {
		if !strings.Contains(got, snippet) {
			t.Errorf("missing %q in:\n%s", snippet, got)
		}
	}
	if !strings.Contains(got, "روزهای تمرین: شنبه، دوشنبه") {
		t.Errorf("training days not formatted as expected:\n%s", got)
	}
	if strings.Contains(got, "شنبه، دوشنبه، شنبه") {
		t.Errorf("duplicate training days were not deduped: %s", got)
	}
}

func TestBuildWeeklyCheckInContext_variableMeals(t *testing.T) {
	got := buildWeeklyCheckInContext(WeeklyNutritionCheckIn{
		MealCount: "متغیر",
	})
	if !strings.Contains(got, "تعداد وعده در روز: متغیر") {
		t.Fatalf("missing variable meal count line in:\n%s", got)
	}
	if !strings.Contains(got, "بین ۳ تا ۶") {
		t.Fatalf("missing variable meal instruction in:\n%s", got)
	}
	if strings.Contains(got, "دقیقاً") {
		t.Fatalf("variable meals should not force exact count:\n%s", got)
	}
}
