package repository

import (
	"context"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type CommunityPostRepository interface {
	Create(ctx context.Context, p *models.CommunityPost) error
	FindByID(ctx context.Context, id uint) (*models.CommunityPost, error)
	ListFeed(ctx context.Context, filter FeedFilter, page, pageSize int) ([]models.CommunityPost, int64, error)
	Delete(ctx context.Context, id uint) error
	SetHidden(ctx context.Context, id uint, hidden bool) error

	CreateComment(ctx context.Context, c *models.PostComment) error
	ListComments(ctx context.Context, postID uint, page, pageSize int) ([]models.PostComment, int64, error)
	IncrementCommentCount(ctx context.Context, postID uint, delta int) error

	ToggleLike(ctx context.Context, postID, userID uint) (liked bool, err error)
	HasLiked(ctx context.Context, postID, userID uint) (bool, error)
}

type communityPostRepository struct {
	db *gorm.DB
}

// FeedFilter narrows ListFeed to one feed tab (roadmap F1 UX pass — post
// template categories + author-role tabs). Zero value ("", "") means no
// filter, i.e. the "برای شما" / all tab.
type FeedFilter struct {
	Category   string // one of models.ValidPostCategories, or "" for any
	AuthorRole string // e.g. "coach", or "" for any
}

func NewCommunityPostRepository(db *gorm.DB) CommunityPostRepository {
	return &communityPostRepository{db: db}
}

func (r *communityPostRepository) Create(ctx context.Context, p *models.CommunityPost) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *communityPostRepository) FindByID(ctx context.Context, id uint) (*models.CommunityPost, error) {
	var p models.CommunityPost
	if err := r.db.WithContext(ctx).First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *communityPostRepository) ListFeed(ctx context.Context, filter FeedFilter, page, pageSize int) ([]models.CommunityPost, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 50 {
		pageSize = 50
	}

	db := r.db.WithContext(ctx).Model(&models.CommunityPost{}).Where("community_posts.is_hidden = ?", false)
	if filter.Category != "" {
		db = db.Where("community_posts.category = ?", filter.Category)
	}
	if filter.AuthorRole != "" {
		db = db.Joins("JOIN users ON users.id = community_posts.user_id").
			Where("users.role = ?", filter.AuthorRole)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	var list []models.CommunityPost
	if err := db.Order("community_posts.created_at DESC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *communityPostRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&models.CommunityPost{}, id).Error
}

func (r *communityPostRepository) SetHidden(ctx context.Context, id uint, hidden bool) error {
	return r.db.WithContext(ctx).Model(&models.CommunityPost{}).Where("id = ?", id).Update("is_hidden", hidden).Error
}

func (r *communityPostRepository) CreateComment(ctx context.Context, c *models.PostComment) error {
	return r.db.WithContext(ctx).Create(c).Error
}

func (r *communityPostRepository) ListComments(ctx context.Context, postID uint, page, pageSize int) ([]models.PostComment, int64, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	db := r.db.WithContext(ctx).Model(&models.PostComment{}).Where("post_id = ?", postID)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	var list []models.PostComment
	if err := db.Order("created_at ASC").Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *communityPostRepository) IncrementCommentCount(ctx context.Context, postID uint, delta int) error {
	return r.db.WithContext(ctx).Model(&models.CommunityPost{}).Where("id = ?", postID).
		UpdateColumn("comment_count", gorm.Expr("comment_count + ?", delta)).Error
}

// ToggleLike creates the like if absent, deletes it if present, and adjusts
// the post's cached LikeCount in the same transaction.
func (r *communityPostRepository) ToggleLike(ctx context.Context, postID, userID uint) (bool, error) {
	liked := false
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing models.PostLike
		err := tx.Where("post_id = ? AND user_id = ?", postID, userID).First(&existing).Error
		if err == nil {
			if delErr := tx.Delete(&existing).Error; delErr != nil {
				return delErr
			}
			liked = false
			return tx.Model(&models.CommunityPost{}).Where("id = ? AND like_count > 0", postID).
				UpdateColumn("like_count", gorm.Expr("like_count - 1")).Error
		}
		if err != gorm.ErrRecordNotFound {
			return err
		}
		like := models.PostLike{PostID: postID, UserID: userID}
		if createErr := tx.Create(&like).Error; createErr != nil {
			return createErr
		}
		liked = true
		return tx.Model(&models.CommunityPost{}).Where("id = ?", postID).
			UpdateColumn("like_count", gorm.Expr("like_count + ?", 1)).Error
	})
	return liked, err
}

func (r *communityPostRepository) HasLiked(ctx context.Context, postID, userID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.PostLike{}).
		Where("post_id = ? AND user_id = ?", postID, userID).Count(&count).Error
	return count > 0, err
}
