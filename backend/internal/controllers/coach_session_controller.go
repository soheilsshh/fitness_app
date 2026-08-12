package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

// CoachSessionController implements the human-coach workflow for coaches
// (roadmap G1-G3): scheduling sessions, the periodic-review overdue flag,
// and sending text feedback to a student.
type CoachSessionController struct {
	svc service.CoachSessionService
}

func NewCoachSessionController(svc service.CoachSessionService) *CoachSessionController {
	return &CoachSessionController{svc: svc}
}

func (h *CoachSessionController) coachID(c *gin.Context) (uint, bool) {
	id, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return 0, false
	}
	return id, true
}

// ListSessions godoc
// @Summary List this coach's scheduled sessions
// @Tags coach-sessions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.SessionListResponse
// @Router /coach/sessions [get]
func (h *CoachSessionController) ListSessions(c *gin.Context) {
	coachID, ok := h.coachID(c)
	if !ok {
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.ListForCoach(c.Request.Context(), coachID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت جلسات"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// ScheduleSession godoc
// @Summary Schedule a session with a student
// @Tags coach-sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Student ID"
// @Param body body service.SessionUpsertRequest true "Session"
// @Success 201 {object} service.CoachSessionDTO
// @Router /coach/students/{id}/sessions [post]
func (h *CoachSessionController) ScheduleSession(c *gin.Context) {
	coachID, ok := h.coachID(c)
	if !ok {
		return
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || studentID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.SessionUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Schedule(c.Request.Context(), coachID, uint(studentID), &req)
	if err != nil {
		writeSessionError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto)
}

// UpdateSession godoc
// @Summary Update/reschedule a session
// @Tags coach-sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param sessionId path int true "Session ID"
// @Param body body service.SessionUpsertRequest true "Session"
// @Success 200 {object} service.CoachSessionDTO
// @Router /coach/sessions/{sessionId} [patch]
func (h *CoachSessionController) UpdateSession(c *gin.Context) {
	coachID, ok := h.coachID(c)
	if !ok {
		return
	}
	sessionID, err := strconv.ParseUint(c.Param("sessionId"), 10, 64)
	if err != nil || sessionID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req service.SessionUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	dto, err := h.svc.Update(c.Request.Context(), coachID, uint(sessionID), &req)
	if err != nil {
		writeSessionError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto)
}

// CancelSession godoc
// @Summary Cancel a session
// @Tags coach-sessions
// @Security BearerAuth
// @Param sessionId path int true "Session ID"
// @Success 200 {object} map[string]string
// @Router /coach/sessions/{sessionId} [delete]
func (h *CoachSessionController) CancelSession(c *gin.Context) {
	coachID, ok := h.coachID(c)
	if !ok {
		return
	}
	sessionID, err := strconv.ParseUint(c.Param("sessionId"), 10, 64)
	if err != nil || sessionID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Cancel(c.Request.Context(), coachID, uint(sessionID)); err != nil {
		writeSessionError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "cancelled"})
}

// ReviewStatus godoc
// @Summary Get the periodic-review overdue flag for a student
// @Tags coach-sessions
// @Produce json
// @Security BearerAuth
// @Param id path int true "Student ID"
// @Success 200 {object} service.ReviewStatusDTO
// @Router /coach/students/{id}/review-status [get]
func (h *CoachSessionController) ReviewStatus(c *gin.Context) {
	coachID, ok := h.coachID(c)
	if !ok {
		return
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || studentID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	dto, err := h.svc.ReviewStatus(c.Request.Context(), coachID, uint(studentID))
	if err != nil {
		writeSessionError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto)
}

// SendFeedback godoc
// @Summary Send text feedback to a student (periodic review)
// @Tags coach-sessions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Student ID"
// @Param body body map[string]string true "feedback"
// @Success 200 {object} map[string]string
// @Router /coach/students/{id}/feedback [post]
func (h *CoachSessionController) SendFeedback(c *gin.Context) {
	coachID, ok := h.coachID(c)
	if !ok {
		return
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || studentID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		Feedback string `json:"feedback"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if err := h.svc.SendFeedback(c.Request.Context(), coachID, uint(studentID), body.Feedback); err != nil {
		writeSessionError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "sent"})
}

func writeSessionError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrSessionNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "جلسه پیدا نشد"})
	case errors.Is(err, service.ErrCoachStudentForbidden):
		c.JSON(http.StatusForbidden, gin.H{"error": "این شاگرد به شما تعلق ندارد"})
	case errors.Is(err, service.ErrSessionTypeInvalid):
		c.JSON(http.StatusBadRequest, gin.H{"error": "نوع جلسه باید حضوری یا آنلاین باشد"})
	case errors.Is(err, service.ErrSessionTimeRequired):
		c.JSON(http.StatusBadRequest, gin.H{"error": "زمان جلسه معتبر نیست"})
	case errors.Is(err, service.ErrFeedbackRequired):
		c.JSON(http.StatusBadRequest, gin.H{"error": "متن فیدبک الزامی است"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطای داخلی"})
	}
}

// MeSessionController exposes the student's own session calendar (read-only, FE-9.5).
type MeSessionController struct {
	svc service.CoachSessionService
}

func NewMeSessionController(svc service.CoachSessionService) *MeSessionController {
	return &MeSessionController{svc: svc}
}

// ListMySessions godoc
// @Summary List my scheduled sessions with my coach
// @Tags me-sessions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} service.SessionListResponse
// @Router /me/sessions [get]
func (h *MeSessionController) ListMySessions(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))
	resp, err := h.svc.ListForStudent(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "خطا در دریافت جلسات"})
		return
	}
	c.JSON(http.StatusOK, resp)
}
