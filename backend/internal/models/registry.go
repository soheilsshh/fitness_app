package models

// AllModels returns every GORM entity registered in the application.
// Used by migrations and the dev seed loader so new models are added in one place.
func AllModels() []any {
	return []any{
		&User{},
		&CoachProfile{},
		&ServicePlan{},
		&Subscription{},
		&Transaction{},
		&RefreshToken{},
		&UserPhoto{},
		&WorkoutProgram{},
		&NutritionProgram{},
		&ProgramItem{},
		&NutritionItem{},
		&CheckIn{},
		&Notification{},
		&Order{},
		&OrderItem{},
		&SiteSettings{},
		&Feedback{},
		&Ticket{},
		&OtpCode{},
		&Exercise{},
		&WorkoutSession{},
		&FunnelLead{},
	}
}
