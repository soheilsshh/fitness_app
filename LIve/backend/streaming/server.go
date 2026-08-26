package streaming

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/nareix/joy4/av/avutil"
	"github.com/nareix/joy4/av/pubsub"
	"github.com/nareix/joy4/format"
	"github.com/nareix/joy4/format/flv"
	"github.com/nareix/joy4/format/rtmp"
)

func init() {
	format.RegisterAll()
}

// HLSLevelConfig holds configuration for a single HLS quality level
type HLSLevelConfig struct {
	Height  int    // Target height (e.g., 720, 480, 360)
	Bitrate string // Target bitrate (e.g., "2500k", "1500k", "800k")
	Maxrate string // Max bitrate (e.g., "2800k", "1700k", "1000k")
	Bufsize string // Buffer size (e.g., "5000k", "3000k", "2000k")
	Profile string // H.264 profile (e.g., "main", "baseline")
	Level   string // H.264 level (e.g., "3.1", "3.0")
}

// HLSEncodingConfig holds configurable encoding parameters for HLS optimization
type HLSEncodingConfig struct {
	// Multi-bitrate support
	EnableMultiBitrate bool             // Enable multi-bitrate HLS (ABR)
	Levels             []HLSLevelConfig // Quality levels (720p, 480p, 360p)

	// Single-bitrate (legacy, for backward compatibility)
	VideoCodec   string // "libx264" for encoding, "copy" for passthrough
	VideoBitrate string // Target bitrate (e.g., "2000k")
	VideoMaxrate string // Max bitrate (e.g., "2400k")
	VideoBufsize string // Buffer size (e.g., "4000k")
	VideoPreset  string // x264 preset (e.g., "veryfast")
	VideoProfile string // H.264 profile (e.g., "main")
	VideoLevel   string // H.264 level (e.g., "3.1")
	VideoFPS     int    // Target FPS (0 = preserve source)
	VideoGOP     int    // GOP size (0 = auto)

	// Audio encoding
	AudioCodec      string // "aac"
	AudioBitrate    string // "128k"
	AudioChannels   int    // 2
	AudioSampleRate int    // 44100

	// HLS settings
	HLSTime     int    // Segment duration in seconds (2-4 recommended)
	HLSListSize int    // Number of segments in playlist (10-15 recommended)
	HLSFlags    string // HLS flags (e.g., "delete_segments+program_date_time+independent_segments")
}

// DefaultHLSEncodingConfig returns optimized HLS encoding config for mobile devices
// Optimized for webinar streaming on weak mobile devices - single quality only
func DefaultHLSEncodingConfig() HLSEncodingConfig {
	return HLSEncodingConfig{
		// DISABLED: Multi-bitrate disabled for stability
		EnableMultiBitrate: false,
		Levels:             []HLSLevelConfig{},

		// Single-bitrate config optimized for weak mobile devices:
		// - Lower bitrate (1500k) for maximum stability on weak devices
		// - 540p max resolution (960x540) - optimal balance for webinars
		// - Conservative buffer settings to prevent overload
		// - Smaller segments (2s) for faster startup and less lag
		VideoCodec:   "libx264",
		VideoBitrate: "1500k",     // Reduced for maximum stability on weak mobile devices
		VideoMaxrate: "1800k",     // 1.2x of bitrate (1500k * 1.2)
		VideoBufsize: "3000k",     // 2x of bitrate (1500k * 2)
		VideoPreset:  "ultrafast", // Ultrafast encoding for minimal lag (changed from veryfast)
		VideoProfile: "baseline",  // Baseline profile for better decode performance on weak Android devices
		VideoLevel:   "3.1",       // Level 3.1 supports up to 720p@30fps (540p is well within)
		VideoFPS:     30,          // 30 fps (smoother motion for webinars)
		VideoGOP:     60,          // GOP = 2 seconds at 30fps (maintains sync with audio)

		// Audio: Standard AAC (optimized for webinar quality)
		AudioCodec:      "aac",
		AudioBitrate:    "96k", // 96k for high-quality speech in webinars
		AudioChannels:   2,
		AudioSampleRate: 44100,

		// HLS: Optimized for minimal lag - smaller segments for faster startup
		HLSTime:     2,                                      // 2 seconds (smaller segments = less lag, faster startup)
		HLSListSize: 15,                                     // 15 segments = ~30 seconds buffer (good balance)
		HLSFlags:    "delete_segments+independent_segments", // delete_segments: Auto-delete old segments to prevent disk accumulation and lag
	}
}

// Global state to track if a stream is currently running
var (
	streamRunning          bool
	streamMutex            sync.Mutex
	currentStreamStartTime time.Time // CRITICAL: Actual time when stream started (Asia/Tehran timezone)
	currentStreamEndTime   time.Time
	currentStreamCancel    context.CancelFunc // Context to cancel current stream
	currentStreamCtx       context.Context    // Context for current stream
	currentFFmpegProcess   *exec.Cmd          // Track FFmpeg process to kill it if needed
	ffmpegMutex            sync.Mutex         // Mutex for FFmpeg process
	hlsEncodingConfig      HLSEncodingConfig  // HLS encoding configuration
)

// IsStreamRunning returns whether a stream is currently running
func IsStreamRunning() bool {
	streamMutex.Lock()
	defer streamMutex.Unlock()
	return streamRunning
}

// GetStreamEndTime returns the end time of the current stream
func GetStreamEndTime() time.Time {
	streamMutex.Lock()
	defer streamMutex.Unlock()
	return currentStreamEndTime
}

// GetStreamStartTime returns the actual start time of the current stream (Asia/Tehran timezone)
// Returns zero time if no stream is running or start time not yet set
func GetStreamStartTime() time.Time {
	streamMutex.Lock()
	defer streamMutex.Unlock()
	return currentStreamStartTime
}

// SetStreamStartTime sets the actual start time of the current stream (must be called when stream actually starts)
// This should be called with the current time in Asia/Tehran timezone when streaming begins
func SetStreamStartTime(t time.Time) {
	streamMutex.Lock()
	defer streamMutex.Unlock()
	currentStreamStartTime = t
	log.Printf("📅 Stream start time set to: %s (Asia/Tehran)", t.Format("2006-01-02 15:04:05"))
}

// StopStream stops the currently running stream immediately
// This is used when admin changes webinar time and stream needs to be stopped
func StopStream(rtmpURL string) {
	streamMutex.Lock()
	defer streamMutex.Unlock()

	if !streamRunning {
		log.Printf("ℹ️  No stream is currently running. Nothing to stop.")
		return
	}

	log.Printf("🛑 Stopping current stream (ends at %s) due to config change...",
		currentStreamEndTime.Format("2006-01-02 15:04:05"))

	// Cancel the stream context to stop it
	if currentStreamCancel != nil {
		currentStreamCancel()
		log.Printf("✅ Stream cancellation signal sent")
	}

	// Kill FFmpeg process if running
	ffmpegMutex.Lock()
	if currentFFmpegProcess != nil && currentFFmpegProcess.Process != nil {
		log.Printf("🛑 Killing FFmpeg process (PID: %d)", currentFFmpegProcess.Process.Pid)
		currentFFmpegProcess.Process.Kill()
		currentFFmpegProcess = nil
	}
	ffmpegMutex.Unlock()

	// Clean up old HLS segments and playlist
	cleanupHLSSegments(rtmpURL)

	// Clear old RTMP channel
	streamPath := "/live/stream" // default
	if rtmpURL != "" {
		if idx := strings.Index(rtmpURL, "://"); idx != -1 {
			pathStart := strings.Index(rtmpURL[idx+3:], "/")
			if pathStart != -1 {
				streamPath = rtmpURL[idx+3+pathStart:]
			}
		}
	}

	// Clear the old channel if server instance is available
	if globalStreamServer != nil {
		globalStreamServer.ClearChannel(streamPath)
	}

	// Reset stream state
	streamRunning = false
	currentStreamCancel = nil
	currentStreamCtx = nil
	currentStreamStartTime = time.Time{}
	currentStreamEndTime = time.Time{}

	log.Printf("✅ Stream stopped successfully. Waiting for new schedule...")
}

// Channel represents a single stream channel
type Channel struct {
	que *pubsub.Queue
}

type writeFlusher struct {
	httpflusher http.Flusher
	io.Writer
}

func (wf *writeFlusher) Flush() error {
	wf.httpflusher.Flush()
	return nil
}

// Server holds the state for the streaming server
type Server struct {
	rtmpServer     *rtmp.Server
	channels       map[string]*Channel
	mutex          *sync.RWMutex
	allowedOrigins []string
}

// Global reference to the streaming server instance
var globalStreamServer *Server

// GetGlobalStreamServer returns the global streaming server instance
func GetGlobalStreamServer() *Server {
	return globalStreamServer
}

// SetGlobalStreamServer sets the global streaming server instance
func SetGlobalStreamServer(server *Server) {
	globalStreamServer = server
}

