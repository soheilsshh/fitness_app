package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type AdminStudentController struct {
	studentService service.AdminStudentService
}

func NewAdminStudentController(s service.AdminStudentService) *AdminStudentController {
	return &AdminStudentController{studentService: s}
}

// ListStudents godoc
// @Summary List students for admin
// @Description Returns paginated list of students with status, plan info (for "شاگردهای من")
// @Tags admin-students
// @Produce json
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Param status query string false "Filter: all | pending | active"
// @Param query query string false "Search by name or phone"
// @Success 200 {object} service.AdminStudentListResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/students [get]
// @Security BearerAuth
func (h *AdminStudentController) ListStudents(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	page := 1
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	pageSize := 20
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	status := c.Query("status")
	if status == "" {
		status = "all"
	}
	query := c.Query("query")

	resp, err := h.studentService.ListStudents(c.Request.Context(), page, pageSize, status, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetStudentByID godoc
// @Summary Get student detail for admin
// @Description Returns one student with plan and optional startDate, durationDays, remainingDays
// @Tags admin-students
// @Produce json
// @Param id path int true "Student (user) ID"
// @Success 200 {object} service.AdminStudentDetail
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/students/{id} [get]
// @Security BearerAuth
func (h *AdminStudentController) GetStudentByID(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	detail, err := h.studentService.GetStudentByID(c.Request.Context(), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}

// UpdateStudent godoc
// @Summary Update student (status and/or assign plan)
// @Description PATCH body: status (pending|active) and/or planId to assign a plan
// @Tags admin-students
// @Accept json
// @Produce json
// @Param id path int true "Student (user) ID"
// @Param body body service.AdminStudentPatchRequest true "Optional status and planId"
// @Success 200 {object} map[string]string "message: ok"
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/students/{id} [patch]
// @Security BearerAuth
func (h *AdminStudentController) UpdateStudent(c *gin.Context) {
	_, _ = c.Get(middleware.ContextRoleKey)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.AdminStudentPatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	if err := h.studentService.UpdateStudent(c.Request.Context(), uint(id), &req); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "student or plan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}
