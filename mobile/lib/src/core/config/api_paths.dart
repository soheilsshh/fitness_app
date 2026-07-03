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
  static const meWorkoutHistory = '/me/workout-history';
  static const meTickets = '/me/tickets';
  static const userFoods = '/user/foods';
  static const userFoodLogs = '/user/food-logs';
  static const subscriptionsCurrent = '/subscriptions/current';
  static const ordersCheckout = '/orders/checkout';
  static const zarinpalRequest = '/payments/zarinpal/request';

  static String coachPlans(String slug) => '/coaches/$slug/plans';

  // Public
  static const coaches = '/coaches';
  static const siteSettings = '/site-settings';

  // Coach
  static const coachProfile = '/coach/profile';
  static const coachPlans = '/coach/plans';
  static const coachStudents = '/coach/students';
  static const coachDashboardStats = '/coach/dashboard/stats';
  static const coachDashboardRecent = '/coach/dashboard/recent-students';
  static const coachDashboardTop = '/coach/dashboard/top-students';
  static const coachDashboardProgress = '/coach/dashboard/progress-series';
  static const coachTickets = '/coach/tickets';
  static const coachFoods = '/coach/foods';
  static const coachExercises = '/coach/exercises';
  static const coachNotifications = '/coach/notifications';
}
