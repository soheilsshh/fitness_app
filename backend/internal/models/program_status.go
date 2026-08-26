package models

// Program authorship: who produced the content of a WorkoutProgram/NutritionProgram.
const (
	ProgramSourceCoach = "coach"
	ProgramSourceAI    = "ai"
)

// ValidProgramSources returns all supported program source values.
func ValidProgramSources() []string {
	return []string{ProgramSourceCoach, ProgramSourceAI}
}

// IsValidProgramSource reports whether source is a known program source value.
func IsValidProgramSource(source string) bool {
	switch source {
	case ProgramSourceCoach, ProgramSourceAI:
		return true
	default:
		return false
	}
}

// Program lifecycle status, shown to the student as a badge (AI_PROGRAM_REFACTOR_TODO.md فاز ۴).
//   - official:       live/active program, no pending review (current default for both
//     coach-authored and directly-saved AI programs).
//   - coach_approved:  an AI suggestion for an existing program that the coach reviewed
//     and accepted (فاز ۳ — not produced anywhere yet, reserved for that flow).
//   - draft:           an unsaved AI-builder draft (فاز ۴ autosave — not produced anywhere
//     yet, reserved for that flow).
const (
	ProgramStatusOfficial      = "official"
	ProgramStatusCoachApproved = "coach_approved"
	ProgramStatusDraft         = "draft"
)

// ValidProgramStatuses returns all supported program status values.
func ValidProgramStatuses() []string {
	return []string{ProgramStatusOfficial, ProgramStatusCoachApproved, ProgramStatusDraft}
}

// IsValidProgramStatus reports whether status is a known program status value.
func IsValidProgramStatus(status string) bool {
	switch status {
	case ProgramStatusOfficial, ProgramStatusCoachApproved, ProgramStatusDraft:
		return true
	default:
		return false
	}
}
