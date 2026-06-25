// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_MeProfile _$MeProfileFromJson(Map<String, dynamic> json) => _MeProfile(
  id: (json['id'] as num).toInt(),
  firstName: json['firstName'] as String? ?? '',
  lastName: json['lastName'] as String? ?? '',
  phone: json['phone'] as String? ?? '',
  email: json['email'] as String? ?? '',
  heightCm: (json['heightCm'] as num?)?.toDouble(),
  weightKg: (json['weightKg'] as num?)?.toDouble(),
  primaryGoal: json['primaryGoal'] as String? ?? '',
  targetWeightKg: (json['targetWeightKg'] as num?)?.toDouble(),
  isProfileComplete: json['isProfileComplete'] as bool? ?? false,
  programsCount: (json['programsCount'] as num?)?.toInt() ?? 0,
  ordersCount: (json['ordersCount'] as num?)?.toInt() ?? 0,
  assignedCoachName: json['assignedCoachName'] as String? ?? '',
);

Map<String, dynamic> _$MeProfileToJson(_MeProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'phone': instance.phone,
      'email': instance.email,
      'heightCm': instance.heightCm,
      'weightKg': instance.weightKg,
      'primaryGoal': instance.primaryGoal,
      'targetWeightKg': instance.targetWeightKg,
      'isProfileComplete': instance.isProfileComplete,
      'programsCount': instance.programsCount,
      'ordersCount': instance.ordersCount,
      'assignedCoachName': instance.assignedCoachName,
    };