// ClearChannel removes a channel from the server, ensuring fresh start
func (s *Server) ClearChannel(streamPath string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if ch, exists := s.channels[streamPath]; exists {
		log.Printf("🗑️  Clearing old RTMP channel for %s to ensure fresh start", streamPath)
		ch.que.Close()
		delete(s.channels, streamPath)
		log.Printf("✅ Old RTMP channel cleared for %s", streamPath)
	} else {
		log.Printf("📂 No existing RTMP channel to clear for %s (this is fine for first stream)", streamPath)
	}
}

// NewServer creates a new streaming server
func NewServer(allowedOrigins []string) *Server {
	// If no origins specified, allow all
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"*"}
	}

	s := &Server{
		rtmpServer:     &rtmp.Server{},
		channels:       make(map[string]*Channel),
		mutex:          &sync.RWMutex{},
		allowedOrigins: allowedOrigins,
	}
	s.setupHandlers()
	return s
}

// setupHandlers configures the RTMP and HTTP handlers
func (s *Server) setupHandlers() {
	s.rtmpServer.HandlePlay = func(conn *rtmp.Conn) {
		s.mutex.RLock()
		ch := s.channels[conn.URL.Path]
		s.mutex.RUnlock()

		if ch != nil {
			cursor := ch.que.Latest()
			avutil.CopyFile(conn, cursor)
		}
	}

	s.rtmpServer.HandlePublish = func(conn *rtmp.Conn) {
		streams, _ := conn.Streams()

		s.mutex.Lock()
		ch := s.channels[conn.URL.Path]
		if ch == nil {
			ch = &Channel{
				que: pubsub.NewQueue(),
			}
			ch.que.WriteHeader(streams)
			s.channels[conn.URL.Path] = ch
		} else {
			ch = nil // Channel already exists, deny publish
		}
		s.mutex.Unlock()

		if ch == nil {
			return
		}

		// Start FFmpeg process to convert RTMP to HLS
		go s.startHLSProcess(conn.URL.Path)

		avutil.CopyPackets(ch.que, conn)

		s.mutex.Lock()
		delete(s.channels, conn.URL.Path)
		s.mutex.Unlock()
		ch.que.Close()
		log.Printf("Stream %s closed", conn.URL.Path)
	}
}

// Start runs the RTMP and HTTP servers
func (s *Server) Start(rtmpAddr, httpAddr string) {
	// Create directory for HLS segments
	hlsPath := "hls_media"
	if err := os.MkdirAll(hlsPath, 0755); err != nil {
		log.Fatalf("Failed to create HLS media directory: %v", err)
	}

	// HTTP server for both FLV and HLS
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleHTTPFLV) // Existing FLV handler

	// Add HLS handler
	hlsHandler := http.StripPrefix("/hls/", http.FileServer(http.Dir(hlsPath)))
	mux.HandleFunc("/hls/", func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		s.setCORSHeaders(w, r)

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// CRITICAL: Disable caching for HLS files to ensure fresh content
		// This prevents browser from using old segments
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		// Set appropriate Content-Type for HLS files
		if filepath.Ext(r.URL.Path) == ".m3u8" {
			w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
		} else if filepath.Ext(r.URL.Path) == ".ts" {
			w.Header().Set("Content-Type", "video/MP2T")
		}

		hlsHandler.ServeHTTP(w, r)
	})

	go func() {
		log.Printf("HTTP-FLV and HLS server listening on %s", httpAddr)
		if err := http.ListenAndServe(httpAddr, mux); err != nil {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	// RTMP server
	s.rtmpServer.Addr = rtmpAddr
	log.Printf("RTMP server listening on %s", rtmpAddr)
	if err := s.rtmpServer.ListenAndServe(); err != nil {
		log.Fatalf("RTMP server error: %v", err)
	}
}

// handleHTTPFLV serves the stream over HTTP-FLV
func (s *Server) handleHTTPFLV(w http.ResponseWriter, r *http.Request) {
	// If the request is for HLS, let the HLS handler take care of it.
	if filepath.Ext(r.URL.Path) == ".m3u8" || filepath.Ext(r.URL.Path) == ".ts" {
		return
	}

	// Set CORS headers
	s.setCORSHeaders(w, r)

	// Handle preflight requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	s.mutex.RLock()
	ch := s.channels[r.URL.Path]
	s.mutex.RUnlock()

	if ch != nil {
		w.Header().Set("Content-Type", "video/x-flv")
		w.Header().Set("Transfer-Encoding", "chunked")
		w.WriteHeader(http.StatusOK)
		flusher, ok := w.(http.Flusher)
		if !ok {
			log.Println("HTTP writer does not support flushing")
			return
		}
		flusher.Flush()

		muxer := flv.NewMuxerWriteFlusher(&writeFlusher{httpflusher: flusher, Writer: w})
		cursor := ch.que.Latest()
		avutil.CopyFile(muxer, cursor)
	} else {
		http.NotFound(w, r)
	}
}

// setCORSHeaders sets CORS headers based on allowed origins
func (s *Server) setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")

	// Check if origin is in allowed list
	allowed := false
	for _, allowedOrigin := range s.allowedOrigins {
		if allowedOrigin == "*" || allowedOrigin == origin {
			allowed = true
			if allowedOrigin == "*" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			} else {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
			}
			break
		}
	}

	if !allowed && origin != "" {
		// If origin not allowed but origin header exists, don't set CORS
		return
	}

	// Set other CORS headers
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Range")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range")
	w.Header().Set("Access-Control-Max-Age", "86400")
}

// cleanupHLSSegments removes old HLS segments and playlist to ensure fresh start
// IMPORTANT: This function ONLY removes real-time streaming files, NOT pre-generated files
// Pre-generated files (stream.m3u8, stream_low.m3u8 and their segments) are preserved
func cleanupHLSSegments(rtmpURL string) {
	hlsPath := "hls_media"

	// Extract stream name from RTMP URL (e.g., rtmp://localhost:1935/live/stream -> stream)
	streamName := "stream" // default
	if rtmpURL != "" {
		// Parse URL to get path (e.g., /live/stream)
		// RTMP URLs are like: rtmp://host:port/path
		// We need to extract the last part of the path
		u := rtmpURL
		// Find the last / after the protocol
		if idx := strings.LastIndex(u, "/"); idx != -1 {
			lastPart := u[idx+1:]
			if lastPart != "" {
				streamName = lastPart
			}
		}
	}

	// CRITICAL: If pre-generated files exist, skip ALL cleanup to preserve them
	// Pre-generated files should NEVER be deleted - they are generated once and used forever
	if HasPreGeneratedHLS() {
		log.Printf("🛡️  Pre-generated HLS files detected. Skipping ALL cleanup to preserve pre-generated files.")
		log.Printf("   Pre-generated files will remain intact for future use.")
		return // Exit early - do not clean anything
	}

	m3u8File := filepath.Join(hlsPath, streamName+".m3u8")

	// Delete .m3u8 playlist file (only when pre-generated files don't exist)
	if err := os.Remove(m3u8File); err != nil {
		if !os.IsNotExist(err) {
			log.Printf("⚠️  Could not remove old HLS playlist %s: %v", m3u8File, err)
		} else {
			log.Printf("📂 No existing HLS playlist to remove (this is fine for first stream)")
		}
	} else {
		log.Printf("🗑️  Removed old HLS playlist: %s", m3u8File)
	}

	// Delete .ts segment files (only when pre-generated files don't exist)
	dir, err := os.Open(hlsPath)
	if err != nil {
		log.Printf("⚠️  Could not open HLS directory %s: %v", hlsPath, err)
		return
	}
	defer dir.Close()

	files, err := dir.Readdir(-1)
	if err != nil {
		log.Printf("⚠️  Could not read HLS directory %s: %v", hlsPath, err)
		return
	}

	removedCount := 0
	for _, file := range files {
		if filepath.Ext(file.Name()) == ".ts" {
			tsFile := filepath.Join(hlsPath, file.Name())
			if err := os.Remove(tsFile); err != nil {
				log.Printf("⚠️  Could not remove old HLS segment %s: %v", tsFile, err)
			} else {
				removedCount++
			}
		}
	}

	if removedCount > 0 {
		log.Printf("🗑️  Removed %d old HLS segment files", removedCount)
	} else {
		log.Printf("📂 No old HLS segments to remove (this is fine for first stream)")
	}
}

