/// User roles, mirroring `frontend/src/lib/auth/roles.js`.
enum AppRole {
  admin('admin'),
  coach('coach'),
  student('student'),
  unknown('');

  const AppRole(this.value);
  final String value;

  static AppRole fromString(String? raw) {
    return switch (raw) {
      'admin' => AppRole.admin,
      'coach' => AppRole.coach,
      'student' => AppRole.student,
      _ => AppRole.unknown,
    };
  }
}

/// Post-login landing route for a role (student incomplete profile -> onboarding).
String postLoginPath(AppRole role, {bool isProfileComplete = true}) {
  if (role == AppRole.student && !isProfileComplete) return '/onboarding';
  return switch (role) {
    AppRole.coach => '/coach',
    AppRole.student => '/student',
    // Admin isn't a mobile target; send them to the student shell as a fallback.
    _ => '/student',
  };
}
