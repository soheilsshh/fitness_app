package config

import (
	"log"

	"gorm.io/gorm"
)

// CreatePerformanceIndexes creates composite indexes for frequently queried column combinations
// This significantly improves query performance, especially for stats and online viewers
func CreatePerformanceIndexes(db *gorm.DB) error {
	// OPTIMIZED: Only log once at startup
	log.Println("Creating performance indexes for better query speed...")

	// Index for webinar_activities: online viewers query
	// Frequently used: WHERE view_start_time IS NOT NULL AND view_end_time IS NULL AND last_updated > ?
	if !db.Migrator().HasIndex(&struct {
		ViewStartTime *string
		ViewEndTime   *string
		LastUpdated   string
	}{}, "idx_online_viewers") {
		// Skip individual index creation logs in production
		// log.Println("Creating index for online viewers query...")
		if err := db.Exec(`
			CREATE INDEX idx_online_viewers 
			ON webinar_activities (view_start_time, view_end_time, last_updated)
		`).Error; err != nil {
			// Index might already exist, skip error log
		}
	}

	// Index for webinar_activities: date range queries with activity type
	// Frequently used: WHERE activity_type = ? AND clicked_at >= ? AND clicked_at <= ?
	var indexExists2 int
	db.Raw(`
		SELECT COUNT(*) 
		FROM information_schema.statistics 
		WHERE table_schema = DATABASE() 
		AND table_name = 'webinar_activities' 
		AND index_name = 'idx_activity_date'
	`).Scan(&indexExists2)

	if indexExists2 == 0 {
		if err := db.Exec(`
			CREATE INDEX idx_activity_date 
			ON webinar_activities (activity_type, clicked_at)
		`).Error; err != nil {
			// Index might already exist, skip error log
		}
	}

	// Index for webinar_activities: view time range queries
	// Frequently used: WHERE view_start_time >= ? AND view_start_time <= ?
	var indexExists3 int
	db.Raw(`
		SELECT COUNT(*) 
		FROM information_schema.statistics 
		WHERE table_schema = DATABASE() 
		AND table_name = 'webinar_activities' 
		AND index_name = 'idx_view_time_range'
	`).Scan(&indexExists3)

	if indexExists3 == 0 {
		if err := db.Exec(`
			CREATE INDEX idx_view_time_range 
			ON webinar_activities (view_start_time)
		`).Error; err != nil {
			// Index might already exist, skip error log
		}
	}

	// Index for users: promoter + date range queries
	// Frequently used: WHERE promoter_id = ? AND registered_at >= ? AND registered_at <= ?
	var indexExists4 int
	db.Raw(`
		SELECT COUNT(*) 
		FROM information_schema.statistics 
		WHERE table_schema = DATABASE() 
		AND table_name = 'users' 
		AND index_name = 'idx_promoter_registered'
	`).Scan(&indexExists4)

	if indexExists4 == 0 {
		if err := db.Exec(`
			CREATE INDEX idx_promoter_registered 
			ON users (promoter_id, registered_at)
		`).Error; err != nil {
			// Index might already exist, skip error log
		}
	}

	// Index for webinar_activities: phone + activity type (for promoter filtering)
	// Frequently used: WHERE phone IN (?) AND activity_type = ?
	var indexExists5 int
	db.Raw(`
		SELECT COUNT(*) 
		FROM information_schema.statistics 
		WHERE table_schema = DATABASE() 
		AND table_name = 'webinar_activities' 
		AND index_name = 'idx_phone_activity'
	`).Scan(&indexExists5)

	if indexExists5 == 0 {
		if err := db.Exec(`
			CREATE INDEX idx_phone_activity 
			ON webinar_activities (phone, activity_type)
		`).Error; err != nil {
			// Index might already exist, skip error log
		}
	}

	log.Println("Performance indexes creation completed")
	return nil
}