// startHLSProcess converts RTMP stream to HLS with optimized encoding for mobile devices
// Supports both single-bitrate (legacy) and multi-bitrate (ABR) modes
func (s *Server) startHLSProcess(streamPath string) {
	// Log FFmpeg start time for startup profiling
	ffmpegStartTime := time.Now()
	log.Printf("⏱️ [BACKEND] FFmpeg process starting at %s for stream %s", ffmpegStartTime.Format("2006-01-02 15:04:05.000"), streamPath)

	// Use default optimized config (can be customized later via config file/database)
	config := DefaultHLSEncodingConfig()

	var ffmpegCmd *exec.Cmd

	if config.EnableMultiBitrate && len(config.Levels) > 0 {
		// Multi-bitrate HLS (ABR) mode
		ffmpegCmd = s.buildMultiBitrateHLSCommand(streamPath, config, ffmpegStartTime)
	} else {
		// Single-bitrate HLS (legacy mode)
		ffmpegCmd = s.buildSingleBitrateHLSCommand(streamPath, config, ffmpegStartTime)
	}

	if ffmpegCmd == nil {
		log.Printf("❌ Failed to build FFmpeg command for stream %s", streamPath)
		return
	}

	// Build low-bitrate HLS command for weak Android devices
	ffmpegCmdLow := s.buildLowBitrateHLSCommand(streamPath, config, ffmpegStartTime)

	ffmpegCmd.Stdout = os.Stdout
	ffmpegCmd.Stderr = os.Stderr

	// Track FFmpeg process
	ffmpegMutex.Lock()
	currentFFmpegProcess = ffmpegCmd
	ffmpegMutex.Unlock()

	// Start low-bitrate HLS in a separate goroutine
	if ffmpegCmdLow != nil {
		ffmpegCmdLow.Stdout = os.Stdout
		ffmpegCmdLow.Stderr = os.Stderr
		go func() {
			log.Printf("🎬 Starting low-bitrate HLS process for stream %s", streamPath)
			if err := ffmpegCmdLow.Run(); err != nil {
				log.Printf("❌ Low-bitrate FFmpeg process for stream %s finished with error: %v", streamPath, err)
			} else {
				log.Printf("✅ Low-bitrate FFmpeg process for stream %s finished successfully.", streamPath)
			}
		}()
	}

	if err := ffmpegCmd.Run(); err != nil {
		log.Printf("❌ FFmpeg process for stream %s finished with error: %v", streamPath, err)
		log.Printf("❌ FFmpeg command was: ffmpeg %s", strings.Join(ffmpegCmd.Args[1:], " "))
	} else {
		log.Printf("✅ FFmpeg process for stream %s finished successfully.", streamPath)
	}

	// Clear reference when done
	ffmpegMutex.Lock()
	currentFFmpegProcess = nil
	ffmpegMutex.Unlock()
}

// buildMultiBitrateHLSCommand builds FFmpeg command for multi-bitrate HLS (ABR)
func (s *Server) buildMultiBitrateHLSCommand(streamPath string, config HLSEncodingConfig, ffmpegStartTime time.Time) *exec.Cmd {
	numLevels := len(config.Levels)
	if numLevels == 0 {
		log.Printf("⚠️ Multi-bitrate enabled but no levels configured, falling back to single-bitrate")
		return nil
	}

	log.Printf("🎬 Building multi-bitrate HLS with %d quality levels", numLevels)

	// Base arguments
	args := []string{
		"-i", "rtmp://localhost:1935" + streamPath,
		"-copyts",
		"-fflags", "+genpts",
	}

	// Build filter_complex for splitting and scaling video
	// Format: [0:v]split=N[v0][v1][v2]; [v0]scale=-2:720[v0out]; [v1]scale=-2:480[v1out]; [v2]scale=-2:360[v2out]
	var splitOutputs []string
	var scaleFilters []string

	for i := 0; i < numLevels; i++ {
		splitOutputs = append(splitOutputs, fmt.Sprintf("[v%d]", i))
		scaleFilters = append(scaleFilters, fmt.Sprintf("[v%d]scale=-2:%d:flags=lanczos[v%dout]", i, config.Levels[i].Height, i))
	}

	filterComplex := fmt.Sprintf("[0:v]split=%d%s; %s",
		numLevels,
		strings.Join(splitOutputs, ""),
		strings.Join(scaleFilters, "; "))

	args = append(args, "-filter_complex", filterComplex)

	// Build var_stream_map: "v:0,a:0 v:1,a:1 v:2,a:2"
	var varStreamMapParts []string
	for i := 0; i < numLevels; i++ {
		varStreamMapParts = append(varStreamMapParts, fmt.Sprintf("v:%d,a:%d", i, i))
	}

	// Add encoding parameters for each level
	for i, level := range config.Levels {
		// Map scaled video output
		args = append(args, "-map", fmt.Sprintf("[v%dout]", i))
		// Map audio (same audio for all levels)
		args = append(args, "-map", "0:a:0")

		// Video encoding for this level
		args = append(args,
			fmt.Sprintf("-c:v:%d", i), "libx264",
			fmt.Sprintf("-preset:v:%d", i), "veryfast",
			fmt.Sprintf("-profile:v:%d", i), level.Profile,
			fmt.Sprintf("-level:v:%d", i), level.Level,
			fmt.Sprintf("-b:v:%d", i), level.Bitrate,
			fmt.Sprintf("-maxrate:v:%d", i), level.Maxrate,
			fmt.Sprintf("-bufsize:v:%d", i), level.Bufsize,
			fmt.Sprintf("-pix_fmt:v:%d", i), "yuv420p",
		)

		// FPS and GOP (same for all levels)
		if config.VideoFPS > 0 {
			args = append(args, fmt.Sprintf("-r:v:%d", i), fmt.Sprintf("%d", config.VideoFPS))
		}
		if config.VideoGOP > 0 {
			args = append(args,
				fmt.Sprintf("-g:v:%d", i), fmt.Sprintf("%d", config.VideoGOP),
				fmt.Sprintf("-keyint_min:v:%d", i), fmt.Sprintf("%d", config.VideoGOP),
			)
			args = append(args, fmt.Sprintf("-x264-params:v:%d", i), "scenecut=0")
		}

		// Audio encoding (same for all levels)
		args = append(args,
			fmt.Sprintf("-c:a:%d", i), config.AudioCodec,
			fmt.Sprintf("-b:a:%d", i), config.AudioBitrate,
			fmt.Sprintf("-ac:a:%d", i), fmt.Sprintf("%d", config.AudioChannels),
			fmt.Sprintf("-ar:a:%d", i), fmt.Sprintf("%d", config.AudioSampleRate),
		)
	}

	// HLS output settings
	baseName := filepath.Base(streamPath)
	masterPlaylist := filepath.Join("hls_media", baseName+".m3u8")
	segmentPattern := filepath.Join("hls_media", baseName+"_%v_%03d.ts")

	args = append(args,
		"-f", "hls",
		"-hls_segment_type", "mpegts",
		"-hls_time", fmt.Sprintf("%d", config.HLSTime),
		"-hls_list_size", fmt.Sprintf("%d", config.HLSListSize),
		"-hls_flags", config.HLSFlags,
		"-master_pl_name", filepath.Base(masterPlaylist),
		"-var_stream_map", strings.Join(varStreamMapParts, " "),
		"-hls_segment_filename", segmentPattern,
		filepath.Join("hls_media", baseName+"_%v.m3u8"),
	)

	// Log configuration
	log.Printf("📊 Multi-bitrate HLS Config: %d levels, hls_time=%d, hls_list_size=%d", numLevels, config.HLSTime, config.HLSListSize)
	for i, level := range config.Levels {
		log.Printf("📊 Level %d: %dp, bitrate=%s, maxrate=%s, profile=%s@%s",
			i, level.Height, level.Bitrate, level.Maxrate, level.Profile, level.Level)
	}
	log.Printf("📊 Master playlist: %s", masterPlaylist)

	// Monitor first segment creation
	go func() {
		firstSegmentWait := time.Duration(config.HLSTime+1) * time.Second
		time.Sleep(firstSegmentWait)

		// Check for first segments (any level)
		segmentPattern := filepath.Join("hls_media", baseName+"_*_*.ts")
		matches, err := filepath.Glob(segmentPattern)
		if err == nil && len(matches) > 0 {
			firstSegmentTime := time.Now()
			timeSinceStart := firstSegmentTime.Sub(ffmpegStartTime)
			log.Printf("⏱️ [BACKEND] First HLS segments created at %s (%.2fs after FFmpeg start)",
				firstSegmentTime.Format("2006-01-02 15:04:05.000"), timeSinceStart.Seconds())
		} else {
			log.Printf("⚠️ [BACKEND] First HLS segments not found after %.2fs - stream may not be ready yet",
				firstSegmentWait.Seconds())
		}
	}()

	return exec.Command("ffmpeg", args...)
}

