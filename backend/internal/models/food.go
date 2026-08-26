package models

import "gorm.io/gorm"

// Food is a catalog entry. Historically one row per serving unit (e.g. "بستنی سنتی"
// has separate rows for اسکوپ/فنجان/گرم) — that shape is preserved for backward
// compatibility with existing DailyFoodLog/NutritionItem FoodID references.
//
// IsCanonical marks the single گرم(=100) row per unique Name that carries the
// per-100g nutrition baseline, the extended nutrient fields, and the
// ServingUnits picker (spoon/gram/cup). Non-canonical sibling rows are untouched.
type Food struct {
	gorm.Model
	ExternalID       string  `gorm:"column:external_id;size:64;uniqueIndex;not null"`
	SourceExternalID *string `gorm:"column:source_external_id;size:64;index"`
	Name             string  `gorm:"size:255;not null;index"`
	Category         string  `gorm:"size:100;index"`
	Unit             string  `gorm:"size:100;not null"`
	Amount           float64 `gorm:"not null"`

	IsCanonical bool `gorm:"column:is_canonical;index"`

	Calories float64
	Fat      float64
	Protein  float64
	Carbs    float64
	Fiber    *float64
	Sugar    *float64

	// Extended nutrition panel, per 100g. Nullable: null means "not yet enriched",
	// never a guessed value.
	Sodium       *float64 // mg
	Cholesterol  *float64 // mg
	Calcium      *float64 // mg
	Iron         *float64 // mg
	Magnesium    *float64 // mg
	Potassium    *float64 // mg
	Phosphorus   *float64 // mg
	TransFat     *float64 // g
	SaturatedFat *float64 // g
	Water        *float64 // g
	Omega3       *float64 // g
	Omega6       *float64 // g
	Zinc         *float64 // mg
	VitaminC     *float64 // mg
	GlycemicLoad *float64

	// Per-gram energy and the workbook's activity-specific minutes needed to
	// burn the energy in one gram. Nullable means the source could not derive
	// the value without guessing a serving weight.
	KcalPerGram              *float64 `gorm:"column:kcal_per_g"`
	BurnRun10KphMinPerGram   *float64 `gorm:"column:burn_run_10kph_min_per_g"`
	BurnWalk7KphMinPerGram   *float64 `gorm:"column:burn_walk_7kph_min_per_g"`
	BurnCycle15KphMinPerGram *float64 `gorm:"column:burn_cycle_15kph_min_per_g"`
	BurnSwimCrawlMinPerGram  *float64 `gorm:"column:burn_swim_crawl_min_per_g"`
	BurnHikeMinPerGram       *float64 `gorm:"column:burn_hike_min_per_g"`
	BurnAerobicsMinPerGram   *float64 `gorm:"column:burn_aerobics_min_per_g"`

	// Provenance for the extended fields above — lets the UI/audit trail show
	// where a number came from instead of presenting it as ground truth.
	NutrientSource     string   `gorm:"column:nutrient_source;size:32"`
	NutrientSourceRef  string   `gorm:"column:nutrient_source_ref;size:255"`
	NutrientMatchScore *float64 `gorm:"column:nutrient_match_score"`

	// DataQualityStatus is verified, corrected, or needs_review. Rows needing
	// review remain stored for traceability but are excluded from food pickers.
	DataQualityStatus string `gorm:"column:data_quality_status;size:16;not null;default:verified;index"`
	DataQualityFlags  string `gorm:"column:data_quality_flags;type:text"`

	ServingUnits []FoodServingUnit `gorm:"foreignKey:FoodID"`
}

// FoodServingUnit is a named way to enter an amount of a food — "قاشق غذاخوری",
// "لیوان", "گرم" — each with its own gram weight so the UI can offer a
// spoon/gram/cup picker per food. FoodID always points at a canonical Food row.
type FoodServingUnit struct {
	gorm.Model
	FoodID       uint    `gorm:"column:food_id;not null;index"`
	Label        string  `gorm:"size:100;not null"`
	GramsPerUnit float64 `gorm:"column:grams_per_unit;not null"`
	IsDefault    bool    `gorm:"column:is_default"`
	SourceNote   string  `gorm:"column:source_note;size:255"`
}
