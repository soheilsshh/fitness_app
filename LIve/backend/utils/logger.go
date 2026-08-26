package utils

import (
	"log"
	"os"
	"strings"
)

// LogLevel represents the logging level
type LogLevel int

const (
	LogLevelError LogLevel = iota
	LogLevelWarn
	LogLevelInfo
	LogLevelDebug
)

var currentLogLevel LogLevel = LogLevelInfo

// InitLogger initializes the logger based on environment variable
// LOG_LEVEL can be: error, warn, info, debug (default: info)
//
// Performance impact:
// - error: Minimal logging, best performance (production recommended)
// - warn: Errors + warnings only
// - info: Errors + warnings + info (default, balanced)
// - debug: All logs including verbose debug info (development only)
//
// Usage:
//
//	export LOG_LEVEL=error  # Production: minimal logging
//	export LOG_LEVEL=info   # Default: balanced
//	export LOG_LEVEL=debug  # Development: verbose logging
func InitLogger() {
	level := strings.ToLower(os.Getenv("LOG_LEVEL"))
	if level == "" {
		level = "info" // Default to info if not set
	}
	switch level {
	case "error":
		currentLogLevel = LogLevelError
	case "warn", "warning":
		currentLogLevel = LogLevelWarn
	case "debug":
		currentLogLevel = LogLevelDebug
	default:
		currentLogLevel = LogLevelInfo
	}
	log.Printf("📋 Logger initialized with level: %s (set LOG_LEVEL env var to change)", level)
	if currentLogLevel == LogLevelDebug {
		log.Printf("⚠️  DEBUG mode enabled - verbose logging may impact performance")
	}
}

// LogError logs error messages (always logged)
func LogError(format string, v ...interface{}) {
	log.Printf("❌ "+format, v...)
}

// LogWarn logs warning messages
func LogWarn(format string, v ...interface{}) {
	if currentLogLevel >= LogLevelWarn {
		log.Printf("⚠️  "+format, v...)
	}
}

// LogInfo logs info messages
func LogInfo(format string, v ...interface{}) {
	if currentLogLevel >= LogLevelInfo {
		log.Printf("ℹ️  "+format, v...)
	}
}

// LogDebug logs debug messages (only in debug mode)
func LogDebug(format string, v ...interface{}) {
	if currentLogLevel >= LogLevelDebug {
		log.Printf("🔍 "+format, v...)
	}
}

// LogSuccess logs success messages
func LogSuccess(format string, v ...interface{}) {
	if currentLogLevel >= LogLevelInfo {
		log.Printf("✅ "+format, v...)
	}
}

// IsDebugMode returns true if debug logging is enabled
func IsDebugMode() bool {
	return currentLogLevel >= LogLevelDebug
}
