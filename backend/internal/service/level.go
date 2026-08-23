package service

import "math"

// Level formula (points-economy roadmap): XP needed to go from level n to
// n+1 is 100*n. So the cumulative XP required to REACH level L is
// sum_{n=1}^{L-1} 100*n = 50*L*(L-1). Level 1 starts at 0 XP.
//
// LevelForXP is a pure function (no DB) so it's trivially unit-testable and
// safe to call from both the award path and read paths without duplicating
// the formula.
func LevelForXP(totalXP int) int {
	if totalXP <= 0 {
		return 1
	}
	// Invert 50*L*(L-1) <= XP for L: L <= (1 + sqrt(1 + XP/12.5)) / 2.
	approx := (1 + math.Sqrt(1+float64(totalXP)/12.5)) / 2
	level := int(math.Floor(approx))
	if level < 1 {
		level = 1
	}
	// Floating-point rounding guard: nudge to the exact boundary.
	for cumulativeXPForLevel(level+1) <= totalXP {
		level++
	}
	for level > 1 && cumulativeXPForLevel(level) > totalXP {
		level--
	}
	return level
}

func cumulativeXPForLevel(level int) int {
	if level <= 1 {
		return 0
	}
	return 50 * level * (level - 1)
}

// XPForNextLevel returns how much more XP is needed to reach level+1 from
// the current total, for progress-bar UI.
func XPForNextLevel(totalXP int) (currentLevel int, xpIntoLevel int, xpNeededForNext int) {
	currentLevel = LevelForXP(totalXP)
	floor := cumulativeXPForLevel(currentLevel)
	ceil := cumulativeXPForLevel(currentLevel + 1)
	return currentLevel, totalXP - floor, ceil - floor
}

// LevelTitle maps a level to the Persian tier name from the points-economy spec.
func LevelTitle(level int) string {
	switch {
	case level <= 3:
		return "تازه‌وارد"
	case level <= 7:
		return "در حال ساخت"
	case level <= 12:
		return "منظم"
	case level <= 20:
		return "متعهد"
	case level <= 35:
		return "حرفه‌ای"
	default:
		return "اسطوره فیتینو"
	}
}
