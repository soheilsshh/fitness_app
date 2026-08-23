package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
)

// BotAPIClient handles API communication between Telegram bot and backend
type BotAPIClient struct {
	BaseURL       string
	APIKey        string
	HTTPClient    *http.Client
	TelegramUserID int64 // Telegram user ID for user mapping
	AdminUserID   uint   // Admin user ID for content filtering
}

// NewBotAPIClient creates a new bot API client
func NewBotAPIClient(baseURL, apiKey string) *BotAPIClient {
	return &BotAPIClient{
		BaseURL: baseURL,
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 5 * time.Second, // Reduced timeout for faster failure
		},
		TelegramUserID: 0,
		AdminUserID:   0,
	}
}

// SetTelegramUserID sets the Telegram user ID for user mapping
func (c *BotAPIClient) SetTelegramUserID(telegramUserID int64) {
	c.TelegramUserID = telegramUserID
}

// SetAdminUserID sets the Admin user ID for content filtering
func (c *BotAPIClient) SetAdminUserID(adminUserID uint) {
	c.AdminUserID = adminUserID
}

// ContentTask represents a content task from the API
type ContentTask struct {
	ID           uint     `json:"id"`
	Title        string   `json:"title"`
	Description  string   `json:"description,omitempty"`
	Status       string   `json:"status"`
	Priority     string   `json:"priority"`
	Tags         []string `json:"tags,omitempty"`
	CreatorID    uint     `json:"creator_id"`
	DueDate      *string  `json:"due_date,omitempty"`
	InstagramURL *string  `json:"instagram_url,omitempty"`
	TwitterURL   *string  `json:"twitter_url,omitempty"`
	TikTokURL    *string  `json:"tiktok_url,omitempty"`
	YouTubeURL   *string  `json:"youtube_url,omitempty"`
	CreatedAt    string   `json:"created_at"`
	UpdatedAt    string   `json:"updated_at"`
}

// ContentTasksResponse represents API response for content tasks list
type ContentTasksResponse struct {
	Tasks []ContentTask `json:"tasks"`
}

// ContentTaskResponse represents API response for single content task
type ContentTaskResponse struct {
	Task ContentTask `json:"task"`
}

// UpdateContentTaskRequest represents request to update content task
type UpdateContentTaskRequest struct {
	Status       *string `json:"status,omitempty"`
	Priority     *string `json:"priority,omitempty"`
	Title        *string `json:"title,omitempty"`
	Description  *string `json:"description,omitempty"`
	InstagramURL *string `json:"instagram_url,omitempty"`
	TwitterURL   *string `json:"twitter_url,omitempty"`
	TikTokURL    *string `json:"tiktok_url,omitempty"`
	YouTubeURL   *string `json:"youtube_url,omitempty"`
}

// StatsResponse represents content stats from API
type StatsResponse struct {
	TotalTasks      int            `json:"total_tasks"`
	TasksByStatus   map[string]int `json:"tasks_by_status"`
	TasksByPriority map[string]int `json:"tasks_by_priority"`
}

// doRequest performs HTTP request with API key authentication
func (c *BotAPIClient) doRequest(method, endpoint string, body interface{}) (*http.Response, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, c.BaseURL+endpoint, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	
	// Include Telegram user ID for user mapping
	if c.TelegramUserID > 0 {
		req.Header.Set("X-Telegram-User-ID", strconv.FormatInt(c.TelegramUserID, 10))
	}

	// Include Admin User ID for content filtering
	if c.AdminUserID > 0 {
		req.Header.Set("X-Admin-User-ID", strconv.FormatUint(uint64(c.AdminUserID), 10))
	}

	log.Printf("[BotAPIClient] %s %s (TelegramUserID: %d, AdminUserID: %d)", method, endpoint, c.TelegramUserID, c.AdminUserID)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}

	return resp, nil
}

// GetContentTasks fetches content tasks from API
func (c *BotAPIClient) GetContentTasks(status, priority string, page, limit int) (*ContentTasksResponse, error) {
	endpoint := fmt.Sprintf("/api/bot/content-tasks?page=%d&limit=%d", page, limit)
	if status != "" {
		endpoint += fmt.Sprintf("&status=%s", status)
	}
	if priority != "" {
		endpoint += fmt.Sprintf("&priority=%s", priority)
	}

	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("[BotAPIClient] Error response: %s", string(bodyBytes))
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var result ContentTasksResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// GetContentTask fetches a single content task by ID
func (c *BotAPIClient) GetContentTask(taskID uint) (*ContentTask, error) {
	endpoint := fmt.Sprintf("/api/bot/content-tasks/%d", taskID)

	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("[BotAPIClient] Error response: %s", string(bodyBytes))
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var result ContentTaskResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result.Task, nil
}

// UpdateContentTaskStatus updates content task status
func (c *BotAPIClient) UpdateContentTaskStatus(taskID uint, status string) error {
	endpoint := fmt.Sprintf("/api/bot/content-tasks/%d", taskID)
	
	req := UpdateContentTaskRequest{
		Status: &status,
	}

	resp, err := c.doRequest("PUT", endpoint, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("[BotAPIClient] Error response: %s", string(bodyBytes))
		return fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	return nil
}

// UpdateContentTask updates content task
func (c *BotAPIClient) UpdateContentTask(taskID uint, req UpdateContentTaskRequest) error {
	endpoint := fmt.Sprintf("/api/bot/content-tasks/%d", taskID)

	resp, err := c.doRequest("PUT", endpoint, req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("[BotAPIClient] Error response: %s", string(bodyBytes))
		return fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	return nil
}

// CreateContentTask creates a new content task
func (c *BotAPIClient) CreateContentTask(title, description, status string) (*ContentTask, error) {
	endpoint := "/api/bot/content-tasks"

	type CreateRequest struct {
		Title       string `json:"title"`
		Description string `json:"description,omitempty"`
		Status      string `json:"status,omitempty"`
	}

	req := CreateRequest{
		Title:       title,
		Description: description,
		Status:      status,
	}

	resp, err := c.doRequest("POST", endpoint, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("[BotAPIClient] Error response: %s", string(bodyBytes))
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var result ContentTaskResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result.Task, nil
}

// ContentTasksStatsResponse represents content tasks statistics response
type ContentTasksStatsResponse struct {
	TotalCount    int64            `json:"total_count"`
	CountByStatus map[string]int64 `json:"count_by_status"`
}

// GetContentTasksStats fetches content tasks statistics from API
func (c *BotAPIClient) GetContentTasksStats() (*ContentTasksStatsResponse, error) {
	endpoint := "/api/bot/content-tasks/stats"

	resp, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("[BotAPIClient] Error response: %s", string(bodyBytes))
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var result ContentTasksStatsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

