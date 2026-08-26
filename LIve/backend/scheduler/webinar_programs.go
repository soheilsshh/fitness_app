package scheduler

import (
	"log"
	"time"

	"fitino-live-backend/models"
	"fitino-live-backend/streaming"

	"gorm.io/gorm"
)

// HasActiveWebinarPrograms reports whether any WebinarProgram rows exist.
// When true, the legacy single-webinar path (manual/appointment mode —
// startStreamingForToday, updateWebinarSchedule) steps aside and this file
// drives streaming instead. When false (no programs ever created), nothing
// here does anything and the account's original single-webinar behavior is
// completely unaffected.
func HasActiveWebinarPrograms(db *gorm.DB) bool {
	var count int64
	db.Model(&models.WebinarProgram{}).Where("is_active = ?", true).Count(&count)
	return count > 0
}

var lastStreamedProgramID uint

// StartWebinarProgramScheduler runs independently of the legacy scheduler
// loop (StartScheduler in scheduler.go) — it does not share state or call
// into it. Every tick it checks whether a WebinarProgram's [start_at,
// end_at] window currently contains now, and starts/stops/switches the
// stream to match.
func StartWebinarProgramScheduler(db *gorm.DB) {
	checkWebinarPrograms(db) // run once immediately at boot, don't wait a full tick
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			checkWebinarPrograms(db)
		}
	}()
	log.Println("🎬 Webinar program scheduler started (1-minute tick)")
}

func checkWebinarPrograms(db *gorm.DB) {
	if !HasActiveWebinarPrograms(db) {
		return
	}

	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)

	var current models.WebinarProgram
	findErr := db.Where("is_active = ? AND start_at <= ? AND end_at >= ?", true, now, now).
		Order("start_at ASC").First(&current).Error

	isRunning := streaming.IsStreamRunning()

	if findErr != nil {
		// No program's window contains now.
		if isRunning && lastStreamedProgramID != 0 {
			log.Printf("🛑 Webinar program scheduler: no program active now, stopping stream (was program #%d)", lastStreamedProgramID)
			streaming.StopStream("rtmp://localhost:1935/live/stream")
			lastStreamedProgramID = 0
		}
		return
	}

	if isRunning && lastStreamedProgramID == current.ID {
		return // already streaming the right program, nothing to do
	}

	if isRunning && lastStreamedProgramID != current.ID {
		log.Printf("🔄 Webinar program scheduler: switching from program #%d to #%d, restarting stream", lastStreamedProgramID, current.ID)
		streaming.StopStream("rtmp://localhost:1935/live/stream")
		time.Sleep(1 * time.Second)
	}

	videoPath := current.VideoURL
	if videoPath == "" {
		videoPath = "./videos/video1.mp4"
	}

	log.Printf("📹 Webinar program scheduler: starting program #%d (%q), video=%s, window %s - %s",
		current.ID, current.Title, videoPath,
		current.StartAt.Format("2006-01-02 15:04"), current.EndAt.Format("2006-01-02 15:04"))

	streaming.StartFilePublisher(videoPath, "rtmp://localhost:1935/live/stream", current.EndAt, current.StartAt)
	lastStreamedProgramID = current.ID
}
