package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/service"
)

type AdminProgramController struct {
	svc service.AdminProgramService
}

func NewAdminProgramController(svc service.AdminProgramService) *AdminProgramController {
	return &AdminProgramController{svc: svc}
}

func (h *AdminProgramController) GetStudentPrograms(c *gin.Context) {
	studentID, ok := h.parseStudentID(c)
	if !ok {
		return
	}
	resp, err := h.svc.GetStudentPrograms(c.Request.Context(), studentID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminProgramController) AssignWorkoutProgram(c *gin.Context) {
	studentID, req, ok := h.parseAssign(c)
	if !ok {
		return
	}
	resp, err := h.svc.AssignWorkoutProgram(c.Request.Context(), studentID, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *AdminProgramController) UpdateWorkoutProgram(c *gin.Context) {
	studentID, req, ok := h.parseAssign(c)
	if !ok {
		return
	}
	programID, err := strconv.ParseUint(c.Param("programId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return
	}
	resp, err := h.svc.UpdateWorkoutProgram(c.Request.Context(), studentID, uint(programID), req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminProgramController) AssignNutritionProgram(c *gin.Context) {
	studentID, req, ok := h.parseAssign(c)
	if !ok {
		return
	}
	resp, err := h.svc.AssignNutritionProgram(c.Request.Context(), studentID, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *AdminProgramController) UpdateNutritionProgram(c *gin.Context) {
	studentID, req, ok := h.parseAssign(c)
	if !ok {
		return
	}
	programID, err := strconv.ParseUint(c.Param("programId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return
	}
	resp, err := h.svc.UpdateNutritionProgram(c.Request.Context(), studentID, uint(programID), req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminProgramController) AssignWorkoutFromTemplate(c *gin.Context) {
	studentID, ok := h.parseStudentID(c)
	if !ok {
		return
	}
	templateID, err := strconv.ParseUint(c.Param("templateId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template id"})
		return
	}
	resp, err := h.svc.AssignWorkoutFromTemplate(c.Request.Context(), studentID, uint(templateID))
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *AdminProgramController) AssignNutritionFromTemplate(c *gin.Context) {
	studentID, ok := h.parseStudentID(c)
	if !ok {
		return
	}
	templateID, err := strconv.ParseUint(c.Param("templateId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid template id"})
		return
	}
	resp, err := h.svc.AssignNutritionFromTemplate(c.Request.Context(), studentID, uint(templateID))
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *AdminProgramController) ListWorkoutTemplates(c *gin.Context) {
	resp, err := h.svc.ListWorkoutTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminProgramController) ListNutritionTemplates(c *gin.Context) {
	resp, err := h.svc.ListNutritionTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AdminProgramController) parseStudentID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid student id"})
		return 0, false
	}
	return uint(id), true
}

func (h *AdminProgramController) parseAssign(c *gin.Context) (uint, *service.ProgramAssignRequest, bool) {
	studentID, ok := h.parseStudentID(c)
	if !ok {
		return 0, nil, false
	}
	var req service.ProgramAssignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return 0, nil, false
	}
	return studentID, &req, true
}

func (h *AdminProgramController) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrAdminNoActiveSubscription), errors.Is(err, service.ErrCoachNoActiveSubscription):
		c.JSON(http.StatusBadRequest, gin.H{"error": "no active subscription"})
	case errors.Is(err, service.ErrCoachStudentForbidden):
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	case errors.Is(err, service.ErrCoachTemplateNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "template not found"})
	case errors.Is(err, service.ErrCoachProgramNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}
