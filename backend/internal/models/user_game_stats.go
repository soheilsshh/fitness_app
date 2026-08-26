package models

import "gorm.io/gorm"

// UserGameStats is a denormalized, 1:1-with-User rollup of the gamification
// layers so "my level/XP" reads don't need to SUM the whole XPLedgerEntry
// table on every request. Reputation is never stored — it's always derived
// as TotalXP + TotalMedalPoints*3 (medals are worth 3x their raw points).
type UserGameStats struct {
	gorm.Model
	UserID           uint `gorm:"uniqueIndex;not null"`
	TotalXP          int  `gorm:"not null;default:0"`
	TotalMedalPoints int  `gorm:"not null;default:0"`
	Level            int  `gorm:"not null;default:1"`
}
