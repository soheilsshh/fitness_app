package models

import "testing"

func TestIsValidIranNationalID(t *testing.T) {
	if !IsValidIranNationalID("0123456789") {
		t.Fatal("ascii control id should be valid")
	}
	if !IsValidIranNationalID("۰۱۲۳۴۵۶۷۸۹") {
		t.Fatal("persian digits should be accepted")
	}
	if IsValidIranNationalID("0000000000") {
		t.Fatal("all zeros must be rejected")
	}
	if IsValidIranNationalID("1234567890") {
		t.Fatal("invalid checksum must be rejected")
	}
	if IsValidIranNationalID("123") {
		t.Fatal("short id must be rejected")
	}
}
