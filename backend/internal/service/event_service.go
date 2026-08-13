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

var (
	ErrEventNotFound      = errors.New("event not found")
	ErrEventTitleRequired = errors.New("event title is required")
	ErrEventTypeInvalid   = errors.New("event type must be offline or online")
	ErrEventAlreadyJoined = errors.New("already joined this event")
)

type EventDTO struct {
	ID               uint   `json:"id"`
	Title            string `json:"title"`
	Description      string `json:"description,omitempty"`
	EventType        string `json:"eventType"`
	Prize            string `json:"prize,omitempty"`
	Location         string `json:"location,omitempty"`
	EventDate        string `json:"eventDate"`
	IsActive         bool   `json:"isActive"`
	ParticipantCount int    `json:"participantCount"`
	JoinedByMe       bool   `json:"joinedByMe"`
}

type EventListResponse struct {
	Items    []EventDTO `json:"items"`
	Total    int64      `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"pageSize"`
}

type EventUpsertRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	EventType   string `json:"eventType"`
	Prize       string `json:"prize"`
	Location    string `json:"location"`
	EventDate   string `json:"eventDate"` // RFC3339
	IsActive    *bool  `json:"isActive"`
}

// EventService implements community events/competitions (roadmap F2/BE-7.3):
// always opt-in participation.
type EventService interface {
	List(ctx context.Context, viewerID uint, onlyActive bool, page, pageSize int) (*EventListResponse, error)
	Create(ctx context.Context, req *EventUpsertRequest) (*EventDTO, error)
	Update(ctx context.Context, id uint, req *EventUpsertRequest) (*EventDTO, error)
	Delete(ctx context.Context, id uint) error
	Join(ctx context.Context, userID, eventID uint) error
	Leave(ctx context.Context, userID, eventID uint) error
}

type eventService struct {
	repo repository.EventRepository
}

func NewEventService(repo repository.EventRepository) EventService {
	return &eventService{repo: repo}
}

func (s *eventService) List(ctx context.Context, viewerID uint, onlyActive bool, page, pageSize int) (*EventListResponse, error) {
	events, total, err := s.repo.List(ctx, onlyActive, page, pageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]EventDTO, 0, len(events))
	for _, e := range events {
		dtos = append(dtos, s.eventToDTO(ctx, e, viewerID))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &EventListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *eventService) Create(ctx context.Context, req *EventUpsertRequest) (*EventDTO, error) {
	if strings.TrimSpace(req.Title) == "" {
		return nil, ErrEventTitleRequired
	}
	eventType := strings.ToLower(strings.TrimSpace(req.EventType))
	if eventType != models.EventTypeOffline && eventType != models.EventTypeOnline {
		return nil, ErrEventTypeInvalid
	}
	eventDate := parseEventDate(req.EventDate)

	e := &models.Event{
		Title: req.Title, Description: req.Description, EventType: eventType,
		Prize: req.Prize, Location: req.Location, EventDate: eventDate, IsActive: true,
	}
	if req.IsActive != nil {
		e.IsActive = *req.IsActive
	}
	if err := s.repo.Create(ctx, e); err != nil {
		return nil, err
	}
	dto := s.eventToDTO(ctx, *e, 0)
	return &dto, nil
}

func (s *eventService) Update(ctx context.Context, id uint, req *EventUpsertRequest) (*EventDTO, error) {
	e, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}
	if req.Title != "" {
		e.Title = req.Title
	}
	e.Description = req.Description
	if et := strings.ToLower(strings.TrimSpace(req.EventType)); et == models.EventTypeOffline || et == models.EventTypeOnline {
		e.EventType = et
	}
	e.Prize = req.Prize
	e.Location = req.Location
	if req.EventDate != "" {
		e.EventDate = parseEventDate(req.EventDate)
	}
	if req.IsActive != nil {
		e.IsActive = *req.IsActive
	}
	if err := s.repo.Update(ctx, e); err != nil {
		return nil, err
	}
	dto := s.eventToDTO(ctx, *e, 0)
	return &dto, nil
}

func (s *eventService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func (s *eventService) Join(ctx context.Context, userID, eventID uint) error {
	if _, err := s.repo.FindByID(ctx, eventID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrEventNotFound
		}
		return err
	}
	joined, err := s.repo.IsParticipant(ctx, eventID, userID)
	if err != nil {
		return err
	}
	if joined {
		return ErrEventAlreadyJoined
	}
	return s.repo.Join(ctx, eventID, userID)
}

func (s *eventService) Leave(ctx context.Context, userID, eventID uint) error {
	return s.repo.Leave(ctx, eventID, userID)
}

func (s *eventService) eventToDTO(ctx context.Context, e models.Event, viewerID uint) EventDTO {
	count, _ := s.repo.CountParticipants(ctx, e.ID)
	joined := false
	if viewerID != 0 {
		joined, _ = s.repo.IsParticipant(ctx, e.ID, viewerID)
	}
	return EventDTO{
		ID: e.ID, Title: e.Title, Description: e.Description, EventType: e.EventType,
		Prize: e.Prize, Location: e.Location, EventDate: e.EventDate.Format(time.RFC3339),
		IsActive: e.IsActive, ParticipantCount: int(count), JoinedByMe: joined,
	}
}

func parseEventDate(raw string) time.Time {
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return t
	}
	if t, err := time.Parse("2006-01-02", raw); err == nil {
		return t
	}
	return time.Now().AddDate(0, 0, 7)
}
