package controllers

import (
	"context"
	"log"
	"fitino-live-backend/config"
	"net/http"
	"time"

	openai "github.com/sashabaranov/go-openai"
	"github.com/gin-gonic/gin"
)

type GroqChatController struct {
	Config *config.Config
	client *openai.Client
}

// NewGroqChatController creates a new Groq chat controller
func NewGroqChatController(fileConfig *config.Config) *GroqChatController {
	ctrl := &GroqChatController{
		Config: fileConfig,
	}

	// Initialize Groq client if enabled and API key is set
	if fileConfig.Groq.Enabled && fileConfig.Groq.APIKey != "" {
		// Create OpenAI-compatible config
		config := openai.DefaultConfig(fileConfig.Groq.APIKey)
		
		// IMPORTANT: Set Groq's base URL
		config.BaseURL = "https://api.groq.com/openai/v1"

		// Create client
		ctrl.client = openai.NewClientWithConfig(config)
		log.Printf("[GroqChat] ✅ Groq client initialized successfully")
		log.Printf("[GroqChat] 📍 Base URL: %s", config.BaseURL)
	} else {
		log.Printf("[GroqChat] ⚠️ Groq client not initialized (disabled or API key missing)")
	}

	return ctrl
}

// GroqChatRequest represents the request body for chat completion
type GroqChatRequest struct {
	Messages []GroqMessage `json:"messages" binding:"required"`
	Model    string        `json:"model"`
}

// GroqMessage represents a single message in the conversation
type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// GroqChatResponse represents the response from Groq API
type GroqChatResponse struct {
	ID      string    `json:"id"`
	Object  string    `json:"object"`
	Created int64     `json:"created"`
	Model   string    `json:"model"`
	Choices []Choice  `json:"choices"`
	Usage   Usage     `json:"usage"`
}

type Choice struct {
	Index        int     `json:"index"`
	Message      Message `json:"message"`
	FinishReason string  `json:"finish_reason"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// Chat handles the chat completion request
func (ctrl *GroqChatController) Chat(c *gin.Context) {
	log.Printf("[GroqChat] Request received")
	
	if !ctrl.Config.Groq.Enabled {
		log.Printf("[GroqChat] Groq AI is disabled")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Groq AI is disabled"})
		return
	}

	if ctrl.Config.Groq.APIKey == "" {
		log.Printf("[GroqChat] Groq API key is not configured")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Groq API key is not configured"})
		return
	}

	if ctrl.client == nil {
		log.Printf("[GroqChat] Groq client is not initialized")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Groq client is not initialized"})
		return
	}

	var req GroqChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[GroqChat] Invalid request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Default model if not specified - use config model or fallback to default
	model := req.Model
	if model == "" {
		if ctrl.Config.Groq.Model != "" {
			model = ctrl.Config.Groq.Model
		} else {
			model = "llama-3.3-70b-versatile"
		}
	}

	log.Printf("[GroqChat] Using model: %s", model)
	log.Printf("[GroqChat] Messages count: %d", len(req.Messages))

	// Convert messages to OpenAI format
	messages := make([]openai.ChatCompletionMessage, len(req.Messages))
	for i, msg := range req.Messages {
		messages[i] = openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	// Context with timeout (120 seconds recommended)
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	// Create chat completion request
	chatReq := openai.ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		MaxTokens:   4000,      // Recommended max tokens
		Temperature: 0.7,       // Balanced temperature (0.0-2.0)
	}

	log.Printf("[GroqChat] Sending request to Groq API...")
	resp, err := ctrl.client.CreateChatCompletion(ctx, chatReq)
	if err != nil {
		log.Printf("[GroqChat] Failed to call Groq API: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to communicate with Groq API",
			"details": err.Error(),
		})
		return
	}

	log.Printf("[GroqChat] ✅ Successfully received response from Groq API")
	log.Printf("[GroqChat] Response ID: %s", resp.ID)
	log.Printf("[GroqChat] Model used: %s", resp.Model)
	log.Printf("[GroqChat] Usage - Prompt: %d, Completion: %d, Total: %d", 
		resp.Usage.PromptTokens, resp.Usage.CompletionTokens, resp.Usage.TotalTokens)

	if len(resp.Choices) == 0 {
		log.Printf("[GroqChat] ⚠️ No choices in response")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response from Groq"})
		return
	}

	// Convert response to our format
	groqResp := GroqChatResponse{
		ID:      resp.ID,
		Object:  resp.Object,
		Created: resp.Created,
		Model:   resp.Model,
		Choices: make([]Choice, len(resp.Choices)),
		Usage: Usage{
			PromptTokens:     resp.Usage.PromptTokens,
			CompletionTokens: resp.Usage.CompletionTokens,
			TotalTokens:      resp.Usage.TotalTokens,
		},
	}

	for i, choice := range resp.Choices {
		groqResp.Choices[i] = Choice{
			Index:        choice.Index,
			FinishReason: string(choice.FinishReason),
			Message: Message{
				Role:    choice.Message.Role,
				Content: choice.Message.Content,
			},
		}
	}

	// Return the response
	c.JSON(http.StatusOK, groqResp)
}
