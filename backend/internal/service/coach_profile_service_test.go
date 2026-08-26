package service

import (
	"testing"

	"github.com/yourusername/fitness-management/internal/models"
)

func TestCoachProfileSubmissionMissingFields(t *testing.T) {
	p := &models.CoachProfile{}
	missing := coachProfileSubmissionMissingFields(p)
	if len(missing) != 5 {
		t.Fatalf("empty profile missing=%v want 5 fields", missing)
	}

	p.DisplayName = "علی"
	p.Title = "مربی"
	p.City = "تهران"
	p.ContactPhone = "09121234567"
	p.NationalID = "۰۱۲۳۴۵۶۷۸۹"
	if got := coachProfileSubmissionMissingFields(p); len(got) != 0 {
		t.Fatalf("complete profile with persian national id still missing=%v", got)
	}
}

func TestHasGrade3CoachingCertificateDigitVariants(t *testing.T) {
	cases := []string{
		"مدرک مربی‌گری درجه سه",
		"مدرک مربیگری درجه 3",
		"مدرک مربیگری درجه ۳",
		"مربیگری درجه 3",
	}
	for _, title := range cases {
		items := []models.CoachAchievement{{
			Type:     "honor",
			Title:    title,
			ImageURL: "/uploads/cert.jpg",
		}}
		if !hasGrade3CoachingCertificate(items) {
			t.Fatalf("expected grade-3 match for title %q", title)
		}
	}

	withoutImage := []models.CoachAchievement{{
		Type:  "qualification",
		Title: Grade3CoachingCertificateTitle,
	}}
	if hasGrade3CoachingCertificate(withoutImage) {
		t.Fatal("grade-3 without image must not count")
	}
}

func TestApplyCoachPublishFlagPendingDraft(t *testing.T) {
	off := false
	on := true
	pending := &models.CoachProfile{Status: models.CoachProfileStatusPending}

	if err := applyCoachPublishFlag(pending, &off); err != nil {
		t.Fatalf("saving draft with isPublished=false must succeed, got %v", err)
	}
	if err := applyCoachPublishFlag(pending, &on); err != ErrCoachProfileIncomplete {
		t.Fatalf("pending publish=true must fail incomplete, got %v", err)
	}

	approved := &models.CoachProfile{Status: models.CoachProfileStatusApproved}
	if err := applyCoachPublishFlag(approved, &on); err != nil {
		t.Fatalf("approved publish=true must succeed, got %v", err)
	}
	if !approved.IsPublished {
		t.Fatal("approved profile should be published")
	}
}
