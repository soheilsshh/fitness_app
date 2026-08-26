package services

import (
	"encoding/json"
	"log"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// TelegramQueue handles queuing and delivery of Telegram messages
type TelegramQueue struct {
	queue       chan *QueueJob
	workers     int
	wg          sync.WaitGroup
	stopChan    chan struct{}
	deadLetterFile *os.File
	deadLetterMu  sync.Mutex
}

// QueueJob represents a job in the queue
type QueueJob struct {
	ID        string
	ChatID    string
	Payload   url.Values
	Method    string
	Attempts  int
	MaxRetries int
	CreatedAt time.Time
}

const (
	maxRetries     = 3
	workerCount    = 3
	deadLetterPath = "logs/telegram_deadletter.log"
)

var (
	globalQueue *TelegramQueue
	queueOnce   sync.Once
)

// InitTelegramQueue initializes the global Telegram queue
func InitTelegramQueue() *TelegramQueue {
	queueOnce.Do(func() {
		// Ensure logs directory exists
		os.MkdirAll("logs", 0755)
		
		deadLetterFile, err := os.OpenFile(deadLetterPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			log.Printf("[TELEGRAM][QUEUE] Failed to open dead-letter log: %v", err)
		}

		globalQueue = &TelegramQueue{
			queue:         make(chan *QueueJob, 1000),
			workers:       workerCount,
			stopChan:      make(chan struct{}),
			deadLetterFile: deadLetterFile,
		}

		// Start workers
		for i := 0; i < workerCount; i++ {
			globalQueue.wg.Add(1)
			go globalQueue.worker(i)
		}

		log.Printf("[TELEGRAM][QUEUE] Initialized with %d workers", workerCount)
	})

	return globalQueue
}

// Stop stops all workers gracefully
func (q *TelegramQueue) Stop() {
	close(q.stopChan)
	q.wg.Wait()
	if q.deadLetterFile != nil {
		q.deadLetterFile.Close()
	}
	log.Printf("[TELEGRAM][QUEUE] Stopped")
}

// Push adds a job to the queue
func (q *TelegramQueue) Push(chatID string, payload url.Values, method string) {
	job := &QueueJob{
		ID:         uuid.New().String(),
		ChatID:     chatID,
		Payload:    payload,
		Method:     method,
		Attempts:   0,
		MaxRetries: maxRetries,
		CreatedAt:  time.Now(),
	}

	select {
	case q.queue <- job:
		log.Printf("[TELEGRAM][QUEUE] queued message id=%s method=%s", job.ID, method)
	default:
		log.Printf("[TELEGRAM][QUEUE] queue full, dropping message id=%s", job.ID)
	}
}

// worker processes jobs from the queue
func (q *TelegramQueue) worker(id int) {
	defer q.wg.Done()

	for {
		select {
		case <-q.stopChan:
			return
		case job := <-q.queue:
			q.processJob(job, id)
		}
	}
}

// processJob processes a single job with retry logic
func (q *TelegramQueue) processJob(job *QueueJob, workerID int) {
	job.Attempts++

	// Calculate backoff delay based on attempt number
	// Attempt 1: no delay, Attempt 2: 1s, Attempt 3: 3s
	var delay time.Duration
	switch job.Attempts {
	case 1:
		delay = 0
	case 2:
		delay = 1 * time.Second
	case 3:
		delay = 3 * time.Second
	default:
		delay = 10 * time.Second // Should not reach here (max 3 attempts)
	}

	if delay > 0 {
		log.Printf("[TELEGRAM][QUEUE] retry attempt=%d delay=%v message id=%s", job.Attempts, delay, job.ID)
		time.Sleep(delay)
	}

	// Send via relay
	status, body, err := SendViaRelay(job.ChatID, job.Payload, job.Method)

	// Handle rate limiting (429)
	if status == 429 {
		retryAfter := q.extractRetryAfter(body)
		if retryAfter > 0 {
			log.Printf("[TELEGRAM][QUEUE] rate limited, retry_after=%ds message id=%s", retryAfter, job.ID)
			
			// Re-queue with delay
			go func() {
				time.Sleep(time.Duration(retryAfter) * time.Second)
				job.Attempts-- // Don't count rate limit as an attempt
				select {
				case q.queue <- job:
				default:
					log.Printf("[TELEGRAM][QUEUE] queue full on re-queue, message id=%s", job.ID)
				}
			}()
			return
		}
	}

	// Handle errors and retries
	if err != nil || status >= 400 {
		if job.Attempts < job.MaxRetries {
			// Re-queue for retry (maxRetries=3 means attempts 1, 2, 3 allowed)
			select {
			case q.queue <- job:
				// Will retry on next attempt
			default:
				log.Printf("[TELEGRAM][QUEUE] queue full on retry, moving to dead-letter message id=%s", job.ID)
				q.writeDeadLetter(job, err, status, body)
			}
			return
		}

		// Max retries exceeded, move to dead-letter
		log.Printf("[TELEGRAM][DEAD-LETTER] stored message id=%s attempts=%d", job.ID, job.Attempts)
		q.writeDeadLetter(job, err, status, body)
		return
	}

	// Success
	log.Printf("[TELEGRAM][QUEUE] delivered message id=%s", job.ID)
}

// extractRetryAfter extracts retry_after from response body
func (q *TelegramQueue) extractRetryAfter(body string) int {
	// Try to parse JSON response
	var resp struct {
		RetryAfter int `json:"retry_after"`
	}
	if err := json.Unmarshal([]byte(body), &resp); err == nil && resp.RetryAfter > 0 {
		return resp.RetryAfter
	}

	// Fallback: try to extract from error description
	if strings.Contains(body, "retry_after") {
		// Simple extraction - could be improved
		return 60 // Default 60 seconds if we can't parse
	}

	return 0
}

// writeDeadLetter writes a failed job to the dead-letter log
func (q *TelegramQueue) writeDeadLetter(job *QueueJob, err error, status int, body string) {
	q.deadLetterMu.Lock()
	defer q.deadLetterMu.Unlock()

	if q.deadLetterFile == nil {
		return
	}

	entry := map[string]interface{}{
		"id":         job.ID,
		"chat_id":    job.ChatID,
		"method":     job.Method,
		"attempts":   job.Attempts,
		"created_at": job.CreatedAt.Format(time.RFC3339),
		"failed_at":  time.Now().Format(time.RFC3339),
		"status":     status,
		"error":      "",
		"body":       body,
		"payload":    job.Payload.Encode(),
	}

	if err != nil {
		entry["error"] = err.Error()
	}

	jsonData, jsonErr := json.Marshal(entry)
	if jsonErr != nil {
		log.Printf("[TELEGRAM][QUEUE] Failed to marshal dead-letter entry: %v", jsonErr)
		return
	}

	_, writeErr := q.deadLetterFile.WriteString(string(jsonData) + "\n")
	if writeErr != nil {
		log.Printf("[TELEGRAM][QUEUE] Failed to write dead-letter: %v", writeErr)
	} else {
		q.deadLetterFile.Sync() // Flush to disk
	}
}

// GetTelegramQueue returns the global queue instance
func GetTelegramQueue() *TelegramQueue {
	if globalQueue == nil {
		return InitTelegramQueue()
	}
	return globalQueue
}

