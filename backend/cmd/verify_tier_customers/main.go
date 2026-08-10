package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yourusername/fitness-management/internal/models"
)

func main() {
	db, err := gorm.Open(mysql.Open("root:aramezani82A@@tcp(127.0.0.1:3306)/fitness_db?charset=utf8mb4&parseTime=True&loc=Local"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		log.Fatal(err)
	}
	var users []models.User
	db.Where("phone IN ?", []string{"09121001001", "09121001002"}).Find(&users)
	fmt.Printf("users found: %d\n", len(users))
	for _, u := range users {
		ok := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte("12345678")) == nil
		fmt.Printf("id=%d phone=%s email=%s role=%s pass_ok=%v\n", u.ID, u.Phone, u.Email, u.Role, ok)
		var subs []models.Subscription
		db.Where("user_id = ? AND deleted_at IS NULL", u.ID).Find(&subs)
		for _, s := range subs {
			var p models.ServicePlan
			db.First(&p, s.ServicePlanID)
			fmt.Printf("  sub plan=%s ends=%v\n", p.Name, s.EndsAt)
		}
	}
}
