package digits

import "strings"

// ToEnglish converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII 0-9.
func ToEnglish(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		switch {
		case r >= '۰' && r <= '۹':
			b.WriteByte(byte(r - '۰' + '0'))
		case r >= '٠' && r <= '٩':
			b.WriteByte(byte(r - '٠' + '0'))
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}

// NormalizePhone trims, converts digits to English, and strips common separators.
func NormalizePhone(phone string) string {
	p := ToEnglish(strings.TrimSpace(phone))
	p = strings.ReplaceAll(p, " ", "")
	p = strings.ReplaceAll(p, "-", "")
	p = strings.ReplaceAll(p, "(", "")
	p = strings.ReplaceAll(p, ")", "")
	return p
}
