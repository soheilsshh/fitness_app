// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'profile_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$MeProfile {

 int get id; String get firstName; String get lastName; String get phone; String get email; double? get heightCm; double? get weightKg; String? get birthDate; String get nationalId; String get gender; List<String> get goals; String get primaryGoal; double? get targetWeightKg; String get bodyCondition; double? get bodyFatPercent; String get medicalHistory; String get injuries; String get physicalLimitations;@JsonKey(name: 'isProfileComplete') bool get isProfileComplete; List<MePhoto> get photos; int get programsCount; int get ordersCount; String get assignedCoachName;
/// Create a copy of MeProfile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MeProfileCopyWith<MeProfile> get copyWith => _$MeProfileCopyWithImpl<MeProfile>(this as MeProfile, _$identity);

  /// Serializes this MeProfile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MeProfile&&(identical(other.id, id) || other.id == id)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.email, email) || other.email == email)&&(identical(other.heightCm, heightCm) || other.heightCm == heightCm)&&(identical(other.weightKg, weightKg) || other.weightKg == weightKg)&&(identical(other.birthDate, birthDate) || other.birthDate == birthDate)&&(identical(other.nationalId, nationalId) || other.nationalId == nationalId)&&(identical(other.gender, gender) || other.gender == gender)&&const DeepCollectionEquality().equals(other.goals, goals)&&(identical(other.primaryGoal, primaryGoal) || other.primaryGoal == primaryGoal)&&(identical(other.targetWeightKg, targetWeightKg) || other.targetWeightKg == targetWeightKg)&&(identical(other.bodyCondition, bodyCondition) || other.bodyCondition == bodyCondition)&&(identical(other.bodyFatPercent, bodyFatPercent) || other.bodyFatPercent == bodyFatPercent)&&(identical(other.medicalHistory, medicalHistory) || other.medicalHistory == medicalHistory)&&(identical(other.injuries, injuries) || other.injuries == injuries)&&(identical(other.physicalLimitations, physicalLimitations) || other.physicalLimitations == physicalLimitations)&&(identical(other.isProfileComplete, isProfileComplete) || other.isProfileComplete == isProfileComplete)&&const DeepCollectionEquality().equals(other.photos, photos)&&(identical(other.programsCount, programsCount) || other.programsCount == programsCount)&&(identical(other.ordersCount, ordersCount) || other.ordersCount == ordersCount)&&(identical(other.assignedCoachName, assignedCoachName) || other.assignedCoachName == assignedCoachName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,firstName,lastName,phone,email,heightCm,weightKg,birthDate,nationalId,gender,const DeepCollectionEquality().hash(goals),primaryGoal,targetWeightKg,bodyCondition,bodyFatPercent,medicalHistory,injuries,physicalLimitations,isProfileComplete,const DeepCollectionEquality().hash(photos),programsCount,ordersCount,assignedCoachName]);

@override
String toString() {
  return 'MeProfile(id: $id, firstName: $firstName, lastName: $lastName, phone: $phone, email: $email, heightCm: $heightCm, weightKg: $weightKg, birthDate: $birthDate, nationalId: $nationalId, gender: $gender, goals: $goals, primaryGoal: $primaryGoal, targetWeightKg: $targetWeightKg, bodyCondition: $bodyCondition, bodyFatPercent: $bodyFatPercent, medicalHistory: $medicalHistory, injuries: $injuries, physicalLimitations: $physicalLimitations, isProfileComplete: $isProfileComplete, photos: $photos, programsCount: $programsCount, ordersCount: $ordersCount, assignedCoachName: $assignedCoachName)';
}


}

