package service

import "strings"

// Personal records were originally weight-only: a set with no external load was
// dropped before it ever reached the database, so calisthenics students (شنا،
// بارفیکس، پلانک، اسکات با وزن بدن) could never set a PR. Every logged set now
// carries a metric kind that says what "better" means for that movement, and
// records are compared only against the same kind for the same exercise.
const (
	// MetricKindWeight — external load. Best = heaviest kilo lifted.
	MetricKindWeight = "weight"
	// MetricKindReps — bodyweight movement. Best = most reps in a single set.
	MetricKindReps = "reps"
	// MetricKindHold — isometric hold. Best = longest hold in seconds.
	MetricKindHold = "hold"
)

// ValidMetricKind reports whether kind is one the API accepts.
func ValidMetricKind(kind string) bool {
	switch kind {
	case MetricKindWeight, MetricKindReps, MetricKindHold:
		return true
	default:
		return false
	}
}

// isometricNameHints are movements measured in seconds rather than reps. Both
// the Persian catalog names and their English twins are listed, because a
// coach-authored program can carry either.
var isometricNameHints = []string{
	"پلانک", "plank",
	"وال سیت", "wall sit",
	"هالو هولد", "hollow hold",
	"ال‌سیت", "ال سیت", "l-sit", "l sit",
	"وی‌سیت", "وی سیت", "v-sit",
	"بالانس روی دست", "handstand",
	"پلانچ", "planche",
	"فرانت لِوِر", "فرانت لور", "front lever",
	"بک لِوِر", "بک لور", "back lever",
	"آویزان مرده", "dead hang",
	"ایزومتریک", "isometric",
	"نگه‌داشتن", "نگه داشتن", "hold",
	"صلیب آهنین", "iron cross",
	"پرچم", "flag",
	"ابوالهول", "sphinx",
}

// bodyweightEquipment are the catalog equipment values that mean "no external
// load", in both catalog languages.
var bodyweightEquipment = map[string]bool{
	"وزن بدن":         true,
	"با وزن بدن":      true,
	"body weight":     true,
	"bodyweight":      true,
	"با کمک دستگاه":   true,
	"assisted":        true,
}

// bodyweightNameHints catch coach-authored entries that are not linked to a
// catalog row, so no equipment field is available.
var bodyweightNameHints = []string{
	"شنا", "push-up", "push up", "pushup",
	"بارفیکس", "pull-up", "pull up", "chin-up", "chin up",
	"دیپ", "dip",
	"دراز و نشست", "sit-up", "sit up", "crunch", "کرانچ",
	"برپی", "burpee",
	"جامپینگ جک", "jumping jack",
	"کوهنورد", "mountain climber",
	"لانژ", "lunge",
	"ماسل‌آپ", "ماسل آپ", "muscle-up", "muscle up",
	"زیربغل وارونه", "inverted row",
	"اینچ‌ورم", "inchworm",
	"سوپرمن", "superman",
	"دد باگ", "dead bug",
	"پل سرینی", "glute bridge",
}

// DetectMetricKind picks the metric for a logged set. `equipment` is the
// catalog value when the set is linked to a catalog exercise (may be empty);
// `hasExternalLoad` says whether the user actually entered a weight, which
// wins over everything (a weighted pull-up is a weight PR).
func DetectMetricKind(exerciseName, equipment string, hasExternalLoad bool) string {
	name := strings.ToLower(strings.TrimSpace(exerciseName))

	if containsAny(name, isometricNameHints) {
		return MetricKindHold
	}
	if hasExternalLoad {
		return MetricKindWeight
	}
	if bodyweightEquipment[strings.ToLower(strings.TrimSpace(equipment))] {
		return MetricKindReps
	}
	if containsAny(name, bodyweightNameHints) {
		return MetricKindReps
	}
	// Unknown movement with no weight entered: treat it as a rep-based effort
	// rather than discarding the set, which is what used to happen.
	return MetricKindReps
}

func containsAny(haystack string, needles []string) bool {
	for _, needle := range needles {
		if needle != "" && strings.Contains(haystack, needle) {
			return true
		}
	}
	return false
}
