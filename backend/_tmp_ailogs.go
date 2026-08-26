package main
import (
  "fmt"
  "os"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
  "github.com/yourusername/fitness-management/internal/models"
)
func main() {
  dsn := "root:aramezani82A@@tcp(localhost:3306)/fitness_db?charset=utf8mb4&parseTime=True"
  db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
  if err != nil { fmt.Println("db err", err); os.Exit(1) }
  var rows []models.AIRequestLog
  db.Order("id desc").Limit(10).Find(&rows)
  for _, r := range rows {
    fmt.Printf("--- %d %s ok=%v model=%s lat=%d\nerr=%s\nat=%v\n", r.ID, r.RequestType, r.Success, r.ModelName, r.LatencyMs, truncate(r.ErrorMsg, 350), r.CreatedAt)
  }
}
func truncate(s string, n int) string {
  if len(s) <= n { return s }
  return s[:n]
}
