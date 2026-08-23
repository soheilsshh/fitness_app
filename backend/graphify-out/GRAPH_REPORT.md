# Graph Report - backend  (2026-08-16)

## Corpus Check
- 259 files · ~11,445,277 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2657 nodes · 5997 edges · 117 communities (115 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 551 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c24f3ff7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CoachProgramService
- admin_template_service.go
- FunnelService
- generator.go
- AuthService
- RunDev
- ExerciseRepository
- TemplateRepository
- ProgramRepository
- MobileDeviceRepository
- AdminUserService
- SubscriptionRepository
- AdminPlanService
- .Get
- تسک‌های بکند — Morabiyar Multi-Coach
- .buildProfileDTO
- AdminStudentService
- .CreateLog
- TicketService
- تسک‌های Jira — موارد پیاده‌سازی‌نشده پنل مربی
- AuthController
- CoachDashboardService
- CoachProfileService
- .Chat
- FeedbackService
- NotificationRepository
- DataFile
- مستندات API بکند — Morabiyar Multi-Coach
- UserRepository
- Config
- NotificationController
- NewServer
- Pagination Audit Report
- CoachAchievementService
- Context
- ProgressReportService
- CoachProfileRepository
- CoachProgramController
- AdminCoachService
- CoachSessionRepository
- CommunityPostService
- EventRepository
- AdminProgramController
- CoachDashboardController
- MeController
- CoachAchievementRepository
- GuaranteeService
- CoachProfileController
- CoachTrackingController
- RecipeService
- CoachExerciseController
- CoachPlanController
- run.sh
- CoachAchievementController
- CoachTicketController
- AdminCoachController
- MeTicketController
- PublicCoachController
- middleware/jwt.go
- upsertStudent
- Development Data Seeding & Datasets Guide
- User
- Fitino seed data — one folder per dataset (no shared filenames)
- NewMySQLGORM
- CheckIn
- Transaction
- seed_peyman_yazdani_paste.sh
- github.com/yourusername/fitness-management
- MotivationalQuoteRepository
- AchievementService
- PoseBankService
- usda.go
- Context
- FunnelLead
- funnel_service.go
- MeService
- ai_generate_service.go
- AIGenerateService
- ServicePlanRepository
- SiteSettingsController
- schemas.go
- CommunityPostController
- FoodRepository
- GetJWTSecret
- coach_food_service.go
- DailyFoodLogRepository
- ai/validate.go
- me_service.go
- GetUserID
- AIRequestLogRepository
- foods.go
- CoachStudentService
- AIGenerateController
- food_enricher.go
- FeedbackRepository
- CalculateNutritionTargets
- AdminPlanController
- deriveServingUnits
- leadToAdminItem
- CheckInController
- ai_generate_controller.go
- AdminStudentController
- DailyFoodLogController
- AuthorizationService
- AnalyzeBodyPhoto
- CoachStudentController
- NutritionPlanJSONSchema
- .Join
- AIChatController
- PersonalRecord
- WeeklyCheckIn

## God Nodes (most connected - your core abstractions)
1. `NewServer()` - 150 edges
2. `GetUserID()` - 115 edges
3. `SubscriptionRepository` - 52 edges
4. `MeService` - 41 edges
5. `ServicePlanRepository` - 36 edges
6. `ProgramRepository` - 35 edges
7. `UserRepository` - 33 edges
8. `CoachProgramService` - 33 edges
9. `FunnelService` - 33 edges
10. `CoachProfileRepository` - 31 edges

## Surprising Connections (you probably didn't know these)
- `NewServer()` --calls--> `CORSAllowCredentials()`  [INFERRED]
  cmd/app/main.go → config/config.go
- `NewServer()` --calls--> `IsOriginAllowed()`  [INFERRED]
  cmd/app/main.go → config/config.go
- `NewServer()` --calls--> `NewAchievementController()`  [INFERRED]
  cmd/app/main.go → internal/controllers/achievement_controller.go
- `NewServer()` --calls--> `NewAdminCoachController()`  [INFERRED]
  cmd/app/main.go → internal/controllers/admin_coach_controller.go
- `NewServer()` --calls--> `NewAdminDashboardController()`  [INFERRED]
  cmd/app/main.go → internal/controllers/admin_dashboard_controller.go

## Import Cycles
- None detected.

## Communities (117 total, 2 thin omitted)

### Community 0 - "CoachProgramService"
Cohesion: 0.05
Nodes (71): Model, Model, Model, Context, NewAdminProgramService(), workoutTemplateToDetail(), Context, DB (+63 more)

### Community 1 - "admin_template_service.go"
Cohesion: 0.10
Nodes (22): AdminTemplateController, Context, NewAdminTemplateController(), Context, DB, mapNutritionMeals(), maxDayFromItems(), NewAdminTemplateService() (+14 more)

### Community 2 - "FunnelService"
Cohesion: 0.17
Nodes (11): funnelCoachSlug(), Context, User, hashFunnelPassword(), FunnelCheckoutDTO, FunnelConfigDTO, FunnelPayResponse, FunnelPlanDTO (+3 more)

### Community 3 - "generator.go"
Cohesion: 0.24
Nodes (22): apiResponse, GenerateResult, jsonSchema, message, responseFormat, structuredRequest, usageInfo, callWithSchema() (+14 more)

### Community 4 - "AuthService"
Cohesion: 0.08
Nodes (25): Model, Time, Model, Time, NormalizePhone(), ToEnglish(), Context, DB (+17 more)

### Community 5 - "RunDev"
Cohesion: 0.06
Nodes (55): main(), FS, DB, MaybeSeedDevData(), PrepareDatabase(), RunMigrations(), SeedCatalogs(), SeedDefaultAdmin() (+47 more)

### Community 6 - "ExerciseRepository"
Cohesion: 0.07
Nodes (31): AdminExerciseController, Context, NewAdminExerciseController(), Model, Context, DB, NewExerciseRepository(), extractInstructionSteps() (+23 more)

### Community 7 - "TemplateRepository"
Cohesion: 0.08
Nodes (36): Model, Model, Context, DB, NewTemplateRepository(), buildNutritionTemplateMeals(), buildWorkoutTemplateItems(), Context (+28 more)

### Community 8 - "ProgramRepository"
Cohesion: 0.06
Nodes (32): currentProgramsResponse, currentSubscriptionResponse, nutritionItemResponse, nutritionProgramResponse, planSummary, StudentController, studentMeResponse, subscriptionResponse (+24 more)

### Community 9 - "MobileDeviceRepository"
Cohesion: 0.05
Nodes (37): MobileAppController, Context, NewMobileAppController(), Time, Context, DB, Time, NewMobileDeviceRepository() (+29 more)

### Community 10 - "AdminUserService"
Cohesion: 0.07
Nodes (31): AdminDashboardController, AdminUserController, adminUsersListResponse, Context, NewAdminDashboardController(), Context, NewAdminUserController(), Context (+23 more)

### Community 11 - "SubscriptionRepository"
Cohesion: 0.06
Nodes (47): Model, Time, Model, Time, Context, DB, Time, NewSubscriptionRepository() (+39 more)

### Community 12 - "AdminPlanService"
Cohesion: 0.18
Nodes (14): Context, Time, NewAdminPlanService(), planToDetail(), planToItem(), Context, NewCoachPlanService(), AdminPlanCreateRequest (+6 more)

### Community 13 - ".Get"
Cohesion: 0.06
Nodes (45): Model, RawMessage, Context, DB, NewSiteSettingsRepository(), Context, transcribeWithShenava(), Context (+37 more)

### Community 14 - "تسک‌های بکند — Morabiyar Multi-Coach"
Cohesion: 0.04
Nodes (48): TASK-B0-01: به‌روزرسانی مستندات API, TASK-B0-02: تعریف ثابت‌های نقش, TASK-B1-01: Migration — فیلد AssignedCoachID روی User, TASK-B1-02: Migration — گسترش CoachProfile, TASK-B1-03: Migration — CoachID روی ServicePlan, TASK-B1-04: Migration — CoachID روی Subscription, TASK-B1-05: Migration — CoachID روی Order (اختیاری), TASK-B1-06: CoachProfile Repository (+40 more)

### Community 15 - ".buildProfileDTO"
Cohesion: 0.22
Nodes (8): Model, Time, containsString(), User, IsStudentProfileComplete(), StudentProfileProgress(), User, UserPhoto

### Community 16 - "AdminStudentService"
Cohesion: 0.27
Nodes (10): Context, DB, Time, User, NewAdminStudentService(), AdminStudentDetail, AdminStudentItem, AdminStudentListResponse (+2 more)

### Community 17 - ".CreateLog"
Cohesion: 0.28
Nodes (12): dailyFoodLogToDTO(), formatFoodLogDate(), Context, Time, normalizeFoodLogDate(), normalizeMealType(), parseFoodLogDate(), CreateFoodLogRequest (+4 more)

### Community 18 - "TicketService"
Cohesion: 0.10
Nodes (25): Model, Time, Context, DB, NewTicketRepository(), Context, Time, isValidTicketStatus() (+17 more)

### Community 19 - "تسک‌های Jira — موارد پیاده‌سازی‌نشده پنل مربی"
Cohesion: 0.05
Nodes (41): Epic 1 — مدیریت حساب, Epic 2 — پایش دوره و شاگردان, Epic 3 — لیست سفارشات و برنامه‌ها, Epic 4 — ابزارها, Epic 5 — تنظیمات, Epic 6 — آمار و گزارش‌ها, Epic 7 — زیرساخت منو (پیش‌نیاز کلی), TASK-CP-01 — ساخت بخش منوی «مدیریت حساب» (+33 more)

### Community 20 - "AuthController"
Cohesion: 0.10
Nodes (20): AuthController, authResponse, authUserResponse, changePasswordRequest, checkPhoneRequest, checkPhoneResponse, forgotSendOTPRequest, loginPasswordRequest (+12 more)

### Community 21 - "CoachDashboardService"
Cohesion: 0.11
Nodes (23): MeDashboardController, NewMeDashboardController(), deltaPct(), Context, DB, Time, NewCoachDashboardService(), prevMonth() (+15 more)

### Community 22 - "CoachProfileService"
Cohesion: 0.13
Nodes (22): IsValidIranNationalID(), Fallback(), Normalize(), coachProfileSubmissionMissingFields(), Context, Time, hasGrade3CoachingCertificate(), NewCoachProfileService() (+14 more)

### Community 23 - ".Chat"
Cohesion: 0.12
Nodes (20): Persona, aiDevMockReply(), buildFitinoSystemPrompt(), Client, Context, Mutex, Time, hitsProgramOrDietTopic() (+12 more)

### Community 24 - "FeedbackService"
Cohesion: 0.15
Nodes (13): AdminFeedbackController, FeedbackController, Context, NewAdminFeedbackController(), Context, NewFeedbackController(), Context, Time (+5 more)

### Community 25 - "NotificationRepository"
Cohesion: 0.07
Nodes (34): Model, Time, Model, Time, Context, DB, Time, NewNotificationRepository() (+26 more)

### Community 26 - "DataFile"
Cohesion: 0.18
Nodes (22): countFiles(), Context, DB, SeedCatalogs(), SeedCatalogsFromConfig(), seedExercisesIfNeeded(), seedFoodsIfNeeded(), seedTemplatesIfNeeded() (+14 more)

### Community 27 - "مستندات API بکند — Morabiyar Multi-Coach"
Cohesion: 0.08
Nodes (23): CoachProfile (گسترش یافته) ✅, Order, ServicePlan, Subscription, User, داشبورد ✅, دانشجویان ✅, عمومی (+15 more)

### Community 28 - "UserRepository"
Cohesion: 0.05
Nodes (40): CheckoutController, PaymentController, zarinpalRequestBody, Context, NewCheckoutController(), Context, NewPaymentController(), webResultButton() (+32 more)

### Community 29 - "Config"
Cohesion: 0.19
Nodes (22): Config, applyExplicitEnvOverrides(), applyLegacyOverrides(), bindEnvKeys(), CORSAllowCredentials(), CORSAllowedOrigins(), CORSAllowLocalhost(), Get() (+14 more)

### Community 30 - "NotificationController"
Cohesion: 0.39
Nodes (3): NotificationController, Context, NewNotificationController()

### Community 31 - "NewServer"
Cohesion: 0.20
Nodes (13): Server, DB, main(), maybeSeedDevData(), NewServer(), runMigrations(), seedDefaultAdmin(), Engine (+5 more)

### Community 32 - "Pagination Audit Report"
Cohesion: 0.10
Nodes (19): Concerns, Conclusion, Current State, Current State, Fully Implemented, `GET /admin/users`, `GET /subscriptions`, Needs Improvement (+11 more)

### Community 33 - "CoachAchievementService"
Cohesion: 0.21
Nodes (13): IsValidCoachAchievementType(), ValidCoachAchievementTypes(), Context, NewCoachAchievementService(), toCoachAchievementDTO(), toPublicAchievementDTO(), CoachAchievementType, CoachAchievementCreateRequest (+5 more)

### Community 34 - "Context"
Cohesion: 0.16
Nodes (8): AdminFunnelController, FunnelController, Context, NewAdminFunnelController(), NewFunnelController(), writeFunnelAuthSession(), containsPersian(), SMSErrorMessage()

### Community 35 - "ProgressReportService"
Cohesion: 0.07
Nodes (34): ProgressReportController, StreakController, Context, NewProgressReportController(), Context, NewStreakController(), Model, Time (+26 more)

### Community 36 - "CoachProfileRepository"
Cohesion: 0.21
Nodes (6): Model, Context, DB, NewCoachProfileRepository(), CoachProfile, CoachProfileRepository

### Community 37 - "CoachProgramController"
Cohesion: 0.25
Nodes (4): CoachProgramController, Context, NewCoachProgramController(), parseOptionalPage()

### Community 38 - "AdminCoachService"
Cohesion: 0.22
Nodes (11): IsValidCoachProfileStatus(), Context, Time, NewAdminCoachService(), toAdminCoachAchievement(), AdminCoachAchievement, AdminCoachDetail, AdminCoachItem (+3 more)

### Community 39 - "CoachSessionRepository"
Cohesion: 0.09
Nodes (24): CoachSessionController, MeSessionController, Context, NewCoachSessionController(), NewMeSessionController(), writeSessionError(), Model, Time (+16 more)

### Community 40 - "CommunityPostService"
Cohesion: 0.09
Nodes (26): Model, Context, DB, NewCommunityPostRepository(), Context, DB, Reader, marshalPostMetadata() (+18 more)

### Community 41 - "EventRepository"
Cohesion: 0.09
Nodes (21): AdminEventController, EventController, Context, NewAdminEventController(), NewEventController(), Model, Time, Context (+13 more)

### Community 42 - "AdminProgramController"
Cohesion: 0.35
Nodes (3): AdminProgramController, Context, NewAdminProgramController()

### Community 43 - "CoachDashboardController"
Cohesion: 0.29
Nodes (5): CoachDashboardController, Context, NewCoachDashboardController(), parseIntQuery(), Context

### Community 44 - "MeController"
Cohesion: 0.23
Nodes (3): MeController, Context, NewMeController()

### Community 45 - "CoachAchievementRepository"
Cohesion: 0.27
Nodes (6): Model, Context, DB, NewCoachAchievementRepository(), CoachAchievement, CoachAchievementRepository

### Community 46 - "GuaranteeService"
Cohesion: 0.10
Nodes (24): AdminGuaranteeController, GuaranteeController, Context, NewAdminGuaranteeController(), NewGuaranteeController(), writeGuaranteeError(), Model, Context (+16 more)

### Community 47 - "CoachProfileController"
Cohesion: 0.35
Nodes (3): CoachProfileController, Context, NewCoachProfileController()

### Community 48 - "CoachTrackingController"
Cohesion: 0.27
Nodes (5): CoachTrackingController, TrackingController, Context, NewCoachTrackingController(), NewTrackingController()

### Community 49 - "RecipeService"
Cohesion: 0.10
Nodes (20): AdminRecipeController, RecipeController, Context, NewAdminRecipeController(), Context, NewRecipeController(), Model, Context (+12 more)

### Community 50 - "CoachExerciseController"
Cohesion: 0.33
Nodes (5): CoachExerciseController, coachExerciseUploadDir(), Context, isAnimatedExerciseMedia(), NewCoachExerciseController()

### Community 51 - "CoachPlanController"
Cohesion: 0.36
Nodes (4): CoachPlanController, Context, NewCoachPlanController(), parsePlanPagination()

### Community 52 - "run.sh"
Cohesion: 0.36
Nodes (8): check_tcp_port(), die(), fail(), ok(), run.sh script, step(), version_ge(), warn()

### Community 53 - "CoachAchievementController"
Cohesion: 0.36
Nodes (3): CoachAchievementController, Context, NewCoachAchievementController()

### Community 54 - "CoachTicketController"
Cohesion: 0.39
Nodes (3): CoachTicketController, Context, NewCoachTicketController()

### Community 55 - "AdminCoachController"
Cohesion: 0.43
Nodes (3): AdminCoachController, Context, NewAdminCoachController()

### Community 56 - "MeTicketController"
Cohesion: 0.43
Nodes (3): MeTicketController, Context, NewMeTicketController()

### Community 57 - "PublicCoachController"
Cohesion: 0.43
Nodes (3): PublicCoachController, Context, NewPublicCoachController()

### Community 58 - "middleware/jwt.go"
Cohesion: 0.33
Nodes (5): GetClaimsFromContext(), Context, HandlerFunc, JWTAuthMiddleware(), JWTClaims

### Community 59 - "upsertStudent"
Cohesion: 0.53
Nodes (5): ensureSub(), DB, User, main(), upsertStudent()

### Community 60 - "Development Data Seeding & Datasets Guide"
Cohesion: 0.33
Nodes (5): CLI, Development Data Seeding & Datasets Guide, Folder layout (one dataset = one folder), Media (do not mix folders), Startup auto-seed

### Community 61 - "User"
Cohesion: 0.33
Nodes (4): DB, Model, User, Time

### Community 62 - "Fitino seed data — one folder per dataset (no shared filenames)"
Cohesion: 0.40
Nodes (4): Fitino seed data — one folder per dataset (no shared filenames), URLها, دیپلوی, چرا جدا؟

### Community 63 - "NewMySQLGORM"
Cohesion: 0.83
Nodes (3): ensureDatabaseExists(), DB, NewMySQLGORM()

### Community 64 - "CheckIn"
Cohesion: 0.50
Nodes (3): Model, Time, CheckIn

### Community 65 - "Transaction"
Cohesion: 0.50
Nodes (3): Model, Time, Transaction

### Community 72 - "MotivationalQuoteRepository"
Cohesion: 0.11
Nodes (18): AdminMotivationalQuoteController, MotivationalQuoteController, Context, NewAdminMotivationalQuoteController(), NewMotivationalQuoteController(), Model, Context, DB (+10 more)

### Community 73 - "AchievementService"
Cohesion: 0.10
Nodes (18): AchievementController, Context, NewAchievementController(), Model, Model, Context, DB, NewAchievementRepository() (+10 more)

### Community 74 - "PoseBankService"
Cohesion: 0.11
Nodes (19): AdminPoseBankController, PoseBankController, Context, NewAdminPoseBankController(), NewPoseBankController(), Model, Context, DB (+11 more)

### Community 75 - "usda.go"
Cohesion: 0.15
Nodes (26): applyMatch(), Context, DB, markUnmatched(), runEnrichment(), main(), csvHeaderIndex(), downloadFile() (+18 more)

### Community 76 - "Context"
Cohesion: 0.18
Nodes (13): FoodLogSchema, SetLogSchema, WorkoutPlanSchema, Context, mapAIGenErr(), workoutPlanToItems(), Context, isShenavaUnavailable() (+5 more)

### Community 77 - "FunnelLead"
Cohesion: 0.17
Nodes (8): Model, Time, Context, DB, NewFunnelLeadRepository(), FunnelLead, FunnelLeadRepository, FunnelStats

### Community 78 - "funnel_service.go"
Cohesion: 0.16
Nodes (19): applyPlanToLead(), generateFunnelToken(), generateFunnelTrackingCode(), isValidActivityLevel(), isValidCommitment(), isValidExperience(), isValidMainObstacle(), isValidNutritionChallenge() (+11 more)

### Community 79 - "MeService"
Cohesion: 0.21
Nodes (8): Context, DB, NewMeService(), MeOrderDTO, MeOrderItemDTO, MeOrderListResponse, MeProgramsResponse, MeService

### Community 80 - "ai_generate_service.go"
Cohesion: 0.23
Nodes (15): NutritionPlanSchema, NutritionWeekSchema, buildAIUserContext(), buildWorkoutConstraintsContext(), derefFloat(), mapPrimaryGoalToPlanGoal(), mealSlotFromIndex(), nutritionPlanToItems() (+7 more)

### Community 81 - "AIGenerateService"
Cohesion: 0.19
Nodes (13): FoodItem, IngredientSuggestionSchema, MealSchema, NutritionWeekDaySchema, buildIngredientUserContext(), buildMealRegenerateContext(), DB, Mutex (+5 more)

### Community 82 - "ServicePlanRepository"
Cohesion: 0.24
Nodes (6): Model, Context, DB, NewServicePlanRepository(), ServicePlan, ServicePlanRepository

### Community 83 - "SiteSettingsController"
Cohesion: 0.23
Nodes (4): GetUploadDir(), SiteSettingsController, Context, NewSiteSettingsController()

### Community 84 - "schemas.go"
Cohesion: 0.14
Nodes (14): ExerciseSchema, ProgressAnalysisSchema, WorkoutDaySchema, WorkoutNoteSummarySchema, FoodLogJSONSchema(), IngredientSuggestionJSONSchema(), MealJSONSchema(), NutritionWeekJSONSchema() (+6 more)

### Community 85 - "CommunityPostController"
Cohesion: 0.24
Nodes (5): AdminCommunityPostController, CommunityPostController, Context, NewAdminCommunityPostController(), NewCommunityPostController()

### Community 86 - "FoodRepository"
Cohesion: 0.27
Nodes (7): Model, Context, DB, NewFoodRepository(), Food, FoodServingUnit, FoodRepository

### Community 87 - "GetJWTSecret"
Cohesion: 0.20
Nodes (12): Claims, GetAccessTokenDuration(), GetJWTSecret(), GetRefreshTokenDuration(), Duration, GenerateAccessToken(), GenerateRefreshToken(), Time (+4 more)

### Community 88 - "coach_food_service.go"
Cohesion: 0.23
Nodes (10): CoachFoodController, Context, NewCoachFoodController(), foodModelToCoachItem(), Context, NewCoachFoodService(), CoachFoodItem, CoachFoodListResponse (+2 more)

### Community 89 - "DailyFoodLogRepository"
Cohesion: 0.20
Nodes (9): Model, Time, Context, DB, Time, NewDailyFoodLogRepository(), NewDailyFoodLogService(), DailyFoodLog (+1 more)

### Community 90 - "ai/validate.go"
Cohesion: 0.26
Nodes (12): T, TestParsePersona(), TestValidateNutritionPlan_AcceptsValid(), TestValidateNutritionPlan_RejectsBadCalories(), TestValidateNutritionPlan_RejectsEmptyMeals(), TestValidateWorkoutPlan_AcceptsValid(), TestValidateWorkoutPlan_RejectsEmptyDays(), ValidateBodyPhotoAnalysis() (+4 more)

### Community 91 - "me_service.go"
Cohesion: 0.24
Nodes (11): containsMeString(), Time, mePhotosToDTO(), meSplitName(), MeNutritionDTO, MePhotoDTO, MeProfileDTO, MeProfileUpdateRequest (+3 more)

### Community 92 - "GetUserID"
Cohesion: 0.32
Nodes (5): WorkoutHistoryController, Context, NewWorkoutHistoryController(), GetUserID(), Context

### Community 93 - "AIRequestLogRepository"
Cohesion: 0.21
Nodes (8): Model, Context, DB, Time, NewAIRequestLogRepository(), AIRequestLog, AIRequestLogRepository, AIUsageSummaryRow

### Community 94 - "foods.go"
Cohesion: 0.31
Nodes (12): foodExternalID(), Context, DB, ImportFoodsCSV(), mapCSVFoodHeader(), mapCSVRowToFood(), normalizeNumber(), parseCSVFoodRow() (+4 more)

### Community 95 - "CoachStudentService"
Cohesion: 0.33
Nodes (7): Context, DB, Time, User, NewCoachStudentService(), CoachStudentDetail, CoachStudentService

### Community 96 - "AIGenerateController"
Cohesion: 0.41
Nodes (3): AIGenerateController, Context, writeAIGenerateError()

### Community 97 - "food_enricher.go"
Cohesion: 0.35
Nodes (11): foodModelToMealDTO(), foodModelToMealDTOByGrams(), formatFoodQuantity(), mealMultiplier(), mealSlotFromLegacyNumber(), mealSlotToNumber(), nutritionItemToMealDTO(), scaleFoodByGrams() (+3 more)

### Community 98 - "FeedbackRepository"
Cohesion: 0.29
Nodes (6): Model, Context, DB, NewFeedbackRepository(), Feedback, FeedbackRepository

### Community 99 - "CalculateNutritionTargets"
Cohesion: 0.38
Nodes (8): ageFromBirthDate(), CalculateNutritionTargets(), T, TestCalculateNutritionTargets_BodyFatUsesKatchMcArdle(), TestCalculateNutritionTargets_CutIsLowerThanBulk(), TestCalculateNutritionTargets_DefaultsWhenMissing(), TestCalculateNutritionTargets_MaintainMale(), NutritionCalcInput

### Community 100 - "AdminPlanController"
Cohesion: 0.36
Nodes (3): AdminPlanController, Context, NewAdminPlanController()

### Community 101 - "deriveServingUnits"
Cohesion: 0.36
Nodes (8): deriveServingUnits(), EnrichFoodServingUnits(), Context, DB, gramsPerUnitFromSibling(), isJunkLabel(), normalizeUnitLabel(), derivedUnit

### Community 102 - "leadToAdminItem"
Cohesion: 0.28
Nodes (7): derefString(), funnelStage(), Time, leadToAdminItem(), AdminFunnelLeadDetail, AdminFunnelLeadItem, AdminFunnelLeadListResponse

### Community 103 - "CheckInController"
Cohesion: 0.39
Nodes (3): CheckInController, Context, NewCheckInController()

### Community 104 - "ai_generate_controller.go"
Cohesion: 0.25
Nodes (7): generateNutritionRequest, generateWeeklyNutritionRequest, generateWorkoutRequest, regenerateMealRequest, suggestFromIngredientsRequest, transcribeResponse, NewAIGenerateController()

### Community 105 - "AdminStudentController"
Cohesion: 0.43
Nodes (3): AdminStudentController, Context, NewAdminStudentController()

### Community 106 - "DailyFoodLogController"
Cohesion: 0.43
Nodes (3): DailyFoodLogController, Context, NewDailyFoodLogController()

### Community 107 - "AuthorizationService"
Cohesion: 0.43
Nodes (4): Context, DB, NewAuthorizationService(), AuthorizationService

### Community 108 - "AnalyzeBodyPhoto"
Cohesion: 0.60
Nodes (5): BodyPhotoAnalysisSchema, AnalyzeBodyPhoto(), BodyPhotoAnalysisJSONSchema(), Context, mockBodyPhotoAnalysis()

### Community 109 - "CoachStudentController"
Cohesion: 0.47
Nodes (3): CoachStudentController, Context, NewCoachStudentController()

### Community 110 - "NutritionPlanJSONSchema"
Cohesion: 0.47
Nodes (5): NutritionPlanJSONSchema(), T, TestNutritionPlanJSONSchemaShape(), TestSchemaNutritionFixtureUnmarshal(), TestSchemaWorkoutFixtureUnmarshal()

### Community 111 - ".Join"
Cohesion: 0.67
Nodes (3): Reader, meGetUploadDir(), meRemovePhotoFile()

### Community 112 - "AIChatController"
Cohesion: 0.50
Nodes (3): AIChatController, Context, NewAIChatController()

### Community 114 - "PersonalRecord"
Cohesion: 0.50
Nodes (3): Model, Time, PersonalRecord

### Community 115 - "WeeklyCheckIn"
Cohesion: 0.50
Nodes (3): Model, Time, WeeklyCheckIn

## Knowledge Gaps
- **138 isolated node(s):** `github.com/yourusername/fitness-management`, `regenerateMealRequest`, `suggestFromIngredientsRequest`, `transcribeResponse`, `registerRequest` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NewServer()` connect `NewServer` to `CoachProgramService`, `admin_template_service.go`, `AuthService`, `ExerciseRepository`, `TemplateRepository`, `ProgramRepository`, `MobileDeviceRepository`, `AdminUserService`, `SubscriptionRepository`, `AdminPlanService`, `.Get`, `AdminStudentService`, `TicketService`, `AuthController`, `CoachDashboardService`, `CoachProfileService`, `.Chat`, `FeedbackService`, `NotificationRepository`, `DataFile`, `UserRepository`, `Config`, `NotificationController`, `CoachAchievementService`, `Context`, `ProgressReportService`, `CoachProfileRepository`, `CoachProgramController`, `AdminCoachService`, `CoachSessionRepository`, `CommunityPostService`, `EventRepository`, `AdminProgramController`, `CoachDashboardController`, `MeController`, `CoachAchievementRepository`, `GuaranteeService`, `CoachProfileController`, `CoachTrackingController`, `RecipeService`, `CoachExerciseController`, `CoachPlanController`, `CoachAchievementController`, `CoachTicketController`, `AdminCoachController`, `MeTicketController`, `PublicCoachController`, `MotivationalQuoteRepository`, `AchievementService`, `PoseBankService`, `FunnelLead`, `MeService`, `AIGenerateService`, `ServicePlanRepository`, `SiteSettingsController`, `CommunityPostController`, `FoodRepository`, `GetJWTSecret`, `coach_food_service.go`, `DailyFoodLogRepository`, `GetUserID`, `AIRequestLogRepository`, `CoachStudentService`, `FeedbackRepository`, `AdminPlanController`, `CheckInController`, `ai_generate_controller.go`, `AdminStudentController`, `DailyFoodLogController`, `AuthorizationService`, `CoachStudentController`, `AIChatController`?**
  _High betweenness centrality (0.475) - this node is a cross-community bridge._
- **Why does `GetUserID()` connect `GetUserID` to `MobileDeviceRepository`, `UserRepository`, `NotificationController`, `NewServer`, `ProgressReportService`, `CoachProgramController`, `CoachSessionRepository`, `EventRepository`, `CoachDashboardController`, `MeController`, `GuaranteeService`, `CoachProfileController`, `CoachTrackingController`, `CoachExerciseController`, `CoachPlanController`, `CoachAchievementController`, `CoachTicketController`, `MeTicketController`, `AchievementService`, `CommunityPostController`, `GetJWTSecret`, `AIGenerateController`, `CheckInController`, `DailyFoodLogController`, `CoachStudentController`, `AIChatController`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `SubscriptionRepository` connect `SubscriptionRepository` to `CoachProgramService`, `ProgressReportService`, `ProgramRepository`, `AdminUserService`, `GuaranteeService`, `MeService`, `AdminStudentService`, `AIGenerateService`, `CoachDashboardService`, `NotificationRepository`, `UserRepository`, `CoachStudentService`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 146 inferred relationships involving `NewServer()` (e.g. with `CORSAllowCredentials()` and `IsOriginAllowed()`) actually correct?**
  _`NewServer()` has 146 INFERRED edges - model-reasoned connections that need verification._
- **Are the 113 inferred relationships involving `GetUserID()` (e.g. with `.GetMyAchievements()` and `.Review()`) actually correct?**
  _`GetUserID()` has 113 INFERRED edges - model-reasoned connections that need verification._
- **What connects `github.com/yourusername/fitness-management`, `regenerateMealRequest`, `suggestFromIngredientsRequest` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CoachProgramService` be split into smaller, more focused modules?**
  _Cohesion score 0.05025284450063211 - nodes in this community are weakly interconnected._