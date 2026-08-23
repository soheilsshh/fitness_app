package controllers

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// VideoController handles video streaming
type VideoController struct {
	VideoPath string
}

// NewVideoController creates a new video controller
func NewVideoController(videoPath string) *VideoController {
	return &VideoController{
		VideoPath: videoPath,
	}
}

// StreamLiveVideo handles live video streaming (no seeking allowed)
func (vc *VideoController) StreamLiveVideo(c *gin.Context) {
	videoName := c.Param("video")
	if videoName == "" {
		videoName = "video1.mp4" // default video
	}

	// Security: prevent directory traversal
	if strings.Contains(videoName, "..") || strings.Contains(videoName, "/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video name"})
		return
	}

	videoPath := filepath.Join(vc.VideoPath, videoName)

	// Check if file exists
	if _, err := os.Stat(videoPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	// Get file info
	fileInfo, err := os.Stat(videoPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get video info"})
		return
	}

	// For live streaming, we don't support range requests
	rangeHeader := c.GetHeader("Range")
	if rangeHeader != "" {
		// Return 200 OK with full video for live streaming
		c.Header("Accept-Ranges", "none") // Disable seeking
		c.Header("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))
		c.Header("Content-Type", "video/mp4")
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Header("X-Live-Stream", "true")

		// Stream the full video without seeking
		vc.streamLive(c, videoPath)
		return
	}

	// Full video request for live streaming
	c.Header("Accept-Ranges", "none") // Disable seeking
	c.Header("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))
	c.Header("Content-Type", "video/mp4")
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	c.Header("X-Live-Stream", "true")

	// Stream the full video
	vc.streamLive(c, videoPath)
}

// streamLive streams the video as a live stream (no seeking)
func (vc *VideoController) streamLive(c *gin.Context, videoPath string) {
	file, err := os.Open(videoPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open video"})
		return
	}
	defer file.Close()

	// Set content type for live streaming
	c.Header("Content-Type", "video/mp4")

	// Create buffer for streaming
	buffer := make([]byte, 64*1024) // 64KB buffer for smoother streaming

	// Stream the file in chunks to simulate live streaming
	for {
		n, err := file.Read(buffer)
		if err != nil || n == 0 {
			break
		}

		// Check if client disconnected before writing
		if c.Writer.Status() == http.StatusOK {
			// Write chunk to response
			_, writeErr := c.Writer.Write(buffer[:n])
			if writeErr != nil {
				// Client disconnected, stop streaming
				break
			}

			// Flush the response to ensure data is sent immediately
			c.Writer.Flush()
		} else {
			// Response already sent, stop streaming
			break
		}

		// Small delay to simulate real-time streaming
		time.Sleep(10 * time.Millisecond)
	}
}

// StreamVideo uses http.ServeContent to handle video streaming efficiently.
// This method correctly handles range requests, content types, and caching.
func (vc *VideoController) StreamVideo(c *gin.Context) {
	videoName := c.Param("video")
	if videoName == "" {
		videoName = "video1.mp4" // default video
	}

	// Security: prevent directory traversal
	if strings.Contains(videoName, "..") || strings.Contains(videoName, "/") {
		c.String(http.StatusBadRequest, "Invalid video name")
		return
	}

	videoPath := filepath.Join(vc.VideoPath, videoName)

	file, err := os.Open(videoPath)
	if err != nil {
		if os.IsNotExist(err) {
			c.String(http.StatusNotFound, "Video not found")
			return
		}
		c.String(http.StatusInternalServerError, "Failed to open video")
		return
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to get video info")
		return
	}

	// http.ServeContent handles all the complexities of serving a file, including range requests.
	http.ServeContent(c.Writer, c.Request, fileInfo.Name(), fileInfo.ModTime(), file)
}
