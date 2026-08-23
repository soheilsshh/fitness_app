package services

import (
	"log"
	"time"
)

// BotLogger provides structured logging for bot interactions
type BotLogger struct {
	prefix string
}

// NewBotLogger creates a new bot logger
func NewBotLogger() *BotLogger {
	return &BotLogger{
		prefix: "[Telegram Bot]",
	}
}

// LogCommand logs a command interaction
func (l *BotLogger) LogCommand(userID int64, command string) {
	log.Printf("%s [COMMAND] User:%d Command:%s Time:%s",
		l.prefix, userID, command, time.Now().Format(time.RFC3339))
}

// LogMessage logs a message interaction
func (l *BotLogger) LogMessage(userID int64, text string) {
	// Truncate long messages for logging
	logText := text
	if len(logText) > 100 {
		logText = logText[:100] + "..."
	}
	log.Printf("%s [MESSAGE] User:%d Text:%s Time:%s",
		l.prefix, userID, logText, time.Now().Format(time.RFC3339))
}

// LogCallback logs a callback interaction
func (l *BotLogger) LogCallback(userID int64, callbackData string) {
	log.Printf("%s [CALLBACK] User:%d Data:%s Time:%s",
		l.prefix, userID, callbackData, time.Now().Format(time.RFC3339))
}

// LogAPICall logs an API call
func (l *BotLogger) LogAPICall(endpoint string, params string) {
	log.Printf("%s [API] Endpoint:%s Params:%s Time:%s",
		l.prefix, endpoint, params, time.Now().Format(time.RFC3339))
}

// LogError logs an error
func (l *BotLogger) LogError(action string, err error) {
	log.Printf("%s [ERROR] Action:%s Error:%v Time:%s",
		l.prefix, action, err, time.Now().Format(time.RFC3339))
}

// LogSuccess logs a successful operation
func (l *BotLogger) LogSuccess(action string, details string) {
	log.Printf("%s [SUCCESS] Action:%s Details:%s Time:%s",
		l.prefix, action, details, time.Now().Format(time.RFC3339))
}

