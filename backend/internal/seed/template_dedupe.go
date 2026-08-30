package seed

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"sort"
	"strings"
)

// The crul dump ships the same program several times over: a coach duplicated a
// template, appended " جدید *" to the title, and never filled in the copy's
// metadata — so the copies carry the default (آقا / افزایشی / فوق مبتدی) triple
// regardless of what their own title says (id=277 is titled "خانم حرفه ای" but
// is stored as آقا/فوق مبتدی). Coaches then scroll past the same program three
// times in the picker, and the copies filter into the wrong buckets.
//
// 47 of 1731 templates are byte-identical in content to an earlier one. They
// are dropped at import time, keeping the lowest source id in each group —
// verified to be the correctly-labelled original in all 40 groups.

// workoutTemplateSignature is a content fingerprint: the ordered movements of
// each day with their set prescriptions, ignoring ids, media paths and free
// text. Block nesting is flattened and empty/absent set counts are normalized,
// because the dump represents the same program with `count: null` in one copy
// and `count: ""` in the next.
func workoutTemplateSignature(src crulExerciseTemplate) string {
	days := make([]crulExerciseDay, len(src.Days))
	copy(days, src.Days)
	sort.SliceStable(days, func(i, j int) bool { return days[i].DayNumber < days[j].DayNumber })

	var sb strings.Builder
	for _, day := range days {
		sb.WriteString("|d")
		for _, block := range day.Data {
			for _, move := range block.MovementList {
				fmt.Fprintf(&sb, ";%d", move.ActionID)
				for _, set := range move.Sets {
					fmt.Fprintf(&sb, ",%s=%s",
						strings.TrimSpace(set.Type), strings.TrimSpace(set.Count))
				}
			}
		}
	}
	sum := md5.Sum([]byte(sb.String()))
	return hex.EncodeToString(sum[:])
}

// dedupeWorkoutTemplates returns the templates to import, dropping any whose
// content repeats one already kept. Input order does not matter: templates are
// considered lowest-source-id-first so the original (correctly labelled) copy
// always wins.
func dedupeWorkoutTemplates(templates []crulExerciseTemplate) (kept []crulExerciseTemplate, dropped int) {
	ordered := make([]crulExerciseTemplate, len(templates))
	copy(ordered, templates)
	sort.SliceStable(ordered, func(i, j int) bool { return ordered[i].ID < ordered[j].ID })

	seen := make(map[string]int, len(ordered))
	kept = make([]crulExerciseTemplate, 0, len(ordered))
	for _, src := range ordered {
		// Templates with no training days are rejected separately; signing them
		// would collapse them all into one bogus group.
		if len(src.Days) == 0 {
			kept = append(kept, src)
			continue
		}
		sig := workoutTemplateSignature(src)
		if first, ok := seen[sig]; ok {
			dropped++
			_ = first
			continue
		}
		seen[sig] = src.ID
		kept = append(kept, src)
	}
	return kept, dropped
}
