package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrTicketCoachNotAssigned = errors.New("coach is not assigned")
	ErrTicketNotFound         = errors.New("ticket not found")
	ErrTicketForbidden        = errors.New("forbidden")
	ErrTicketInvalidStatus    = errors.New("invalid ticket status")
)

type TicketPriority string

const (
	TicketPriorityLow    TicketPriority = "low"
	TicketPriorityNormal TicketPriority = "normal"
	TicketPriorityHigh   TicketPriority = "high"
)

type TicketStatus string

const (
	TicketStatusPending  TicketStatus = "pending"
	TicketStatusInReview TicketStatus = "in_review"
	TicketStatusAnswered TicketStatus = "answered"
	TicketStatusClosed   TicketStatus = "closed"
)

type TicketCreateRequest struct {
	Title    string `json:"title" binding:"required"`
	Priority string `json:"priority"`
	Message  string `json:"message" binding:"required"`
}

type TicketItemDTO struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	Priority  string    `json:"priority"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	Answered  bool      `json:"answered"`
}

type TicketDetailsDTO struct {
	ID         uint       `json:"id"`
	Title      string     `json:"title"`
	Priority   string     `json:"priority"`
	Status     string     `json:"status"`
	Message    string     `json:"message"`
	Answer     string     `json:"answer,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	AnsweredAt *time.Time `json:"answeredAt,omitempty"`
}

