package seed

import (
	"regexp"
	"strings"
	"unicode"
)

// The crul template dump carries the vendor's own QA leftovers: titles ending
// in filler runs typed to force a re-sort ("...3 جلسه باشگاهzzz", "منزل AAA",
// "جدیدااا 333////"), placeholder rows literally titled "تست", and templates
// with no training days at all. They reach coaches verbatim in the template
// picker, so both the titles and the junk rows are cleaned at import time
// rather than by hand-editing the ~95MB source file.

var (
	// Trailing punctuation noise ("////", "....", "+++", "---", "___").
	trailingPunctRe = regexp.MustCompile(`[\s.\-_+/\\*=~^#]+$`)
	// Leading punctuation noise.
	leadingPunctRe = regexp.MustCompile(`^[\s.\-_+/\\*=~^#]+`)
	// Runs of repeated whitespace, including the Persian ZWNJ-adjacent spaces.
	multiSpaceRe = regexp.MustCompile(`[ \t\x{00A0}]{2,}`)
	// Unbalanced bracket left over from truncated vendor titles.
	strayBracketRe = regexp.MustCompile(`[\[\]{}]`)
)

// placeholderTitles are rows the vendor created while testing; they carry no
// usable program and must never be offered to a coach.
var placeholderTitles = map[string]bool{
	"تست":     true,
	"test":    true,
	"تست تست": true,
	"نمونه":   true,
	"asdf":    true,
	"aaa":     true,
	"123":     true,
	"...":     true,
	"-":       true,
}

// trimTrailingFiller removes a trailing run of one repeated latin letter
// ("zzz", "AAA", "vvv") that the vendor typed as a sort key, whether it is
// glued to the last word or stands alone. RE2 has no backreferences, so the
// repetition is checked by hand.
func trimTrailingFiller(title string) string {
	runes := []rune(title)
	end := len(runes)
	for end > 0 && (runes[end-1] == ' ' || runes[end-1] == '\t') {
		end--
	}
	if end == 0 {
		return ""
	}
	last := unicode.ToLower(runes[end-1])
	if last < 'a' || last > 'z' {
		return title
	}
	start := end
	for start > 0 && unicode.ToLower(runes[start-1]) == last {
		start--
	}
	if end-start < 3 {
		return title
	}
	return strings.TrimRight(string(runes[:start]), " \t")
}

// cleanTemplateTitle strips the vendor's QA filler from a template title.
// It returns the cleaned title, which may be empty if nothing meaningful is
// left — callers treat that as "skip this template".
func cleanTemplateTitle(raw string) string {
	title := strings.TrimSpace(raw)
	if title == "" {
		return ""
	}

	title = strayBracketRe.ReplaceAllString(title, " ")
	// Filler and punctuation can be layered ("جدیدااا 333////"), so peel
	// repeatedly until the title stops shrinking.
	for {
		before := title
		title = trimTrailingFiller(title)
		title = trailingPunctRe.ReplaceAllString(title, "")
		title = leadingPunctRe.ReplaceAllString(title, "")
		title = strings.TrimSpace(title)
		if title == before {
			break
		}
	}
	title = multiSpaceRe.ReplaceAllString(title, " ")
	return strings.TrimSpace(title)
}

// isPlaceholderTemplateTitle reports whether a cleaned title is one of the
// vendor's throwaway rows rather than a real program name.
func isPlaceholderTemplateTitle(cleaned string) bool {
	normalized := strings.ToLower(strings.TrimSpace(cleaned))
	if normalized == "" {
		return true
	}
	if placeholderTitles[normalized] {
		return true
	}
	// A title of only digits/punctuation carries no meaning either.
	return !strings.ContainsFunc(normalized, func(r rune) bool {
		return (r >= 'a' && r <= 'z') || (r >= 0x0600 && r <= 0x06FF)
	})
}

// Movement names inside the templates carry the same kind of coach shorthand as
// the template titles: a trailing "*", "**", "+" or "++" the coach used to mark
// their own edits, doubled spaces, and a handful of typos. All of it is shown
// to students verbatim in the program view.
var movementTypoFixes = map[string]string{
	"لاگز پرشی با لمس سرپنجه پا":              "لانگز پرشی با لمس سرپنجه پا",
	"نشر خم آرنج 90 رجه تک دست با دمبل نشسته": "نشر خم آرنج 90 درجه تک دست با دمبل نشسته",
	"نشر از جلو دمبل تناوبی معکوس نسشته":      "نشر از جلو دمبل تناوبی معکوس نشسته",
	"بیرون پا ایستاه با زانوی خم با دمبل":     "بیرون پا ایستاده با زانوی خم با دمبل",
}

// cleanMovementTitle strips the coach's edit markers and normalizes spacing.
func cleanMovementTitle(raw string) string {
	title := strings.TrimSpace(raw)
	if title == "" {
		return ""
	}
	// Trailing "*"/"+" runs only — a leading or inner one could be meaningful.
	title = strings.TrimRight(title, " \t*+")
	title = multiSpaceRe.ReplaceAllString(title, " ")
	title = strings.TrimSpace(title)
	if fixed, ok := movementTypoFixes[title]; ok {
		return fixed
	}
	return title
}
