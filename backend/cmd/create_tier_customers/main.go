package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yourusername/fitness-management/internal/models"
)

func main() {
	dsn := os.Getenv("DSN")
	if dsn == "" {
		dsn = "root:aramezani82A@@tcp(127.0.0.1:3306)/fitness_db?charset=utf8mb4&parseTime=True&loc=Local"
	}
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	pass := "12345678"
	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	passHash := string(hash)

	var coach models.User
	if err := db.Where("email = ?", "ali.rashidabadi@fitino.ir").First(&coach).Error; err != nil {
		log.Fatalf("coach not found: %v — run: go run ./cmd/seed -ali", err)
	}

	var vip, cip models.ServicePlan
	if err := db.Where("coach_id = ? AND name = ?", coach.ID, "پلن VIP").First(&vip).Error; err != nil {
		log.Fatalf("VIP plan missing: %v", err)
	}
	if err := db.Where("coach_id = ? AND name = ?", coach.ID, "پلن CIP").First(&cip).Error; err != nil {
		log.Fatalf("CIP plan missing: %v", err)
	}

	type acct struct {
		name, email, phone string
		plan               models.ServicePlan
		label              string
	}
	accounts := []acct{
		{"کاربر استاندارد", "student.standard@fitino.dev", "09121001001", vip, "پلن VIP (استاندارد)"},
		{"کاربر VIP پرمیوم", "student.vip@fitino.dev", "09121001002", cip, "پلن CIP (پرمیوم)"},
	}

	for _, a := range accounts {
		u, err := upsertStudent(db, a.name, a.email, a.phone, passHash, coach.ID)
		if err != nil {
			log.Fatalf("user %s: %v", a.phone, err)
		}
		if err := ensureSub(db, u.ID, a.plan.ID, coach.ID, 90); err != nil {
			log.Fatalf("sub %s: %v", a.phone, err)
		}
		fmt.Printf("OK %s | %s | %s | plan=%s (id=%d) user_id=%d\n", a.label, a.phone, pass, a.plan.Name, a.plan.ID, u.ID)
	}
}

func upsertStudent(db *gorm.DB, name, email, phone, passHash string, coachID uint) (*models.User, error) {
	var u models.User
	err := db.Where("phone = ? OR email = ?", phone, email).First(&u).Error
	if err == nil {
		u.Name = name
		u.Email = email
		u.Phone = phone
		u.Password = passHash
		u.Role = models.RoleStudent
		u.AssignedCoachID = &coachID
		u.Goals = "[]"
		if err := db.Save(&u).Error; err != nil {
			return nil, err
		}
		return &u, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}
	u = models.User{
		Name:            name,
		Email:           email,
		Phone:           phone,
		Password:        passHash,
		Role:            models.RoleStudent,
		AssignedCoachID: &coachID,
		Goals:           "[]",
	}
	if err := db.Create(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func ensureSub(db *gorm.DB, userID, planID, coachID uint, days int) error {
	now := time.Now()
	var existing models.Subscription
	err := db.Where("user_id = ? AND deleted_at IS NULL AND (ends_at IS NULL OR ends_at > ?)", userID, now).
		Order("id desc").First(&existing).Error
	if err == nil {
		ends := now.AddDate(0, 0, days)
		existing.ServicePlanID = planID
		existing.CoachID = coachID
		existing.StartsAt = now
		existing.EndsAt = &ends
		return db.Save(&existing).Error
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}
	ends := now.AddDate(0, 0, days)
	sub := models.Subscription{
		UserID:        userID,
		ServicePlanID: planID,
		CoachID:       coachID,
		StartsAt:      now,
		EndsAt:        &ends,
	}
	return db.Create(&sub).Error
}
