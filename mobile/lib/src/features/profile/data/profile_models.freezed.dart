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

 int get id; String get firstName; String get lastName; String get phone; String get email; double? get heightCm; double? get weightKg; String get primaryGoal; double? get targetWeightKg;@JsonKey(name: 'isProfileComplete') bool get isProfileComplete; int get programsCount; int get ordersCount; String get assignedCoachName;
/// Create a copy of MeProfile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MeProfileCopyWith<MeProfile> get copyWith => _$MeProfileCopyWithImpl<MeProfile>(this as MeProfile, _$identity);

  /// Serializes this MeProfile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MeProfile&&(identical(other.id, id) || other.id == id)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.email, email) || other.email == email)&&(identical(other.heightCm, heightCm) || other.heightCm == heightCm)&&(identical(other.weightKg, weightKg) || other.weightKg == weightKg)&&(identical(other.primaryGoal, primaryGoal) || other.primaryGoal == primaryGoal)&&(identical(other.targetWeightKg, targetWeightKg) || other.targetWeightKg == targetWeightKg)&&(identical(other.isProfileComplete, isProfileComplete) || other.isProfileComplete == isProfileComplete)&&(identical(other.programsCount, programsCount) || other.programsCount == programsCount)&&(identical(other.ordersCount, ordersCount) || other.ordersCount == ordersCount)&&(identical(other.assignedCoachName, assignedCoachName) || other.assignedCoachName == assignedCoachName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,firstName,lastName,phone,email,heightCm,weightKg,primaryGoal,targetWeightKg,isProfileComplete,programsCount,ordersCount,assignedCoachName);

@override
String toString() {
  return 'MeProfile(id: $id, firstName: $firstName, lastName: $lastName, phone: $phone, email: $email, heightCm: $heightCm, weightKg: $weightKg, primaryGoal: $primaryGoal, targetWeightKg: $targetWeightKg, isProfileComplete: $isProfileComplete, programsCount: $programsCount, ordersCount: $ordersCount, assignedCoachName: $assignedCoachName)';
}


}

