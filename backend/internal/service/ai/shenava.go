package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/yourusername/fitness-management/config"
)

// transcribeWithShenava runs the local Shenava ASR package (Python) on audio bytes.
// Prefer 16 kHz mono WAV from the client; webm needs ffmpeg on PATH.
func transcribeWithShenava(ctx context.Context, filename string, data []byte) (string, error) {
	cfg := config.Get()
	if !cfg.ASR.ShenavaEnabled {
		return "", fmt.Errorf("%w: shenava disabled", ErrNotConfigured)
	}

	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		ext = ".wav"
	}
	tmp, err := os.CreateTemp("", "fitino-voice-*"+ext)
	if err != nil {
		return "", err
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return "", err
	}
	if err := tmp.Close(); err != nil {
		return "", err
	}

	python := strings.TrimSpace(cfg.ASR.Python)
	if python == "" {
		python = "python"
	}

	args := []string{"-m", "shenava_asr", tmpPath, "--json"}
	if dir := strings.TrimSpace(cfg.ASR.ModelDir); dir != "" {
		args = append(args, "--model-dir", dir)
	}

	runCtx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	cmd := exec.CommandContext(runCtx, python, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return "", fmt.Errorf("%w: shenava: %s", ErrUpstream, msg)
	}

	var parsed struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(stdout.Bytes(), &parsed); err != nil {
		// Fallback: plain text line from older CLI
		text := strings.TrimSpace(stdout.String())
		if text == "" {
			return "", fmt.Errorf("%w: invalid shenava output", ErrUpstream)
		}
		return text, nil
	}
	if strings.TrimSpace(parsed.Text) == "" {
		return "", ErrEmptyResponse
	}
	return parsed.Text, nil
}
