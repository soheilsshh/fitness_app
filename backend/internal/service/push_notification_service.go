package service

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/repository"
)

const fcmLegacyEndpoint = "https://fcm.googleapis.com/fcm/send"

// PushNotificationService sends push notifications via FCM (roadmap BE-8.1).
// Without a configured server key it logs to console instead of failing —
// same "console delivery" fallback SMS uses in dev (see SMSDeliveryMode).
type PushNotificationService interface {
	SendToUser(ctx context.Context, userID uint, title, body string, data map[string]string) error
	IsConfigured() bool
}

type pushNotificationService struct {
	devices repository.MobileDeviceRepository
	client  *http.Client
}

func NewPushNotificationService(devices repository.MobileDeviceRepository) PushNotificationService {
	return &pushNotificationService{devices: devices, client: &http.Client{Timeout: 10 * time.Second}}
}

func (s *pushNotificationService) IsConfigured() bool {
	return strings.TrimSpace(config.Get().FCM.ServerKey) != ""
}

type fcmLegacyRequest struct {
	RegistrationIDs []string          `json:"registration_ids"`
	Notification    fcmNotification   `json:"notification"`
	Data            map[string]string `json:"data,omitempty"`
}

type fcmNotification struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

// SendToUser fans out to every FCM token registered for the user's devices.
// A user with no registered device (or no configured server key) is a no-op,
// not an error — push is best-effort, callers should not fail the caller flow on it.
func (s *pushNotificationService) SendToUser(ctx context.Context, userID uint, title, body string, data map[string]string) error {
	tokens, err := s.devices.PushTokensForUser(ctx, userID)
	if err != nil {
		return err
	}
	if len(tokens) == 0 {
		return nil
	}

	serverKey := strings.TrimSpace(config.Get().FCM.ServerKey)
	if serverKey == "" {
		log.Printf("push (console-only, FCM_SERVER_KEY not set): user=%d title=%q body=%q tokens=%d", userID, title, body, len(tokens))
		return nil
	}

	payload := fcmLegacyRequest{
		RegistrationIDs: tokens,
		Notification:    fcmNotification{Title: title, Body: body},
		Data:            data,
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fcmLegacyEndpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "key="+serverKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		log.Printf("push: FCM request failed user=%d: %v", userID, err)
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		log.Printf("push: FCM responded status=%d user=%d", resp.StatusCode, userID)
	}
	return nil
}