/// @nodoc
abstract mixin class $MeProfileCopyWith<$Res>  {
  factory $MeProfileCopyWith(MeProfile value, $Res Function(MeProfile) _then) = _$MeProfileCopyWithImpl;
@useResult
$Res call({
 int id, String firstName, String lastName, String phone, String email, double? heightCm, double? weightKg, String? birthDate, String nationalId, String gender, List<String> goals, String primaryGoal, double? targetWeightKg, String bodyCondition, double? bodyFatPercent, String medicalHistory, String injuries, String physicalLimitations,@JsonKey(name: 'isProfileComplete') bool isProfileComplete, List<MePhoto> photos, int programsCount, int ordersCount, String assignedCoachName
});




}
/// @nodoc
class _$MeProfileCopyWithImpl<$Res>
    implements $MeProfileCopyWith<$Res> {
  _$MeProfileCopyWithImpl(this._self, this._then);

  final MeProfile _self;
  final $Res Function(MeProfile) _then;

/// Create a copy of MeProfile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? firstName = null,Object? lastName = null,Object? phone = null,Object? email = null,Object? heightCm = freezed,Object? weightKg = freezed,Object? birthDate = freezed,Object? nationalId = null,Object? gender = null,Object? goals = null,Object? primaryGoal = null,Object? targetWeightKg = freezed,Object? bodyCondition = null,Object? bodyFatPercent = freezed,Object? medicalHistory = null,Object? injuries = null,Object? physicalLimitations = null,Object? isProfileComplete = null,Object? photos = null,Object? programsCount = null,Object? ordersCount = null,Object? assignedCoachName = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,heightCm: freezed == heightCm ? _self.heightCm : heightCm // ignore: cast_nullable_to_non_nullable
as double?,weightKg: freezed == weightKg ? _self.weightKg : weightKg // ignore: cast_nullable_to_non_nullable
as double?,birthDate: freezed == birthDate ? _self.birthDate : birthDate // ignore: cast_nullable_to_non_nullable
as String?,nationalId: null == nationalId ? _self.nationalId : nationalId // ignore: cast_nullable_to_non_nullable
as String,gender: null == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String,goals: null == goals ? _self.goals : goals // ignore: cast_nullable_to_non_nullable
as List<String>,primaryGoal: null == primaryGoal ? _self.primaryGoal : primaryGoal // ignore: cast_nullable_to_non_nullable
as String,targetWeightKg: freezed == targetWeightKg ? _self.targetWeightKg : targetWeightKg // ignore: cast_nullable_to_non_nullable
as double?,bodyCondition: null == bodyCondition ? _self.bodyCondition : bodyCondition // ignore: cast_nullable_to_non_nullable
as String,bodyFatPercent: freezed == bodyFatPercent ? _self.bodyFatPercent : bodyFatPercent // ignore: cast_nullable_to_non_nullable
as double?,medicalHistory: null == medicalHistory ? _self.medicalHistory : medicalHistory // ignore: cast_nullable_to_non_nullable
as String,injuries: null == injuries ? _self.injuries : injuries // ignore: cast_nullable_to_non_nullable
as String,physicalLimitations: null == physicalLimitations ? _self.physicalLimitations : physicalLimitations // ignore: cast_nullable_to_non_nullable
as String,isProfileComplete: null == isProfileComplete ? _self.isProfileComplete : isProfileComplete // ignore: cast_nullable_to_non_nullable
as bool,photos: null == photos ? _self.photos : photos // ignore: cast_nullable_to_non_nullable
as List<MePhoto>,programsCount: null == programsCount ? _self.programsCount : programsCount // ignore: cast_nullable_to_non_nullable
as int,ordersCount: null == ordersCount ? _self.ordersCount : ordersCount // ignore: cast_nullable_to_non_nullable
as int,assignedCoachName: null == assignedCoachName ? _self.assignedCoachName : assignedCoachName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [MeProfile].
extension MeProfilePatterns on MeProfile {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MeProfile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MeProfile() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MeProfile value)  $default,){
final _that = this;
switch (_that) {
case _MeProfile():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MeProfile value)?  $default,){
final _that = this;
switch (_that) {
case _MeProfile() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String firstName,  String lastName,  String phone,  String email,  double? heightCm,  double? weightKg,  String? birthDate,  String nationalId,  String gender,  List<String> goals,  String primaryGoal,  double? targetWeightKg,  String bodyCondition,  double? bodyFatPercent,  String medicalHistory,  String injuries,  String physicalLimitations, @JsonKey(name: 'isProfileComplete')  bool isProfileComplete,  List<MePhoto> photos,  int programsCount,  int ordersCount,  String assignedCoachName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MeProfile() when $default != null:
return $default(_that.id,_that.firstName,_that.lastName,_that.phone,_that.email,_that.heightCm,_that.weightKg,_that.birthDate,_that.nationalId,_that.gender,_that.goals,_that.primaryGoal,_that.targetWeightKg,_that.bodyCondition,_that.bodyFatPercent,_that.medicalHistory,_that.injuries,_that.physicalLimitations,_that.isProfileComplete,_that.photos,_that.programsCount,_that.ordersCount,_that.assignedCoachName);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String firstName,  String lastName,  String phone,  String email,  double? heightCm,  double? weightKg,  String? birthDate,  String nationalId,  String gender,  List<String> goals,  String primaryGoal,  double? targetWeightKg,  String bodyCondition,  double? bodyFatPercent,  String medicalHistory,  String injuries,  String physicalLimitations, @JsonKey(name: 'isProfileComplete')  bool isProfileComplete,  List<MePhoto> photos,  int programsCount,  int ordersCount,  String assignedCoachName)  $default,) {final _that = this;
switch (_that) {
case _MeProfile():
return $default(_that.id,_that.firstName,_that.lastName,_that.phone,_that.email,_that.heightCm,_that.weightKg,_that.birthDate,_that.nationalId,_that.gender,_that.goals,_that.primaryGoal,_that.targetWeightKg,_that.bodyCondition,_that.bodyFatPercent,_that.medicalHistory,_that.injuries,_that.physicalLimitations,_that.isProfileComplete,_that.photos,_that.programsCount,_that.ordersCount,_that.assignedCoachName);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String firstName,  String lastName,  String phone,  String email,  double? heightCm,  double? weightKg,  String? birthDate,  String nationalId,  String gender,  List<String> goals,  String primaryGoal,  double? targetWeightKg,  String bodyCondition,  double? bodyFatPercent,  String medicalHistory,  String injuries,  String physicalLimitations, @JsonKey(name: 'isProfileComplete')  bool isProfileComplete,  List<MePhoto> photos,  int programsCount,  int ordersCount,  String assignedCoachName)?  $default,) {final _that = this;
switch (_that) {
case _MeProfile() when $default != null:
return $default(_that.id,_that.firstName,_that.lastName,_that.phone,_that.email,_that.heightCm,_that.weightKg,_that.birthDate,_that.nationalId,_that.gender,_that.goals,_that.primaryGoal,_that.targetWeightKg,_that.bodyCondition,_that.bodyFatPercent,_that.medicalHistory,_that.injuries,_that.physicalLimitations,_that.isProfileComplete,_that.photos,_that.programsCount,_that.ordersCount,_that.assignedCoachName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MeProfile extends MeProfile {
  const _MeProfile({required this.id, this.firstName = '', this.lastName = '', this.phone = '', this.email = '', this.heightCm, this.weightKg, this.birthDate, this.nationalId = '', this.gender = '', final  List<String> goals = const <String>[], this.primaryGoal = '', this.targetWeightKg, this.bodyCondition = '', this.bodyFatPercent, this.medicalHistory = '', this.injuries = '', this.physicalLimitations = '', @JsonKey(name: 'isProfileComplete') this.isProfileComplete = false, final  List<MePhoto> photos = const <MePhoto>[], this.programsCount = 0, this.ordersCount = 0, this.assignedCoachName = ''}): _goals = goals,_photos = photos,super._();
  factory _MeProfile.fromJson(Map<String, dynamic> json) => _$MeProfileFromJson(json);

@override final  int id;
@override@JsonKey() final  String firstName;
@override@JsonKey() final  String lastName;
@override@JsonKey() final  String phone;
@override@JsonKey() final  String email;
@override final  double? heightCm;
@override final  double? weightKg;
@override final  String? birthDate;
@override@JsonKey() final  String nationalId;
@override@JsonKey() final  String gender;
 final  List<String> _goals;
@override@JsonKey() List<String> get goals {
  if (_goals is EqualUnmodifiableListView) return _goals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_goals);
}

@override@JsonKey() final  String primaryGoal;
@override final  double? targetWeightKg;
@override@JsonKey() final  String bodyCondition;
@override final  double? bodyFatPercent;
@override@JsonKey() final  String medicalHistory;
@override@JsonKey() final  String injuries;
@override@JsonKey() final  String physicalLimitations;
@override@JsonKey(name: 'isProfileComplete') final  bool isProfileComplete;
 final  List<MePhoto> _photos;
@override@JsonKey() List<MePhoto> get photos {
  if (_photos is EqualUnmodifiableListView) return _photos;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_photos);
}

@override@JsonKey() final  int programsCount;
@override@JsonKey() final  int ordersCount;
@override@JsonKey() final  String assignedCoachName;

/// Create a copy of MeProfile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MeProfileCopyWith<_MeProfile> get copyWith => __$MeProfileCopyWithImpl<_MeProfile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MeProfileToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MeProfile&&(identical(other.id, id) || other.id == id)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.email, email) || other.email == email)&&(identical(other.heightCm, heightCm) || other.heightCm == heightCm)&&(identical(other.weightKg, weightKg) || other.weightKg == weightKg)&&(identical(other.birthDate, birthDate) || other.birthDate == birthDate)&&(identical(other.nationalId, nationalId) || other.nationalId == nationalId)&&(identical(other.gender, gender) || other.gender == gender)&&const DeepCollectionEquality().equals(other._goals, _goals)&&(identical(other.primaryGoal, primaryGoal) || other.primaryGoal == primaryGoal)&&(identical(other.targetWeightKg, targetWeightKg) || other.targetWeightKg == targetWeightKg)&&(identical(other.bodyCondition, bodyCondition) || other.bodyCondition == bodyCondition)&&(identical(other.bodyFatPercent, bodyFatPercent) || other.bodyFatPercent == bodyFatPercent)&&(identical(other.medicalHistory, medicalHistory) || other.medicalHistory == medicalHistory)&&(identical(other.injuries, injuries) || other.injuries == injuries)&&(identical(other.physicalLimitations, physicalLimitations) || other.physicalLimitations == physicalLimitations)&&(identical(other.isProfileComplete, isProfileComplete) || other.isProfileComplete == isProfileComplete)&&const DeepCollectionEquality().equals(other._photos, _photos)&&(identical(other.programsCount, programsCount) || other.programsCount == programsCount)&&(identical(other.ordersCount, ordersCount) || other.ordersCount == ordersCount)&&(identical(other.assignedCoachName, assignedCoachName) || other.assignedCoachName == assignedCoachName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,firstName,lastName,phone,email,heightCm,weightKg,birthDate,nationalId,gender,const DeepCollectionEquality().hash(_goals),primaryGoal,targetWeightKg,bodyCondition,bodyFatPercent,medicalHistory,injuries,physicalLimitations,isProfileComplete,const DeepCollectionEquality().hash(_photos),programsCount,ordersCount,assignedCoachName]);

@override
String toString() {
  return 'MeProfile(id: $id, firstName: $firstName, lastName: $lastName, phone: $phone, email: $email, heightCm: $heightCm, weightKg: $weightKg, birthDate: $birthDate, nationalId: $nationalId, gender: $gender, goals: $goals, primaryGoal: $primaryGoal, targetWeightKg: $targetWeightKg, bodyCondition: $bodyCondition, bodyFatPercent: $bodyFatPercent, medicalHistory: $medicalHistory, injuries: $injuries, physicalLimitations: $physicalLimitations, isProfileComplete: $isProfileComplete, photos: $photos, programsCount: $programsCount, ordersCount: $ordersCount, assignedCoachName: $assignedCoachName)';
}


}

/// @nodoc
abstract mixin class _$MeProfileCopyWith<$Res> implements $MeProfileCopyWith<$Res> {
  factory _$MeProfileCopyWith(_MeProfile value, $Res Function(_MeProfile) _then) = __$MeProfileCopyWithImpl;
@override @useResult
$Res call({
 int id, String firstName, String lastName, String phone, String email, double? heightCm, double? weightKg, String? birthDate, String nationalId, String gender, List<String> goals, String primaryGoal, double? targetWeightKg, String bodyCondition, double? bodyFatPercent, String medicalHistory, String injuries, String physicalLimitations,@JsonKey(name: 'isProfileComplete') bool isProfileComplete, List<MePhoto> photos, int programsCount, int ordersCount, String assignedCoachName
});




}
/// @nodoc
class __$MeProfileCopyWithImpl<$Res>
    implements _$MeProfileCopyWith<$Res> {
  __$MeProfileCopyWithImpl(this._self, this._then);

  final _MeProfile _self;
  final $Res Function(_MeProfile) _then;

/// Create a copy of MeProfile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? firstName = null,Object? lastName = null,Object? phone = null,Object? email = null,Object? heightCm = freezed,Object? weightKg = freezed,Object? birthDate = freezed,Object? nationalId = null,Object? gender = null,Object? goals = null,Object? primaryGoal = null,Object? targetWeightKg = freezed,Object? bodyCondition = null,Object? bodyFatPercent = freezed,Object? medicalHistory = null,Object? injuries = null,Object? physicalLimitations = null,Object? isProfileComplete = null,Object? photos = null,Object? programsCount = null,Object? ordersCount = null,Object? assignedCoachName = null,}) {
  return _then(_MeProfile(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,heightCm: freezed == heightCm ? _self.heightCm : heightCm // ignore: cast_nullable_to_non_nullable
as double?,weightKg: freezed == weightKg ? _self.weightKg : weightKg // ignore: cast_nullable_to_non_nullable
as double?,birthDate: freezed == birthDate ? _self.birthDate : birthDate // ignore: cast_nullable_to_non_nullable
as String?,nationalId: null == nationalId ? _self.nationalId : nationalId // ignore: cast_nullable_to_non_nullable
as String,gender: null == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String,goals: null == goals ? _self._goals : goals // ignore: cast_nullable_to_non_nullable
as List<String>,primaryGoal: null == primaryGoal ? _self.primaryGoal : primaryGoal // ignore: cast_nullable_to_non_nullable
as String,targetWeightKg: freezed == targetWeightKg ? _self.targetWeightKg : targetWeightKg // ignore: cast_nullable_to_non_nullable
as double?,bodyCondition: null == bodyCondition ? _self.bodyCondition : bodyCondition // ignore: cast_nullable_to_non_nullable
as String,bodyFatPercent: freezed == bodyFatPercent ? _self.bodyFatPercent : bodyFatPercent // ignore: cast_nullable_to_non_nullable
as double?,medicalHistory: null == medicalHistory ? _self.medicalHistory : medicalHistory // ignore: cast_nullable_to_non_nullable
as String,injuries: null == injuries ? _self.injuries : injuries // ignore: cast_nullable_to_non_nullable
as String,physicalLimitations: null == physicalLimitations ? _self.physicalLimitations : physicalLimitations // ignore: cast_nullable_to_non_nullable
as String,isProfileComplete: null == isProfileComplete ? _self.isProfileComplete : isProfileComplete // ignore: cast_nullable_to_non_nullable
as bool,photos: null == photos ? _self._photos : photos // ignore: cast_nullable_to_non_nullable
as List<MePhoto>,programsCount: null == programsCount ? _self.programsCount : programsCount // ignore: cast_nullable_to_non_nullable
as int,ordersCount: null == ordersCount ? _self.ordersCount : ordersCount // ignore: cast_nullable_to_non_nullable
as int,assignedCoachName: null == assignedCoachName ? _self.assignedCoachName : assignedCoachName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$MePhoto {

 int get id; String get url; String get name; String get type;
/// Create a copy of MePhoto
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MePhotoCopyWith<MePhoto> get copyWith => _$MePhotoCopyWithImpl<MePhoto>(this as MePhoto, _$identity);

  /// Serializes this MePhoto to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MePhoto&&(identical(other.id, id) || other.id == id)&&(identical(other.url, url) || other.url == url)&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,url,name,type);

@override
String toString() {
  return 'MePhoto(id: $id, url: $url, name: $name, type: $type)';
}


}

/// @nodoc
abstract mixin class $MePhotoCopyWith<$Res>  {
  factory $MePhotoCopyWith(MePhoto value, $Res Function(MePhoto) _then) = _$MePhotoCopyWithImpl;
@useResult
$Res call({
 int id, String url, String name, String type
});




}
/// @nodoc
class _$MePhotoCopyWithImpl<$Res>
    implements $MePhotoCopyWith<$Res> {
  _$MePhotoCopyWithImpl(this._self, this._then);

  final MePhoto _self;
  final $Res Function(MePhoto) _then;

/// Create a copy of MePhoto
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? url = null,Object? name = null,Object? type = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [MePhoto].
extension MePhotoPatterns on MePhoto {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MePhoto value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MePhoto() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MePhoto value)  $default,){
final _that = this;
switch (_that) {
case _MePhoto():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MePhoto value)?  $default,){
final _that = this;
switch (_that) {
case _MePhoto() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String url,  String name,  String type)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MePhoto() when $default != null:
return $default(_that.id,_that.url,_that.name,_that.type);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String url,  String name,  String type)  $default,) {final _that = this;
switch (_that) {
case _MePhoto():
return $default(_that.id,_that.url,_that.name,_that.type);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String url,  String name,  String type)?  $default,) {final _that = this;
switch (_that) {
case _MePhoto() when $default != null:
return $default(_that.id,_that.url,_that.name,_that.type);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MePhoto implements MePhoto {
  const _MePhoto({this.id = 0, this.url = '', this.name = '', this.type = ''});
  factory _MePhoto.fromJson(Map<String, dynamic> json) => _$MePhotoFromJson(json);

@override@JsonKey() final  int id;
@override@JsonKey() final  String url;
@override@JsonKey() final  String name;
@override@JsonKey() final  String type;

/// Create a copy of MePhoto
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MePhotoCopyWith<_MePhoto> get copyWith => __$MePhotoCopyWithImpl<_MePhoto>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MePhotoToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MePhoto&&(identical(other.id, id) || other.id == id)&&(identical(other.url, url) || other.url == url)&&(identical(other.name, name) || other.name == name)&&(identical(other.type, type) || other.type == type));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,url,name,type);

@override
String toString() {
  return 'MePhoto(id: $id, url: $url, name: $name, type: $type)';
}


}

/// @nodoc
abstract mixin class _$MePhotoCopyWith<$Res> implements $MePhotoCopyWith<$Res> {
  factory _$MePhotoCopyWith(_MePhoto value, $Res Function(_MePhoto) _then) = __$MePhotoCopyWithImpl;
@override @useResult
$Res call({
 int id, String url, String name, String type
});




}
/// @nodoc
class __$MePhotoCopyWithImpl<$Res>
    implements _$MePhotoCopyWith<$Res> {
  __$MePhotoCopyWithImpl(this._self, this._then);

  final _MePhoto _self;
  final $Res Function(_MePhoto) _then;

/// Create a copy of MePhoto
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? url = null,Object? name = null,Object? type = null,}) {
  return _then(_MePhoto(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,url: null == url ? _self.url : url // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
