package services

import (
	"log"
	"net/url"
	"sync"
	"time"
)

// TelegramMonitor monitors relay latency
type TelegramMonitor struct {
	stopChan  chan struct{}
	wg        sync.WaitGroup
	running   bool
	mu        sync.Mutex
}

var (
	globalMonitor *TelegramMonitor
	monitorOnce   sync.Once
)

// InitTelegramMonitor initializes the latency monitor
func InitTelegramMonitor() *TelegramMonitor {
	monitorOnce.Do(func() {
		globalMonitor = &TelegramMonitor{
			stopChan: make(chan struct{}),
			running:  false,
		}
	})

	return globalMonitor
}

// Start starts the monitoring loop
func (m *TelegramMonitor) Start() {
	m.mu.Lock()
	if m.running {
		m.mu.Unlock()
		return
	}
	m.running = true
	m.mu.Unlock()

	m.wg.Add(1)
	go m.monitorLoop()

	log.Printf("[TELEGRAM][MONITOR] Started")
}

// Stop stops the monitoring loop
func (m *TelegramMonitor) Stop() {
	m.mu.Lock()
	if !m.running {
		m.mu.Unlock()
		return
	}
	m.running = false
	m.mu.Unlock()

	close(m.stopChan)
	m.wg.Wait()
	log.Printf("[TELEGRAM][MONITOR] Stopped")
}

// monitorLoop sends periodic ping requests and measures latency
func (m *TelegramMonitor) monitorLoop() {
	defer m.wg.Done()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Send initial ping
	m.sendPing()

	for {
		select {
		case <-m.stopChan:
			return
		case <-ticker.C:
			m.sendPing()
		}
	}
}

// sendPing sends a small noop ping via relay and measures latency
func (m *TelegramMonitor) sendPing() {
	start := time.Now()

	// Create minimal payload for ping (using a dummy chat_id)
	// Note: This will fail but we just measure the round-trip time
	payload := url.Values{}
	payload.Set("chat_id", "0") // Invalid chat_id, but we just measure latency
	payload.Set("text", "ping")

	// Measure round-trip time
	status, _, err := SendViaRelay("0", payload, "MonitorPing")
	latency := time.Since(start)
	latencyMs := latency.Milliseconds()

	if err != nil {
		log.Printf("[TELEGRAM][MONITOR] ping failed latency=%dms error=%v", latencyMs, err)
		return
	}

	if latencyMs > 2000 {
		log.Printf("[TELEGRAM][MONITOR][WARN] relay slow=%dms status=%d", latencyMs, status)
	} else {
		log.Printf("[TELEGRAM][MONITOR] relay latency=%dms", latencyMs)
	}
}

// GetTelegramMonitor returns the global monitor instance
func GetTelegramMonitor() *TelegramMonitor {
	if globalMonitor == nil {
		return InitTelegramMonitor()
	}
	return globalMonitor
}

