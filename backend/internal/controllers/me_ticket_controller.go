package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/yourusername/fitness-management/internal/middleware"
	"github.com/yourusername/fitness-management/internal/service"
)

type MeTicketController struct {
	ticketService service.TicketService
}

func NewMeTicketController(s service.TicketService) *MeTicketController {
	return &MeTicketController{ticketService: s}
}

// CreateTicket godoc
// @Summary Create a new ticket (student)
// @Tags me-ticket
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param body body service.TicketCreateRequest true "Ticket create request"
// @Success 201 {object} service.TicketDetailsDTO
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/tickets [post]
func (h *MeTicketController) CreateTicket(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req service.TicketCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	out, err := h.ticketService.CreateForStudent(c.Request.Context(), userID, &req)
	if err != nil {
		if errors.Is(err, service.ErrTicketCoachNotAssigned) {
			c.JSON(http.StatusConflict, gin.H{"error": "no assigned coach"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, out)
}

// ListTickets godoc
// @Summary List my tickets (student)
// @Tags me-ticket
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number"
// @Param pageSize query int false "Page size"
// @Success 200 {object} service.TicketListResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/tickets [get]
func (h *MeTicketController) ListTickets(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	pageSize := 8
	if ps := c.Query("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}

	resp, err := h.ticketService.ListForStudent(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetTicket godoc
// @Summary Get my ticket by id (student)
// @Tags me-ticket
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ticket ID"
// @Success 200 {object} service.TicketDetailsDTO
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /me/tickets/{id} [get]
func (h *MeTicketController) GetTicket(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ticket id"})
		return
	}

	resp, err := h.ticketService.GetForStudent(c.Request.Context(), userID, uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ticket not found"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

