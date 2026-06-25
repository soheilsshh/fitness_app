// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'coach_dashboard_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CoachStats {

 int get totalStudents; int get activeSubscriptions; int get monthlySales; int get completedSessions; int get programAdherence;
/// Create a copy of CoachStats
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CoachStatsCopyWith<CoachStats> get copyWith => _$CoachStatsCopyWithImpl<CoachStats>(this as CoachStats, _$identity);

  /// Serializes this CoachStats to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CoachStats&&(identical(other.totalStudents, totalStudents) || other.totalStudents == totalStudents)&&(identical(other.activeSubscriptions, activeSubscriptions) || other.activeSubscriptions == activeSubscriptions)&&(identical(other.monthlySales, monthlySales) || other.monthlySales == monthlySales)&&(identical(other.completedSessions, completedSessions) || other.completedSessions == completedSessions)&&(identical(other.programAdherence, programAdherence) || other.programAdherence == programAdherence));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalStudents,activeSubscriptions,monthlySales,completedSessions,programAdherence);

@override
String toString() {
  return 'CoachStats(totalStudents: $totalStudents, activeSubscriptions: $activeSubscriptions, monthlySales: $monthlySales, completedSessions: $completedSessions, programAdherence: $programAdherence)';
}


}

/// @nodoc
abstract mixin class $CoachStatsCopyWith<$Res>  {
  factory $CoachStatsCopyWith(CoachStats value, $Res Function(CoachStats) _then) = _$CoachStatsCopyWithImpl;
@useResult
$Res call({
 int totalStudents, int activeSubscriptions, int monthlySales, int completedSessions, int programAdherence
});




}
/// @nodoc
class _$CoachStatsCopyWithImpl<$Res>
    implements $CoachStatsCopyWith<$Res> {
  _$CoachStatsCopyWithImpl(this._self, this._then);

  final CoachStats _self;
  final $Res Function(CoachStats) _then;

/// Create a copy of CoachStats
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? totalStudents = null,Object? activeSubscriptions = null,Object? monthlySales = null,Object? completedSessions = null,Object? programAdherence = null,}) {
  return _then(_self.copyWith(
totalStudents: null == totalStudents ? _self.totalStudents : totalStudents // ignore: cast_nullable_to_non_nullable
as int,activeSubscriptions: null == activeSubscriptions ? _self.activeSubscriptions : activeSubscriptions // ignore: cast_nullable_to_non_nullable
as int,monthlySales: null == monthlySales ? _self.monthlySales : monthlySales // ignore: cast_nullable_to_non_nullable
as int,completedSessions: null == completedSessions ? _self.completedSessions : completedSessions // ignore: cast_nullable_to_non_nullable
as int,programAdherence: null == programAdherence ? _self.programAdherence : programAdherence // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [CoachStats].
extension CoachStatsPatterns on CoachStats {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CoachStats value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CoachStats() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CoachStats value)  $default,){
final _that = this;
switch (_that) {
case _CoachStats():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CoachStats value)?  $default,){
final _that = this;
switch (_that) {
case _CoachStats() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int totalStudents,  int activeSubscriptions,  int monthlySales,  int completedSessions,  int programAdherence)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CoachStats() when $default != null:
return $default(_that.totalStudents,_that.activeSubscriptions,_that.monthlySales,_that.completedSessions,_that.programAdherence);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int totalStudents,  int activeSubscriptions,  int monthlySales,  int completedSessions,  int programAdherence)  $default,) {final _that = this;
switch (_that) {
case _CoachStats():
return $default(_that.totalStudents,_that.activeSubscriptions,_that.monthlySales,_that.completedSessions,_that.programAdherence);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int totalStudents,  int activeSubscriptions,  int monthlySales,  int completedSessions,  int programAdherence)?  $default,) {final _that = this;
switch (_that) {
case _CoachStats() when $default != null:
return $default(_that.totalStudents,_that.activeSubscriptions,_that.monthlySales,_that.completedSessions,_that.programAdherence);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CoachStats implements CoachStats {
  const _CoachStats({this.totalStudents = 0, this.activeSubscriptions = 0, this.monthlySales = 0, this.completedSessions = 0, this.programAdherence = 0});
  factory _CoachStats.fromJson(Map<String, dynamic> json) => _$CoachStatsFromJson(json);

@override@JsonKey() final  int totalStudents;
@override@JsonKey() final  int activeSubscriptions;
@override@JsonKey() final  int monthlySales;
@override@JsonKey() final  int completedSessions;
@override@JsonKey() final  int programAdherence;

/// Create a copy of CoachStats
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CoachStatsCopyWith<_CoachStats> get copyWith => __$CoachStatsCopyWithImpl<_CoachStats>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CoachStatsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CoachStats&&(identical(other.totalStudents, totalStudents) || other.totalStudents == totalStudents)&&(identical(other.activeSubscriptions, activeSubscriptions) || other.activeSubscriptions == activeSubscriptions)&&(identical(other.monthlySales, monthlySales) || other.monthlySales == monthlySales)&&(identical(other.completedSessions, completedSessions) || other.completedSessions == completedSessions)&&(identical(other.programAdherence, programAdherence) || other.programAdherence == programAdherence));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalStudents,activeSubscriptions,monthlySales,completedSessions,programAdherence);

@override
String toString() {
  return 'CoachStats(totalStudents: $totalStudents, activeSubscriptions: $activeSubscriptions, monthlySales: $monthlySales, completedSessions: $completedSessions, programAdherence: $programAdherence)';
}


}

/// @nodoc
abstract mixin class _$CoachStatsCopyWith<$Res> implements $CoachStatsCopyWith<$Res> {
  factory _$CoachStatsCopyWith(_CoachStats value, $Res Function(_CoachStats) _then) = __$CoachStatsCopyWithImpl;
@override @useResult
$Res call({
 int totalStudents, int activeSubscriptions, int monthlySales, int completedSessions, int programAdherence
});




}
/// @nodoc
class __$CoachStatsCopyWithImpl<$Res>
    implements _$CoachStatsCopyWith<$Res> {
  __$CoachStatsCopyWithImpl(this._self, this._then);

  final _CoachStats _self;
  final $Res Function(_CoachStats) _then;

/// Create a copy of CoachStats
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? totalStudents = null,Object? activeSubscriptions = null,Object? monthlySales = null,Object? completedSessions = null,Object? programAdherence = null,}) {
  return _then(_CoachStats(
totalStudents: null == totalStudents ? _self.totalStudents : totalStudents // ignore: cast_nullable_to_non_nullable
as int,activeSubscriptions: null == activeSubscriptions ? _self.activeSubscriptions : activeSubscriptions // ignore: cast_nullable_to_non_nullable
as int,monthlySales: null == monthlySales ? _self.monthlySales : monthlySales // ignore: cast_nullable_to_non_nullable
as int,completedSessions: null == completedSessions ? _self.completedSessions : completedSessions // ignore: cast_nullable_to_non_nullable
as int,programAdherence: null == programAdherence ? _self.programAdherence : programAdherence // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$CoachRecentStudent {

 int get studentId; String get fullName; String get joinedAt;
/// Create a copy of CoachRecentStudent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CoachRecentStudentCopyWith<CoachRecentStudent> get copyWith => _$CoachRecentStudentCopyWithImpl<CoachRecentStudent>(this as CoachRecentStudent, _$identity);

  /// Serializes this CoachRecentStudent to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CoachRecentStudent&&(identical(other.studentId, studentId) || other.studentId == studentId)&&(identical(other.fullName, fullName) || other.fullName == fullName)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,studentId,fullName,joinedAt);

@override
String toString() {
  return 'CoachRecentStudent(studentId: $studentId, fullName: $fullName, joinedAt: $joinedAt)';
}


}

/// @nodoc
abstract mixin class $CoachRecentStudentCopyWith<$Res>  {
  factory $CoachRecentStudentCopyWith(CoachRecentStudent value, $Res Function(CoachRecentStudent) _then) = _$CoachRecentStudentCopyWithImpl;
@useResult
$Res call({
 int studentId, String fullName, String joinedAt
});




}
/// @nodoc
class _$CoachRecentStudentCopyWithImpl<$Res>
    implements $CoachRecentStudentCopyWith<$Res> {
  _$CoachRecentStudentCopyWithImpl(this._self, this._then);

  final CoachRecentStudent _self;
  final $Res Function(CoachRecentStudent) _then;

/// Create a copy of CoachRecentStudent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? studentId = null,Object? fullName = null,Object? joinedAt = null,}) {
  return _then(_self.copyWith(
studentId: null == studentId ? _self.studentId : studentId // ignore: cast_nullable_to_non_nullable
as int,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,joinedAt: null == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [CoachRecentStudent].
extension CoachRecentStudentPatterns on CoachRecentStudent {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CoachRecentStudent value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CoachRecentStudent() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CoachRecentStudent value)  $default,){
final _that = this;
switch (_that) {
case _CoachRecentStudent():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CoachRecentStudent value)?  $default,){
final _that = this;
switch (_that) {
case _CoachRecentStudent() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int studentId,  String fullName,  String joinedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CoachRecentStudent() when $default != null:
return $default(_that.studentId,_that.fullName,_that.joinedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int studentId,  String fullName,  String joinedAt)  $default,) {final _that = this;
switch (_that) {
case _CoachRecentStudent():
return $default(_that.studentId,_that.fullName,_that.joinedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int studentId,  String fullName,  String joinedAt)?  $default,) {final _that = this;
switch (_that) {
case _CoachRecentStudent() when $default != null:
return $default(_that.studentId,_that.fullName,_that.joinedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CoachRecentStudent implements CoachRecentStudent {
  const _CoachRecentStudent({this.studentId = 0, this.fullName = '', this.joinedAt = ''});
  factory _CoachRecentStudent.fromJson(Map<String, dynamic> json) => _$CoachRecentStudentFromJson(json);

@override@JsonKey() final  int studentId;
@override@JsonKey() final  String fullName;
@override@JsonKey() final  String joinedAt;

/// Create a copy of CoachRecentStudent
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CoachRecentStudentCopyWith<_CoachRecentStudent> get copyWith => __$CoachRecentStudentCopyWithImpl<_CoachRecentStudent>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CoachRecentStudentToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CoachRecentStudent&&(identical(other.studentId, studentId) || other.studentId == studentId)&&(identical(other.fullName, fullName) || other.fullName == fullName)&&(identical(other.joinedAt, joinedAt) || other.joinedAt == joinedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,studentId,fullName,joinedAt);

@override
String toString() {
  return 'CoachRecentStudent(studentId: $studentId, fullName: $fullName, joinedAt: $joinedAt)';
}


}

/// @nodoc
abstract mixin class _$CoachRecentStudentCopyWith<$Res> implements $CoachRecentStudentCopyWith<$Res> {
  factory _$CoachRecentStudentCopyWith(_CoachRecentStudent value, $Res Function(_CoachRecentStudent) _then) = __$CoachRecentStudentCopyWithImpl;
@override @useResult
$Res call({
 int studentId, String fullName, String joinedAt
});




}
/// @nodoc
class __$CoachRecentStudentCopyWithImpl<$Res>
    implements _$CoachRecentStudentCopyWith<$Res> {
  __$CoachRecentStudentCopyWithImpl(this._self, this._then);

  final _CoachRecentStudent _self;
  final $Res Function(_CoachRecentStudent) _then;

/// Create a copy of CoachRecentStudent
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? studentId = null,Object? fullName = null,Object? joinedAt = null,}) {
  return _then(_CoachRecentStudent(
studentId: null == studentId ? _self.studentId : studentId // ignore: cast_nullable_to_non_nullable
as int,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,joinedAt: null == joinedAt ? _self.joinedAt : joinedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