/// @nodoc
abstract mixin class $MeProfileCopyWith<$Res>  {
  factory $MeProfileCopyWith(MeProfile value, $Res Function(MeProfile) _then) = _$MeProfileCopyWithImpl;
@useResult
$Res call({
 int id, String firstName, String lastName, String phone, String email, double? heightCm, double? weightKg, String primaryGoal, double? targetWeightKg,@JsonKey(name: 'isProfileComplete') bool isProfileComplete, int programsCount, int ordersCount, String assignedCoachName
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
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? firstName = null,Object? lastName = null,Object? phone = null,Object? email = null,Object? heightCm = freezed,Object? weightKg = freezed,Object? primaryGoal = null,Object? targetWeightKg = freezed,Object? isProfileComplete = null,Object? programsCount = null,Object? ordersCount = null,Object? assignedCoachName = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,heightCm: freezed == heightCm ? _self.heightCm : heightCm // ignore: cast_nullable_to_non_nullable
as double?,weightKg: freezed == weightKg ? _self.weightKg : weightKg // ignore: cast_nullable_to_non_nullable
as double?,primaryGoal: null == primaryGoal ? _self.primaryGoal : primaryGoal // ignore: cast_nullable_to_non_nullable
as String,targetWeightKg: freezed == targetWeightKg ? _self.targetWeightKg : targetWeightKg // ignore: cast_nullable_to_non_nullable
as double?,isProfileComplete: null == isProfileComplete ? _self.isProfileComplete : isProfileComplete // ignore: cast_nullable_to_non_nullable
as bool,programsCount: null == programsCount ? _self.programsCount : programsCount // ignore: cast_nullable_to_non_nullable
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String firstName,  String lastName,  String phone,  String email,  double? heightCm,  double? weightKg,  String primaryGoal,  double? targetWeightKg, @JsonKey(name: 'isProfileComplete')  bool isProfileComplete,  int programsCount,  int ordersCount,  String assignedCoachName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MeProfile() when $default != null:
return $default(_that.id,_that.firstName,_that.lastName,_that.phone,_that.email,_that.heightCm,_that.weightKg,_that.primaryGoal,_that.targetWeightKg,_that.isProfileComplete,_that.programsCount,_that.ordersCount,_that.assignedCoachName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String firstName,  String lastName,  String phone,  String email,  double? heightCm,  double? weightKg,  String primaryGoal,  double? targetWeightKg, @JsonKey(name: 'isProfileComplete')  bool isProfileComplete,  int programsCount,  int ordersCount,  String assignedCoachName)  $default,) {final _that = this;
switch (_that) {
case _MeProfile():
return $default(_that.id,_that.firstName,_that.lastName,_that.phone,_that.email,_that.heightCm,_that.weightKg,_that.primaryGoal,_that.targetWeightKg,_that.isProfileComplete,_that.programsCount,_that.ordersCount,_that.assignedCoachName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String firstName,  String lastName,  String phone,  String email,  double? heightCm,  double? weightKg,  String primaryGoal,  double? targetWeightKg, @JsonKey(name: 'isProfileComplete')  bool isProfileComplete,  int programsCount,  int ordersCount,  String assignedCoachName)?  $default,) {final _that = this;
switch (_that) {
case _MeProfile() when $default != null:
return $default(_that.id,_that.firstName,_that.lastName,_that.phone,_that.email,_that.heightCm,_that.weightKg,_that.primaryGoal,_that.targetWeightKg,_that.isProfileComplete,_that.programsCount,_that.ordersCount,_that.assignedCoachName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MeProfile extends MeProfile {
  const _MeProfile({required this.id, this.firstName = '', this.lastName = '', this.phone = '', this.email = '', this.heightCm, this.weightKg, this.primaryGoal = '', this.targetWeightKg, @JsonKey(name: 'isProfileComplete') this.isProfileComplete = false, this.programsCount = 0, this.ordersCount = 0, this.assignedCoachName = ''}): super._();
  factory _MeProfile.fromJson(Map<String, dynamic> json) => _$MeProfileFromJson(json);

@override final  int id;
@override@JsonKey() final  String firstName;
@override@JsonKey() final  String lastName;
@override@JsonKey() final  String phone;
@override@JsonKey() final  String email;
@override final  double? heightCm;
@override final  double? weightKg;
@override@JsonKey() final  String primaryGoal;
@override final  double? targetWeightKg;
@override@JsonKey(name: 'isProfileComplete') final  bool isProfileComplete;
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
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MeProfile&&(identical(other.id, id) || other.id == id)&&(identical(other.firstName, firstName) || other.firstName == firstName)&&(identical(other.lastName, lastName) || other.lastName == lastName)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.email, email) || other.email == email)&&(identical(other.heightCm, heightCm) || other.heightCm == heightCm)&&(identical(other.weightKg, weightKg) || other.weightKg == weightKg)&&(identical(other.primaryGoal, primaryGoal) || other.primaryGoal == primaryGoal)&&(identical(other.targetWeightKg, targetWeightKg) || other.targetWeightKg == targetWeightKg)&&(identical(other.isProfileComplete, isProfileComplete) || other.isProfileComplete == isProfileComplete)&&(identical(other.programsCount, programsCount) || other.programsCount == programsCount)&&(identical(other.ordersCount, ordersCount) || other.ordersCount == ordersCount)&&(identical(other.assignedCoachName, assignedCoachName) || other.assignedCoachName == assignedCoachName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,firstName,lastName,phone,email,heightCm,weightKg,primaryGoal,targetWeightKg,isProfileComplete,programsCount,ordersCount,assignedCoachName);

@override
String toString() {
  return 'MeProfile(id: $id, firstName: $firstName, lastName: $lastName, phone: $phone, email: $email, heightCm: $heightCm, weightKg: $weightKg, primaryGoal: $primaryGoal, targetWeightKg: $targetWeightKg, isProfileComplete: $isProfileComplete, programsCount: $programsCount, ordersCount: $ordersCount, assignedCoachName: $assignedCoachName)';
}


}

/// @nodoc
abstract mixin class _$MeProfileCopyWith<$Res> implements $MeProfileCopyWith<$Res> {
  factory _$MeProfileCopyWith(_MeProfile value, $Res Function(_MeProfile) _then) = __$MeProfileCopyWithImpl;
@override @useResult
$Res call({
 int id, String firstName, String lastName, String phone, String email, double? heightCm, double? weightKg, String primaryGoal, double? targetWeightKg,@JsonKey(name: 'isProfileComplete') bool isProfileComplete, int programsCount, int ordersCount, String assignedCoachName
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
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? firstName = null,Object? lastName = null,Object? phone = null,Object? email = null,Object? heightCm = freezed,Object? weightKg = freezed,Object? primaryGoal = null,Object? targetWeightKg = freezed,Object? isProfileComplete = null,Object? programsCount = null,Object? ordersCount = null,Object? assignedCoachName = null,}) {
  return _then(_MeProfile(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,firstName: null == firstName ? _self.firstName : firstName // ignore: cast_nullable_to_non_nullable
as String,lastName: null == lastName ? _self.lastName : lastName // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,heightCm: freezed == heightCm ? _self.heightCm : heightCm // ignore: cast_nullable_to_non_nullable
as double?,weightKg: freezed == weightKg ? _self.weightKg : weightKg // ignore: cast_nullable_to_non_nullable
as double?,primaryGoal: null == primaryGoal ? _self.primaryGoal : primaryGoal // ignore: cast_nullable_to_non_nullable
as String,targetWeightKg: freezed == targetWeightKg ? _self.targetWeightKg : targetWeightKg // ignore: cast_nullable_to_non_nullable
as double?,isProfileComplete: null == isProfileComplete ? _self.isProfileComplete : isProfileComplete // ignore: cast_nullable_to_non_nullable
as bool,programsCount: null == programsCount ? _self.programsCount : programsCount // ignore: cast_nullable_to_non_nullable
as int,ordersCount: null == ordersCount ? _self.ordersCount : ordersCount // ignore: cast_nullable_to_non_nullable
as int,assignedCoachName: null == assignedCoachName ? _self.assignedCoachName : assignedCoachName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
