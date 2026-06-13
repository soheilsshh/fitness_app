package seed

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// devPasswordHash is bcrypt("12345678") used in fixtures/users.json.
const devPasswordHash = "$2a$10$4GOYG1WoU9XJNHIdbwOtQeEmLqWfOtBDJyZbACRr5TSn1dsOHa7km"

func TestDevFixturePasswordHash(t *testing.T) {
	if err := bcrypt.CompareHashAndPassword([]byte(devPasswordHash), []byte("12345678")); err != nil {
		t.Fatalf("fixture password hash does not match 12345678: %v", err)
	}
}

func TestAllowedBlocksProduction(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("SEED_DEV_DATA", "true")

	if err := Allowed(false); err == nil {
		t.Fatal("expected production to block dev seed")
	}
	if err := Allowed(true); err == nil {
		t.Fatal("expected production to block CLI dev seed")
	}
}
