package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/config"
	"github.com/yourusername/fitness-management/internal/models"
	"github.com/yourusername/fitness-management/internal/repository"
)

var (
	ErrPostContentRequired  = errors.New("post content or image is required")
	ErrPostNotFound         = errors.New("post not found")
	ErrCommentRequired      = errors.New("comment content is required")
	ErrPostCategoryInvalid  = errors.New("invalid post category")
	ErrPostMediaTypeInvalid = errors.New("unsupported media file type")
	ErrPostMediaTooLarge    = errors.New("media file is too large")
)

// MaxPostImageBytes / MaxPostVideoBytes cap upload size before we even try to
// write the file (roadmap: عکس/فیلم در پست پass).
const (
	MaxPostImageBytes = 10 << 20 // 10 MB
	MaxPostVideoBytes = 80 << 20 // 80 MB
)

var postImageExts = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
var postVideoExts = map[string]bool{".mp4": true, ".mov": true, ".webm": true, ".m4v": true}

type PostAuthorDTO struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatarUrl,omitempty"`
	Role      string `json:"role,omitempty"`
}

type CommunityPostDTO struct {
	ID           uint          `json:"id"`
	Author       PostAuthorDTO `json:"author"`
	Content      string        `json:"content,omitempty"`
	ImageURL     string        `json:"imageUrl,omitempty"`
	MediaType    string        `json:"mediaType,omitempty"`
	Category     string        `json:"category,omitempty"`
	LikeCount    int           `json:"likeCount"`
	CommentCount int           `json:"commentCount"`
	LikedByMe    bool          `json:"likedByMe"`
	CreatedAt    string        `json:"createdAt"`
}

type CommunityFeedResponse struct {
	Items    []CommunityPostDTO `json:"items"`
	Total    int64              `json:"total"`
	Page     int                `json:"page"`
	PageSize int                `json:"pageSize"`
}

type PostCommentDTO struct {
	ID        uint          `json:"id"`
	Author    PostAuthorDTO `json:"author"`
	Content   string        `json:"content"`
	CreatedAt string        `json:"createdAt"`
}

type CommentListResponse struct {
	Items    []PostCommentDTO `json:"items"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"pageSize"`
}

type CreatePostRequest struct {
	Content   string `json:"content"`
	ImageURL  string `json:"imageUrl"`
	MediaType string `json:"mediaType"`
	Category  string `json:"category"`
}

// PostMediaUploadResult is returned by UploadPostMedia so the client can drop
// the URL + type straight into CreatePostRequest.
type PostMediaUploadResult struct {
	URL       string `json:"url"`
	MediaType string `json:"mediaType"`
}

// FeedQuery narrows ListFeed to a feed tab: pass Category and/or AuthorRole,
// or leave both empty for the unfiltered "برای شما" tab.
type FeedQuery struct {
	Category   string
	AuthorRole string
}

// CommunityPostService implements the phase-1 social feed (roadmap F1/BE-7.1/BE-7.2):
// HTTP polling reads, no real-time — see Fitino_Master_Roadmap.md §3 for the
// planned WebSocket upgrade path (BE-7.6).
type CommunityPostService interface {
	CreatePost(ctx context.Context, userID uint, req *CreatePostRequest) (*CommunityPostDTO, error)
	UploadPostMedia(ctx context.Context, userID uint, file io.Reader, filename string, size int64) (*PostMediaUploadResult, error)
	ListFeed(ctx context.Context, viewerID uint, query FeedQuery, page, pageSize int) (*CommunityFeedResponse, error)
	DeletePost(ctx context.Context, userID uint, postID uint, isAdmin bool) error
	SetHidden(ctx context.Context, postID uint, hidden bool) error
	AddComment(ctx context.Context, userID, postID uint, content string) (*PostCommentDTO, error)
	ListComments(ctx context.Context, postID uint, page, pageSize int) (*CommentListResponse, error)
	ToggleLike(ctx context.Context, userID, postID uint) (liked bool, likeCount int, err error)
}

type communityPostService struct {
	db   *gorm.DB
	repo repository.CommunityPostRepository
}

func NewCommunityPostService(db *gorm.DB, repo repository.CommunityPostRepository) CommunityPostService {
	return &communityPostService{db: db, repo: repo}
}

func (s *communityPostService) CreatePost(ctx context.Context, userID uint, req *CreatePostRequest) (*CommunityPostDTO, error) {
	content := strings.TrimSpace(req.Content)
	imageURL := strings.TrimSpace(req.ImageURL)
	if content == "" && imageURL == "" {
		return nil, ErrPostContentRequired
	}
	category := strings.TrimSpace(req.Category)
	if category != "" && !models.ValidPostCategories[category] {
		return nil, ErrPostCategoryInvalid
	}
	mediaType := strings.TrimSpace(req.MediaType)
	post := &models.CommunityPost{
		UserID: userID, Content: content, ImageURL: imageURL, MediaType: mediaType, Category: category,
	}
	if err := s.repo.Create(ctx, post); err != nil {
		return nil, err
	}
	dto := s.postToDTO(ctx, *post, userID)
	return &dto, nil
}

