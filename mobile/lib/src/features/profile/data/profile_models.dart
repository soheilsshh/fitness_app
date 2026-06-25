import 'package:freezed_annotation/freezed_annotation.dart';

part 'profile_models.freezed.dart';
part 'profile_models.g.dart';

/// Subset of `GET /me` (MeProfileDTO) that the mobile profile screen shows.
/// Unknown keys are ignored by json_serializable.
@freezed
abstract class MeProfile with _$MeProfile {
  const factory MeProfile({
    required int id,
    @Default('') String firstName,
    @Default('') String lastName,
    @Default('') String phone,
    @Default('') String email,
    double? heightCm,
    double? weightKg,
    @Default('') String primaryGoal,
    double? targetWeightKg,
    @JsonKey(name: 'isProfileComplete') @Default(false) bool isProfileComplete,
    @Default(0) int programsCount,
    @Default(0) int ordersCount,
    @Default('') String assignedCoachName,
  }) = _MeProfile;

  factory MeProfile.fromJson(Map<String, dynamic> json) =>
      _$MeProfileFromJson(json);

  const MeProfile._();

  String get fullName => '$firstName $lastName'.trim();
}