// buildSingleBitrateHLSCommand builds FFmpeg command for single-bitrate HLS
// Optimized for webinar streaming on mobile devices
func (s *Server) buildSingleBitrateHLSCommand(streamPath string, config HLSEncodingConfig, ffmpegStartTime time.Time) *exec.Cmd {
	log.Printf("🎬 Building single-bitrate HLS (mobile-optimized)")

	// Current HLS command template (documented - optimized for weak mobile devices):
	// ffmpeg -i rtmp://localhost:1935/live/stream \
	//   -map 0:v:0 -map 0:a:0 \
	//   -copyts -fflags +genpts \
	//   -c:v libx264 -preset veryfast -tune zerolatency \
	//   -profile:v main -level 3.1 \
	//   -b:v 1500k -maxrate 1800k -bufsize 3000k \
	//   -r 30 -g 60 -keyint_min 60 -x264-params scenecut=0 \
	//   -pix_fmt yuv420p \
	//   -vf scale='min(960,iw)':'min(540,ih)':force_original_aspect_ratio=decrease:flags=lanczos \
	//   -c:a aac -b:a 96k -ac 2 -ar 44100 \
	//   -async 1 -vsync 1 \
	//   -hls_segment_type mpegts -hls_time 4 -hls_list_size 12 \
	//   -hls_flags independent_segments \
	//   -f hls hls_media/stream.m3u8
	//
	// Key optimizations for weak mobile devices:
	// - Resolution: 540p (960x540) instead of 720p - reduces decode load by ~40%
	// - Bitrate: 1500k instead of 1800k - reduces network/CPU load
	// - Audio: 96k for high-quality speech in webinars
	// - Framerate: 30fps for smoother motion
	// - GOP: 60 (2s at 30fps) for better sync with audio
	// - Segment duration: 4s instead of 3s - more stable buffering
	// - Buffer: 12 segments (~48s) instead of 10 segments (~30s) - more stable

	args := []string{
		"-i", "rtmp://localhost:1935" + streamPath,
		"-map", "0:v:0",
		"-map", "0:a:0",
		"-copyts",
		"-fflags", "+genpts",
		"-use_wallclock_as_timestamps", "1",
	}

	// Video encoding - optimized for mobile/webinar
	if config.VideoCodec == "libx264" {
		args = append(args,
			"-c:v", "libx264",
			"-preset", config.VideoPreset, // veryfast for real-time encoding
			"-tune", "zerolatency,fastdecode", // Optimize for low latency and fast decode on mobile
			"-profile:v", config.VideoProfile, // baseline profile for better decode performance
			"-level", config.VideoLevel, // 3.1 for 720p@30fps
			"-b:v", config.VideoBitrate, // 1800k (optimized for mobile)
			"-maxrate", config.VideoMaxrate, // 2160k (1.2x bitrate)
			"-bufsize", config.VideoBufsize, // 3600k (2x bitrate)
			"-pix_fmt", "yuv420p", // Ensure compatibility with all devices
		)

		// Scale video to max 960x540 if source is higher (for weak mobile optimization)
		// 540p is optimal balance for webinars - reduces decode load significantly
		// Using lanczos for better quality scaling
		args = append(args,
			"-vf", "scale='min(960,iw)':'min(540,ih)':force_original_aspect_ratio=decrease:flags=lanczos",
		)

		// FPS: Set target FPS if specified
		if config.VideoFPS > 0 {
			args = append(args, "-r", fmt.Sprintf("%d", config.VideoFPS))
		}

		// GOP: Set GOP size for better seeking and lower latency
		if config.VideoGOP > 0 {
			args = append(args,
				"-g", fmt.Sprintf("%d", config.VideoGOP),
				"-keyint_min", fmt.Sprintf("%d", config.VideoGOP),
			)
			// Disable scenecut detection and B-frames for consistent GOP and faster decode
			args = append(args, "-x264-params", "scenecut=0:bframes=0")
		}
	} else {
		args = append(args, "-c:v", "copy")
	}

	// Audio encoding
	args = append(args,
		"-c:a", config.AudioCodec,
		"-b:a", config.AudioBitrate,
		"-ac", fmt.Sprintf("%d", config.AudioChannels),
		"-ar", fmt.Sprintf("%d", config.AudioSampleRate),
	)

	// HLS output
	hlsOutputPath := filepath.Join("hls_media", filepath.Base(streamPath)+".m3u8")
	args = append(args,
		"-hls_segment_type", "mpegts",
		"-hls_time", fmt.Sprintf("%d", config.HLSTime),
		"-hls_list_size", fmt.Sprintf("%d", config.HLSListSize),
		"-hls_flags", config.HLSFlags,
		"-f", "hls",
		hlsOutputPath,
	)

	// Log encoding configuration for debugging
	log.Printf("📊 Single-bitrate HLS Config (mobile-optimized):")
	log.Printf("   Video: codec=%s, bitrate=%s, maxrate=%s, bufsize=%s, fps=%d, gop=%d",
		config.VideoCodec, config.VideoBitrate, config.VideoMaxrate, config.VideoBufsize, config.VideoFPS, config.VideoGOP)
	log.Printf("   Video: preset=%s, profile=%s, level=%s, resolution=max(960x540)",
		config.VideoPreset, config.VideoProfile, config.VideoLevel)
	log.Printf("   Audio: codec=%s, bitrate=%s, channels=%d, sample_rate=%d",
		config.AudioCodec, config.AudioBitrate, config.AudioChannels, config.AudioSampleRate)
	log.Printf("   HLS: time=%ds, list_size=%d, flags=%s",
		config.HLSTime, config.HLSListSize, config.HLSFlags)
	log.Printf("   Playlist: %s", hlsOutputPath)

	// Monitor first segment
	go func() {
		firstSegmentWait := time.Duration(config.HLSTime+1) * time.Second
		time.Sleep(firstSegmentWait)

		segmentPattern := filepath.Join("hls_media", filepath.Base(streamPath)+"*.ts")
		matches, err := filepath.Glob(segmentPattern)
		if err == nil && len(matches) > 0 {
			firstSegmentTime := time.Now()
			timeSinceStart := firstSegmentTime.Sub(ffmpegStartTime)
			log.Printf("⏱️ [BACKEND] First HLS segment created at %s (%.2fs after FFmpeg start)",
				firstSegmentTime.Format("2006-01-02 15:04:05.000"), timeSinceStart.Seconds())
		} else {
			log.Printf("⚠️ [BACKEND] First HLS segment not found after %.2fs - stream may not be ready yet",
				firstSegmentWait.Seconds())
		}
	}()

	return exec.Command("ffmpeg", args...)
}

// buildLowBitrateHLSCommand builds FFmpeg command for low-bitrate HLS (stream_low.m3u8)
// Optimized for weak Android devices with 15fps and 480p resolution
// Uses same HLS timing settings (hls_time, hls_list_size) as main stream for perfect sync
func (s *Server) buildLowBitrateHLSCommand(streamPath string, config HLSEncodingConfig, ffmpegStartTime time.Time) *exec.Cmd {
	log.Printf("🎬 Building low-bitrate HLS (stream_low.m3u8) for weak Android devices")

	// Low-bitrate HLS command template (documented):
	// ffmpeg -i rtmp://localhost:1935/live/stream \
	//   -map 0:v:0 -map 0:a:0 \
	//   -fflags +genpts -use_wallclock_as_timestamps 1 \
	//   -c:v libx264 -preset veryfast -tune zerolatency,fastdecode \
	//   -profile:v baseline \
	//   -x264-params scenecut=0:bframes=0 \
	//   -b:v 900k -maxrate 1100k -bufsize 2000k \
	//   -r 15 -g 15 -keyint_min 15 \
	//   -pix_fmt yuv420p \
	//   -vf scale='min(854,iw)':'min(480,ih)':force_original_aspect_ratio=decrease \
	//   -c:a aac -b:a 64k -ac 2 -ar 44100 \
	//   -hls_segment_type mpegts -hls_time 4 -hls_list_size 12 \
	//   -hls_flags independent_segments \
	//   -f hls hls_media/stream_low.m3u8

	args := []string{
		"-i", "rtmp://localhost:1935" + streamPath,
		"-map", "0:v:0",
		"-map", "0:a:0",
		"-fflags", "+genpts",
		"-use_wallclock_as_timestamps", "1",
	}

	// Video encoding - optimized for weak Android devices
	args = append(args,
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-tune", "zerolatency,fastdecode", // Fast decode for weak devices
		"-profile:v", "baseline", // Baseline profile for better decode performance
		"-level", "3.0", // Level 3.0 supports 480p@15fps
		"-b:v", "900k", // Lower bitrate for weak devices
		"-maxrate", "1100k", // 1.22x of bitrate
		"-bufsize", "2000k", // 2.22x of bitrate
		"-pix_fmt", "yuv420p",
	)

	// Scale video to max 854x480 (480p) for weak mobile devices
	// Fix: Use trunc to ensure width is always even (divisible by 2)
	args = append(args,
		"-vf", "scale='trunc(min(854,iw)/2)*2':'trunc(min(480,ih)/2)*2':force_original_aspect_ratio=decrease",
	)

	// FPS: 15fps for smoother playback on weak devices
	args = append(args, "-r", "15")

	// GOP: 15 (1 second at 15fps)
	args = append(args,
		"-g", "15",
		"-keyint_min", "15",
	)
	// Disable scenecut detection and B-frames for consistent GOP and faster decode
	args = append(args, "-x264-params", "scenecut=0:bframes=0")

	// Audio encoding - lower bitrate for weak devices
	args = append(args,
		"-c:a", "aac",
		"-b:a", "64k", // Lower audio bitrate
		"-ac", "2",
		"-ar", "44100",
	)

	// HLS output - CRITICAL: Same timing settings as main stream for perfect sync
	hlsOutputPath := filepath.Join("hls_media", "stream_low.m3u8")
	args = append(args,
		"-hls_segment_type", "mpegts",
		"-hls_time", fmt.Sprintf("%d", config.HLSTime), // Same as main stream (4s)
		"-hls_list_size", fmt.Sprintf("%d", config.HLSListSize), // Same as main stream (12)
		"-hls_flags", config.HLSFlags, // Same as main stream (independent_segments)
		"-f", "hls",
		hlsOutputPath,
	)

	// Log encoding configuration for debugging
	log.Printf("📊 Low-bitrate HLS Config (stream_low.m3u8):")
	log.Printf("   Video: codec=libx264, bitrate=900k, maxrate=1100k, bufsize=2000k, fps=15, gop=15")
	log.Printf("   Video: preset=veryfast, profile=baseline, level=3.0, resolution=max(854x480)")
	log.Printf("   Video: bframes=0 (disabled for faster decode)")
	log.Printf("   Audio: codec=aac, bitrate=64k, channels=2, sample_rate=44100")
	log.Printf("   HLS: time=%ds, list_size=%d, flags=%s (same as main stream for sync)", config.HLSTime, config.HLSListSize, config.HLSFlags)
	log.Printf("   Playlist: %s", hlsOutputPath)

	// Monitor first segment creation
	go func() {
		firstSegmentWait := time.Duration(config.HLSTime+1) * time.Second
		time.Sleep(firstSegmentWait)

		segmentPattern := filepath.Join("hls_media", "stream_low*.ts")
		matches, err := filepath.Glob(segmentPattern)
		if err == nil && len(matches) > 0 {
			firstSegmentTime := time.Now()
			timeSinceStart := firstSegmentTime.Sub(ffmpegStartTime)
			log.Printf("⏱️ [BACKEND] First low-bitrate HLS segment created at %s (%.2fs after FFmpeg start)",
				firstSegmentTime.Format("2006-01-02 15:04:05.000"), timeSinceStart.Seconds())
		} else {
			log.Printf("⚠️ [BACKEND] First low-bitrate HLS segment not found after %.2fs - stream may not be ready yet",
				firstSegmentWait.Seconds())
		}
	}()

	return exec.Command("ffmpeg", args...)
}