type CoachTicketItemDTO struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Priority    string    `json:"priority"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	Answered    bool      `json:"answered"`
	StudentID   uint      `json:"studentId"`
	StudentName string    `json:"studentName"`
}

type CoachTicketDetailsDTO struct {
	TicketDetailsDTO
	StudentID    uint   `json:"studentId"`
	StudentName  string `json:"studentName"`
	StudentPhone string `json:"studentPhone,omitempty"`
}

type TicketAnswerRequest struct {
	Answer string `json:"answer" binding:"required"`
}

type TicketStatusUpdateRequest struct {
	Status string `json:"status" binding:"required"`
}

type TicketListResponse struct {
	Items    []TicketItemDTO `json:"items"`
	Page     int             `json:"page"`
	PageSize int             `json:"pageSize"`
	Total    int64           `json:"total"`
}

type CoachTicketListResponse struct {
	Items    []CoachTicketItemDTO `json:"items"`
	Page     int             `json:"page"`
	PageSize int             `json:"pageSize"`
	Total    int64           `json:"total"`
}

type TicketService interface {
	CreateForStudent(ctx context.Context, studentID uint, req *TicketCreateRequest) (*TicketDetailsDTO, error)
	ListForStudent(ctx context.Context, studentID uint, page, pageSize int) (*TicketListResponse, error)
	GetForStudent(ctx context.Context, studentID uint, id uint) (*TicketDetailsDTO, error)
	ListForCoach(ctx context.Context, coachID uint, page, pageSize int, status string) (*CoachTicketListResponse, error)
	GetForCoach(ctx context.Context, coachID uint, id uint) (*CoachTicketDetailsDTO, error)
	AnswerForCoach(ctx context.Context, coachID uint, id uint, req *TicketAnswerRequest) (*CoachTicketDetailsDTO, error)
	UpdateStatusForCoach(ctx context.Context, coachID uint, id uint, req *TicketStatusUpdateRequest) (*CoachTicketDetailsDTO, error)
}

type ticketService struct {
	userRepo   repository.UserRepository
	ticketRepo repository.TicketRepository
}

func NewTicketService(userRepo repository.UserRepository, ticketRepo repository.TicketRepository) TicketService {
	return &ticketService{userRepo: userRepo, ticketRepo: ticketRepo}
}

func normalizePriority(p string) string {
	p = strings.ToLower(strings.TrimSpace(p))
	switch TicketPriority(p) {
	case TicketPriorityLow, TicketPriorityNormal, TicketPriorityHigh:
		return p
	default:
		return string(TicketPriorityNormal)
	}
}

func (s *ticketService) CreateForStudent(ctx context.Context, studentID uint, req *TicketCreateRequest) (*TicketDetailsDTO, error) {
	u, err := s.userRepo.FindByID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	if u.AssignedCoachID == nil || *u.AssignedCoachID == 0 {
		return nil, ErrTicketCoachNotAssigned
	}

	t := &models.Ticket{
		StudentID: studentID,
		CoachID:   *u.AssignedCoachID,
		Title:     strings.TrimSpace(req.Title),
		Priority:  normalizePriority(req.Priority),
		Status:    string(TicketStatusPending),
		Message:   strings.TrimSpace(req.Message),
	}
	if err := s.ticketRepo.Create(ctx, t); err != nil {
		return nil, err
	}
	return toTicketDetailsDTO(t), nil
}

func (s *ticketService) ListForStudent(ctx context.Context, studentID uint, page, pageSize int) (*TicketListResponse, error) {
	list, total, err := s.ticketRepo.ListByStudentID(ctx, studentID, page, pageSize)
	if err != nil {
		return nil, err
	}
	items := make([]TicketItemDTO, 0, len(list))
	for i := range list {
		t := &list[i]
		items = append(items, TicketItemDTO{
			ID:        t.ID,
			Title:     t.Title,
			Priority:  t.Priority,
			Status:    t.Status,
			CreatedAt: t.CreatedAt,
			Answered:  t.AnsweredAt != nil && strings.TrimSpace(t.Answer) != "",
		})
	}
	return &TicketListResponse{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func (s *ticketService) GetForStudent(ctx context.Context, studentID uint, id uint) (*TicketDetailsDTO, error) {
	t, err := s.ticketRepo.GetByIDAndStudentID(ctx, id, studentID)
	if err != nil {
		return nil, ErrTicketNotFound
	}
	return toTicketDetailsDTO(t), nil
}

func (s *ticketService) ListForCoach(ctx context.Context, coachID uint, page, pageSize int, status string) (*CoachTicketListResponse, error) {
	status = strings.ToLower(strings.TrimSpace(status))
	if status != "" && !isValidTicketStatus(status) {
		return nil, ErrTicketInvalidStatus
	}

	list, total, err := s.ticketRepo.ListByCoachID(ctx, coachID, page, pageSize, status)
	if err != nil {
		return nil, err
	}
	items := make([]CoachTicketItemDTO, 0, len(list))
	for i := range list {
		t := &list[i]
		studentName := s.resolveStudentName(ctx, t.StudentID)
		items = append(items, CoachTicketItemDTO{
			ID:          t.ID,
			Title:       t.Title,
			Priority:    t.Priority,
			Status:      t.Status,
			CreatedAt:   t.CreatedAt,
			Answered:    t.AnsweredAt != nil && strings.TrimSpace(t.Answer) != "",
			StudentID:   t.StudentID,
			StudentName: studentName,
		})
	}
	return &CoachTicketListResponse{Items: items, Page: page, PageSize: pageSize, Total: total}, nil
}

func (s *ticketService) GetForCoach(ctx context.Context, coachID uint, id uint) (*CoachTicketDetailsDTO, error) {
	t, err := s.ticketRepo.GetByIDAndCoachID(ctx, id, coachID)
	if err != nil {
		return nil, ErrTicketNotFound
	}
	return s.toCoachTicketDetailsDTO(ctx, t), nil
}

func (s *ticketService) AnswerForCoach(ctx context.Context, coachID uint, id uint, req *TicketAnswerRequest) (*CoachTicketDetailsDTO, error) {
	if _, err := s.ticketRepo.GetByIDAndCoachID(ctx, id, coachID); err != nil {
		return nil, ErrTicketNotFound
	}
	answer := strings.TrimSpace(req.Answer)
	if answer == "" {
		return nil, ErrTicketInvalidStatus
	}
	if err := s.ticketRepo.Answer(ctx, id, coachID, answer); err != nil {
		return nil, err
	}
	t, err := s.ticketRepo.GetByIDAndCoachID(ctx, id, coachID)
	if err != nil {
		return nil, err
	}
	return s.toCoachTicketDetailsDTO(ctx, t), nil
}

func (s *ticketService) UpdateStatusForCoach(ctx context.Context, coachID uint, id uint, req *TicketStatusUpdateRequest) (*CoachTicketDetailsDTO, error) {
	status := strings.ToLower(strings.TrimSpace(req.Status))
	switch TicketStatus(status) {
	case TicketStatusInReview, TicketStatusClosed:
	default:
		return nil, ErrTicketInvalidStatus
	}
	if _, err := s.ticketRepo.GetByIDAndCoachID(ctx, id, coachID); err != nil {
		return nil, ErrTicketNotFound
	}
	if err := s.ticketRepo.UpdateStatus(ctx, id, coachID, status); err != nil {
		return nil, err
	}
	t, err := s.ticketRepo.GetByIDAndCoachID(ctx, id, coachID)
	if err != nil {
		return nil, err
	}
	return s.toCoachTicketDetailsDTO(ctx, t), nil
}

func toTicketDetailsDTO(t *models.Ticket) *TicketDetailsDTO {
	return &TicketDetailsDTO{
		ID:         t.ID,
		Title:      t.Title,
		Priority:   t.Priority,
		Status:     t.Status,
		Message:    t.Message,
		Answer:     t.Answer,
		CreatedAt:  t.CreatedAt,
		AnsweredAt: t.AnsweredAt,
	}
}

func (s *ticketService) toCoachTicketDetailsDTO(ctx context.Context, t *models.Ticket) *CoachTicketDetailsDTO {
	studentName := s.resolveStudentName(ctx, t.StudentID)
	studentPhone := s.resolveStudentPhone(ctx, t.StudentID)
	return &CoachTicketDetailsDTO{
		TicketDetailsDTO: *toTicketDetailsDTO(t),
		StudentID:        t.StudentID,
		StudentName:      studentName,
		StudentPhone:     studentPhone,
	}
}

func (s *ticketService) resolveStudentName(ctx context.Context, studentID uint) string {
	u, err := s.userRepo.FindByID(ctx, studentID)
	if err != nil {
		return ""
	}
	return u.Name
}

func (s *ticketService) resolveStudentPhone(ctx context.Context, studentID uint) string {
	u, err := s.userRepo.FindByID(ctx, studentID)
	if err != nil {
		return ""
	}
	return u.Phone
}

func isValidTicketStatus(status string) bool {
	switch TicketStatus(status) {
	case TicketStatusPending, TicketStatusInReview, TicketStatusAnswered, TicketStatusClosed:
		return true
	default:
		return false
	}
}

