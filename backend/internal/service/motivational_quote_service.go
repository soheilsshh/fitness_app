package service

import (
	"context"
	"errors"
	"strings"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrQuoteTextRequired = errors.New("quote text is required")

type MotivationalQuoteDTO struct {
	ID       uint   `json:"id"`
	Text     string `json:"text"`
	Author   string `json:"author,omitempty"`
	IsActive bool   `json:"isActive"`
}

type QuoteListResponse struct {
	Items    []MotivationalQuoteDTO `json:"items"`
	Total    int64                  `json:"total"`
	Page     int                    `json:"page"`
	PageSize int                    `json:"pageSize"`
}

type QuoteUpsertRequest struct {
	Text     string `json:"text"`
	Author   string `json:"author"`
	IsActive *bool  `json:"isActive"`
}

// MotivationalQuoteService powers the dashboard "Optimal" section (roadmap E4/BE-8.5).
type MotivationalQuoteService interface {
	Random(ctx context.Context) (*MotivationalQuoteDTO, error)
	List(ctx context.Context, page, pageSize int) (*QuoteListResponse, error)
	Create(ctx context.Context, req *QuoteUpsertRequest) (*MotivationalQuoteDTO, error)
	Update(ctx context.Context, id uint, req *QuoteUpsertRequest) (*MotivationalQuoteDTO, error)
	Delete(ctx context.Context, id uint) error
}

type motivationalQuoteService struct {
	repo repository.MotivationalQuoteRepository
}

func NewMotivationalQuoteService(repo repository.MotivationalQuoteRepository) MotivationalQuoteService {
	return &motivationalQuoteService{repo: repo}
}

// defaultQuotes seed the section before an admin adds real content, so the
// dashboard never renders empty on a fresh install.
var defaultQuotes = []models.MotivationalQuote{
	{Text: "بدنت همون چیزیه که هر روز بهش یادآوری می‌کنی — امروزم یادآوری کن.", IsActive: true},
	{Text: "پیشرفت همیشه خطی نیست؛ فقط ادامه بده.", IsActive: true},
	{Text: "بهترین نسخه‌ی خودت رو با انضباط امروز می‌سازی، نه انگیزه‌ی فردا.", IsActive: true},
}

func (s *motivationalQuoteService) Random(ctx context.Context) (*MotivationalQuoteDTO, error) {
	count, err := s.repo.CountActive(ctx)
	if err != nil {
		return nil, err
	}
	if count == 0 {
		q := defaultQuotes[0]
		dto := MotivationalQuoteDTO{Text: q.Text, Author: q.Author, IsActive: true}
		return &dto, nil
	}
	q, err := s.repo.RandomActive(ctx)
	if err != nil {
		return nil, err
	}
	dto := quoteToDTO(*q)
	return &dto, nil
}

func (s *motivationalQuoteService) List(ctx context.Context, page, pageSize int) (*QuoteListResponse, error) {
	items, total, err := s.repo.List(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]MotivationalQuoteDTO, 0, len(items))
	for _, q := range items {
		dtos = append(dtos, quoteToDTO(q))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &QuoteListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *motivationalQuoteService) Create(ctx context.Context, req *QuoteUpsertRequest) (*MotivationalQuoteDTO, error) {
	text := strings.TrimSpace(req.Text)
	if text == "" {
		return nil, ErrQuoteTextRequired
	}
	q := &models.MotivationalQuote{Text: text, Author: strings.TrimSpace(req.Author), IsActive: true}
	if req.IsActive != nil {
		q.IsActive = *req.IsActive
	}
	if err := s.repo.Create(ctx, q); err != nil {
		return nil, err
	}
	dto := quoteToDTO(*q)
	return &dto, nil
}

func (s *motivationalQuoteService) Update(ctx context.Context, id uint, req *QuoteUpsertRequest) (*MotivationalQuoteDTO, error) {
	q, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if text := strings.TrimSpace(req.Text); text != "" {
		q.Text = text
	} else {
		return nil, ErrQuoteTextRequired
	}
	q.Author = strings.TrimSpace(req.Author)
	if req.IsActive != nil {
		q.IsActive = *req.IsActive
	}
	if err := s.repo.Update(ctx, q); err != nil {
		return nil, err
	}
	dto := quoteToDTO(*q)
	return &dto, nil
}

func (s *motivationalQuoteService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func quoteToDTO(q models.MotivationalQuote) MotivationalQuoteDTO {
	return MotivationalQuoteDTO{ID: q.ID, Text: q.Text, Author: q.Author, IsActive: q.IsActive}
}
