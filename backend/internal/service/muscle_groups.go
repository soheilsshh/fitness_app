package service

import "strings"

// Fitino has two independent sources of exercises: the ExerciseDB catalog
// (data/exercises-fa) which carries a `target` muscle, and the ~1700 imported
// coach templates (data/exercise-templates) whose movements are free-text
// Persian names with no muscle field at all. Personal records need one shared
// vocabulary, otherwise a student's "پرس سینه" from a template and the same
// movement from the catalog land in different buckets.
//
// These are the canonical groups. Both sources are mapped onto them.

const (
	MuscleGroupChest      = "chest"
	MuscleGroupBack       = "back"
	MuscleGroupShoulders  = "shoulders"
	MuscleGroupTraps      = "traps"
	MuscleGroupBiceps     = "biceps"
	MuscleGroupTriceps    = "triceps"
	MuscleGroupForearms   = "forearms"
	MuscleGroupAbs        = "abs"
	MuscleGroupQuads      = "quads"
	MuscleGroupHamstrings = "hamstrings"
	MuscleGroupGlutes     = "glutes"
	MuscleGroupAdductors  = "adductors"
	MuscleGroupAbductors  = "abductors"
	MuscleGroupCalves     = "calves"
	MuscleGroupNeck       = "neck"
	MuscleGroupCardio     = "cardio"
	MuscleGroupFullbody   = "fullbody"
	MuscleGroupWarmup     = "warmup"
)

// MuscleGroupInfo is one row of the standard taxonomy, in the order it should
// be offered in a muscle-group picker (push, pull, arms, core, legs, other).
type MuscleGroupInfo struct {
	Code string `json:"code"`
	// Label is the Persian name shown to students.
	Label string `json:"label"`
	// Region groups the muscle for a split-style picker.
	Region string `json:"region"`
	// Recordable is false for entries that are never a personal record —
	// warm-ups, stretches, and steady-state cardio.
	Recordable bool `json:"recordable"`
}

// MuscleGroupCatalog is the display-ordered standard taxonomy.
var MuscleGroupCatalog = []MuscleGroupInfo{
	{MuscleGroupChest, "سینه", "بالاتنه", true},
	{MuscleGroupBack, "زیربغل و پشت", "بالاتنه", true},
	{MuscleGroupShoulders, "سرشانه", "بالاتنه", true},
	{MuscleGroupTraps, "کول", "بالاتنه", true},
	{MuscleGroupBiceps, "جلو بازو", "بازو", true},
	{MuscleGroupTriceps, "پشت بازو", "بازو", true},
	{MuscleGroupForearms, "ساعد", "بازو", true},
	{MuscleGroupAbs, "شکم و مرکز بدن", "مرکز بدن", true},
	{MuscleGroupQuads, "چهارسر ران", "پایین‌تنه", true},
	{MuscleGroupHamstrings, "همسترینگ", "پایین‌تنه", true},
	{MuscleGroupGlutes, "سرینی", "پایین‌تنه", true},
	{MuscleGroupAdductors, "داخل ران", "پایین‌تنه", true},
	{MuscleGroupAbductors, "بیرون ران", "پایین‌تنه", true},
	{MuscleGroupCalves, "ساق پا", "پایین‌تنه", true},
	{MuscleGroupNeck, "گردن", "بالاتنه", true},
	{MuscleGroupFullbody, "تمام بدن", "ترکیبی", true},
	{MuscleGroupCardio, "هوازی", "ترکیبی", false},
	{MuscleGroupWarmup, "گرم کردن و کشش", "ترکیبی", false},
}

var muscleGroupByCode = func() map[string]MuscleGroupInfo {
	m := make(map[string]MuscleGroupInfo, len(MuscleGroupCatalog))
	for _, g := range MuscleGroupCatalog {
		m[g.Code] = g
	}
	return m
}()

