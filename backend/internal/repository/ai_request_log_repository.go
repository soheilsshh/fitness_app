package repository

import (
	"context"
	"time"

	"github.com/yourusername/fitness-management/internal/models"
	"gorm.io/gorm"
)

type AIRequestLogRepository interface {
	Create(ctx context.Context, log *models.AIRequestLog) error
	Summary(ctx context.Context, since time.Time) ([]AIUsageSummaryRow, error)
}

// AIUsageSummaryRow aggregates ai_request_log rows by request type + prompt
// version (roadmap Phase 5: token tracking / prompt versioning surfaced to
// admins instead of only sitting in raw log rows).
type AIUsageSummaryRow struct {
	RequestType       string
	PromptVersion     string
	Count             int64
	SuccessCount      int64
	PromptTokens      int64
	CompletionTokens  int64
	AvgLatencyMs      float64
}

type aiRequestLogRepository struct {
	db *gorm.DB
}

func NewAIRequestLogRepository(db *gorm.DB) AIRequestLogRepository {
	return &aiRequestLogRepository{db: db}
}

func (r *aiRequestLogRepository) Create(ctx context.Context, log *models.AIRequestLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

func (r *aiRequestLogRepository) Summary(ctx context.Context, since time.Time) ([]AIUsageSummaryRow, error) {
	var rows []AIUsageSummaryRow
	err := r.db.WithContext(ctx).
		Model(&models.AIRequestLog{}).
		Select(
			"request_type",
			"prompt_version",
			"COUNT(*) as count",
			"SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count",
			"SUM(prompt_tokens) as prompt_tokens",
			"SUM(completion_tokens) as completion_tokens",
			"AVG(latency_ms) as avg_latency_ms",
		).
		Where("created_at >= ?", since).
		Group("request_type, prompt_version").
		Order("request_type").
		Scan(&rows).Error
	return rows, err
}
