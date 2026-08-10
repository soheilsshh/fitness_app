# Graph Report - backend  (2026-08-10)

## Corpus Check
- 200 files · ~11,401,784 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1953 nodes · 4268 edges · 72 communities (70 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 392 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f8e832f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CoachProgramService
- TemplateRepository
- funnel_service.go
- generator.go
- AuthService
- RunDev
- ExerciseRepository
- templates.go
- ProgramRepository
- MobileAppService
- AdminUserService
- SubscriptionRepository
- ServicePlanRepository
- SiteSettingsController
- تسک‌های بکند — Morabiyar Multi-Coach
- MeService
- CoachStudentService
- daily_food_log_service.go
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
- PaymentService
- Config
- NotificationRepository
- NewServer
- Pagination Audit Report
- CoachAchievementService
- Context
- NewCheckoutService
- CoachProfileRepository
- CoachProgramController
- AdminCoachService
- OrderRepository
- ZarinpalClient
- sms_service.go
- AdminProgramController
- CoachDashboardController
- GetUserID
- CoachAchievementRepository
- UserRepository
- CoachProfileController
- TrackingController
- PaymentController
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

## God Nodes (most connected - your core abstractions)
1. `NewServer()` - 106 edges
2. `GetUserID()` - 71 edges
3. `SubscriptionRepository` - 41 edges
4. `ServicePlanRepository` - 36 edges
5. `FunnelService` - 33 edges
6. `MeService` - 33 edges
7. `CoachProfileRepository` - 31 edges
8. `ExerciseRepository` - 29 edges
9. `ProgramRepository` - 29 edges
10. `CoachProgramService` - 29 edges

## Surprising Connections (you probably didn't know these)
- `NewServer()` --calls--> `IsOriginAllowed()`  [INFERRED]
  cmd/app/main.go → config/config.go
- `NewServer()` --calls--> `NewAdminCoachController()`  [INFERRED]
  cmd/app/main.go → internal/controllers/admin_coach_controller.go
- `NewServer()` --calls--> `NewAdminDashboardController()`  [INFERRED]
  cmd/app/main.go → internal/controllers/admin_dashboard_controller.go
- `NewServer()` --calls--> `NewAdminExerciseController()`  [INFERRED]
  cmd/app/main.go → internal/controllers/admin_exercise_controller.go
- `NewServer()` --calls--> `NewAdminFeedbackController()`  [INFERRED]
  cmd/app/main.go → internal/controllers/admin_feedback_controller.go

## Import Cycles
- None detected.

## Communities (72 total, 2 thin omitted)

### Community 0 - "CoachProgramService"
Cohesion: 0.05
Nodes (68): Model, Model, Model, Context, NewAdminProgramService(), Context, DB, NewCoachProgramService() (+60 more)

### Community 1 - "TemplateRepository"
Cohesion: 0.06
Nodes (35): AdminTemplateController, Context, NewAdminTemplateController(), Model, Model, Context, DB, NewTemplateRepository() (+27 more)

### Community 2 - "funnel_service.go"
Cohesion: 0.06
Nodes (45): Model, Time, Context, DB, NewFunnelLeadRepository(), applyPlanToLead(), derefString(), funnelCoachSlug() (+37 more)

### Community 3 - "generator.go"
Cohesion: 0.05
Nodes (58): apiResponse, ExerciseSchema, FoodItem, FoodLogSchema, GenerateResult, jsonSchema, MealSchema, message (+50 more)

### Community 4 - "AuthService"
Cohesion: 0.06
Nodes (34): Claims, GetJWTSecret(), GenerateAccessToken(), GenerateRefreshToken(), Time, ParseToken(), AuthMiddleware(), HandlerFunc (+26 more)

### Community 5 - "RunDev"
Cohesion: 0.06
Nodes (55): main(), FS, DB, MaybeSeedDevData(), PrepareDatabase(), RunMigrations(), SeedCatalogs(), SeedDefaultAdmin() (+47 more)

### Community 6 - "ExerciseRepository"
Cohesion: 0.07
Nodes (31): AdminExerciseController, Context, NewAdminExerciseController(), Model, Context, DB, NewExerciseRepository(), extractInstructionSteps() (+23 more)

### Community 7 - "templates.go"
Cohesion: 0.06
Nodes (51): CoachFoodController, Context, NewCoachFoodController(), Model, Context, DB, NewFoodRepository(), foodExternalID() (+43 more)

### Community 8 - "ProgramRepository"
Cohesion: 0.06
Nodes (32): currentProgramsResponse, currentSubscriptionResponse, nutritionItemResponse, nutritionProgramResponse, planSummary, StudentController, studentMeResponse, subscriptionResponse (+24 more)

### Community 9 - "MobileAppService"
Cohesion: 0.07
Nodes (25): MobileAppController, Context, NewMobileAppController(), Time, Context, DB, Time, NewMobileDeviceRepository() (+17 more)

### Community 10 - "AdminUserService"
Cohesion: 0.06
Nodes (31): AdminDashboardController, AdminUserController, adminUsersListResponse, Context, NewAdminDashboardController(), Context, NewAdminUserController(), Context (+23 more)

### Community 11 - "SubscriptionRepository"
Cohesion: 0.10
Nodes (26): Model, Time, Context, DB, Time, NewSubscriptionRepository(), coachAlertsFromStudent(), daysBetween() (+18 more)

### Community 12 - "ServicePlanRepository"
Cohesion: 0.08
Nodes (23): AdminPlanController, Context, NewAdminPlanController(), Model, Context, DB, NewServicePlanRepository(), Context (+15 more)

### Community 13 - "SiteSettingsController"
Cohesion: 0.08
Nodes (25): GetUploadDir(), SiteSettingsController, Context, NewSiteSettingsController(), Model, RawMessage, Context, DB (+17 more)

### Community 14 - "تسک‌های بکند — Morabiyar Multi-Coach"
Cohesion: 0.04
Nodes (48): TASK-B0-01: به‌روزرسانی مستندات API, TASK-B0-02: تعریف ثابت‌های نقش, TASK-B1-01: Migration — فیلد AssignedCoachID روی User, TASK-B1-02: Migration — گسترش CoachProfile, TASK-B1-03: Migration — CoachID روی ServicePlan, TASK-B1-04: Migration — CoachID روی Subscription, TASK-B1-05: Migration — CoachID روی Order (اختیاری), TASK-B1-06: CoachProfile Repository (+40 more)

### Community 15 - "MeService"
Cohesion: 0.10
Nodes (30): Model, Time, containsString(), User, IsStudentProfileComplete(), StudentProfileProgress(), containsMeString(), Context (+22 more)

### Community 16 - "CoachStudentService"
Cohesion: 0.08
Nodes (27): AdminStudentController, CoachStudentController, Context, NewAdminStudentController(), Context, NewCoachStudentController(), Context, DB (+19 more)

### Community 17 - "daily_food_log_service.go"
Cohesion: 0.08
Nodes (31): DailyFoodLogController, Context, NewDailyFoodLogController(), Model, Time, Context, DB, Time (+23 more)

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
Cohesion: 0.12
Nodes (21): deltaPct(), Context, DB, Time, NewCoachDashboardService(), prevMonth(), epley(), Context (+13 more)

### Community 22 - "CoachProfileService"
Cohesion: 0.13
Nodes (22): IsValidIranNationalID(), Fallback(), Normalize(), coachProfileSubmissionMissingFields(), Context, Time, hasGrade3CoachingCertificate(), NewCoachProfileService() (+14 more)

### Community 23 - ".Chat"
Cohesion: 0.10
Nodes (23): Persona, AIChatController, Context, NewAIChatController(), aiDevMockReply(), buildFitinoSystemPrompt(), Client, Context (+15 more)

### Community 24 - "FeedbackService"
Cohesion: 0.10
Nodes (19): AdminFeedbackController, FeedbackController, Context, NewAdminFeedbackController(), Context, NewFeedbackController(), Model, Context (+11 more)

### Community 25 - "WorkoutHistoryService"
Cohesion: 0.12
Nodes (20): WorkoutHistoryController, Context, NewWorkoutHistoryController(), Model, Time, Model, Time, buildSetLogs() (+12 more)

### Community 26 - "DataFile"
Cohesion: 0.18
Nodes (22): countFiles(), Context, DB, SeedCatalogs(), SeedCatalogsFromConfig(), seedExercisesIfNeeded(), seedFoodsIfNeeded(), seedTemplatesIfNeeded() (+14 more)

### Community 27 - "مستندات API بکند — Morabiyar Multi-Coach"
Cohesion: 0.08
Nodes (23): CoachProfile (گسترش یافته) ✅, Order, ServicePlan, Subscription, User, داشبورد ✅, دانشجویان ✅, عمومی (+15 more)

### Community 28 - "PaymentService"
Cohesion: 0.22
Nodes (8): Context, DB, NewPaymentService(), NewPaymentServiceWithFunnel(), ZarinpalAmountRials(), PaymentService, preparedOrder, ZarinpalPaymentResponse

### Community 29 - "Config"
Cohesion: 0.19
Nodes (22): Config, applyExplicitEnvOverrides(), applyLegacyOverrides(), bindEnvKeys(), CORSAllowedOrigins(), CORSAllowLocalhost(), Get(), GetAccessTokenDuration() (+14 more)

### Community 30 - "NotificationRepository"
Cohesion: 0.13
Nodes (14): NotificationController, Context, NewNotificationController(), Model, Time, Context, DB, NewNotificationRepository() (+6 more)

### Community 31 - "NewServer"
Cohesion: 0.16
Nodes (16): Server, DB, main(), maybeSeedDevData(), NewServer(), runMigrations(), seedDefaultAdmin(), CORSAllowCredentials() (+8 more)

### Community 32 - "Pagination Audit Report"
Cohesion: 0.10
Nodes (19): Concerns, Conclusion, Current State, Current State, Fully Implemented, `GET /admin/users`, `GET /subscriptions`, Needs Improvement (+11 more)

### Community 33 - "CoachAchievementService"
Cohesion: 0.21
Nodes (13): IsValidCoachAchievementType(), ValidCoachAchievementTypes(), Context, NewCoachAchievementService(), toCoachAchievementDTO(), toPublicAchievementDTO(), CoachAchievementType, CoachAchievementCreateRequest (+5 more)

### Community 34 - "Context"
Cohesion: 0.20
Nodes (5): AdminFunnelController, FunnelController, Context, NewAdminFunnelController(), writeFunnelAuthSession()

### Community 35 - "NewCheckoutService"
Cohesion: 0.18
Nodes (12): CheckoutController, Context, NewCheckoutController(), generateTrackingCode(), Context, DB, NewCheckoutService(), orderItemsToDTO() (+4 more)

### Community 36 - "CoachProfileRepository"
Cohesion: 0.21
Nodes (6): Model, Context, DB, NewCoachProfileRepository(), CoachProfile, CoachProfileRepository

### Community 37 - "CoachProgramController"
Cohesion: 0.30
Nodes (4): CoachProgramController, Context, NewCoachProgramController(), parseOptionalPage()

### Community 38 - "AdminCoachService"
Cohesion: 0.22
Nodes (11): IsValidCoachProfileStatus(), Context, Time, NewAdminCoachService(), toAdminCoachAchievement(), AdminCoachAchievement, AdminCoachDetail, AdminCoachItem (+3 more)

### Community 39 - "OrderRepository"
Cohesion: 0.22
Nodes (8): Model, Time, Context, DB, NewOrderRepository(), Order, OrderItem, OrderRepository

### Community 40 - "ZarinpalClient"
Cohesion: 0.25
Nodes (9): Client, RawMessage, NewZarinpalClient(), parseZarinpalPayload(), zarinpalPersianMessage(), zarinpalAPIResponse, ZarinpalClient, zarinpalData (+1 more)

### Community 41 - "sms_service.go"
Cohesion: 0.23
Nodes (15): IsDevelopment(), containsPersian(), escapeAPIKeyForPath(), normalizeKavenegarAPIKey(), persianKavenegarError(), sanitizeLookupName(), SendProgramReadySMS(), SendVerification() (+7 more)

### Community 42 - "AdminProgramController"
Cohesion: 0.35
Nodes (3): AdminProgramController, Context, NewAdminProgramController()

### Community 43 - "CoachDashboardController"
Cohesion: 0.23
Nodes (7): CoachDashboardController, MeDashboardController, Context, NewCoachDashboardController(), parseIntQuery(), Context, NewMeDashboardController()

### Community 44 - "GetUserID"
Cohesion: 0.31
Nodes (5): MeController, Context, NewMeController(), GetUserID(), Context

### Community 45 - "CoachAchievementRepository"
Cohesion: 0.27
Nodes (6): Model, Context, DB, NewCoachAchievementRepository(), CoachAchievement, CoachAchievementRepository

### Community 46 - "UserRepository"
Cohesion: 0.30
Nodes (6): Context, DB, User, NewUserRepository(), NewFunnelService(), UserRepository

### Community 47 - "CoachProfileController"
Cohesion: 0.35
Nodes (3): CoachProfileController, Context, NewCoachProfileController()

### Community 48 - "TrackingController"
Cohesion: 0.29
Nodes (5): CoachTrackingController, TrackingController, Context, NewCoachTrackingController(), NewTrackingController()

### Community 49 - "PaymentController"
Cohesion: 0.31
Nodes (6): PaymentController, zarinpalRequestBody, Context, NewPaymentController(), webResultButton(), BuildMobilePaymentDeepLink()

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

## Knowledge Gaps
- **135 isolated node(s):** `github.com/yourusername/fitness-management`, `registerRequest`, `checkPhoneRequest`, `checkPhoneResponse`, `registerCoachRequest` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NewServer()` connect `NewServer` to `CoachProgramService`, `TemplateRepository`, `funnel_service.go`, `generator.go`, `AuthService`, `ExerciseRepository`, `templates.go`, `ProgramRepository`, `MobileAppService`, `AdminUserService`, `SubscriptionRepository`, `ServicePlanRepository`, `SiteSettingsController`, `MeService`, `CoachStudentService`, `daily_food_log_service.go`, `TicketService`, `AuthController`, `CoachDashboardService`, `CoachProfileService`, `.Chat`, `FeedbackService`, `WorkoutHistoryService`, `DataFile`, `PaymentService`, `Config`, `NotificationRepository`, `CoachAchievementService`, `Context`, `NewCheckoutService`, `CoachProfileRepository`, `CoachProgramController`, `AdminCoachService`, `OrderRepository`, `AdminProgramController`, `CoachDashboardController`, `GetUserID`, `CoachAchievementRepository`, `UserRepository`, `CoachProfileController`, `TrackingController`, `PaymentController`, `CoachExerciseController`, `CoachPlanController`, `CoachAchievementController`, `CoachTicketController`, `AdminCoachController`, `MeTicketController`, `PublicCoachController`?**
  _High betweenness centrality (0.383) - this node is a cross-community bridge._
- **Why does `MeService` connect `MeService` to `CoachProgramService`, `generator.go`, `ExerciseRepository`, `templates.go`, `OrderRepository`, `ProgramRepository`, `SubscriptionRepository`, `GetUserID`, `ServicePlanRepository`, `UserRepository`, `AuthController`, `.Chat`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `GetUserID()` connect `GetUserID` to `generator.go`, `AuthService`, `MobileAppService`, `CoachStudentService`, `daily_food_log_service.go`, `.Chat`, `WorkoutHistoryService`, `NotificationRepository`, `NewServer`, `NewCheckoutService`, `CoachProgramController`, `CoachDashboardController`, `CoachProfileController`, `TrackingController`, `PaymentController`, `CoachExerciseController`, `CoachPlanController`, `CoachAchievementController`, `CoachTicketController`, `MeTicketController`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 102 inferred relationships involving `NewServer()` (e.g. with `CORSAllowCredentials()` and `IsOriginAllowed()`) actually correct?**
  _`NewServer()` has 102 INFERRED edges - model-reasoned connections that need verification._
- **Are the 69 inferred relationships involving `GetUserID()` (e.g. with `.Chat()` and `.GenerateNutrition()`) actually correct?**
  _`GetUserID()` has 69 INFERRED edges - model-reasoned connections that need verification._
- **What connects `github.com/yourusername/fitness-management`, `registerRequest`, `checkPhoneRequest` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CoachProgramService` be split into smaller, more focused modules?**
  _Cohesion score 0.05384615384615385 - nodes in this community are weakly interconnected._