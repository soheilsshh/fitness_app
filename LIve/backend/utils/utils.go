package utils

import (
	"database/sql"
	"fmt"
	"log"
	"monetizeai-backend/config"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/yaa110/go-persian-calendar"
)

// Add utility functions here as needed

func IsBefore6PM() bool {
	now := time.Now()
	return now.Hour() < 18
}

// PersianDate represents a Persian (Jalali) date
type PersianDate struct {
	Year  int
	Month int
	Day   int
}

// ToPersian converts a Gregorian date to Persian (Jalali) date
// Uses the go-persian-calendar library for accurate conversion
func ToPersian(t time.Time) PersianDate {
	// Use the library to convert Gregorian to Persian
	p := ptime.New(t)

	return PersianDate{
		Year:  p.Year(),
		Month: int(p.Month()),
		Day:   p.Day(),
	}
}

// FormatPersianDate formats a Persian date as string (YYYY/MM/DD)
func FormatPersianDate(t time.Time) string {
	p := ToPersian(t)
	return fmt.Sprintf("%d/%02d/%02d", p.Year, p.Month, p.Day)
}

// GetPersianDayName returns Persian day name (شنبه, یکشنبه, etc.)
// Persian week starts from Saturday (شنبه)
func GetPersianDayName(t time.Time) string {
	weekday := int(t.Weekday())
	// Go's Weekday: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
	// Persian week: Saturday=0, Sunday=1, Monday=2, Tuesday=3, Wednesday=4, Thursday=5, Friday=6
	persianDays := []string{"شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"}

	// Convert: Sat(6)->0, Sun(0)->1, Mon(1)->2, Tue(2)->3, Wed(3)->4, Thu(4)->5, Fri(5)->6
	var index int
	if weekday == 6 { // Saturday
		index = 0
	} else {
		index = weekday + 1
	}

	return persianDays[index]
}

// GetPersianMonthName returns Persian month name (فروردین, اردیبهشت, etc.)
func GetPersianMonthName(month int) string {
	persianMonths := []string{
		"", // 0 index (months are 1-12)
		"فروردین", "اردیبهشت", "خرداد",
		"تیر", "مرداد", "شهریور",
		"مهر", "آبان", "آذر",
		"دی", "بهمن", "اسفند",
	}
	if month >= 1 && month <= 12 {
		return persianMonths[month]
	}
	return ""
}

// GetPersianMonthNameFromDate returns Persian month name from a time.Time
func GetPersianMonthNameFromDate(t time.Time) string {
	p := ToPersian(t)
	return GetPersianMonthName(p.Month)
}

// PersianToGregorian converts a Persian (Jalali) date to Gregorian date
// Uses the go-persian-calendar library for accurate conversion
func PersianToGregorian(persianYear, persianMonth, persianDay int) time.Time {
	loc := ptime.Iran()
	if loc == nil {
		loc, _ = time.LoadLocation("Asia/Tehran")
	if loc == nil {
		loc = time.UTC
	}
	}

	// Use the library to convert Persian to Gregorian
	p := ptime.Date(persianYear, ptime.Month(persianMonth), persianDay, 0, 0, 0, 0, loc)
	return p.Time()
}

// CreateDatabaseIfNotExists creates the MySQL database if it doesn't exist
func CreateDatabaseIfNotExists(cfg *config.Config) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/?parseTime=true&charset=utf8mb4&loc=Local", cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec("CREATE DATABASE IF NOT EXISTS " + cfg.DBName + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
	if err != nil {
		return err
	}
	log.Printf("Database '%s' ensured.", cfg.DBName)
	return nil
}
