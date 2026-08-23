package services

import (
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

const telegramRelayURL = "https://ttte.sianacademy.com/relay/send"

var botDebug = os.Getenv("BOT_DEBUG") == "true"

// Global shared HTTP client with optimized connection pooling
// This client is reused for all relay requests to maintain persistent connections
var (
	relayHTTPClient     *http.Client
	relayHTTPClientOnce sync.Once
	relayLatencyStats   = struct {
		sync.RWMutex
		recentLatencies []time.Duration
		maxSamples      int
	}{
		recentLatencies: make([]time.Duration, 0, 100),
		maxSamples:      100,
	}
)

// initRelayClient initializes the global shared HTTP client with connection pooling
func initRelayClient() {
	relayHTTPClientOnce.Do(func() {
		// Create custom transport with connection pooling
		transport := &http.Transport{
			MaxIdleConns:        100,              // Maximum idle connections in pool
			MaxIdleConnsPerHost: 100,              // Maximum idle connections per host
			IdleConnTimeout:     90 * time.Second, // How long idle connections stay in pool
			DisableCompression:  false,            // Enable compression for efficiency
			DisableKeepAlives:   false,            // Enable HTTP/1.1 keep-alive
			ForceAttemptHTTP2:   true,             // Try HTTP/2 if available
			
			// TCP connection settings
			DialContext: (&net.Dialer{
				Timeout:   500 * time.Millisecond, // Fast TCP dial timeout
				KeepAlive: 30 * time.Second,       // TCP keep-alive
			}).DialContext,
			
			// TLS settings
			TLSHandshakeTimeout:   500 * time.Millisecond, // Fast TLS handshake
			ResponseHeaderTimeout: 1 * time.Second,        // Fast header timeout
			ExpectContinueTimeout: 100 * time.Millisecond,
		}

		// Create client with fast timeout and shared transport
		relayHTTPClient = &http.Client{
			Transport: transport,
			Timeout:   1 * time.Second, // Hard timeout - fail fast, retry with new connection
		}

		log.Printf("[TELEGRAM][RELAY][INIT] Global HTTP client initialized with connection pooling (MaxIdleConns=100, Timeout=1s)")
	})
}

// getRelayClient returns the global shared HTTP client (initializes if needed)
func getRelayClient() *http.Client {
	initRelayClient()
	return relayHTTPClient
}

// recordLatency records a latency measurement for monitoring
func recordLatency(latency time.Duration) {
	relayLatencyStats.Lock()
	defer relayLatencyStats.Unlock()

	relayLatencyStats.recentLatencies = append(relayLatencyStats.recentLatencies, latency)
	if len(relayLatencyStats.recentLatencies) > relayLatencyStats.maxSamples {
		// Keep only recent samples
		relayLatencyStats.recentLatencies = relayLatencyStats.recentLatencies[len(relayLatencyStats.recentLatencies)-relayLatencyStats.maxSamples:]
	}

	// Warn if median latency is high
	if len(relayLatencyStats.recentLatencies) >= 10 {
		// Calculate median
		sorted := make([]time.Duration, len(relayLatencyStats.recentLatencies))
		copy(sorted, relayLatencyStats.recentLatencies)
		median := sorted[len(sorted)/2]
		if median > 200*time.Millisecond {
			log.Printf("[TELEGRAM][RELAY][WARN] High median latency detected: %v (samples: %d)", median, len(relayLatencyStats.recentLatencies))
		}
	}
}

// isRetryableError checks if an error is retryable (timeout, network, IO errors)
func isRetryableError(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return strings.Contains(errStr, "timeout") ||
		strings.Contains(errStr, "deadline exceeded") ||
		strings.Contains(errStr, "connection") ||
		strings.Contains(errStr, "network") ||
		strings.Contains(errStr, "EOF") ||
		strings.Contains(errStr, "broken pipe")
}

// SendViaRelay sends a Telegram request via the relay endpoint with retry logic
// Returns status code, response body, and error
func SendViaRelay(chatID string, payload url.Values, method string) (status int, body string, err error) {
	// Validate that we're using the relay endpoint, not direct Telegram API
	if strings.Contains(telegramRelayURL, "api.telegram.org") {
		log.Printf("[TELEGRAM][BLOCKED] direct call prevented")
		return 0, "", fmt.Errorf("direct Telegram API calls are blocked - use relay endpoint")
	}
	// Additional validation: ensure relay URL is correct
	if !strings.Contains(telegramRelayURL, "ttte.sianacademy.com") {
		log.Printf("[TELEGRAM][BLOCKED] invalid relay URL detected")
		return 0, "", fmt.Errorf("invalid relay endpoint configuration")
	}

	// Debug log
	if botDebug {
		log.Printf("[TELEGRAM][RELAY] sending -> chat=%s method=%s payload=%s", chatID, method, payload.Encode())
	} else {
		log.Printf("[TELEGRAM][RELAY] sending -> chat=%s method=%s", chatID, method)
	}

	// Retry with exponential backoff
	maxRetries := 3
	backoffDelays := []time.Duration{0, 50 * time.Millisecond, 150 * time.Millisecond, 300 * time.Millisecond}

	var lastErr error
	var lastStatus int
	var lastBody string

	for attempt := 0; attempt <= maxRetries; attempt++ {
		attemptStart := time.Now()

		// Get shared client (ensures connection pooling)
		client := getRelayClient()

		// Send request to relay
		resp, err := client.PostForm(telegramRelayURL, payload)
		elapsed := time.Since(attemptStart)

		if err != nil {
			lastErr = err
			
			// Check if error is retryable
			if isRetryableError(err) && attempt < maxRetries {
				backoff := backoffDelays[attempt+1]
				log.Printf("[TELEGRAM][RELAY][RETRY] attempt=%d/%d chat=%s method=%s error=%v elapsed=%v backoff=%v", 
					attempt+1, maxRetries+1, chatID, method, err, elapsed, backoff)
				time.Sleep(backoff)
				continue
			}

			// Non-retryable error or max retries reached
			log.Printf("[TELEGRAM][RELAY][ERROR] request failed -> chat=%s method=%s error=%v elapsed=%v attempt=%d", 
				chatID, method, err, elapsed, attempt+1)
			return 0, "", err
		}

		// Success - read response
		defer resp.Body.Close()

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			lastErr = err
			lastStatus = resp.StatusCode
			log.Printf("[TELEGRAM][RELAY] read response failed -> chat=%s method=%s error=%v elapsed=%v", 
				chatID, method, err, elapsed)
			
			// Reading error is usually not retryable (we got response, just failed to read)
			return resp.StatusCode, "", err
		}

		bodyStr := string(bodyBytes)
		
		// Record latency for monitoring
		recordLatency(elapsed)

		// Log success
		if attempt > 0 {
			log.Printf("[TELEGRAM][RELAY][SUCCESS] chat=%s method=%s status=%d elapsed=%v attempt=%d (after retry)", 
				chatID, method, resp.StatusCode, elapsed, attempt+1)
		} else {
			log.Printf("[TELEGRAM][RELAY] response status=%d elapsed=%v", resp.StatusCode, elapsed)
		}

		if botDebug {
			log.Printf("[TELEGRAM][RELAY] response body -> %s", bodyStr)
		}

		// Check for HTTP errors (4xx, 5xx) - don't retry these
		if resp.StatusCode >= 400 {
			log.Printf("[TELEGRAM][RELAY][HTTP_ERROR] chat=%s method=%s status=%d (not retrying)", 
				chatID, method, resp.StatusCode)
			return resp.StatusCode, bodyStr, nil
		}

		return resp.StatusCode, bodyStr, nil
	}

	// All retries exhausted
	log.Printf("[TELEGRAM][RELAY][EXHAUSTED] chat=%s method=%s all retries failed", chatID, method)
	return lastStatus, lastBody, lastErr
}
