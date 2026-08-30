package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
)

// Weight PRs already earn the repeatable "رکورد جدید" medal. Calisthenics
// students had nothing to chase, because a rep count or a hold never counted as
// a record at all. On top of the now-working rep/hold PRs, the tiered medals
// below give bodyweight training its own progression ladder: each family has
// bronze/silver/gold thresholds, awarded once each, in the same points economy
// as the rest of the system.

// bodyweightFamily groups the many catalog names for one movement so a student
// who logs "شنا دست جمع" still progresses the push-up ladder.
type bodyweightFamily struct {
	// key is the family's code prefix, e.g. "pushup" -> "bw_pushup_25".
	key string
	// metric is the kind of record that advances this family.
	metric string
	// hints are substrings matched case-insensitively against the exercise name.
	hints []string
	// tiers are the thresholds, ascending, with the medal points for each.
	tiers []bodyweightTier
}

type bodyweightTier struct {
	threshold int // reps, or seconds for hold families
	points    int
	title     string
	desc      string
}

var bodyweightFamilies = []bodyweightFamily{
	{
		key:    "pushup",
		metric: MetricKindReps,
		hints:  []string{"شنا", "push-up", "push up", "pushup"},
		tiers: []bodyweightTier{
			{25, 30, "شنا برنزی", "۲۵ تکرار شنا در یک ست."},
			{50, 70, "شنا نقره‌ای", "۵۰ تکرار شنا در یک ست."},
			{100, 150, "شنا طلایی", "۱۰۰ تکرار شنا در یک ست."},
		},
	},
	{
		key:    "pullup",
		metric: MetricKindReps,
		hints:  []string{"بارفیکس", "pull-up", "pull up", "chin-up", "chin up"},
		tiers: []bodyweightTier{
			{5, 40, "بارفیکس برنزی", "۵ تکرار بارفیکس در یک ست."},
			{10, 90, "بارفیکس نقره‌ای", "۱۰ تکرار بارفیکس در یک ست."},
			{20, 200, "بارفیکس طلایی", "۲۰ تکرار بارفیکس در یک ست."},
		},
	},
	{
		key:    "dip",
		metric: MetricKindReps,
		hints:  []string{"دیپ", "dip"},
		tiers: []bodyweightTier{
			{10, 35, "دیپ برنزی", "۱۰ تکرار دیپ در یک ست."},
			{25, 80, "دیپ نقره‌ای", "۲۵ تکرار دیپ در یک ست."},
			{50, 170, "دیپ طلایی", "۵۰ تکرار دیپ در یک ست."},
		},
	},
	{
		key:    "squat",
		metric: MetricKindReps,
		hints:  []string{"اسکات", "squat"},
		tiers: []bodyweightTier{
			{50, 30, "اسکات برنزی", "۵۰ تکرار اسکات با وزن بدن در یک ست."},
			{100, 70, "اسکات نقره‌ای", "۱۰۰ تکرار اسکات با وزن بدن در یک ست."},
			{200, 150, "اسکات طلایی", "۲۰۰ تکرار اسکات با وزن بدن در یک ست."},
		},
	},
	{
		key:    "core",
		metric: MetricKindReps,
		hints:  []string{"دراز و نشست", "کرانچ", "sit-up", "sit up", "crunch"},
		tiers: []bodyweightTier{
			{50, 25, "شکم برنزی", "۵۰ تکرار حرکت شکم در یک ست."},
			{100, 60, "شکم نقره‌ای", "۱۰۰ تکرار حرکت شکم در یک ست."},
			{200, 130, "شکم طلایی", "۲۰۰ تکرار حرکت شکم در یک ست."},
		},
	},
	{
		key:    "plank",
		metric: MetricKindHold,
		hints:  []string{"پلانک", "plank"},
		tiers: []bodyweightTier{
			{60, 25, "پلانک برنزی", "۱ دقیقه پلانک بدون توقف."},
			{180, 70, "پلانک نقره‌ای", "۳ دقیقه پلانک بدون توقف."},
			{300, 150, "پلانک طلایی", "۵ دقیقه پلانک بدون توقف."},
		},
	},
	{
		key:    "hold",
		metric: MetricKindHold,
		hints:  []string{"وال سیت", "wall sit", "هالو هولد", "hollow hold", "ال سیت", "ال‌سیت", "l-sit", "آویزان مرده", "dead hang"},
		tiers: []bodyweightTier{
			{30, 25, "ایزومتریک برنزی", "۳۰ ثانیه نگه‌داشتن حرکت ایزومتریک."},
			{60, 60, "ایزومتریک نقره‌ای", "۱ دقیقه نگه‌داشتن حرکت ایزومتریک."},
			{120, 130, "ایزومتریک طلایی", "۲ دقیقه نگه‌داشتن حرکت ایزومتریک."},
		},
	},
}

// BodyweightMilestoneCode builds the achievement-rule code for one tier.
func BodyweightMilestoneCode(familyKey string, threshold int) string {
	return fmt.Sprintf("bw_%s_%d", familyKey, threshold)
}

// bodyweightMilestoneRules materializes every tier as an AchievementRule so the
// seeder and the awarding path share one definition.
func bodyweightMilestoneRules() []models.AchievementRule {
	rules := make([]models.AchievementRule, 0, len(bodyweightFamilies)*3)
	for _, family := range bodyweightFamilies {
		for _, tier := range family.tiers {
			rules = append(rules, models.AchievementRule{
				Code:        BodyweightMilestoneCode(family.key, tier.threshold),
				Title:       tier.title,
				Description: tier.desc,
				Points:      tier.points,
				Repeatable:  false,
			})
		}
	}
	return rules
}

// matchBodyweightFamilies returns the families an exercise name belongs to.
// A name can match more than one ("اسکات پرش" is both squat-family and, if the
// coach named it so, nothing else) — every match is checked independently.
func matchBodyweightFamilies(exerciseName, metricKind string) []bodyweightFamily {
	name := strings.ToLower(strings.TrimSpace(exerciseName))
	matched := make([]bodyweightFamily, 0, 2)
	for _, family := range bodyweightFamilies {
		if family.metric != metricKind {
			continue
		}
		if containsAny(name, family.hints) {
			matched = append(matched, family)
		}
	}
	return matched
}

// bodyweightMilestonesFor returns the medal codes a set qualifies for.
func bodyweightMilestonesFor(exerciseName, metricKind string, value int) []string {
	if value <= 0 {
		return nil
	}
	codes := make([]string, 0, 3)
	for _, family := range matchBodyweightFamilies(exerciseName, metricKind) {
		for _, tier := range family.tiers {
			if value >= tier.threshold {
				codes = append(codes, BodyweightMilestoneCode(family.key, tier.threshold))
			}
		}
	}
	return codes
}

// awardBodyweightMilestones grants every tier the set reaches. Rules are
// non-repeatable, so re-reaching a tier the student already holds is a no-op.
func (s *achievementService) HandleBodyweightSet(ctx context.Context, userID uint, exerciseName, metricKind string, value int) {
	for _, code := range bodyweightMilestonesFor(exerciseName, metricKind, value) {
		s.award(ctx, userID, code, exerciseName)
	}
}