// UploadPostMedia stores an image/video attached to a not-yet-created post
// (roadmap: عکس/فیلم در پست) and returns the URL + detected type for the
// client to include in the follow-up CreatePost call — mirrors the
// avatar/body-photo upload pattern in me_service.go.
func (s *communityPostService) UploadPostMedia(ctx context.Context, userID uint, file io.Reader, filename string, size int64) (*PostMediaUploadResult, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	var mediaType string
	var maxBytes int64
	switch {
	case postImageExts[ext]:
		mediaType = models.PostMediaTypeImage
		maxBytes = MaxPostImageBytes
	case postVideoExts[ext]:
		mediaType = models.PostMediaTypeVideo
		maxBytes = MaxPostVideoBytes
	default:
		return nil, ErrPostMediaTypeInvalid
	}
	if size > maxBytes {
		return nil, ErrPostMediaTooLarge
	}

	baseDir := config.GetUploadDir()
	if baseDir == "" {
		baseDir = "uploads"
	}
	relDir := filepath.Join("users", fmt.Sprintf("%d", userID), "community")
	dir := filepath.Join(baseDir, relDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("creating upload dir: %w", err)
	}

	uniqueName := fmt.Sprintf("post_%d%s", time.Now().UnixNano(), ext)
	fullPath := filepath.Join(dir, uniqueName)
	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("creating file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, io.LimitReader(file, maxBytes+1)); err != nil {
		_ = os.Remove(fullPath)
		return nil, fmt.Errorf("writing file: %w", err)
	}

	urlPath := "/" + filepath.ToSlash(filepath.Join("uploads", relDir, uniqueName))
	return &PostMediaUploadResult{URL: urlPath, MediaType: mediaType}, nil
}

func (s *communityPostService) ListFeed(ctx context.Context, viewerID uint, query FeedQuery, page, pageSize int) (*CommunityFeedResponse, error) {
	posts, total, err := s.repo.ListFeed(ctx, repository.FeedFilter{
		Category:   query.Category,
		AuthorRole: query.AuthorRole,
	}, page, pageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]CommunityPostDTO, 0, len(posts))
	for _, p := range posts {
		dtos = append(dtos, s.postToDTO(ctx, p, viewerID))
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &CommunityFeedResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *communityPostService) DeletePost(ctx context.Context, userID, postID uint, isAdmin bool) error {
	post, err := s.repo.FindByID(ctx, postID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPostNotFound
		}
		return err
	}
	if !isAdmin && post.UserID != userID {
		return ErrCoachStudentForbidden
	}
	return s.repo.Delete(ctx, postID)
}

func (s *communityPostService) SetHidden(ctx context.Context, postID uint, hidden bool) error {
	return s.repo.SetHidden(ctx, postID, hidden)
}

func (s *communityPostService) AddComment(ctx context.Context, userID, postID uint, content string) (*PostCommentDTO, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, ErrCommentRequired
	}
	if _, err := s.repo.FindByID(ctx, postID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}
	comment := &models.PostComment{PostID: postID, UserID: userID, Content: content}
	if err := s.repo.CreateComment(ctx, comment); err != nil {
		return nil, err
	}
	_ = s.repo.IncrementCommentCount(ctx, postID, 1)

	dto := PostCommentDTO{
		ID:        comment.ID,
		Author:    s.resolveAuthor(ctx, userID),
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt.Format(time.RFC3339),
	}
	return &dto, nil
}

func (s *communityPostService) ListComments(ctx context.Context, postID uint, page, pageSize int) (*CommentListResponse, error) {
	comments, total, err := s.repo.ListComments(ctx, postID, page, pageSize)
	if err != nil {
		return nil, err
	}
	dtos := make([]PostCommentDTO, 0, len(comments))
	for _, c := range comments {
		dtos = append(dtos, PostCommentDTO{
			ID:        c.ID,
			Author:    s.resolveAuthor(ctx, c.UserID),
			Content:   c.Content,
			CreatedAt: c.CreatedAt.Format(time.RFC3339),
		})
	}
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	return &CommentListResponse{Items: dtos, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *communityPostService) ToggleLike(ctx context.Context, userID, postID uint) (bool, int, error) {
	if _, err := s.repo.FindByID(ctx, postID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, 0, ErrPostNotFound
		}
		return false, 0, err
	}
	liked, err := s.repo.ToggleLike(ctx, postID, userID)
	if err != nil {
		return false, 0, err
	}
	post, err := s.repo.FindByID(ctx, postID)
	if err != nil {
		return liked, 0, err
	}
	return liked, post.LikeCount, nil
}

func (s *communityPostService) postToDTO(ctx context.Context, p models.CommunityPost, viewerID uint) CommunityPostDTO {
	likedByMe := false
	if viewerID != 0 {
		likedByMe, _ = s.repo.HasLiked(ctx, p.ID, viewerID)
	}
	return CommunityPostDTO{
		ID:           p.ID,
		Author:       s.resolveAuthor(ctx, p.UserID),
		Content:      p.Content,
		ImageURL:     p.ImageURL,
		MediaType:    p.MediaType,
		Category:     p.Category,
		LikeCount:    p.LikeCount,
		CommentCount: p.CommentCount,
		LikedByMe:    likedByMe,
		CreatedAt:    p.CreatedAt.Format(time.RFC3339),
	}
}

func (s *communityPostService) resolveAuthor(ctx context.Context, userID uint) PostAuthorDTO {
	var user models.User
	if err := s.db.WithContext(ctx).Select("id", "name", "avatar_url", "role").First(&user, userID).Error; err != nil {
		return PostAuthorDTO{ID: userID}
	}
	return PostAuthorDTO{ID: user.ID, Name: user.Name, AvatarURL: user.AvatarURL, Role: user.Role}
}
