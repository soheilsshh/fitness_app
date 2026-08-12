package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// CommunityPostController exposes the student social feed (roadmap F1/BE-7.1/BE-7.2).
type CommunityPostController struct {
	svc service.CommunityPostService
}

func NewCommunityPostController(svc service.CommunityPostService) *CommunityPostController {
	return &CommunityPostController{svc: svc}
}

// CreatePost godoc
// @Summary Create a community post
// @Tags community
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body service.CreatePostRequest true "Post content"
// @Success 201 {object} service.CommunityPostDTO
// @Failure 400 {object} map[string]string
// @Router /me/community/posts [post]
func (h *CommunityPostController) CreatePost(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req service.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.CreatePost(c.Request.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPostContentRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": "متن یا عکس پست الزامی است"})
		case errors.Is(err, service.ErrPostCategoryInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "دسته‌بندی پست نامعتبر است"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت پست"})
		}
		return
	}
	c.JSON(http.StatusCreated, dto)
}

// UploadMedia godoc
// @Summary Upload an image or video to attach to a post
// @Tags community
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Image or video file"
// @Success 200 {object} service.PostMediaUploadResult
// @Failure 400 {object} map[string]string
// @Router /me/community/posts/media [post]
func (h *CommunityPostController) UploadMedia(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "فایل الزامی است"})
		return
	}
	opened, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در خواندن فایل"})
		return
	}
	defer opened.Close()

	result, err := h.svc.UploadPostMedia(c.Request.Context(), userID, opened, fileHeader.Filename, fileHeader.Size)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPostMediaTypeInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "فرمت فایل پشتیبانی نمی‌شود (فقط عکس یا ویدیو)"})
		case errors.Is(err, service.ErrPostMediaTooLarge):
			c.JSON(http.StatusBadRequest, gin.H{"error": "حجم فایل بیش از حد مجاز است"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در آپلود فایل"})
		}
		return
	}
	c.JSON(http.StatusOK, result)
}

// ListFeed godoc
// @Summary List community feed (paginated, polling)
// @Tags community
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page"
// @Param pageSize query int false "Page size"
// @Param category query string false "workout|nutrition|progress|record|question|tip"
// @Param authorRole query string false "coach — restrict to posts by coaches"
// @Success 200 {object} service.CommunityFeedResponse
// @Router /me/community/posts [get]
func (h *CommunityPostController) ListFeed(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	query := service.FeedQuery{
		Category:   c.Query("category"),
		AuthorRole: c.Query("authorRole"),
	}
	resp, err := h.svc.ListFeed(c.Request.Context(), userID, query, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت فید"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// DeletePost godoc
// @Summary Delete own post
// @Tags community
// @Security BearerAuth
// @Param id path int true "Post ID"
// @Success 204
// @Router /me/community/posts/{id} [delete]
func (h *CommunityPostController) DeletePost(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.DeletePost(c.Request.Context(), userID, uint(id), false); err != nil {
		switch {
		case errors.Is(err, service.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "پست پیدا نشد"})
		case errors.Is(err, service.ErrCoachStudentForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "اجازه حذف این پست را ندارید"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف پست"})
		}
		return
	}
	c.Status(http.StatusNoContent)
}

// ToggleLike godoc
// @Summary Toggle like on a post
// @Tags community
// @Security BearerAuth
// @Param id path int true "Post ID"
// @Success 200 {object} map[string]interface{}
// @Router /me/community/posts/{id}/like [post]
func (h *CommunityPostController) ToggleLike(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	liked, count, err := h.svc.ToggleLike(c.Request.Context(), userID, uint(id))
	if err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "پست پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت لایک"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"liked": liked, "likeCount": count})
}

// ListComments godoc
// @Summary List comments on a post
// @Tags community
// @Produce json
// @Security BearerAuth
// @Param id path int true "Post ID"
// @Success 200 {object} service.CommentListResponse
// @Router /me/community/posts/{id}/comments [get]
func (h *CommunityPostController) ListComments(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.ListComments(c.Request.Context(), uint(id), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت کامنت‌ها"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// AddComment godoc
// @Summary Add a comment to a post
// @Tags community
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Post ID"
// @Param body body map[string]string true "content"
// @Success 201 {object} service.PostCommentDTO
// @Router /me/community/posts/{id}/comments [post]
func (h *CommunityPostController) AddComment(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.AddComment(c.Request.Context(), userID, uint(id), body.Content)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCommentRequired):
			c.JSON(http.StatusBadRequest, gin.H{"error": "متن کامنت الزامی است"})
		case errors.Is(err, service.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "پست پیدا نشد"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در ثبت کامنت"})
		}
		return
	}
	c.JSON(http.StatusCreated, dto)
}

// AdminCommunityPostController exposes moderation actions (roadmap Admin-7.5).
type AdminCommunityPostController struct {
	svc service.CommunityPostService
}

func NewAdminCommunityPostController(svc service.CommunityPostService) *AdminCommunityPostController {
	return &AdminCommunityPostController{svc: svc}
}

// SetHidden godoc
// @Summary Hide/unhide a post (moderation)
// @Tags admin-community
// @Security BearerAuth
// @Param id path int true "Post ID"
// @Param body body map[string]bool true "hidden"
// @Success 200 {object} map[string]string
// @Router /admin/community/posts/{id}/hide [patch]
func (h *AdminCommunityPostController) SetHidden(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		Hidden bool `json:"hidden"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.svc.SetHidden(c.Request.Context(), uint(id), body.Hidden); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در به‌روزرسانی وضعیت پست"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DeletePost godoc
// @Summary Admin delete any post
// @Tags admin-community
// @Security BearerAuth
// @Param id path int true "Post ID"
// @Success 204
// @Router /admin/community/posts/{id} [delete]
func (h *AdminCommunityPostController) DeletePost(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.DeletePost(c.Request.Context(), 0, uint(id), true); err != nil {
		if errors.Is(err, service.ErrPostNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "پست پیدا نشد"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در حذف پست"})
		return
	}
	c.Status(http.StatusNoContent)
}
