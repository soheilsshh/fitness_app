package service

import (
	"strings"
	"testing"
)

func TestBuildDailyCheckInContext_empty(t *testing.T) {
	if got := buildDailyCheckInContext(DailyNutritionCheckIn{}); got != "" {
		t.Fatalf("empty check-in should add nothing, got %q", got)
	}
}

func TestBuildDailyCheckInContext_mealCountAndLists(t *testing.T) {
	got := buildDailyCheckInContext(DailyNutritionCheckIn{
		MealCount:      "۴ وعده",
		Protein:        []string{"مرغ", " ", "مرغ"},
		Carbs:          []string{"برنج"},
		Produce:        []string{"فرقی نمی‌کنه"},
		AvailableExtra: []string{"قارچ"},
		Craving:        []string{"غذای ایرانی"},
		CravingCustom:  "قیمه",
		Training:       "تمرین متوسط",
		PrepTime:       "۱۵ تا ۳۰ دقیقه",
		Avoid:          []string{"غذاهای چرب"},
		AvoidExtra:     []string{"بادمجان"},
		Style:          "ساده و سریع",
	})

	wantSnippets := []string{
		"چک‌این روزانه تغذیه",
		"تعداد وعده امروز: ۴ وعده (آرایه meals باید دقیقاً 4 عضو داشته باشد)",
		"پروتئین در دسترس: مرغ",
		"کربوهیدرات در دسترس: برنج",
		"سبزیجات و میوه در دسترس: فرقی نمی‌کنه",
		"مواد غذایی اضافه‌شده: قارچ",
		"هوس امروز: غذای ایرانی",
		"غذای دلخواه: قیمه",
		"تمرین امروز: تمرین متوسط",
		"وقت آماده‌سازی غذا: ۱۵ تا ۳۰ دقیقه",
		"نمی‌خواهد بخورد: غذاهای چرب",
		"غذاهای اضافه‌ای که نمی‌خواهد: بادمجان",
		"سبک برنامه امروز: ساده و سریع",
	}
	for _, snippet := range wantSnippets {
		if !strings.Contains(got, snippet) {
			t.Errorf("missing %q in:\n%s", snippet, got)
		}
	}
	if strings.Count(got, "مرغ") != 1 {
		t.Errorf("duplicate protein entries were not deduped: %s", got)
	}
}

func TestMealCountFromCheckIn(t *testing.T) {
	cases := map[string]int{
		"":             0,
		"فرقی نمی‌کنه": 0,
		"۳ وعده":       3,
		"۴ وعده":       4,
		"۵ وعده":       5,
		"۶":            6,
		"متغیر":        0,
	}
	for in, want := range cases {
		if got := mealCountFromCheckIn(in); got != want {
			t.Errorf("mealCountFromCheckIn(%q)=%d, want %d", in, got, want)
		}
	}
}