// PreGenerateHLSFromFile generates HLS segments from a video file (pre-generation, not real-time)
// This is used to generate HLS files before the webinar starts to reduce lag during streaming
func PreGenerateHLSFromFile(videoFilePath string) error {
	log.Printf("🎬 Starting pre-generation of HLS files from %s", videoFilePath)

	// Check if video file exists
	if _, err := os.Stat(videoFilePath); os.IsNotExist(err) {
		return fmt.Errorf("video file not found: %s", videoFilePath)
	}

	// Ensure hls_media directory exists
	hlsPath := "hls_media"
	if err := os.MkdirAll(hlsPath, 0755); err != nil {
		return fmt.Errorf("failed to create HLS media directory: %v", err)
	}

	// NOTE: We do NOT clean up old HLS files here to preserve pre-generated files
	// The cleanup only happens when starting a new real-time stream, not during pre-generation
	// cleanupHLSSegments("rtmp://localhost:1935/live/stream") // DISABLED - preserve pre-generated files
	// cleanupHLSSegments("rtmp://localhost:1935/live/stream")

	// Use default optimized config
	config := DefaultHLSEncodingConfig()

	// Build FFmpeg command for main stream (stream.m3u8)
	mainStreamArgs := []string{
		"-i", videoFilePath,
		"-map", "0:v:0",
		"-map", "0:a:0",
		"-c:v", "libx264",
		"-preset", config.VideoPreset, // veryfast for faster encoding
		"-tune", "zerolatency,fastdecode",
		"-profile:v", config.VideoProfile, // baseline
		"-level", config.VideoLevel, // 3.1
		"-b:v", config.VideoBitrate, // 1500k
		"-maxrate", config.VideoMaxrate, // 1800k
		"-bufsize", config.VideoBufsize, // 3000k
		"-pix_fmt", "yuv420p",
		"-vf", "scale='min(960,iw)':'min(540,ih)':force_original_aspect_ratio=decrease:flags=lanczos",
		"-r", fmt.Sprintf("%d", config.VideoFPS), // 30
		"-g", fmt.Sprintf("%d", config.VideoGOP), // 60
		"-keyint_min", fmt.Sprintf("%d", config.VideoGOP),
		"-x264-params", "scenecut=0:bframes=0",
		"-c:a", config.AudioCodec, // aac
		"-b:a", config.AudioBitrate, // 96k
		"-ac", fmt.Sprintf("%d", config.AudioChannels), // 2
		"-ar", fmt.Sprintf("%d", config.AudioSampleRate), // 44100
		"-hls_segment_type", "mpegts",
		"-hls_time", fmt.Sprintf("%d", config.HLSTime), // 4
		"-hls_list_size", fmt.Sprintf("%d", config.HLSListSize), // 12
		"-hls_flags", config.HLSFlags, // independent_segments
		"-f", "hls",
		filepath.Join(hlsPath, "stream.m3u8"),
	}

	// Build FFmpeg command for low-bitrate stream (stream_low.m3u8)
	// Fix: Use trunc to ensure width is always even (divisible by 2)
	lowStreamArgs := []string{
		"-i", videoFilePath,
		"-map", "0:v:0",
		"-map", "0:a:0",
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-tune", "zerolatency,fastdecode",
		"-profile:v", "baseline",
		"-level", "3.0",
		"-b:v", "900k",
		"-maxrate", "1100k",
		"-bufsize", "2000k",
		"-pix_fmt", "yuv420p",
		"-vf", "scale='trunc(min(854,iw)/2)*2':'trunc(min(480,ih)/2)*2':force_original_aspect_ratio=decrease",
		"-r", "15",
		"-g", "15",
		"-keyint_min", "15",
		"-x264-params", "scenecut=0:bframes=0",
		"-c:a", "aac",
		"-b:a", "64k",
		"-ac", "2",
		"-ar", "44100",
		"-hls_segment_type", "mpegts",
		"-hls_time", fmt.Sprintf("%d", config.HLSTime), // Same as main stream (4s)
		"-hls_list_size", fmt.Sprintf("%d", config.HLSListSize), // Same as main stream (12)
		"-hls_flags", config.HLSFlags, // Same as main stream
		"-f", "hls",
		filepath.Join(hlsPath, "stream_low.m3u8"),
	}

	log.Printf("🎬 Generating main stream (stream.m3u8)...")
	mainCmd := exec.Command("ffmpeg", mainStreamArgs...)
	mainCmd.Stdout = os.Stdout
	mainCmd.Stderr = os.Stderr

	if err := mainCmd.Run(); err != nil {
		return fmt.Errorf("failed to generate main HLS stream: %v", err)
	}

	log.Printf("✅ Main stream (stream.m3u8) generated successfully")

	log.Printf("🎬 Generating low-bitrate stream (stream_low.m3u8)...")
	lowCmd := exec.Command("ffmpeg", lowStreamArgs...)
	lowCmd.Stdout = os.Stdout
	lowCmd.Stderr = os.Stderr

	if err := lowCmd.Run(); err != nil {
		return fmt.Errorf("failed to generate low-bitrate HLS stream: %v", err)
	}

	log.Printf("✅ Low-bitrate stream (stream_low.m3u8) generated successfully")

	// Verify files were created
	mainPlaylist := filepath.Join(hlsPath, "stream.m3u8")
	lowPlaylist := filepath.Join(hlsPath, "stream_low.m3u8")

	if _, err := os.Stat(mainPlaylist); os.IsNotExist(err) {
		return fmt.Errorf("main playlist file was not created: %s", mainPlaylist)
	}

	if _, err := os.Stat(lowPlaylist); os.IsNotExist(err) {
		return fmt.Errorf("low-bitrate playlist file was not created: %s", lowPlaylist)
	}

	// Count segments
	mainSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream*.ts"))
	lowSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream_low*.ts"))

	log.Printf("✅ Pre-generation completed successfully!")
	log.Printf("   Main stream: %s (%d segments)", mainPlaylist, len(mainSegments))
	log.Printf("   Low stream: %s (%d segments)", lowPlaylist, len(lowSegments))

	return nil
}

// HasPreGeneratedHLS checks if pre-generated HLS files exist
func HasPreGeneratedHLS() bool {
	hlsPath := "hls_media"
	mainPlaylist := filepath.Join(hlsPath, "stream.m3u8")
	lowPlaylist := filepath.Join(hlsPath, "stream_low.m3u8")

	// Check if both playlists exist
	if _, err := os.Stat(mainPlaylist); os.IsNotExist(err) {
		return false
	}

	if _, err := os.Stat(lowPlaylist); os.IsNotExist(err) {
		return false
	}

	// Check if at least one segment exists for each stream
	mainSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream*.ts"))
	lowSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream_low*.ts"))

	// Filter to get only main stream segments (not low stream)
	var mainOnlySegments []string
	for _, seg := range mainSegments {
		if !strings.Contains(seg, "stream_low") {
			mainOnlySegments = append(mainOnlySegments, seg)
		}
	}

	if len(mainOnlySegments) == 0 || len(lowSegments) == 0 {
		return false
	}

	return true
}