// MuscleGroupLabel returns the Persian label for a group code.
func MuscleGroupLabel(code string) string {
	if g, ok := muscleGroupByCode[code]; ok {
		return g.Label
	}
	return ""
}

// IsRecordableMuscleGroup reports whether records make sense for this group.
// Warm-ups, stretches and steady-state cardio are logged but never ranked.
func IsRecordableMuscleGroup(code string) bool {
	g, ok := muscleGroupByCode[code]
	return ok && g.Recordable
}

// catalogTargetToGroup maps the localized ExerciseDB `target` values onto the
// canonical groups. Anything not listed falls through to name matching.
var catalogTargetToGroup = map[string]string{
	"سینه":                MuscleGroupChest,
	"زیربغل":              MuscleGroupBack,
	"بالای پشت":           MuscleGroupBack,
	"ستون فقرات":          MuscleGroupBack,
	"پشتی بزرگ":           MuscleGroupBack,
	"سرشانه":              MuscleGroupShoulders,
	"دلتوئید":             MuscleGroupShoulders,
	"روتاتور کاف":         MuscleGroupShoulders,
	"کول":                 MuscleGroupTraps,
	"بالابرنده کتف":       MuscleGroupTraps,
	"رومبوئید":            MuscleGroupTraps,
	"جلو بازو":            MuscleGroupBiceps,
	"پشت بازو":            MuscleGroupTriceps,
	"ساعد":                MuscleGroupForearms,
	"مچ دست":              MuscleGroupForearms,
	"بازکننده‌های مچ دست":  MuscleGroupForearms,
	"خم‌کننده‌های مچ دست":   MuscleGroupForearms,
	"شکم":                 MuscleGroupAbs,
	"مایل شکم":            MuscleGroupAbs,
	"دندانه‌ای قدامی":      MuscleGroupAbs,
	"مرکز بدن":            MuscleGroupAbs,
	"کمر":                 MuscleGroupBack,
	"چهارسر ران":          MuscleGroupQuads,
	"راست رانی":           MuscleGroupQuads,
	"خم‌کننده‌های ران":      MuscleGroupQuads,
	"همسترینگ":            MuscleGroupHamstrings,
	"سرینی":               MuscleGroupGlutes,
	"پیریفورمیس":          MuscleGroupGlutes,
	"دورکننده‌های ران":     MuscleGroupAbductors,
	"دورکننده ران":        MuscleGroupAbductors,
	"نزدیک‌کننده‌های ران":   MuscleGroupAdductors,
	"نزدیک‌کننده ران":      MuscleGroupAdductors,
	"ساق پا":              MuscleGroupCalves,
	"نعلی":                MuscleGroupCalves,
	"مچ پا":               MuscleGroupCalves,
	"تثبیت‌کننده‌های مچ پا": MuscleGroupCalves,
	"پرونئال":             MuscleGroupCalves,
	"تیبیالیس":            MuscleGroupCalves,
	"گردن":                MuscleGroupNeck,
	"دستگاه قلبی-عروقی":   MuscleGroupCardio,
	"دست":                 MuscleGroupForearms,
	"سینه‌ای بزرگ":         MuscleGroupChest,
}

type muscleGroupRule struct {
	group string
	hints []string
}

