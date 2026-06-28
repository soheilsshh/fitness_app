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
  birthDate: json['birthDate'] as String?,
  nationalId: json['nationalId'] as String? ?? '',
  gender: json['gender'] as String? ?? '',
  goals:
      (json['goals'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  primaryGoal: json['primaryGoal'] as String? ?? '',
  targetWeightKg: (json['targetWeightKg'] as num?)?.toDouble(),
  bodyCondition: json['bodyCondition'] as String? ?? '',
  bodyFatPercent: (json['bodyFatPercent'] as num?)?.toDouble(),
  medicalHistory: json['medicalHistory'] as String? ?? '',
  injuries: json['injuries'] as String? ?? '',
  physicalLimitations: json['physicalLimitations'] as String? ?? '',
  isProfileComplete: json['isProfileComplete'] as bool? ?? false,
  photos:
      (json['photos'] as List<dynamic>?)
          ?.map((e) => MePhoto.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <MePhoto>[],
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
      'birthDate': instance.birthDate,
      'nationalId': instance.nationalId,
      'gender': instance.gender,
      'goals': instance.goals,
      'primaryGoal': instance.primaryGoal,
      'targetWeightKg': instance.targetWeightKg,
      'bodyCondition': instance.bodyCondition,
      'bodyFatPercent': instance.bodyFatPercent,
      'medicalHistory': instance.medicalHistory,
      'injuries': instance.injuries,
      'physicalLimitations': instance.physicalLimitations,
      'isProfileComplete': instance.isProfileComplete,
      'photos': instance.photos,
      'programsCount': instance.programsCount,
      'ordersCount': instance.ordersCount,
      'assignedCoachName': instance.assignedCoachName,
    };

_MePhoto _$MePhotoFromJson(Map<String, dynamic> json) => _MePhoto(
  id: (json['id'] as num?)?.toInt() ?? 0,
  url: json['url'] as String? ?? '',
  name: json['name'] as String? ?? '',
  type: json['type'] as String? ?? '',
);

Map<String, dynamic> _$MePhotoToJson(_MePhoto instance) => <String, dynamic>{
  'id': instance.id,
  'url': instance.url,
  'name': instance.name,
  'type': instance.type,
};
