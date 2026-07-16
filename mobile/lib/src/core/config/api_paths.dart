/// Backend endpoint paths (relative to [AppConfig.baseUrl]).
/// Mirrors the routes registered in `backend/cmd/app/main.go`.
class ApiPaths {
  const ApiPaths._();

  // Auth (public)
  static const register = '/auth/register';
  static const registerCoach = '/auth/register/coach';
  static const loginPassword = '/auth/login/password';
  static const otpRequest = '/auth/otp/request';
  static const otpVerify = '/auth/otp/verify';
  static const forgotSendOtp = '/auth/forgot/send-otp';
  static const resetPassword = '/auth/reset-password';

  // Auth (protected)
  static const logout = '/auth/logout';
  static const me = '/me';
  static const authMe = '/auth/me';
  static const changePassword = '/me/change-password';
  static const bodyPhotos = '/me/body-photos';

  // Student
  static const meDashboard = '/me/dashboard';
  static const meRecords = '/me/records';
  static const mePrograms = '/me/programs';
  static const meOrders = '/me/orders';
  static const meTracking = '/me/tracking';
  static const meTrackingWeight = '/me/tracking/weight';
  static const meTrackingPhotos = '/me/tracking/photos';
  static const meWorkoutHistory = '/me/workout-history';
  static const meWorkoutSessions = '/me/workout-sessions';
  static const meTickets = '/me/tickets';
  static const meAiChat = '/me/ai/chat';
  static const meAvatar = '/me/avatar';
  static const programsCurrent = '/programs/current';
  static const userFoods = '/user/foods';
  static const userFoodLogs = '/user/food-logs';
  static const subscriptionsCurrent = '/subscriptions/current';
  static const ordersCheckout = '/orders/checkout';
  static const zarinpalRequest = '/payments/zarinpal/request';
  static const checkPhone = '/auth/check-phone';

  static String publicCoachPlans(String slug) => '/coaches/$slug/plans';
  static String publicCoach(String slug) => '/coaches/$slug';
  static String meOrder(int id) => '/me/orders/$id';
  static String meTicket(int id) => '/me/tickets/$id';
  static String meProgram(int id) => '/me/programs/$id';
  static String coachTicket(int id) => '/coach/tickets/$id';
  static String coachStudent(int id) => '/coach/students/$id';
  static String coachStudentPrograms(int id) => '/coach/students/$id/programs';
  static String coachStudentWorkoutPrograms(int id) =>
      '/coach/students/$id/workout-programs';
  static String coachStudentWorkoutProgram(int id, int programId) =>
      '/coach/students/$id/workout-programs/$programId';
  static String coachStudentWorkoutFromTemplate(int id, int templateId) =>
      '/coach/students/$id/workout-programs/templates/$templateId';
  static String coachStudentNutritionPrograms(int id) =>
      '/coach/students/$id/nutrition-programs';
  static String coachStudentNutritionProgram(int id, int programId) =>
      '/coach/students/$id/nutrition-programs/$programId';
  static String coachStudentNutritionFromTemplate(int id, int templateId) =>
      '/coach/students/$id/nutrition-programs/templates/$templateId';
  static String coachPlan(int id) => '/coach/plans/$id';
  static String coachTrackingStudent(int id) => '/coach/tracking/students/$id';
  static String coachAchievement(int id) => '/coach/profile/achievements/$id';

  // Public content
  static const coaches = '/coaches';
  static const siteSettings = '/site-settings';
  static const academy = '/academy';
  static const faq = '/faq';
  static const mobileHeartbeatPublic = '/mobile/heartbeat';
  static const meMobileHeartbeat = '/me/mobile/heartbeat';

  // Coach
  static const coachProfile = '/coach/profile';
  static const coachProfileSubmit = '/coach/profile/submit-request';
  static const coachProfileSlugCheck = '/coach/profile/slug/check';
  static const coachProfileAvatar = '/coach/profile/avatar';
  static const coachProfileCover = '/coach/profile/cover';
  static const coachAchievements = '/coach/profile/achievements';
  static const coachAchievementImage = '/coach/profile/achievements/image';
  static const coachPlans = '/coach/plans';
  static const coachStudents = '/coach/students';
  static const coachWorkoutTemplates = '/coach/workout-templates';
  static const coachNutritionTemplates = '/coach/nutrition-templates';
  static const coachTrackingStudents = '/coach/tracking/students';
  static const coachDashboardStats = '/coach/dashboard/stats';
  static const coachDashboardRecent = '/coach/dashboard/recent-students';
  static const coachDashboardTop = '/coach/dashboard/top-students';
  static const coachDashboardProgress = '/coach/dashboard/progress-series';
  static const coachTickets = '/coach/tickets';
  static const coachFoods = '/coach/foods';
  static const coachExercises = '/coach/exercises';
  static const coachExerciseCategories = '/coach/exercises/categories';
  static const coachNotifications = '/coach/notifications';
}
