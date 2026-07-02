package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type CoachProgramController struct {
	programService service.CoachProgramService
}

func NewCoachProgramController(s service.CoachProgramService) *CoachProgramController {
	return &CoachProgramController{programService: s}
}

func (h *CoachProgramController) GetStudentPrograms(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return
	}
	resp, err := h.programService.GetStudentPrograms(c.Request.Context(), coachID, uint(studentID))
	if err != nil {
		h.handleProgramError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachProgramController) AssignWorkoutProgram(c *gin.Context) {
	coachID, studentID, req, ok := h.parseAssignRequest(c)
	if !ok {
		return
	}
	resp, err := h.programService.AssignWorkoutProgram(c.Request.Context(), coachID, studentID, req)
	if err != nil {
		h.handleProgramError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *CoachProgramController) UpdateWorkoutProgram(c *gin.Context) {
	coachID, studentID, req, ok := h.parseAssignRequest(c)
	if !ok {
		return
	}
	programID, err := strconv.ParseUint(c.Param("programId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return
	}
	resp, err := h.programService.UpdateWorkoutProgram(c.Request.Context(), coachID, studentID, uint(programID), req)
	if err != nil {
		h.handleProgramError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachProgramController) AssignNutritionProgram(c *gin.Context) {
	coachID, studentID, req, ok := h.parseAssignRequest(c)
	if !ok {
		return
	}
	resp, err := h.programService.AssignNutritionProgram(c.Request.Context(), coachID, studentID, req)
	if err != nil {
		h.handleProgramError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *CoachProgramController) UpdateNutritionProgram(c *gin.Context) {
	coachID, studentID, req, ok := h.parseAssignRequest(c)
	if !ok {
		return
	}
	programID, err := strconv.ParseUint(c.Param("programId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return
	}
	resp, err := h.programService.UpdateNutritionProgram(c.Request.Context(), coachID, studentID, uint(programID), req)
	if err != nil {
		h.handleProgramError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachProgramController) ListWorkoutTemplates(c *gin.Context) {
	if _, err := middleware.GetUserID(c); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.programService.ListWorkoutTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachProgramController) ListNutritionTemplates(c *gin.Context) {
	if _, err := middleware.GetUserID(c); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.programService.ListNutritionTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *CoachProgramController) AssignWorkoutFromTemplate(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return
	}
	templateID, err := strconv.ParseUint(c.Param("templateId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template id"})
		return
	}
	resp, err := h.programService.AssignWorkoutFromTemplate(c.Request.Context(), coachID, uint(studentID), uint(templateID))
	if err != nil {
		h.handleProgramError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *CoachProgramController) AssignNutritionFromTemplate(c *gin.Context) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return
	}
	templateID, err := strconv.ParseUint(c.Param("templateId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template id"})
		return
	}
	resp, err := h.programService.AssignNutritionFromTemplate(c.Request.Context(), coachID, uint(studentID), uint(templateID))
	if err != nil {
		h.handleProgramError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *CoachProgramController) parseAssignRequest(c *gin.Context) (uint, uint, *service.ProgramAssignRequest, bool) {
	coachID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return 0, 0, nil, false
	}
	studentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return 0, 0, nil, false
	}
	var req service.ProgramAssignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return 0, 0, nil, false
	}
	return coachID, uint(studentID), &req, true
}

func (h *CoachProgramController) handleProgramError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrCoachStudentForbidden):
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
	case errors.Is(err, service.ErrCoachNoActiveSubscription):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case errors.Is(err, service.ErrCoachProgramNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
	case errors.Is(err, service.ErrCoachTemplateNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "template not found"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
