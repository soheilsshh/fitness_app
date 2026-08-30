package seed

import "testing"

func TestCleanTemplateTitle(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{"latin filler glued to last word", "اکتو مورف حرفه ای 3 جلسه باشگاهzzz", "اکتو مورف حرفه ای 3 جلسه باشگاه"},
		{"latin filler after a space", "مرد نیمه حرفه ای کاهش وزن 4 جلسه منزل AAA", "مرد نیمه حرفه ای کاهش وزن 4 جلسه منزل"},
		{"trailing slashes", "کاهشی3 روزه-خانم فوق حرفه ای 333////", "کاهشی3 روزه-خانم فوق حرفه ای 333"},
		{"trailing plus run", "دو عضله ای - چهار روز - فیتنس - خانم+++", "دو عضله ای - چهار روز - فیتنس - خانم"},
		{"stray bracket", "کاهشی3 روزه]drop set(.-باشگاه", "کاهشی3 روزه drop set(.-باشگاه"},
		{"collapses double spaces", "تمرین  در  منزل", "تمرین در منزل"},
		{"leaves a clean title alone", "برنامه ۴ روزه حجم باشگاه", "برنامه ۴ روزه حجم باشگاه"},
		{"whitespace only", "   ", ""},
		{"three-letter latin word is not filler", "برنامه FST", "برنامه FST"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := cleanTemplateTitle(tc.in); got != tc.want {
				t.Fatalf("cleanTemplateTitle(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
	}
}

func TestIsPlaceholderTemplateTitle(t *testing.T) {
	placeholders := []string{"", "   ", "تست", "TEST", "asdf", "123", "...", "-"}
	for _, in := range placeholders {
		if !isPlaceholderTemplateTitle(cleanTemplateTitle(in)) {
			t.Errorf("expected %q to be treated as a placeholder", in)
		}
	}

	real := []string{"برنامه ۴ روزه حجم باشگاه", "پکیج 5", "خانم اکتو مورف مبتدی باشگاه 3 جلسه"}
	for _, in := range real {
		if isPlaceholderTemplateTitle(cleanTemplateTitle(in)) {
			t.Errorf("expected %q to be kept", in)
		}
	}
}