// muscleGroupRules classify a free-text Persian movement name. Order matters:
// Persian movement names share prefixes across very different muscles —
// "پشت بازو" (triceps) and "پشت پا" (hamstrings) both begin with the word the
// back rule would otherwise claim — so specific two-word phrases are tested
// before any generic one, and no rule carries a bare "پشت".
//
// Validated against all 87,602 movement instances in the coach template dump:
// every one is classified.
var muscleGroupRules = []muscleGroupRule{
	// Non-strength entries first: they are never a personal record.
	{group: MuscleGroupWarmup, hints: []string{"گرم کردن", "سرد کردن", "کشش", "گربه گاو", "فوم رول", "ریکاوری", "تنفس", " شمع", "حرکات کششی"}},
	{group: MuscleGroupCardio, hints: []string{"تردمیل", "دوچرخه", "جاگینگ", " طناب", "الپتیکال", "پله عمودی", "دویدن", "روئینگ", "کراس تردمیل", " اسکی", "پارویی", "ایروبیک", "هوازی"}},

	// A combined movement spans two muscles, so it gets no single-muscle record.
	{group: MuscleGroupFullbody, hints: []string{"ترکیب", "من میکر", "ترکیبی"}},

	{group: MuscleGroupNeck, hints: []string{" گردن"}},
	{group: MuscleGroupTraps, hints: []string{"شراگز", "شراگ", " کول"}},

	// Two-word muscle phrases, before the generic back/leg rules.
	{group: MuscleGroupTriceps, hints: []string{"پشت بازو", "پشت‌بازو", "سه سر", "دیپ پشت بازو", "دیپ بازو", "دیپ پارالل نشسته پشت", "هیزم شکن"}},
	{group: MuscleGroupHamstrings, hints: []string{"پشت پا", "ددلیفت رومانیایی", "سلام ژاپنی", "استیف", "همسترینگ", "لیفت تک پا", "لیفت سومو", "دو سر ران"}},
	{group: MuscleGroupBiceps, hints: []string{"جلو بازو", "جلوبازو", "لاری", "دوسر بازو", "دو سر بازو"}},

	// Planks name the forearm they rest on, so they precede the forearm rule.
	{group: MuscleGroupAbs, hints: []string{"پلانک", "چرخشی t روی ساعد", "کماندو"}},
	// "مچ برعکس"/"مچ عکس" is a grip modifier, not a forearm movement — matching
	// a bare "مچ" here would steal rows from back, chest and shoulders.
	{group: MuscleGroupForearms, hints: []string{"ساعد", "مچ سیم کش", "مچ سیمکش", "مچ به داخل", "مچ به بیرون"}},

	{group: MuscleGroupShoulders, hints: []string{"پرس سرشانه", "سرشانه", " نشر", "فلای معکوس", "فلای بک", "فیس پول", "مسگری", "آرنولدی", "دلتوئید", "چرخش شانه", "اپرایت", "دان کراس", "داون کراس", "خیاطه", "چرخش 360"}},
	{group: MuscleGroupChest, hints: []string{"پرس سینه", "پرس بالا سینه", "پرس بالاسینه", "پرس زیر سینه", "پرس زیرسینه", " قفسه", "باترفلای", "باتر فلای", "فلای سینه", "کراس اور", "کراس‌اور", "شنا سوئدی", " شنا ", " شنای", " سینه", "زیرسینه", "بالاسینه", "فلای چکشی", "پول آور", "پول اور", "پولاور", "پلاور", " سوند", "فلای با کش", "فلای سیم کش", "فلای سیمکش", "دیپ پارالل"}},
	{group: MuscleGroupBack, hints: []string{"زیر بغل", "زیربغل", " لت ", " لت‌", "بارفیکس", "قایقی", "ددلیفت", "فیله کمر", "سوپرمن", "رول اوت", "هالتر خم", "تی بار", "کشش پشت", "رنگادرو", "پشت بدن", " لت از"}},

	{group: MuscleGroupGlutes, hints: []string{"پل باسن", "هیپ تراست", "هیپ فلای", "بوت کیکر", "کیک ساید", "کیک از", "کیک بک", " باسن", " سرینی", " لگن", "دانکی", "کراس پا"}},
	{group: MuscleGroupAdductors, hints: []string{"داخل پا", "نزدیک کننده", "پای قورباغه"}},
	{group: MuscleGroupAbductors, hints: []string{"بیرون پا", "دور کننده", "ابداکشن"}},
	{group: MuscleGroupCalves, hints: []string{"ساق پا", " ساق ", "پنجه پا", "کف پا", "جمع کردن حوله", "مچ پا"}},
	{group: MuscleGroupQuads, hints: []string{"جلو پا", "اسکوات", "اسکات", " هکس", "پرس پا", "لانگز", " لانچ", " لاگز", "استپ آپ", "پله", "گوبلت", "زانو بلند", "زانوبلند", "چهار سر", "چهارسر", " سیسی", "ایزو لانگز", " باکس", " هاگ"}},

	{group: MuscleGroupAbs, hints: []string{"کرانچ", "دراز نشست", "دراز و نشست", "زیر شکم", "زیرشکم", "پلانک", " شکم", " پهلو", "وکیوم", "برف پاک کن", "وود چاپ", " قیچی", "خلبانی", "روسی", "مرکز بدن", "v قورباغه", "اسپایدرمن", "سگ پرنده", "گهواره", "چوب چرخشی", "چرخشی t", "پل معکوس"}},

	// Whatever is left that is clearly conditioning rather than one muscle.
	{group: MuscleGroupFullbody, hints: []string{"بورپی", "برپی", "بیرپی", "جامپینگ جک", "کوهنورد", "اسکیتر", " هوپ", " جهش", " پرش", "کماندو", "استارت", "واکی جک", "پانچ", "سوئیچ کیک", "حفظ تعادل", "تعادلی تک پا", "سوئینگ"}},

	// English fallbacks, for AI-generated programs that answer in English.
	{group: MuscleGroupChest, hints: []string{"bench press", "chest", "push-up", "push up", "fly", "dip", "pec"}},
	{group: MuscleGroupBack, hints: []string{"row", "pull-up", "pull up", "chin-up", "lat ", "deadlift", "back extension"}},
	{group: MuscleGroupShoulders, hints: []string{"shoulder press", "lateral raise", "front raise", "overhead press", "delt", "shoulder"}},
	{group: MuscleGroupBiceps, hints: []string{"biceps", "bicep", "curl"}},
	{group: MuscleGroupTriceps, hints: []string{"triceps", "tricep", "pushdown", "skull"}},
	{group: MuscleGroupQuads, hints: []string{"squat", "lunge", "leg press", "leg extension", "step-up", "quad"}},
	{group: MuscleGroupHamstrings, hints: []string{"leg curl", "hamstring", "romanian", "good morning"}},
	{group: MuscleGroupGlutes, hints: []string{"glute", "hip thrust", "kickback"}},
	{group: MuscleGroupCalves, hints: []string{"calf"}},
	{group: MuscleGroupAbs, hints: []string{"plank", "crunch", "sit-up", "sit up", "abs", "core", "oblique", "hollow"}},
	{group: MuscleGroupCardio, hints: []string{"treadmill", "run", "jog", "cycling", "bike", "rowing", "elliptical", "cardio"}},
	{group: MuscleGroupFullbody, hints: []string{"burpee", "jumping jack", "mountain climber", "thruster", "clean", "snatch"}},
	{group: MuscleGroupWarmup, hints: []string{"warm-up", "warm up", "cool down", "stretch", "mobility"}},
}

// ClassifyMuscleGroup resolves an exercise to one canonical muscle group.
// catalogTarget is the localized `target` when the exercise is linked to the
// catalog (may be empty); exerciseName is always used as the fallback, which is
// what makes coach templates and AI-generated home programs classifiable.
// Returns "" when nothing matches.
func ClassifyMuscleGroup(exerciseName, catalogTarget string) string {
	if group, ok := catalogTargetToGroup[strings.TrimSpace(catalogTarget)]; ok {
		return group
	}

	name := " " + strings.ToLower(strings.Join(strings.Fields(exerciseName), " ")) + " "
	if strings.TrimSpace(name) == "" {
		return ""
	}
	for _, rule := range muscleGroupRules {
		for _, hint := range rule.hints {
			if strings.Contains(name, hint) {
				return rule.group
			}
		}
	}
	return ""
}
