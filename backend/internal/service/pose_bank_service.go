package service

import (
	"context"
	"errors"

	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var ErrPoseNotFound = errors.New("pose not found")

type PoseDTO struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Category    string `json:"category,omitempty"`
	VideoURL    string `json:"videoUrl,omitempty"`
	ImageURL    string `json:"imageUrl,omitempty"`
	Description string `json:"description,omitempty"`
	IsPublished bool   `json:"isPublished"`
}

type PoseListResponse struct {
	Items    []PoseDTO `json:"items"`
	Total    int64     `json:"total"`
	Page     int       `json:"page"`
	PageSize int       `json:"pageSize"`
}

type PoseUpsertRequest struct {
	Name        string `json:"name"`
	Category    string `json:"category"`
	VideoURL    string `json:"videoUrl"`
	ImageURL    string `json:"imageUrl"`
	Description string `json:"description"`
	IsPublished *bool  `json:"isPublished"`
}

type PoseBankService interface {
	List(ctx context.Context, filter repository.PoseBankFilter, page, pageSize int) (*PoseListResponse, error)
	Create(ctx context.Context, req *PoseUpsertRequest) (*PoseDTO, error)
	Update(ctx context.Context, id uint, req *PoseUpsertRequest) (*PoseDTO, error)
	Delete(ctx context.Context, id uint) error
}

type poseBankService struct {
	repo repository.PoseBankRepository
}

func NewPoseBankService(repo repository.PoseBankRepository) PoseBankService {
	return &poseBankService{repo: repo}
}

func poseToDTO(p *models.PoseBank) PoseDTO {
	return PoseDTO{
		ID: p.ID, Name: p.Name, Category: p.Category,
		VideoURL: p.VideoURL, ImageURL: p.ImageURL,
		Description: p.Description, IsPublished: p.IsPublished,
	}
}

func (s *poseBankService) List(ctx context.Context, filter repository.PoseBankFilter, page, pageSize int) (*PoseListResponse, error) {
	items, total, err := s.repo.List(ctx, filter, page, pageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]PoseDTO, 0, len(items))
	for i := range items {
		dtos = append(dtos, poseToDTO(&items[i]))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &PoseListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *poseBankService) Create(ctx context.Context, req *PoseUpsertRequest) (*PoseDTO, error) {
	if req.Name == "" {
		return nil, errors.New("نام پوز الزامی است")
	}
	p := &models.PoseBank{
		Name: req.Name, Category: req.Category, VideoURL: req.VideoURL,
		ImageURL: req.ImageURL, Description: req.Description, IsPublished: true,
	}
	if req.IsPublished != nil {
		p.IsPublished = *req.IsPublished
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	dto := poseToDTO(p)
	return &dto, nil
}

func (s *poseBankService) Update(ctx context.Context, id uint, req *PoseUpsertRequest) (*PoseDTO, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrPoseNotFound
	}
	if req.Name != "" {
		p.Name = req.Name
	}
	p.Category = req.Category
	p.VideoURL = req.VideoURL
	p.ImageURL = req.ImageURL
	p.Description = req.Description
	if req.IsPublished != nil {
		p.IsPublished = *req.IsPublished
	}
	if err := s.repo.Update(ctx, p); err != nil {
		return nil, err
	}
	dto := poseToDTO(p)
	return &dto, nil
}

func (s *poseBankService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}
