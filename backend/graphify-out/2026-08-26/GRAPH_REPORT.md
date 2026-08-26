# Graph Report - backend  (2026-08-26)

## Corpus Check
- 274 files · ~11,467,689 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2809 nodes · 6376 edges · 136 communities (133 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 586 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6cad6590`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MeDayPlanDTO
- TemplateRepository
- FunnelService
- generator.go
- AuthService
- EnsureDemoData
- ExerciseRepository
- templates.go
- ProgramRepository
- MobileDeviceRepository
- AdminUserService
- CheckInService
- AdminPlanService
- SiteSettingsController
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
- WorkoutHistoryService
- DataFile
- مستندات API بکند — Morabiyar Multi-Coach
- NewCheckoutService
- Config
- NotificationController
- main
- Pagination Audit Report
- CoachAchievementService
- Context
- ProgressReportService
- CoachProfileRepository
- CoachProgramController
- AdminCoachService
- NotificationRepository
- CommunityPostService
- EventRepository
- AdminProgramController
- GamificationRepository
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
- main
- CheckIn
- Transaction
- seed_peyman_yazdani_paste.sh
- github.com/yourusername/fitness-management
- MotivationalQuoteRepository
- AchievementService
- PoseBankService
- usda.go
- funnel_analyze.go
- FunnelLead
- funnel_service.go
- MeService
- Context
- CoachProgramService
- SubscriptionRepository
- .Get
- schemas.go
- ServicePlanRepository
- FoodRepository
- GetJWTSecret
- coach_food_service.go
- CoachStudentProgramsResponse
- ValidateNutritionPlan
- me_service.go
- GetUserID
- AIRequestLogRepository
- foods.go
- CoachStudentService
- AIGenerateController
- AIGenerateService
- FeedbackRepository
- CalculateNutritionTargets
- enrichWorkoutPlan
- deriveServingUnits
- OrderRepository
- ZarinpalClient
- ai_generate_service.go
- AdminStudentController
- DailyFoodLogController
- DailyFoodLogRepository
- MotivationalQuoteService
- CoachStudentController
- NutritionPlanJSONSchema
- .Join
- AIChatController
- PersonalRecord
- WeeklyCheckIn
- FunnelAIAnalysisRepository
- FromUser
- PaymentService
- RunDev
- UserRepository
- PrepareDatabase
- PaymentController
- AdminMotivationalQuoteController
- IsValidIranNationalID
- FillMissingExerciseMedia
- AllModels
- EnsureAliFunnel
- NewServer
- AdminPlanController
- _tmp_ailogs.go
- .GenerateWorkout
- Allowed
- AuthorizationService
- FeedbackController

## God Nodes (most connected - your core abstractions)
1. `NewServer()` - 154 edges
2. `GetUserID()` - 117 edges
3. `SubscriptionRepository` - 52 edges
4. `AchievementService` - 48 edges
5. `MeService` - 42 edges
6. `ServicePlanRepository` - 36 edges
7. `ProgramRepository` - 35 edges
8. `AIGenerateService` - 34 edges
9. `CoachProgramService` - 34 edges
10. `FunnelService` - 34 edges

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

## Communities (136 total, 3 thin omitted)

### Community 0 - "MeDayPlanDTO"
Cohesion: 0.12
Nodes (35): Model, Model, Model, buildFullPlanByDay(), dayKeyToNum(), exerciseDTOToProgramItem(), extractNutritionTargetsFromPlan(), formatWorkoutStep() (+27 more)

### Community 1 - "TemplateRepository"
Cohesion: 0.06
Nodes (35): AdminTemplateController, Context, NewAdminTemplateController(), Model, Model, Context, DB, NewTemplateRepository() (+27 more)

### Community 2 - "FunnelService"
Cohesion: 0.23
Nodes (5): funnelCoachSlug(), Context, FunnelService, User, FunnelCheckoutDTO

### Community 3 - "generator.go"
Cohesion: 0.23
Nodes (23): apiResponse, GenerateResult, jsonSchema, message, responseFormat, structuredRequest, usageInfo, callWithSchema() (+15 more)

### Community 4 - "AuthService"
Cohesion: 0.08
Nodes (25): Model, Time, Model, Time, NormalizePhone(), ToEnglish(), Context, DB (+17 more)

### Community 5 - "EnsureDemoData"
Cohesion: 0.44
Nodes (11): ensureAliTierCustomers(), ensureDemoCoachProfile(), EnsureDemoData(), ensureDemoPlan(), ensureDemoSubscription(), ensureDemoUser(), ensureDemoUserFreshPassword(), findUserByEmail() (+3 more)

### Community 6 - "ExerciseRepository"
Cohesion: 0.07
Nodes (31): AdminExerciseController, Context, NewAdminExerciseController(), Model, Context, DB, NewExerciseRepository(), extractInstructionSteps() (+23 more)

### Community 7 - "templates.go"
Cohesion: 0.18
Nodes (24): buildNutritionTemplateMeals(), buildWorkoutTemplateItems(), Context, DB, isAMRAPSetType(), mapCreatorID(), mapExerciseSystemType(), resolveCrulPath() (+16 more)

### Community 8 - "ProgramRepository"
Cohesion: 0.06
Nodes (32): currentProgramsResponse, currentSubscriptionResponse, nutritionItemResponse, nutritionProgramResponse, planSummary, StudentController, studentMeResponse, subscriptionResponse (+24 more)

### Community 9 - "MobileDeviceRepository"
Cohesion: 0.05
Nodes (37): MobileAppController, Context, NewMobileAppController(), Time, Context, DB, Time, NewMobileDeviceRepository() (+29 more)

### Community 10 - "AdminUserService"
Cohesion: 0.07
Nodes (31): AdminDashboardController, AdminUserController, adminUsersListResponse, Context, NewAdminDashboardController(), Context, NewAdminUserController(), Context (+23 more)

### Community 11 - "CheckInService"
Cohesion: 0.10
Nodes (23): CheckInController, Context, NewCheckInController(), Model, Time, Context, DB, Time (+15 more)

### Community 12 - "AdminPlanService"
Cohesion: 0.18
Nodes (14): Context, Time, NewAdminPlanService(), planToDetail(), planToItem(), Context, NewCoachPlanService(), AdminPlanCreateRequest (+6 more)

### Community 13 - "SiteSettingsController"
Cohesion: 0.08
Nodes (25): GetUploadDir(), SiteSettingsController, Context, NewSiteSettingsController(), Model, RawMessage, Context, DB (+17 more)

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
Cohesion: 0.14
Nodes (26): dailyFoodLogToDTO(), formatFoodLogDate(), Context, Time, NewDailyFoodLogService(), normalizeFoodLogDate(), normalizeMealType(), parseFoodLogDate() (+18 more)

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
Cohesion: 0.08
Nodes (28): CoachDashboardController, MeDashboardController, Context, NewCoachDashboardController(), parseIntQuery(), Context, NewMeDashboardController(), deltaPct() (+20 more)

### Community 22 - "CoachProfileService"
Cohesion: 0.14
Nodes (20): Fallback(), Normalize(), Context, Time, hasGrade3CoachingCertificate(), NewCoachProfileService(), normalizePersianText(), toCoachProfileDTO() (+12 more)

### Community 23 - ".Chat"
Cohesion: 0.12
Nodes (20): Persona, aiDevMockReply(), buildFitinoSystemPrompt(), Client, Context, Mutex, Time, hitsProgramOrDietTopic() (+12 more)

### Community 24 - "FeedbackService"
Cohesion: 0.20
Nodes (10): AdminFeedbackController, Context, NewAdminFeedbackController(), Context, Time, NewFeedbackService(), FeedbackCreateRequest, FeedbackItemDTO (+2 more)

### Community 25 - "WorkoutHistoryService"
Cohesion: 0.13
Nodes (21): Model, Time, buildPersonalRecords(), buildSetLogs(), Context, DB, Time, NewWorkoutHistoryService() (+13 more)

### Community 26 - "DataFile"
Cohesion: 0.29
Nodes (16): countFiles(), Context, DB, SeedCatalogs(), SeedCatalogsFromConfig(), seedExercisesIfNeeded(), seedFoodsIfNeeded(), seedTemplatesIfNeeded() (+8 more)

### Community 27 - "مستندات API بکند — Morabiyar Multi-Coach"
Cohesion: 0.08
Nodes (23): CoachProfile (گسترش یافته) ✅, Order, ServicePlan, Subscription, User, داشبورد ✅, دانشجویان ✅, عمومی (+15 more)

### Community 28 - "NewCheckoutService"
Cohesion: 0.18
Nodes (12): CheckoutController, Context, NewCheckoutController(), generateTrackingCode(), Context, DB, NewCheckoutService(), orderItemsToDTO() (+4 more)

### Community 29 - "Config"
Cohesion: 0.20
Nodes (21): Config, applyExplicitEnvOverrides(), applyLegacyOverrides(), bindEnvKeys(), CORSAllowCredentials(), CORSAllowedOrigins(), CORSAllowLocalhost(), Get() (+13 more)

### Community 30 - "NotificationController"
Cohesion: 0.39
Nodes (3): NotificationController, Context, NewNotificationController()

### Community 31 - "main"
Cohesion: 0.33
Nodes (8): Server, DB, main(), maybeSeedDevData(), runMigrations(), seedDefaultAdmin(), ServerAddr(), Engine

### Community 32 - "Pagination Audit Report"
Cohesion: 0.10
Nodes (19): Concerns, Conclusion, Current State, Current State, Fully Implemented, `GET /admin/users`, `GET /subscriptions`, Needs Improvement (+11 more)

### Community 33 - "CoachAchievementService"
Cohesion: 0.21
Nodes (13): IsValidCoachAchievementType(), ValidCoachAchievementTypes(), Context, NewCoachAchievementService(), toCoachAchievementDTO(), toPublicAchievementDTO(), CoachAchievementType, CoachAchievementCreateRequest (+5 more)

### Community 34 - "Context"
Cohesion: 0.18
Nodes (6): AdminFunnelController, FunnelController, Context, NewAdminFunnelController(), NewFunnelController(), writeFunnelAuthSession()

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

### Community 39 - "NotificationRepository"
Cohesion: 0.06
Nodes (37): CoachSessionController, MeSessionController, Context, NewCoachSessionController(), NewMeSessionController(), writeSessionError(), Model, Time (+29 more)

### Community 40 - "CommunityPostService"
Cohesion: 0.07
Nodes (31): AdminCommunityPostController, CommunityPostController, Context, NewAdminCommunityPostController(), NewCommunityPostController(), Model, Context, DB (+23 more)

### Community 41 - "EventRepository"
Cohesion: 0.09
Nodes (21): AdminEventController, EventController, Context, NewAdminEventController(), NewEventController(), Model, Time, Context (+13 more)

### Community 42 - "AdminProgramController"
Cohesion: 0.35
Nodes (3): AdminProgramController, Context, NewAdminProgramController()

### Community 43 - "GamificationRepository"
Cohesion: 0.08
Nodes (25): GamificationController, Context, NewGamificationController(), Model, Model, Context, DB, Time (+17 more)

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

### Community 63 - "main"
Cohesion: 0.38
Nodes (5): main(), ensureDatabaseExists(), DB, NewMySQLGORM(), LogDemoCredentials()

### Community 64 - "CheckIn"
Cohesion: 0.50
Nodes (3): Model, Time, CheckIn

### Community 65 - "Transaction"
Cohesion: 0.50
Nodes (3): Model, Time, Transaction

### Community 72 - "MotivationalQuoteRepository"
Cohesion: 0.25
Nodes (6): Model, Context, DB, NewMotivationalQuoteRepository(), MotivationalQuote, MotivationalQuoteRepository

### Community 73 - "AchievementService"
Cohesion: 0.09
Nodes (18): AchievementController, Context, NewAchievementController(), Model, Model, Context, DB, NewAchievementRepository() (+10 more)

### Community 74 - "PoseBankService"
Cohesion: 0.11
Nodes (19): AdminPoseBankController, PoseBankController, Context, NewAdminPoseBankController(), NewPoseBankController(), Model, Context, DB (+11 more)

### Community 75 - "usda.go"
Cohesion: 0.15
Nodes (26): applyMatch(), Context, DB, markUnmatched(), runEnrichment(), main(), csvHeaderIndex(), downloadFile() (+18 more)

### Community 76 - "funnel_analyze.go"
Cohesion: 0.15
Nodes (32): FunnelAnalysisSchema, FunnelChartBarSchema, ValidateFunnelAnalysis(), analyzeReqFromLead(), buildFunnelAnalysisPrompt(), buildPersonalizedChartBars(), buildPersonalizedFunnelDTO(), buildPersonalizedTrendChart() (+24 more)

### Community 77 - "FunnelLead"
Cohesion: 0.17
Nodes (8): Model, Time, Context, DB, NewFunnelLeadRepository(), FunnelLead, FunnelLeadRepository, FunnelStats

### Community 78 - "funnel_service.go"
Cohesion: 0.09
Nodes (34): applyFunnelMetrics(), funnelPaymentPath(), applyPlanToLead(), derefString(), funnelStage(), generateFunnelToken(), generateFunnelTrackingCode(), Time (+26 more)

### Community 79 - "MeService"
Cohesion: 0.23
Nodes (6): Time, Context, DB, NewMeService(), MeService, ProgramVersionDTO

### Community 80 - "Context"
Cohesion: 0.20
Nodes (12): FoodLogSchema, buildAIUserContext(), derefFloat(), Context, mapAIGenErr(), mapPrimaryGoalToPlanGoal(), truncateRunes(), Context (+4 more)

### Community 81 - "CoachProgramService"
Cohesion: 0.27
Nodes (5): Context, DB, NewCoachProgramService(), applyNutritionProgramTargets(), CoachProgramService

### Community 82 - "SubscriptionRepository"
Cohesion: 0.08
Nodes (34): BodyPhotoAnalysisSchema, Model, Time, Context, DB, Time, NewSubscriptionRepository(), ValidateBodyPhotoAnalysis() (+26 more)

### Community 83 - ".Get"
Cohesion: 0.19
Nodes (17): Context, transcribeWithShenava(), containsPersian(), escapeAPIKeyForPath(), normalizeKavenegarAPIKey(), persianKavenegarError(), sanitizeLookupName(), SendInactivityReminderSMS() (+9 more)

### Community 84 - "schemas.go"
Cohesion: 0.11
Nodes (21): ExerciseSchema, ProgressAnalysisSchema, SetLogSchema, WorkoutDaySchema, WorkoutNoteSummarySchema, FoodLogJSONSchema(), FunnelAnalysisJSONSchema(), IngredientSuggestionJSONSchema() (+13 more)

### Community 85 - "ServicePlanRepository"
Cohesion: 0.24
Nodes (6): Model, Context, DB, NewServicePlanRepository(), ServicePlan, ServicePlanRepository

### Community 86 - "FoodRepository"
Cohesion: 0.27
Nodes (7): Model, Context, DB, NewFoodRepository(), Food, FoodServingUnit, FoodRepository

### Community 87 - "GetJWTSecret"
Cohesion: 0.20
Nodes (12): Claims, GetAccessTokenDuration(), GetJWTSecret(), GetRefreshTokenDuration(), Duration, GenerateAccessToken(), GenerateRefreshToken(), Time (+4 more)

### Community 88 - "coach_food_service.go"
Cohesion: 0.23
Nodes (10): CoachFoodController, Context, NewCoachFoodController(), foodModelToCoachItem(), Context, NewCoachFoodService(), CoachFoodItem, CoachFoodListResponse (+2 more)

### Community 89 - "CoachStudentProgramsResponse"
Cohesion: 0.25
Nodes (8): Context, NewAdminProgramService(), AdminProgramService, CoachStudentProgramsResponse, NutritionTemplateSummary, ProgramAssignRequest, TemplateListResponse, WorkoutTemplateSummary

### Community 90 - "ValidateNutritionPlan"
Cohesion: 0.42
Nodes (8): T, TestParsePersona(), TestValidateNutritionPlan_AcceptsValid(), TestValidateNutritionPlan_RejectsBadCalories(), TestValidateNutritionPlan_RejectsEmptyMeals(), TestValidateWorkoutPlan_AcceptsValid(), TestValidateWorkoutPlan_RejectsEmptyDays(), ValidateNutritionPlan()

### Community 91 - "me_service.go"
Cohesion: 0.19
Nodes (16): Time, mePhotosToDTO(), meSplitName(), MeNutritionDTO, MeOrderDTO, MeOrderItemDTO, MeOrderListResponse, MePhotoDTO (+8 more)

### Community 92 - "GetUserID"
Cohesion: 0.32
Nodes (5): WorkoutHistoryController, Context, NewWorkoutHistoryController(), GetUserID(), Context

### Community 93 - "AIRequestLogRepository"
Cohesion: 0.21
Nodes (8): Model, Context, DB, Time, NewAIRequestLogRepository(), AIRequestLog, AIRequestLogRepository, AIUsageSummaryRow

### Community 94 - "foods.go"
Cohesion: 0.24
Nodes (18): foodExternalID(), Context, DB, ImportFoodsCSV(), mapCSVFoodHeader(), mapCSVRowToFood(), normalizeNumber(), parseCSVFoodRow() (+10 more)

### Community 95 - "CoachStudentService"
Cohesion: 0.33
Nodes (7): Context, DB, Time, User, NewCoachStudentService(), CoachStudentDetail, CoachStudentService

### Community 96 - "AIGenerateController"
Cohesion: 0.41
Nodes (3): AIGenerateController, Context, writeAIGenerateError()

### Community 97 - "AIGenerateService"
Cohesion: 0.23
Nodes (11): FoodItem, IngredientSuggestionSchema, MealSchema, buildIngredientUserContext(), DB, Mutex, Time, NewAIGenerateService() (+3 more)

### Community 98 - "FeedbackRepository"
Cohesion: 0.29
Nodes (6): Model, Context, DB, NewFeedbackRepository(), Feedback, FeedbackRepository

### Community 99 - "CalculateNutritionTargets"
Cohesion: 0.38
Nodes (8): ageFromBirthDate(), CalculateNutritionTargets(), T, TestCalculateNutritionTargets_BodyFatUsesKatchMcArdle(), TestCalculateNutritionTargets_CutIsLowerThanBulk(), TestCalculateNutritionTargets_DefaultsWhenMissing(), TestCalculateNutritionTargets_MaintainMale(), NutritionCalcInput

### Community 100 - "enrichWorkoutPlan"
Cohesion: 0.15
Nodes (16): decodeInstructionStepsJSON(), enrichWorkoutPlan(), exerciseMediaURL(), exerciseModelToWorkoutDTO(), Context, lookupMediaDonor(), warmMediaDonorCache(), IsValidMealSlot() (+8 more)

### Community 101 - "deriveServingUnits"
Cohesion: 0.36
Nodes (8): deriveServingUnits(), EnrichFoodServingUnits(), Context, DB, gramsPerUnitFromSibling(), isJunkLabel(), normalizeUnitLabel(), derivedUnit

### Community 102 - "OrderRepository"
Cohesion: 0.22
Nodes (8): Model, Time, Context, DB, NewOrderRepository(), Order, OrderItem, OrderRepository

### Community 103 - "ZarinpalClient"
Cohesion: 0.25
Nodes (9): Client, RawMessage, NewZarinpalClient(), parseZarinpalPayload(), zarinpalPersianMessage(), zarinpalAPIResponse, ZarinpalClient, zarinpalData (+1 more)

### Community 104 - "ai_generate_service.go"
Cohesion: 0.14
Nodes (18): NutritionPlanSchema, NutritionWeekDaySchema, NutritionWeekSchema, generateNutritionRequest, generateWeeklyNutritionRequest, generateWorkoutRequest, regenerateMealRequest, suggestFromIngredientsRequest (+10 more)

### Community 105 - "AdminStudentController"
Cohesion: 0.43
Nodes (3): AdminStudentController, Context, NewAdminStudentController()

### Community 106 - "DailyFoodLogController"
Cohesion: 0.43
Nodes (3): DailyFoodLogController, Context, NewDailyFoodLogController()

### Community 107 - "DailyFoodLogRepository"
Cohesion: 0.22
Nodes (8): Model, Time, Context, DB, Time, NewDailyFoodLogRepository(), DailyFoodLog, DailyFoodLogRepository

### Community 108 - "MotivationalQuoteService"
Cohesion: 0.37
Nodes (7): Context, NewMotivationalQuoteService(), quoteToDTO(), MotivationalQuoteDTO, MotivationalQuoteService, QuoteListResponse, QuoteUpsertRequest

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

### Community 117 - "FunnelAIAnalysisRepository"
Cohesion: 0.19
Nodes (9): Model, Time, Context, DB, NewFunnelAIAnalysisRepository(), fillAnalysisNarrativeFields(), NewFunnelService(), FunnelAIAnalysis (+1 more)

### Community 118 - "FromUser"
Cohesion: 0.25
Nodes (13): Derived, AgeFromBirthDate(), BMI(), BMIStatusFromValue(), BMIStatusFromValues(), FromUser(), Time, User (+5 more)

### Community 119 - "PaymentService"
Cohesion: 0.23
Nodes (8): Context, DB, NewPaymentService(), NewPaymentServiceWithFunnel(), ZarinpalAmountRials(), PaymentService, preparedOrder, ZarinpalPaymentResponse

### Community 120 - "RunDev"
Cohesion: 0.26
Nodes (10): Context, DB, logSeedResult(), RunDev(), syncAutoIncrement(), Context, DB, validatePreconditions() (+2 more)

### Community 121 - "UserRepository"
Cohesion: 0.33
Nodes (5): Context, DB, User, NewUserRepository(), UserRepository

### Community 122 - "PrepareDatabase"
Cohesion: 0.33
Nodes (9): DB, MaybeSeedDevData(), PrepareDatabase(), RunMigrations(), SeedCatalogs(), SeedDefaultAdmin(), EnsureSiteContact(), Context (+1 more)

### Community 123 - "PaymentController"
Cohesion: 0.31
Nodes (6): PaymentController, zarinpalRequestBody, Context, NewPaymentController(), webResultButton(), BuildMobilePaymentDeepLink()

### Community 124 - "AdminMotivationalQuoteController"
Cohesion: 0.31
Nodes (4): AdminMotivationalQuoteController, MotivationalQuoteController, Context, NewMotivationalQuoteController()

### Community 125 - "IsValidIranNationalID"
Cohesion: 0.22
Nodes (9): IsValidIranNationalID(), T, TestIsValidIranNationalID(), applyCoachPublishFlag(), coachProfileSubmissionMissingFields(), T, TestApplyCoachPublishFlagPendingDraft(), TestCoachProfileSubmissionMissingFields() (+1 more)

### Community 126 - "FillMissingExerciseMedia"
Cohesion: 0.43
Nodes (6): dirHasMediaFiles(), exerciseMediaUsable(), FillMissingExerciseMedia(), Context, DB, normalizeExerciseCoreName()

### Community 127 - "AllModels"
Cohesion: 0.24
Nodes (8): FS, AllModels(), fixtureFileName(), FixtureNamesForAllModels(), fixturesSubFS(), DB, registerDevSpecs(), Seeder

### Community 128 - "EnsureAliFunnel"
Cohesion: 0.44
Nodes (9): EnsureAliFunnel(), ensureAliFunnelPlans(), ensureAliFunnelProfile(), ensureAliFunnelUser(), Context, DB, User, syncAliFunnelUser() (+1 more)

### Community 129 - "NewServer"
Cohesion: 0.28
Nodes (7): NewServer(), NewAdminMotivationalQuoteController(), AdminOnly(), HandlerFunc, ApprovedCoachOnly(), CoachOnly(), HandlerFunc

### Community 130 - "AdminPlanController"
Cohesion: 0.36
Nodes (3): AdminPlanController, Context, NewAdminPlanController()

### Community 132 - ".GenerateWorkout"
Cohesion: 0.43
Nodes (6): WorkoutPlanSchema, buildWorkoutConstraintsContext(), workoutPlanToItems(), ValidateWorkoutPlan(), WorkoutConstraints, WorkoutPlanResult

### Community 133 - "Allowed"
Cohesion: 0.36
Nodes (6): Allowed(), isProductionEnv(), isTruthy(), T, TestAllowedBlocksProduction(), TestDevFixturePasswordHash()

### Community 134 - "AuthorizationService"
Cohesion: 0.43
Nodes (4): Context, DB, NewAuthorizationService(), AuthorizationService

### Community 135 - "FeedbackController"
Cohesion: 0.50
Nodes (3): FeedbackController, Context, NewFeedbackController()

## Knowledge Gaps
- **138 isolated node(s):** `github.com/yourusername/fitness-management`, `regenerateMealRequest`, `suggestFromIngredientsRequest`, `transcribeResponse`, `registerRequest` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NewServer()` connect `NewServer` to `TemplateRepository`, `AuthService`, `ExerciseRepository`, `ProgramRepository`, `MobileDeviceRepository`, `AdminUserService`, `CheckInService`, `AdminPlanService`, `SiteSettingsController`, `AdminStudentService`, `.CreateLog`, `TicketService`, `AuthController`, `CoachDashboardService`, `CoachProfileService`, `.Chat`, `FeedbackService`, `WorkoutHistoryService`, `DataFile`, `NewCheckoutService`, `Config`, `NotificationController`, `main`, `CoachAchievementService`, `Context`, `ProgressReportService`, `CoachProfileRepository`, `CoachProgramController`, `AdminCoachService`, `NotificationRepository`, `CommunityPostService`, `EventRepository`, `AdminProgramController`, `GamificationRepository`, `MeController`, `CoachAchievementRepository`, `GuaranteeService`, `CoachProfileController`, `CoachTrackingController`, `RecipeService`, `CoachExerciseController`, `CoachPlanController`, `CoachAchievementController`, `CoachTicketController`, `AdminCoachController`, `MeTicketController`, `PublicCoachController`, `MotivationalQuoteRepository`, `AchievementService`, `PoseBankService`, `FunnelLead`, `MeService`, `CoachProgramService`, `SubscriptionRepository`, `ServicePlanRepository`, `FoodRepository`, `GetJWTSecret`, `coach_food_service.go`, `CoachStudentProgramsResponse`, `GetUserID`, `AIRequestLogRepository`, `CoachStudentService`, `AIGenerateService`, `FeedbackRepository`, `OrderRepository`, `ai_generate_service.go`, `AdminStudentController`, `DailyFoodLogController`, `DailyFoodLogRepository`, `MotivationalQuoteService`, `CoachStudentController`, `AIChatController`, `FunnelAIAnalysisRepository`, `PaymentService`, `UserRepository`, `PaymentController`, `AdminMotivationalQuoteController`, `AdminPlanController`, `AuthorizationService`, `FeedbackController`?**
  _High betweenness centrality (0.442) - this node is a cross-community bridge._
- **Why does `GetUserID()` connect `GetUserID` to `NewServer`, `MobileDeviceRepository`, `CheckInService`, `CoachDashboardService`, `NewCheckoutService`, `NotificationController`, `ProgressReportService`, `CoachProgramController`, `NotificationRepository`, `CommunityPostService`, `EventRepository`, `GamificationRepository`, `MeController`, `GuaranteeService`, `CoachProfileController`, `CoachTrackingController`, `CoachExerciseController`, `CoachPlanController`, `CoachAchievementController`, `CoachTicketController`, `MeTicketController`, `AchievementService`, `GetJWTSecret`, `AIGenerateController`, `DailyFoodLogController`, `CoachStudentController`, `AIChatController`, `PaymentController`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `MeService` connect `MeService` to `AIGenerateService`, `ExerciseRepository`, `OrderRepository`, `ProgramRepository`, `AchievementService`, `MeController`, `.buildProfileDTO`, `.Join`, `SubscriptionRepository`, `AuthController`, `ServicePlanRepository`, `FoodRepository`, `.Chat`, `UserRepository`, `me_service.go`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 150 inferred relationships involving `NewServer()` (e.g. with `CORSAllowCredentials()` and `IsOriginAllowed()`) actually correct?**
  _`NewServer()` has 150 INFERRED edges - model-reasoned connections that need verification._
- **Are the 115 inferred relationships involving `GetUserID()` (e.g. with `.GetMyAchievements()` and `.Review()`) actually correct?**
  _`GetUserID()` has 115 INFERRED edges - model-reasoned connections that need verification._
- **What connects `github.com/yourusername/fitness-management`, `regenerateMealRequest`, `suggestFromIngredientsRequest` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MeDayPlanDTO` be split into smaller, more focused modules?**
  _Cohesion score 0.12051282051282051 - nodes in this community are weakly interconnected._