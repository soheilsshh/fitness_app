import 'roles.dart';

/// The authenticated session as the app cares about it.
class Session {
  const Session({
    required this.role,
    required this.name,
    required this.isProfileComplete,
  });

  final AppRole role;
  final String name;
  final bool isProfileComplete;

  bool get isCoach => role == AppRole.coach;
  bool get isStudent => role == AppRole.student;
}
