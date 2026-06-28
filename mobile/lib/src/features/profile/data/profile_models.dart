import 'package:freezed_annotation/freezed_annotation.dart';

part 'profile_models.freezed.dart';
part 'profile_models.g.dart';

/// Subset of `GET /me` (MeProfileDTO) used by the mobile profile screen and
/// the onboarding wizard. Unknown keys are ignored by json_serializable.
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
    String? birthDate,
    @Default('') String nationalId,
    @Default('') String gender,
    @Default(<String>[]) List<String> goals,
    @Default('') String primaryGoal,
    double? targetWeightKg,
    @Default('') String bodyCondition,
    double? bodyFatPercent,
    @Default('') String medicalHistory,
    @Default('') String injuries,
    @Default('') String physicalLimitations,
    @JsonKey(name: 'isProfileComplete') @Default(false) bool isProfileComplete,
    @Default(<MePhoto>[]) List<MePhoto> photos,
    @Default(0) int programsCount,
    @Default(0) int ordersCount,
    @Default('') String assignedCoachName,
  }) = _MeProfile;

  factory MeProfile.fromJson(Map<String, dynamic> json) =>
      _$MeProfileFromJson(json);

  const MeProfile._();

  String get fullName => '$firstName $lastName'.trim();
}

/// A body photo slot (`MePhotoDTO`): one of front / right / back / left.
@freezed
abstract class MePhoto with _$MePhoto {
  const factory MePhoto({
    @Default(0) int id,
    @Default('') String url,
    @Default('') String name,
    @Default('') String type,
  }) = _MePhoto;

  factory MePhoto.fromJson(Map<String, dynamic> json) =>
      _$MePhotoFromJson(json);
}
