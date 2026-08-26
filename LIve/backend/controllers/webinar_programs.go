package controllers

import (
	"encoding/json"
	"fitino-live-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WebinarProgramController struct {
	DB *gorm.DB
}

func NewWebinarProgramController(db *gorm.DB) *WebinarProgramController {
	return &WebinarProgramController{DB: db}
}

// --- Admin CRUD ---

func (ctrl *WebinarProgramController) List(c *gin.Context) {
	var programs []models.WebinarProgram
	if err := ctrl.DB.Order("start_at ASC").Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"programs": programs})
}

func (ctrl *WebinarProgramController) Get(c *gin.Context) {
	var program models.WebinarProgram
	if err := ctrl.DB.First(&program, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, program)
}

type webinarProgramInput struct {
	Slug              string     `json:"slug" binding:"required"`
	Title             string     `json:"title" binding:"required"`
	VideoURL          string     `json:"video_url"`
	StartAt           time.Time  `json:"start_at" binding:"required"`
	EndAt             time.Time  `json:"end_at" binding:"required"`
	IsSellingEnabled  bool       `json:"is_selling_enabled"`
	BuyButtonRevealAt *time.Time `json:"buy_button_reveal_at"`
	Price             int        `json:"price"`
	CommentsJSON      string     `json:"comments_json"`
	IsActive          *bool      `json:"is_active"`
}

func (ctrl *WebinarProgramController) Create(c *gin.Context) {
	var in webinarProgramInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if in.CommentsJSON != "" && !isValidJSON(in.CommentsJSON) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "comments_json is not valid JSON"})
		return
	}

	program := models.WebinarProgram{
		Slug:              in.Slug,
		Title:             in.Title,
		VideoURL:          in.VideoURL,
		StartAt:           in.StartAt,
		EndAt:             in.EndAt,
		IsSellingEnabled:  in.IsSellingEnabled,
		BuyButtonRevealAt: in.BuyButtonRevealAt,
		Price:             in.Price,
		CommentsJSON:      in.CommentsJSON,
		IsActive:          true,
	}
	if in.IsActive != nil {
		program.IsActive = *in.IsActive
	}

	if err := ctrl.DB.Create(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, program)
}

func (ctrl *WebinarProgramController) Update(c *gin.Context) {
	var program models.WebinarProgram
	if err := ctrl.DB.First(&program, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var in webinarProgramInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if in.CommentsJSON != "" && !isValidJSON(in.CommentsJSON) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "comments_json is not valid JSON"})
		return
	}

	program.Slug = in.Slug
	program.Title = in.Title
	program.VideoURL = in.VideoURL
	program.StartAt = in.StartAt
	program.EndAt = in.EndAt
	program.IsSellingEnabled = in.IsSellingEnabled
	program.BuyButtonRevealAt = in.BuyButtonRevealAt
	program.Price = in.Price
	program.CommentsJSON = in.CommentsJSON
	if in.IsActive != nil {
		program.IsActive = *in.IsActive
	}

	if err := ctrl.DB.Save(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, program)
}

func (ctrl *WebinarProgramController) Delete(c *gin.Context) {
	if err := ctrl.DB.Delete(&models.WebinarProgram{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// --- Public ---

// FindCurrentOrNextProgram is also used by the scheduler sync bridge
// (see scheduler.SyncActiveWebinarProgram) — not just this HTTP handler.
func FindCurrentOrNextProgram(db *gorm.DB, now time.Time) (*models.WebinarProgram, error) {
	var program models.WebinarProgram

	// Currently within a program's window.
	err := db.Where("is_active = ? AND start_at <= ? AND end_at >= ?", true, now, now).
		Order("start_at ASC").First(&program).Error
	if err == nil {
		return &program, nil
	}

	// Otherwise the next upcoming one.
	err = db.Where("is_active = ? AND start_at > ?", true, now).
		Order("start_at ASC").First(&program).Error
	if err == nil {
		return &program, nil
	}

	// Otherwise the most recent past one (so the page has something to show
	// instead of a hard error right after a program ends).
	err = db.Where("is_active = ?", true).
		Order("start_at DESC").First(&program).Error
	if err != nil {
		return nil, err
	}
	return &program, nil
}

// GetCurrent returns the active/next/last WebinarProgram plus whether the
// buy button should show right now: is_selling_enabled AND
// now >= buy_button_reveal_at (a nil reveal time means never, even if
// selling is otherwise enabled).
func (ctrl *WebinarProgramController) GetCurrent(c *gin.Context) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)

	program, err := FindCurrentOrNextProgram(ctrl.DB, now)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no webinar programs configured"})
		return
	}

	showBuyButton := program.IsSellingEnabled &&
		program.BuyButtonRevealAt != nil &&
		!now.Before(*program.BuyButtonRevealAt)

	c.JSON(http.StatusOK, gin.H{
		"id":                  program.ID,
		"slug":                program.Slug,
		"title":               program.Title,
		"start_at":            program.StartAt.Format(time.RFC3339),
		"end_at":              program.EndAt.Format(time.RFC3339),
		"is_selling_enabled":  program.IsSellingEnabled,
		"show_buy_button":     showBuyButton,
		"buy_button_reveal_at": program.BuyButtonRevealAt,
		"price":               program.Price,
		"server_now":          now.UnixMilli(),
	})
}

// GetCurrentComments serves the active program's marketing comments as JSON
// — fetched at runtime by the frontend instead of the old static TS-file
// import, so switching which program is "current" doesn't need a rebuild.
func (ctrl *WebinarProgramController) GetCurrentComments(c *gin.Context) {
	loc, err := time.LoadLocation("Asia/Tehran")
	if err != nil {
		loc = time.UTC
	}
	program, err := FindCurrentOrNextProgram(ctrl.DB, time.Now().In(loc))
	if err != nil || program.CommentsJSON == "" {
		c.Data(http.StatusOK, "application/json", []byte("[]"))
		return
	}
	c.Data(http.StatusOK, "application/json", []byte(program.CommentsJSON))
}

func isValidJSON(s string) bool {
	var js json.RawMessage
	return json.Unmarshal([]byte(s), &js) == nil
}
