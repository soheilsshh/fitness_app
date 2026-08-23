package utils

import "strings"

// ConvertPersianToEnglishDigits converts Persian/Farsi digits to English digits
// This is necessary for SMS services that expect English digits
func ConvertPersianToEnglishDigits(phone string) string {
	if phone == "" {
		return phone
	}

	// Map Persian digits to English digits
	persianToEnglish := map[rune]rune{
		'۰': '0',
		'۱': '1',
		'۲': '2',
		'۳': '3',
		'۴': '4',
		'۵': '5',
		'۶': '6',
		'۷': '7',
		'۸': '8',
		'۹': '9',
	}

	var result strings.Builder
	result.Grow(len(phone))

	for _, char := range phone {
		if englishDigit, exists := persianToEnglish[char]; exists {
			result.WriteRune(englishDigit)
		} else {
			result.WriteRune(char)
		}
	}

	return result.String()
}

// NormalizePhoneNumber normalizes phone number: removes spaces, dashes, and converts Persian to English digits
func NormalizePhoneNumber(phone string) string {
	if phone == "" {
		return phone
	}

	// Convert Persian to English digits
	normalized := ConvertPersianToEnglishDigits(phone)

	// Remove spaces, dashes, parentheses, dots, and other non-digit characters
	normalized = strings.ReplaceAll(normalized, " ", "")
	normalized = strings.ReplaceAll(normalized, "-", "")
	normalized = strings.ReplaceAll(normalized, "(", "")
	normalized = strings.ReplaceAll(normalized, ")", "")
	normalized = strings.ReplaceAll(normalized, ".", "")

	// Handle international format: +98 or 0098 -> 0
	if strings.HasPrefix(normalized, "+98") && len(normalized) > 3 {
		normalized = "0" + normalized[3:]
	} else if strings.HasPrefix(normalized, "0098") && len(normalized) > 4 {
		normalized = "0" + normalized[4:]
	}

	return normalized
}
