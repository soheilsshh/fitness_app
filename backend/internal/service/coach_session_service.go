package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

// reviewOverdueAfter matches the roadmap's "every 2-3 days" check-in cadence (G3/BE-9.3).
const reviewOverdueAfter = 3 * 24 * time.Hour

var (
	ErrSessionNotFound     = errors.New("coach session not found")
	ErrSessionTypeInvalid  = errors.New("session type must be in_person or online")
	ErrSessionTimeRequired = errors.New("scheduledAt is required")
	ErrFeedbackRequired    = errors.New("feedback text is required")
)

type CoachSessionDTO struct {
	ID              uint   `json:"id"`
	CoachID         uint   `json:"coachId"`
	StudentID       uint   `json:"studentId"`
	Type            string `json:"type"`
	Status          string `json:"status"`
	ScheduledAt     string `json:"scheduledAt"`
	DurationMinutes int    `json:"durationMinutes"`
	Notes           string `json:"notes,omitempty"`
}

type SessionListResponse struct {
	Items    []CoachSessionDTO `json:"items"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
}

type SessionUpsertRequest struct {
	Type            string `json:"type"`
	ScheduledAt     string `json:"scheduledAt"` // RFC3339
	DurationMinutes int    `json:"durationMinutes"`
	Notes           string `json:"notes"`
	Status          string `json:"status"`
}

type ReviewStatusDTO struct {
	LastReviewedAt  *string `json:"lastReviewedAt"`
	DaysSinceReview *int    `json:"daysSinceReview"`
	Overdue         bool    `json:"overdue"`
}

// CoachSessionService implements the human-coach workflow (roadmap G1-G3):
// scheduled sessions, the periodic-review overdue flag, and text feedback to
// the student (wired through Notification, type message_from_coach).
type CoachSessionService interface {
	Schedule(ctx context.Context, coachID, studentID uint, req *SessionUpsertRequest) (*CoachSessionDTO, error)
	Update(ctx context.Context, coachID, sessionID uint, req *SessionUpsertRequest) (*CoachSessionDTO, error)
	Cancel(ctx context.Context, coachID, sessionID uint) error
	ListForCoach(ctx context.Context, coachID uint, page, pageSize int) (*SessionListResponse, error)
	ListForStudent(ctx context.Context, studentID uint, page, pageSize int) (*SessionListResponse, error)

	ReviewStatus(ctx context.Context, coachID, studentID uint) (*ReviewStatusDTO, error)
	SendFeedback(ctx context.Context, coachID, studentID uint, feedback string) error
}

type coachSessionService struct {
	sessions        repository.CoachSessionRepository
	notifications   repository.NotificationRepository
	coachStudentSvc CoachStudentService
}

func NewCoachSessionService(
	sessions repository.CoachSessionRepository,
	notifications repository.NotificationRepository,
	coachStudentSvc CoachStudentService,
) CoachSessionService {
	return &coachSessionService{sessions: sessions, notifications: notifications, coachStudentSvc: coachStudentSvc}
}

func (s *coachSessionService) Schedule(ctx context.Context, coachID, studentID uint, req *SessionUpsertRequest) (*CoachSessionDTO, error) {
	if err := s.assertOwnsStudent(ctx, coachID, studentID); err != nil {
		return nil, err
	}
	sessionType := strings.ToLower(strings.TrimSpace(req.Type))
	if sessionType != models.CoachSessionTypeInPerson && sessionType != models.CoachSessionTypeOnline {
		return nil, ErrSessionTypeInvalid
	}
	when, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		return nil, ErrSessionTimeRequired
	}
	duration := req.DurationMinutes
	if duration <= 0 {
		duration = 30
	}
	session := &models.CoachSession{
		CoachID: coachID, StudentID: studentID, Type: sessionType,
		Status: models.CoachSessionStatusScheduled, ScheduledAt: when,
		DurationMinutes: duration, Notes: strings.TrimSpace(req.Notes),
	}
	if err := s.sessions.Create(ctx, session); err != nil {
		return nil, err
	}
	dto := sessionToDTO(*session)
	return &dto, nil
}

func (s *coachSessionService) Update(ctx context.Context, coachID, sessionID uint, req *SessionUpsertRequest) (*CoachSessionDTO, error) {
	session, err := s.sessions.FindByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	if session.CoachID != coachID {
		return nil, ErrCoachStudentForbidden
	}
	if t := strings.ToLower(strings.TrimSpace(req.Type)); t == models.CoachSessionTypeInPerson || t == models.CoachSessionTypeOnline {
		session.Type = t
	}
	if req.ScheduledAt != "" {
		if when, err := time.Parse(time.RFC3339, req.ScheduledAt); err == nil {
			session.ScheduledAt = when
		}
	}
	if req.DurationMinutes > 0 {
		session.DurationMinutes = req.DurationMinutes
	}
	if req.Notes != "" {
		session.Notes = strings.TrimSpace(req.Notes)
	}
	switch strings.ToLower(strings.TrimSpace(req.Status)) {
	case models.CoachSessionStatusScheduled, models.CoachSessionStatusCompleted, models.CoachSessionStatusCancelled:
		session.Status = strings.ToLower(strings.TrimSpace(req.Status))
	}
	if err := s.sessions.Update(ctx, session); err != nil {
		return nil, err
	}
	dto := sessionToDTO(*session)
	return &dto, nil
}

func (s *coachSessionService) Cancel(ctx context.Context, coachID, sessionID uint) error {
	session, err := s.sessions.FindByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSessionNotFound
		}
		return err
	}
	if session.CoachID != coachID {
		return ErrCoachStudentForbidden
	}
	session.Status = models.CoachSessionStatusCancelled
	return s.sessions.Update(ctx, session)
}

func (s *coachSessionService) ListForCoach(ctx context.Context, coachID uint, page, pageSize int) (*SessionListResponse, error) {
	items, total, err := s.sessions.ListByCoach(ctx, coachID, page, pageSize)
	if err != nil {
		return nil, err
	}
	return toSessionListResponse(items, total, page, pageSize), nil
}

func (s *coachSessionService) ListForStudent(ctx context.Context, studentID uint, page, pageSize int) (*SessionListResponse, error) {
	items, total, err := s.sessions.ListByStudent(ctx, studentID, page, pageSize)
	if err != nil {
		return nil, err
	}
	return toSessionListResponse(items, total, page, pageSize), nil
}

func (s *coachSessionService) ReviewStatus(ctx context.Context, coachID, studentID uint) (*ReviewStatusDTO, error) {
	if err := s.assertOwnsStudent(ctx, coachID, studentID); err != nil {
		return nil, err
	}
	lastReview, err := s.sessions.LastReviewAt(ctx, coachID, studentID)
	if err != nil {
		return nil, err
	}
	if lastReview == nil {
		return &ReviewStatusDTO{Overdue: true}, nil
	}
	days := int(time.Since(*lastReview).Hours() / 24)
	formatted := lastReview.Format(time.RFC3339)
	return &ReviewStatusDTO{
		LastReviewedAt:  &formatted,
		DaysSinceReview: &days,
		Overdue:         time.Since(*lastReview) > reviewOverdueAfter,
	}, nil
}

func (s *coachSessionService) SendFeedback(ctx context.Context, coachID, studentID uint, feedback string) error {
	if err := s.assertOwnsStudent(ctx, coachID, studentID); err != nil {
		return err
	}
	feedback = strings.TrimSpace(feedback)
	if feedback == "" {
		return ErrFeedbackRequired
	}
	if err := s.sessions.CreateReview(ctx, &models.CoachReview{CoachID: coachID, StudentID: studentID, Feedback: feedback}); err != nil {
		return err
	}
	return s.notifications.Create(ctx, &models.Notification{
		UserID:  studentID,
		Type:    models.NotificationTypeMessageFromCoach,
		Title:   "بازخورد مربی",
		Message: feedback,
	})
}

func (s *coachSessionService) assertOwnsStudent(ctx context.Context, coachID, studentID uint) error {
	ok, err := s.coachStudentSvc.CanAccessStudent(ctx, coachID, studentID)
	if err != nil {
		return err
	}
	if !ok {
		return ErrCoachStudentForbidden
	}
	return nil
}

func sessionToDTO(s models.CoachSession) CoachSessionDTO {
	return CoachSessionDTO{
		ID: s.ID, CoachID: s.CoachID, StudentID: s.StudentID, Type: s.Type, Status: s.Status,
		ScheduledAt: s.ScheduledAt.Format(time.RFC3339), DurationMinutes: s.DurationMinutes, Notes: s.Notes,
	}
}

func toSessionListResponse(items []models.CoachSession, total int64, page, pageSize int) *SessionListResponse {
	dtos := make([]CoachSessionDTO, 0, len(items))
	for _, it := range items {
		dtos = append(dtos, sessionToDTO(it))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &SessionListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}
}
