package service

import (
	"bufio"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
)

// testdata/template_movement_titles.txt holds every distinct movement name from
// the ~1700 imported coach templates, after title cleaning. The classifier is
// what routes those movements into personal records, so a name it cannot place
// is a movement whose records silently vanish from the muscle-group filter.
//
// This guards the whole corpus rather than the handful of cases in
// muscle_groups_test.go, which is where the "گوب‌لت اسکوات" style substring bugs
// hide: short hints like "لت " match inside unrelated words.
func loadMovementCorpus(t *testing.T) []string {
	t.Helper()
	path := filepath.Join("testdata", "template_movement_titles.txt")
	fh, err := os.Open(path)
	if err != nil {
		t.Skipf("movement corpus not available: %v", err)
	}
	defer fh.Close()

	var titles []string
	sc := bufio.NewScanner(fh)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for sc.Scan() {
		if line := strings.TrimSpace(sc.Text()); line != "" {
			titles = append(titles, line)
		}
	}
	if err := sc.Err(); err != nil {
		t.Fatalf("read corpus: %v", err)
	}
	if len(titles) < 1000 {
		t.Fatalf("corpus looks truncated: %d titles", len(titles))
	}
	return titles
}

func TestEveryTemplateMovementClassifies(t *testing.T) {
	var unclassified []string
	for _, title := range loadMovementCorpus(t) {
		if ClassifyMuscleGroup(title, "") == "" {
			unclassified = append(unclassified, title)
		}
	}
	if len(unclassified) > 0 {
		sort.Strings(unclassified)
		limit := len(unclassified)
		if limit > 25 {
			limit = 25
		}
		t.Fatalf("%d template movements could not be classified; first %d:\n  %s",
			len(unclassified), limit, strings.Join(unclassified[:limit], "\n  "))
	}
}

// TestMovementCorpusDistributionIsSane catches a hint that has started
// swallowing other groups' movements — the failure mode that made triceps
// collapse to 2 names when the back rule still carried a bare "پشت".
func TestMovementCorpusDistributionIsSane(t *testing.T) {
	counts := map[string]int{}
	for _, title := range loadMovementCorpus(t) {
		counts[ClassifyMuscleGroup(title, "")]++
	}

	// Floors chosen well below the observed counts, so ordinary edits to the
	// vocabulary do not trip this but a swallowed group does.
	floors := map[string]int{
		MuscleGroupChest:      100,
		MuscleGroupBack:       50,
		MuscleGroupShoulders:  120,
		MuscleGroupBiceps:     60,
		MuscleGroupTriceps:    50,
		MuscleGroupQuads:      60,
		MuscleGroupAbs:        60,
		MuscleGroupGlutes:     20,
		MuscleGroupHamstrings: 10,
		MuscleGroupForearms:   10,
		MuscleGroupTraps:      15,
		MuscleGroupCalves:     5,
	}
	for group, floor := range floors {
		if counts[group] < floor {
			t.Errorf("muscle group %q (%s) matched only %d movements, expected at least %d — "+
				"a hint in an earlier rule is probably swallowing them",
				group, MuscleGroupLabel(group), counts[group], floor)
		}
	}

	// No single group may dominate: that means a hint is matching too broadly.
	total := len(loadMovementCorpus(t))
	for group, n := range counts {
		if n*100/total > 35 {
			t.Errorf("muscle group %q matched %d/%d movements (%d%%) — hint too broad",
				group, n, total, n*100/total)
		}
	}
}
