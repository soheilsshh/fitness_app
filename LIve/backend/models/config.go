package models

import "time"

// SystemConfig stores system configuration in database
// Note: Column name "key" is a MySQL reserved word, so all raw SQL queries must use backticks: `key`
type SystemConfig struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Key       string    `gorm:"column:key;type:varchar(191);uniqueIndex" json:"key"` // Column name is "key" (reserved word, escaped in queries)
	Value     string    `gorm:"type:text" json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName specifies the table name for SystemConfig
func (SystemConfig) TableName() string {
	return "system_configs"
}
