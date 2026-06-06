package slug

import (
	"fmt"
	"regexp"
	"strings"
)

var invalidChars = regexp.MustCompile(`[^a-z0-9-]+`)

// Normalize converts input to a URL-safe slug (latin lowercase + hyphens).
func Normalize(input string) string {
	s := strings.ToLower(strings.TrimSpace(input))
	s = strings.ReplaceAll(s, "_", "-")
	s = strings.ReplaceAll(s, " ", "-")
	s = invalidChars.ReplaceAllString(s, "")
	s = strings.Trim(s, "-")
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	return s
}

// Fallback generates a deterministic slug when user input is empty or invalid.
func Fallback(userID uint) string {
	return fmt.Sprintf("coach-%d", userID)
}