// GetHLSGenerationProgress returns the progress of HLS generation (0-100)
// Calculates progress based on number of segments created vs expected total
func GetHLSGenerationProgress(videoFilePath string) (int, string, error) {
	hlsPath := "hls_media"

	// Get video duration to calculate expected segments
	// Use ffprobe to get video duration
	probeCmd := exec.Command("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", videoFilePath)
	probeOutput, err := probeCmd.Output()
	if err != nil {
		// If ffprobe fails, try to estimate from existing segments
		return getProgressFromSegments(hlsPath)
	}

	var videoDuration float64
	if _, err := fmt.Sscanf(string(probeOutput), "%f", &videoDuration); err != nil {
		return getProgressFromSegments(hlsPath)
	}

	// Calculate expected number of segments (based on 4 second segments)
	config := DefaultHLSEncodingConfig()
	expectedSegments := int(videoDuration / float64(config.HLSTime))
	if expectedSegments < 1 {
		expectedSegments = 1
	}

	// Count actual segments created
	mainSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream*.ts"))
	lowSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream_low*.ts"))

	// Filter main stream segments (exclude low stream)
	var mainOnlySegments []string
	for _, seg := range mainSegments {
		if !strings.Contains(seg, "stream_low") {
			mainOnlySegments = append(mainOnlySegments, seg)
		}
	}

	// Progress is based on the stream with fewer segments (both must be complete)
	mainCount := len(mainOnlySegments)
	lowCount := len(lowSegments)

	// Use minimum to ensure both streams are progressing
	minCount := mainCount
	if lowCount < mainCount {
		minCount = lowCount
	}

	// Calculate percentage
	progress := 0
	if expectedSegments > 0 {
		progress = int((float64(minCount) / float64(expectedSegments)) * 100)
		if progress > 100 {
			progress = 100
		}
	}

	status := "در حال تولید..."
	if progress >= 100 {
		status = "تکمیل شده"
	} else if progress > 0 {
		status = fmt.Sprintf("در حال تولید... (%d/%d segments)", minCount, expectedSegments)
	}

	return progress, status, nil
}

// getProgressFromSegments estimates progress from existing segments when video duration is unknown
func getProgressFromSegments(hlsPath string) (int, string, error) {
	mainSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream*.ts"))
	lowSegments, _ := filepath.Glob(filepath.Join(hlsPath, "stream_low*.ts"))

	var mainOnlySegments []string
	for _, seg := range mainSegments {
		if !strings.Contains(seg, "stream_low") {
			mainOnlySegments = append(mainOnlySegments, seg)
		}
	}

	mainCount := len(mainOnlySegments)
	lowCount := len(lowSegments)

	// If we have segments, assume we're making progress
	// But can't calculate exact percentage without video duration
	if mainCount > 0 || lowCount > 0 {
		status := fmt.Sprintf("در حال تولید... (Main: %d, Low: %d segments)", mainCount, lowCount)
		// Estimate 50% if we have some segments but don't know total
		return 50, status, nil
	}

	return 0, "شروع نشده", nil
}

// StartFilePublisher streams a video file until the webinar's scheduled end time.
// Waits until the exact start time before beginning playback.
// Ensures video always starts from the beginning (time 0).
func StartFilePublisher(filePath, rtmpURL string, webinarEndTime time.Time, webinarStartTime ...time.Time) {
	// Check if a stream is already running
	streamMutex.Lock()
	loc, _ := time.LoadLocation("Asia/Tehran")
	now := time.Now().In(loc)

	// CRITICAL: If a stream is already running, STOP IT FIRST before starting new one
	if streamRunning {
		log.Printf("🛑 Stopping previous stream (ends at %s) to start new stream at scheduled time %s",
			currentStreamEndTime.Format("2006-01-02 15:04:05"),
			func() string {
				if len(webinarStartTime) > 0 && !webinarStartTime[0].IsZero() {
					return webinarStartTime[0].In(loc).Format("2006-01-02 15:04:05")
				}
				return "now"
			}())

		// Cancel the previous stream context to stop it
		if currentStreamCancel != nil {
			currentStreamCancel()
			log.Printf("✅ Previous stream cancellation signal sent")
		}

		// Kill FFmpeg process if running
		ffmpegMutex.Lock()
		if currentFFmpegProcess != nil && currentFFmpegProcess.Process != nil {
			log.Printf("🛑 Killing previous FFmpeg process (PID: %d)", currentFFmpegProcess.Process.Pid)
			currentFFmpegProcess.Process.Kill()
			currentFFmpegProcess = nil
		}
		ffmpegMutex.Unlock()

		// Clean up old HLS segments and playlist
		cleanupHLSSegments(rtmpURL)

		// CRITICAL: Clear old RTMP channel to ensure fresh start from beginning
		// Extract stream path from RTMP URL (e.g., rtmp://localhost:1935/live/stream -> /live/stream)
		streamPath := "/live/stream" // default
		if rtmpURL != "" {
			if idx := strings.Index(rtmpURL, "://"); idx != -1 {
				// Find the path part after host:port
				pathStart := strings.Index(rtmpURL[idx+3:], "/")
				if pathStart != -1 {
					streamPath = rtmpURL[idx+3+pathStart:]
				}
			}
		}

		// Clear the old channel if server instance is available
		if globalStreamServer != nil {
			globalStreamServer.ClearChannel(streamPath)
		}

		// Wait a moment for the previous stream to stop
		streamMutex.Unlock()
		time.Sleep(1 * time.Second) // Increased wait time to ensure cleanup
		streamMutex.Lock()

		// Reset the flag
		streamRunning = false
		log.Printf("🔄 Previous stream stopped and cleaned up. Ready for new stream.")
	}

	// If previous stream's end time has passed, reset the flag (stream finished naturally)
	if streamRunning && now.After(currentStreamEndTime) {
		log.Printf("🔄 Previous stream ended naturally at %s (now: %s). Resetting flag for new stream.",
			currentStreamEndTime.Format("2006-01-02 15:04:05"),
			now.Format("2006-01-02 15:04:05"))
		streamRunning = false
		if currentStreamCancel != nil {
			currentStreamCancel()
		}
	}

	// Create new context for this stream
	ctx, cancel := context.WithCancel(context.Background())
	currentStreamCtx = ctx
	currentStreamCancel = cancel
	streamRunning = true
	currentStreamStartTime = time.Time{} // Reset start time - will be set when stream actually starts
	currentStreamEndTime = webinarEndTime
	streamMutex.Unlock()

	go func() {
		// Use the context for this stream (allows cancellation)
		ctx := currentStreamCtx

		// Load Iran timezone for accurate time calculation
		loc, err := time.LoadLocation("Asia/Tehran")
		if err != nil {
			loc = time.UTC
		}

		// Check if the webinar has already ended
		now := time.Now().In(loc)
		if now.After(webinarEndTime) {
			log.Printf("❌ Webinar has already ended at %s. No stream will be started.", webinarEndTime.Format(time.RFC1123))
			streamMutex.Lock()
			streamRunning = false
			currentStreamCancel = nil
			currentStreamCtx = nil
			currentStreamStartTime = time.Time{} // Reset start time
			streamMutex.Unlock()
			return
		}

		// Wait until webinar start time (if provided) - PRECISE TIMING
		if len(webinarStartTime) > 0 && !webinarStartTime[0].IsZero() {
			actualStartTime := webinarStartTime[0].In(loc)
			waitDuration := actualStartTime.Sub(now)

			if waitDuration > 0 {
				log.Printf("⏳ Waiting %v until webinar starts at %s. Stream will start EXACTLY at that time.",
					waitDuration, actualStartTime.Format("2006-01-02 15:04:05"))

				// Use context-aware sleep to allow cancellation
				select {
				case <-ctx.Done():
					log.Printf("🛑 Stream cancelled during wait. Stopping.")
					streamMutex.Lock()
					streamRunning = false
					currentStreamCancel = nil
					currentStreamCtx = nil
					currentStreamStartTime = time.Time{} // Reset start time
					streamMutex.Unlock()
					return
				case <-time.After(waitDuration):
					// Wait completed
				}

				// Re-check time after sleep to ensure we're at the right time
				now = time.Now().In(loc)
				timeDiff := now.Sub(actualStartTime)
				log.Printf("✅ Wait completed. Starting stream now at %s (target was %s, difference: %v)",
					now.Format("2006-01-02 15:04:05"),
					actualStartTime.Format("2006-01-02 15:04:05"),
					timeDiff)
			} else {
				// We're past the start time - check if we're still within webinar window
				// CRITICAL: If we're within the webinar window (before end time), ALWAYS start
				// Only skip if we're past the end time AND more than 5 minutes past start
				if now.After(webinarEndTime) && waitDuration < -5*time.Minute {
					// Webinar has ended AND we're more than 5 minutes past start - don't start
					log.Printf("❌ Too late to start stream (webinar ended at %s, start was %s, now is %s). Skipping.",
						webinarEndTime.Format("2006-01-02 15:04:05"),
						actualStartTime.Format("2006-01-02 15:04:05"),
						now.Format("2006-01-02 15:04:05"))
					streamMutex.Lock()
					streamRunning = false
					currentStreamCancel = nil
					currentStreamCtx = nil
					currentStreamStartTime = time.Time{} // Reset start time
					streamMutex.Unlock()
					return
				} else {
					// We're past the start time but still within webinar window - start immediately
					log.Printf("⏰ Start time has passed (%v ago), but we're within webinar window (ends at %s). Starting stream immediately from beginning",
						-waitDuration, webinarEndTime.Format("2006-01-02 15:04:05"))
				}
			}
		}

		// Check if cancelled before connecting
		select {
		case <-ctx.Done():
			log.Printf("🛑 Stream cancelled before connection. Stopping.")
			streamMutex.Lock()
			streamRunning = false
			currentStreamCancel = nil
			currentStreamCtx = nil
			currentStreamStartTime = time.Time{} // Reset start time
			streamMutex.Unlock()
			return
		default:
		}

		// OPTIMIZATION: Check if pre-generated HLS files exist
		// If they exist, we can skip RTMP streaming and just serve the pre-generated files
		if HasPreGeneratedHLS() {
			log.Printf("✅ Pre-generated HLS files found! Using pre-generated files instead of real-time encoding.")
			log.Printf("   This will significantly reduce lag and improve streaming performance.")

			// Set stream start time
			streamStartTimeActual := time.Now().In(loc)
			SetStreamStartTime(streamStartTimeActual)

			// Calculate video duration
			var videoDuration time.Duration
			var streamEndTimeActual time.Time

			if !webinarEndTime.IsZero() && len(webinarStartTime) > 0 && !webinarStartTime[0].IsZero() {
				scheduledStartTime := webinarStartTime[0].In(loc)
				scheduledEndTime := webinarEndTime.In(loc)
				scheduledDuration := scheduledEndTime.Sub(scheduledStartTime)

				// Check if this is appointment mode (102 minutes)
				appointmentModeDuration := 102 * time.Minute
				isAppointmentMode := scheduledDuration >= appointmentModeDuration-time.Minute && scheduledDuration <= appointmentModeDuration+time.Minute

				if isAppointmentMode {
					// APPOINTMENT MODE: Always use 102 minutes from ACTUAL start time
					videoDuration = appointmentModeDuration
					streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
				} else {
					// MANUAL MODE: Use scheduled duration
					videoDuration = scheduledDuration
					streamEndTimeActual = scheduledEndTime

					if videoDuration <= 0 || videoDuration < 30*time.Minute || videoDuration > 3*time.Hour {
						videoDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
						streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
					}
				}
			} else if !webinarEndTime.IsZero() {
				streamEndTimeActual = webinarEndTime.In(loc)
				videoDuration = streamEndTimeActual.Sub(streamStartTimeActual)
				if videoDuration <= 0 || videoDuration < 30*time.Minute || videoDuration > 3*time.Hour {
					videoDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
					streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
				}
			} else {
				videoDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
				streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
			}

			log.Printf("🎬 Using pre-generated HLS files. Stream started at %s, will end at %s (duration: %v)",
				streamStartTimeActual.Format("2006-01-02 15:04:05"),
				streamEndTimeActual.Format("2006-01-02 15:04:05"),
				videoDuration)

			// Monitor end time and stop stream when duration is reached
			endTimeMonitor := make(chan bool, 1)
			endTimeMonitorCtx, endTimeMonitorCancel := context.WithCancel(ctx)
			defer endTimeMonitorCancel()

			go func() {
				ticker := time.NewTicker(1 * time.Second)
				defer ticker.Stop()

				for {
					select {
					case <-endTimeMonitorCtx.Done():
						return
					case <-ticker.C:
						now := time.Now().In(loc)
						if now.After(streamEndTimeActual) || now.Equal(streamEndTimeActual) {
							elapsed := now.Sub(streamStartTimeActual)
							log.Printf("⏰ Pre-generated stream duration reached (started: %s, now: %s, elapsed: %v, target: %v). Stopping stream.",
								streamStartTimeActual.Format("2006-01-02 15:04:05"),
								now.Format("2006-01-02 15:04:05"),
								elapsed,
								videoDuration)
							if currentStreamCancel != nil {
								currentStreamCancel()
							}
							select {
							case endTimeMonitor <- true:
							default:
							}
							return
						}
					}
				}
			}()

			// Wait for end time or cancellation
			select {
			case <-ctx.Done():
				log.Printf("🛑 Pre-generated stream cancelled. Stopping.")
			case <-endTimeMonitor:
				log.Printf("⏰ Pre-generated stream ended. Duration reached.")
			}

			// Cleanup
			streamMutex.Lock()
			streamRunning = false
			currentStreamCancel = nil
			currentStreamCtx = nil
			currentStreamStartTime = time.Time{}
			currentStreamEndTime = time.Time{}
			streamMutex.Unlock()

			log.Printf("✅ Pre-generated stream cleanup completed.")
			return
		}

		log.Printf("ℹ️  Pre-generated HLS files not found. Using real-time encoding (RTMP + FFmpeg).")

		// CRITICAL: Clean up old HLS segments BEFORE starting new stream
		// This ensures frontend always gets fresh segments from the beginning
		cleanupHLSSegments(rtmpURL)

		// CRITICAL: Clear old RTMP channel to ensure fresh start from beginning
		// Extract stream path from RTMP URL (e.g., rtmp://localhost:1935/live/stream -> /live/stream)
		streamPath := "/live/stream" // default
		if rtmpURL != "" {
			if idx := strings.Index(rtmpURL, "://"); idx != -1 {
				// Find the path part after host:port
				pathStart := strings.Index(rtmpURL[idx+3:], "/")
				if pathStart != -1 {
					streamPath = rtmpURL[idx+3+pathStart:]
				}
			}
		}

		// Clear the old channel if server instance is available
		if globalStreamServer != nil {
			globalStreamServer.ClearChannel(streamPath)
		}

		log.Printf("🔌 Connecting to RTMP URL %s to stream file %s", rtmpURL, filePath)
		conn, err := rtmp.Dial(rtmpURL)
		if err != nil {
			log.Printf("❌ Error dialing RTMP URL %s: %v", rtmpURL, err)
			streamMutex.Lock()
			streamRunning = false
			currentStreamCancel = nil
			currentStreamCtx = nil
			currentStreamStartTime = time.Time{} // Reset start time
			streamMutex.Unlock()
			return
		}
		defer func() {
			conn.Close()
			log.Printf("🔌 RTMP connection closed")
		}()

		// CRITICAL: Always open file fresh to ensure we start from beginning (time 0)
		// Opening a new file handle ensures we start from the first packet
		// This MUST happen AFTER waiting for start time to ensure we start from beginning
		log.Printf("📂 Opening video file %s (fresh handle to ensure start from BEGINNING, time 0)", filePath)
		file, err := avutil.Open(filePath)
		if err != nil {
			log.Printf("❌ Error opening file %s: %v", filePath, err)
			streamMutex.Lock()
			streamRunning = false
			currentStreamCancel = nil
			currentStreamCtx = nil
			currentStreamStartTime = time.Time{} // Reset start time
			streamMutex.Unlock()
			return
		}
		defer func() {
			file.Close()
			log.Printf("📂 Video file %s closed", filePath)
		}()

		streams, err := file.Streams()
		if err != nil {
			log.Printf("❌ Error getting streams from file: %v", err)
			streamMutex.Lock()
			streamRunning = false
			currentStreamCancel = nil
			currentStreamCtx = nil
			currentStreamStartTime = time.Time{} // Reset start time
			streamMutex.Unlock()
			return
		}

		if err = conn.WriteHeader(streams); err != nil {
			log.Printf("❌ Error writing header: %v", err)
			streamMutex.Lock()
			streamRunning = false
			currentStreamCancel = nil
			currentStreamCtx = nil
			currentStreamStartTime = time.Time{} // Reset start time
			streamMutex.Unlock()
			return
		}

		// CRITICAL: Set the actual stream start time (in Asia/Tehran timezone) when streaming begins
		// This is the SINGLE SOURCE OF TRUTH for when the stream actually started
		// MUST be set BEFORE starting the monitor goroutine
		streamStartTimeActual := time.Now().In(loc)
		SetStreamStartTime(streamStartTimeActual)

		// CRITICAL: Calculate video duration from webinarEndTime and webinarStartTime if provided
		// For appointment mode: MUST be exactly 102 minutes from ACTUAL start time
		// For manual mode: Use scheduled duration (from config)
		var videoDuration time.Duration
		var streamEndTimeActual time.Time

		if !webinarEndTime.IsZero() && len(webinarStartTime) > 0 && !webinarStartTime[0].IsZero() {
			scheduledStartTime := webinarStartTime[0].In(loc)
			scheduledEndTime := webinarEndTime.In(loc)
			scheduledDuration := scheduledEndTime.Sub(scheduledStartTime)

			// Check if this is appointment mode (102 minutes) or manual mode
			// Appointment mode: scheduledDuration should be exactly 102 minutes
			appointmentModeDuration := 102 * time.Minute
			isAppointmentMode := scheduledDuration >= appointmentModeDuration-time.Minute && scheduledDuration <= appointmentModeDuration+time.Minute

			if isAppointmentMode {
				// APPOINTMENT MODE: Always use 102 minutes from ACTUAL start time
				// This ensures stream ends exactly 102 minutes after it actually started
				videoDuration = appointmentModeDuration
				streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
				log.Printf("📊 APPOINTMENT MODE: Using fixed 102-minute duration from ACTUAL start time (%s). Stream will end at %s",
					streamStartTimeActual.Format("2006-01-02 15:04:05"),
					streamEndTimeActual.Format("2006-01-02 15:04:05"))
			} else {
				// MANUAL MODE: Use scheduled duration (from config)
				// Use scheduledEndTime as the definitive end time (absolute time)
				videoDuration = scheduledDuration
				streamEndTimeActual = scheduledEndTime

				// Ensure videoDuration is positive and reasonable (between 30 minutes and 3 hours)
				if videoDuration <= 0 {
					log.Printf("⚠️  Calculated video duration is negative or zero (%v). Using default duration (1:43:36).", videoDuration)
					videoDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
					streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
				} else if videoDuration < 30*time.Minute || videoDuration > 3*time.Hour {
					log.Printf("⚠️  Calculated video duration is out of range (%v). Using default duration (1:43:36).", videoDuration)
					videoDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
					streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
				} else {
					log.Printf("📊 MANUAL MODE: Using scheduled duration from config: %v (scheduled: %s to %s)",
						videoDuration,
						scheduledStartTime.Format("2006-01-02 15:04:05"),
						scheduledEndTime.Format("2006-01-02 15:04:05"))
				}
			}
		} else if !webinarEndTime.IsZero() {
			// Only webinarEndTime is provided - calculate duration from actual start time
			streamEndTimeActual = webinarEndTime.In(loc)
			videoDuration = streamEndTimeActual.Sub(streamStartTimeActual)

			if videoDuration <= 0 || videoDuration < 30*time.Minute || videoDuration > 3*time.Hour {
				log.Printf("⚠️  Calculated video duration from endTime is invalid (%v). Using default duration (1:43:36).", videoDuration)
				videoDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
				streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
			} else {
				log.Printf("📊 Using calculated video duration from webinarEndTime: %v", videoDuration)
			}
		} else {
			// Fallback: Use default duration for manual mode (1:43:36 = 6216 seconds)
			videoDuration = 1*time.Hour + 43*time.Minute + 36*time.Second
			streamEndTimeActual = streamStartTimeActual.Add(videoDuration)
			log.Printf("📊 Using default video duration: %v (manual mode)", videoDuration)
		}
		log.Printf("🎬 Starting real-time stream for %s from BEGINNING (time 0). Stream started at %s, will end at %s (duration: %v)",
			filePath,
			streamStartTimeActual.Format("2006-01-02 15:04:05"),
			streamEndTimeActual.Format("2006-01-02 15:04:05"),
			videoDuration)

		streamStartTime := time.Now() // Used for packet timing calculations

		// CRITICAL: Initialize firstPacketTime to -1 to ensure we capture the first packet's time
		// This ensures we always start from the beginning of the video (time 0)
		firstPacketTime := time.Duration(-1)

		// CRITICAL: Start a goroutine to monitor video duration and stop stream precisely
		// This ensures stream stops exactly after 1:43:36 from stream start, not after processing more packets
		endTimeMonitor := make(chan bool, 1)
		endTimeMonitorCtx, endTimeMonitorCancel := context.WithCancel(ctx)
		defer endTimeMonitorCancel() // Ensure monitor goroutine stops when stream ends

		go func() {
			loc, _ := time.LoadLocation("Asia/Tehran")
			ticker := time.NewTicker(1 * time.Second) // Check every second
			defer ticker.Stop()

			log.Printf("⏰ Video duration monitor started. Stream started at %s, will end at %s (duration: %v)",
				streamStartTimeActual.Format("2006-01-02 15:04:05"),
				streamEndTimeActual.Format("2006-01-02 15:04:05"),
				videoDuration)

			for {
				select {
				case <-endTimeMonitorCtx.Done():
					// Stream was cancelled or ended, stop monitoring
					return
				case <-ticker.C:
					now := time.Now().In(loc)
					// Check if video duration has elapsed since stream start
					if now.After(streamEndTimeActual) || now.Equal(streamEndTimeActual) {
						elapsed := now.Sub(streamStartTimeActual)
						log.Printf("⏰ Video duration reached (started: %s, now: %s, elapsed: %v, target: %v). Stopping stream immediately.",
							streamStartTimeActual.Format("2006-01-02 15:04:05"),
							now.Format("2006-01-02 15:04:05"),
							elapsed,
							videoDuration)
						// Cancel the stream context to stop it immediately
						if currentStreamCancel != nil {
							currentStreamCancel()
						}
						select {
						case endTimeMonitor <- true:
						default:
						}
						return
					}
				}
			}
		}()

		for {
			// Check if stream was cancelled or end time reached
			select {
			case <-ctx.Done():
				log.Printf("🛑 Stream cancelled or end time reached. Stopping immediately.")
				streamMutex.Lock()
				streamRunning = false
				currentStreamCancel = nil
				currentStreamCtx = nil
				currentStreamStartTime = time.Time{} // Reset start time
				streamMutex.Unlock()
				return
			case <-endTimeMonitor:
				log.Printf("⏰ End time monitor triggered. Stopping stream.")
				streamMutex.Lock()
				streamRunning = false
				currentStreamCancel = nil
				currentStreamCtx = nil
				currentStreamStartTime = time.Time{} // Reset start time
				streamMutex.Unlock()
				return
			default:
			}

			// Additional check: if video duration has elapsed since stream start, stop immediately
			streamMutex.Lock()
			streamStartTimeCheck := currentStreamStartTime
			streamMutex.Unlock()

			if !streamStartTimeCheck.IsZero() {
				now := time.Now().In(loc)
				elapsed := now.Sub(streamStartTimeCheck)
				if elapsed >= videoDuration {
					log.Printf("⏰ Video duration reached during packet processing (started: %s, now: %s, elapsed: %v, target: %v). Stopping stream.",
						streamStartTimeCheck.Format("2006-01-02 15:04:05"),
						now.Format("2006-01-02 15:04:05"),
						elapsed,
						videoDuration)
					break
				}
			}

			pkt, err := file.ReadPacket()
			if err != nil {
				if err == io.EOF {
					log.Println("📄 Finished streaming file. Stream will now end.")
				} else {
					log.Printf("❌ Error reading packet: %v", err)
				}
				break // End of file or error, stop streaming
			}

			// CRITICAL: Capture first packet time ONCE and use it as baseline (time 0)
			// This ensures we always start from the beginning, not from where the file was last read
			if firstPacketTime == -1 {
				firstPacketTime = pkt.Time
				log.Printf("🎬 First packet time captured: %v (video will start from BEGINNING, time 0)", firstPacketTime)
			}

			// Calculate time difference from first packet (this is the video's internal timestamp)
			// We use this to simulate real-time playback from the beginning
			timeDiff := pkt.Time - firstPacketTime
			elapsed := time.Since(streamStartTime)

			// Only sleep if we're ahead of schedule (to maintain real-time playback)
			if timeDiff > elapsed {
				sleepDuration := timeDiff - elapsed
				// Use context-aware sleep to allow cancellation
				select {
				case <-ctx.Done():
					log.Printf("🛑 Stream cancelled during sleep. Stopping.")
					streamMutex.Lock()
					streamRunning = false
					currentStreamCancel = nil
					currentStreamCtx = nil
					currentStreamStartTime = time.Time{} // Reset start time
					streamMutex.Unlock()
					return
				case <-time.After(sleepDuration):
					// Sleep completed
				}
			}

			if err = conn.WritePacket(pkt); err != nil {
				log.Printf("❌ Error writing packet: %v", err)
				break
			}
		}

		log.Println("✅ Stream has concluded.")

		// CRITICAL: Cleanup when stream ends naturally (reached end time)
		// Kill FFmpeg process if running
		ffmpegMutex.Lock()
		if currentFFmpegProcess != nil && currentFFmpegProcess.Process != nil {
			log.Printf("🛑 Stopping FFmpeg process (PID: %d) - stream ended", currentFFmpegProcess.Process.Pid)
			currentFFmpegProcess.Process.Kill()
			currentFFmpegProcess = nil
		}
		ffmpegMutex.Unlock()

		// Clean up HLS segments and playlist
		cleanupHLSSegments(rtmpURL)

		// Clear RTMP channel
		streamPath = "/live/stream" // default
		if rtmpURL != "" {
			if idx := strings.Index(rtmpURL, "://"); idx != -1 {
				pathStart := strings.Index(rtmpURL[idx+3:], "/")
				if pathStart != -1 {
					streamPath = rtmpURL[idx+3+pathStart:]
				}
			}
		}

		// Clear the channel if server instance is available
		if globalStreamServer != nil {
			globalStreamServer.ClearChannel(streamPath)
			log.Printf("🗑️  Cleared RTMP channel: %s", streamPath)
		}

		// Mark stream as finished
		streamMutex.Lock()
		streamRunning = false
		currentStreamCancel = nil
		currentStreamCtx = nil
		currentStreamStartTime = time.Time{} // Reset start time when stream ends
		currentStreamEndTime = time.Time{}   // Reset end time when stream ends
		streamMutex.Unlock()

		log.Printf("✅ Stream cleanup completed. Ready for next scheduled stream.")
	}()
}
