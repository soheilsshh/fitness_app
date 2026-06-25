// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'dashboard_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$DashboardSummary {

 int get totalSessions; int get sessionsThisWeek; int get sessionsThisMonth; int get avgDurationMin; int get streakWeeks; int get adherence; int get weeklyGoalDays; int get completedThisWeek; List<ProgressPoint> get progressSeries;
/// Create a copy of DashboardSummary
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DashboardSummaryCopyWith<DashboardSummary> get copyWith => _$DashboardSummaryCopyWithImpl<DashboardSummary>(this as DashboardSummary, _$identity);

  /// Serializes this DashboardSummary to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DashboardSummary&&(identical(other.totalSessions, totalSessions) || other.totalSessions == totalSessions)&&(identical(other.sessionsThisWeek, sessionsThisWeek) || other.sessionsThisWeek == sessionsThisWeek)&&(identical(other.sessionsThisMonth, sessionsThisMonth) || other.sessionsThisMonth == sessionsThisMonth)&&(identical(other.avgDurationMin, avgDurationMin) || other.avgDurationMin == avgDurationMin)&&(identical(other.streakWeeks, streakWeeks) || other.streakWeeks == streakWeeks)&&(identical(other.adherence, adherence) || other.adherence == adherence)&&(identical(other.weeklyGoalDays, weeklyGoalDays) || other.weeklyGoalDays == weeklyGoalDays)&&(identical(other.completedThisWeek, completedThisWeek) || other.completedThisWeek == completedThisWeek)&&const DeepCollectionEquality().equals(other.progressSeries, progressSeries));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalSessions,sessionsThisWeek,sessionsThisMonth,avgDurationMin,streakWeeks,adherence,weeklyGoalDays,completedThisWeek,const DeepCollectionEquality().hash(progressSeries));

@override
String toString() {
  return 'DashboardSummary(totalSessions: $totalSessions, sessionsThisWeek: $sessionsThisWeek, sessionsThisMonth: $sessionsThisMonth, avgDurationMin: $avgDurationMin, streakWeeks: $streakWeeks, adherence: $adherence, weeklyGoalDays: $weeklyGoalDays, completedThisWeek: $completedThisWeek, progressSeries: $progressSeries)';
}


}

/// @nodoc
abstract mixin class $DashboardSummaryCopyWith<$Res>  {
  factory $DashboardSummaryCopyWith(DashboardSummary value, $Res Function(DashboardSummary) _then) = _$DashboardSummaryCopyWithImpl;
@useResult
$Res call({
 int totalSessions, int sessionsThisWeek, int sessionsThisMonth, int avgDurationMin, int streakWeeks, int adherence, int weeklyGoalDays, int completedThisWeek, List<ProgressPoint> progressSeries
});




}
/// @nodoc
class _$DashboardSummaryCopyWithImpl<$Res>
    implements $DashboardSummaryCopyWith<$Res> {
  _$DashboardSummaryCopyWithImpl(this._self, this._then);

  final DashboardSummary _self;
  final $Res Function(DashboardSummary) _then;

/// Create a copy of DashboardSummary
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? totalSessions = null,Object? sessionsThisWeek = null,Object? sessionsThisMonth = null,Object? avgDurationMin = null,Object? streakWeeks = null,Object? adherence = null,Object? weeklyGoalDays = null,Object? completedThisWeek = null,Object? progressSeries = null,}) {
  return _then(_self.copyWith(
totalSessions: null == totalSessions ? _self.totalSessions : totalSessions // ignore: cast_nullable_to_non_nullable
as int,sessionsThisWeek: null == sessionsThisWeek ? _self.sessionsThisWeek : sessionsThisWeek // ignore: cast_nullable_to_non_nullable
as int,sessionsThisMonth: null == sessionsThisMonth ? _self.sessionsThisMonth : sessionsThisMonth // ignore: cast_nullable_to_non_nullable
as int,avgDurationMin: null == avgDurationMin ? _self.avgDurationMin : avgDurationMin // ignore: cast_nullable_to_non_nullable
as int,streakWeeks: null == streakWeeks ? _self.streakWeeks : streakWeeks // ignore: cast_nullable_to_non_nullable
as int,adherence: null == adherence ? _self.adherence : adherence // ignore: cast_nullable_to_non_nullable
as int,weeklyGoalDays: null == weeklyGoalDays ? _self.weeklyGoalDays : weeklyGoalDays // ignore: cast_nullable_to_non_nullable
as int,completedThisWeek: null == completedThisWeek ? _self.completedThisWeek : completedThisWeek // ignore: cast_nullable_to_non_nullable
as int,progressSeries: null == progressSeries ? _self.progressSeries : progressSeries // ignore: cast_nullable_to_non_nullable
as List<ProgressPoint>,
  ));
}

}


/// Adds pattern-matching-related methods to [DashboardSummary].
extension DashboardSummaryPatterns on DashboardSummary {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DashboardSummary value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DashboardSummary() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DashboardSummary value)  $default,){
final _that = this;
switch (_that) {
case _DashboardSummary():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DashboardSummary value)?  $default,){
final _that = this;
switch (_that) {
case _DashboardSummary() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int totalSessions,  int sessionsThisWeek,  int sessionsThisMonth,  int avgDurationMin,  int streakWeeks,  int adherence,  int weeklyGoalDays,  int completedThisWeek,  List<ProgressPoint> progressSeries)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DashboardSummary() when $default != null:
return $default(_that.totalSessions,_that.sessionsThisWeek,_that.sessionsThisMonth,_that.avgDurationMin,_that.streakWeeks,_that.adherence,_that.weeklyGoalDays,_that.completedThisWeek,_that.progressSeries);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int totalSessions,  int sessionsThisWeek,  int sessionsThisMonth,  int avgDurationMin,  int streakWeeks,  int adherence,  int weeklyGoalDays,  int completedThisWeek,  List<ProgressPoint> progressSeries)  $default,) {final _that = this;
switch (_that) {
case _DashboardSummary():
return $default(_that.totalSessions,_that.sessionsThisWeek,_that.sessionsThisMonth,_that.avgDurationMin,_that.streakWeeks,_that.adherence,_that.weeklyGoalDays,_that.completedThisWeek,_that.progressSeries);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int totalSessions,  int sessionsThisWeek,  int sessionsThisMonth,  int avgDurationMin,  int streakWeeks,  int adherence,  int weeklyGoalDays,  int completedThisWeek,  List<ProgressPoint> progressSeries)?  $default,) {final _that = this;
switch (_that) {
case _DashboardSummary() when $default != null:
return $default(_that.totalSessions,_that.sessionsThisWeek,_that.sessionsThisMonth,_that.avgDurationMin,_that.streakWeeks,_that.adherence,_that.weeklyGoalDays,_that.completedThisWeek,_that.progressSeries);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DashboardSummary implements DashboardSummary {
  const _DashboardSummary({this.totalSessions = 0, this.sessionsThisWeek = 0, this.sessionsThisMonth = 0, this.avgDurationMin = 0, this.streakWeeks = 0, this.adherence = 0, this.weeklyGoalDays = 0, this.completedThisWeek = 0, final  List<ProgressPoint> progressSeries = const <ProgressPoint>[]}): _progressSeries = progressSeries;
  factory _DashboardSummary.fromJson(Map<String, dynamic> json) => _$DashboardSummaryFromJson(json);

@override@JsonKey() final  int totalSessions;
@override@JsonKey() final  int sessionsThisWeek;
@override@JsonKey() final  int sessionsThisMonth;
@override@JsonKey() final  int avgDurationMin;
@override@JsonKey() final  int streakWeeks;
@override@JsonKey() final  int adherence;
@override@JsonKey() final  int weeklyGoalDays;
@override@JsonKey() final  int completedThisWeek;
 final  List<ProgressPoint> _progressSeries;
@override@JsonKey() List<ProgressPoint> get progressSeries {
  if (_progressSeries is EqualUnmodifiableListView) return _progressSeries;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_progressSeries);
}


/// Create a copy of DashboardSummary
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DashboardSummaryCopyWith<_DashboardSummary> get copyWith => __$DashboardSummaryCopyWithImpl<_DashboardSummary>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DashboardSummaryToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DashboardSummary&&(identical(other.totalSessions, totalSessions) || other.totalSessions == totalSessions)&&(identical(other.sessionsThisWeek, sessionsThisWeek) || other.sessionsThisWeek == sessionsThisWeek)&&(identical(other.sessionsThisMonth, sessionsThisMonth) || other.sessionsThisMonth == sessionsThisMonth)&&(identical(other.avgDurationMin, avgDurationMin) || other.avgDurationMin == avgDurationMin)&&(identical(other.streakWeeks, streakWeeks) || other.streakWeeks == streakWeeks)&&(identical(other.adherence, adherence) || other.adherence == adherence)&&(identical(other.weeklyGoalDays, weeklyGoalDays) || other.weeklyGoalDays == weeklyGoalDays)&&(identical(other.completedThisWeek, completedThisWeek) || other.completedThisWeek == completedThisWeek)&&const DeepCollectionEquality().equals(other._progressSeries, _progressSeries));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,totalSessions,sessionsThisWeek,sessionsThisMonth,avgDurationMin,streakWeeks,adherence,weeklyGoalDays,completedThisWeek,const DeepCollectionEquality().hash(_progressSeries));

@override
String toString() {
  return 'DashboardSummary(totalSessions: $totalSessions, sessionsThisWeek: $sessionsThisWeek, sessionsThisMonth: $sessionsThisMonth, avgDurationMin: $avgDurationMin, streakWeeks: $streakWeeks, adherence: $adherence, weeklyGoalDays: $weeklyGoalDays, completedThisWeek: $completedThisWeek, progressSeries: $progressSeries)';
}


}

/// @nodoc
abstract mixin class _$DashboardSummaryCopyWith<$Res> implements $DashboardSummaryCopyWith<$Res> {
  factory _$DashboardSummaryCopyWith(_DashboardSummary value, $Res Function(_DashboardSummary) _then) = __$DashboardSummaryCopyWithImpl;
@override @useResult
$Res call({
 int totalSessions, int sessionsThisWeek, int sessionsThisMonth, int avgDurationMin, int streakWeeks, int adherence, int weeklyGoalDays, int completedThisWeek, List<ProgressPoint> progressSeries
});




}
/// @nodoc
class __$DashboardSummaryCopyWithImpl<$Res>
    implements _$DashboardSummaryCopyWith<$Res> {
  __$DashboardSummaryCopyWithImpl(this._self, this._then);

  final _DashboardSummary _self;
  final $Res Function(_DashboardSummary) _then;

/// Create a copy of DashboardSummary
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? totalSessions = null,Object? sessionsThisWeek = null,Object? sessionsThisMonth = null,Object? avgDurationMin = null,Object? streakWeeks = null,Object? adherence = null,Object? weeklyGoalDays = null,Object? completedThisWeek = null,Object? progressSeries = null,}) {
  return _then(_DashboardSummary(
totalSessions: null == totalSessions ? _self.totalSessions : totalSessions // ignore: cast_nullable_to_non_nullable
as int,sessionsThisWeek: null == sessionsThisWeek ? _self.sessionsThisWeek : sessionsThisWeek // ignore: cast_nullable_to_non_nullable
as int,sessionsThisMonth: null == sessionsThisMonth ? _self.sessionsThisMonth : sessionsThisMonth // ignore: cast_nullable_to_non_nullable
as int,avgDurationMin: null == avgDurationMin ? _self.avgDurationMin : avgDurationMin // ignore: cast_nullable_to_non_nullable
as int,streakWeeks: null == streakWeeks ? _self.streakWeeks : streakWeeks // ignore: cast_nullable_to_non_nullable
as int,adherence: null == adherence ? _self.adherence : adherence // ignore: cast_nullable_to_non_nullable
as int,weeklyGoalDays: null == weeklyGoalDays ? _self.weeklyGoalDays : weeklyGoalDays // ignore: cast_nullable_to_non_nullable
as int,completedThisWeek: null == completedThisWeek ? _self.completedThisWeek : completedThisWeek // ignore: cast_nullable_to_non_nullable
as int,progressSeries: null == progressSeries ? _self._progressSeries : progressSeries // ignore: cast_nullable_to_non_nullable
as List<ProgressPoint>,
  ));
}


}


/// @nodoc
mixin _$ProgressPoint {

 String get date; int get value;
/// Create a copy of ProgressPoint
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProgressPointCopyWith<ProgressPoint> get copyWith => _$ProgressPointCopyWithImpl<ProgressPoint>(this as ProgressPoint, _$identity);

  /// Serializes this ProgressPoint to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProgressPoint&&(identical(other.date, date) || other.date == date)&&(identical(other.value, value) || other.value == value));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,value);

@override
String toString() {
  return 'ProgressPoint(date: $date, value: $value)';
}


}

/// @nodoc
abstract mixin class $ProgressPointCopyWith<$Res>  {
  factory $ProgressPointCopyWith(ProgressPoint value, $Res Function(ProgressPoint) _then) = _$ProgressPointCopyWithImpl;
@useResult
$Res call({
 String date, int value
});




}
/// @nodoc
class _$ProgressPointCopyWithImpl<$Res>
    implements $ProgressPointCopyWith<$Res> {
  _$ProgressPointCopyWithImpl(this._self, this._then);

  final ProgressPoint _self;
  final $Res Function(ProgressPoint) _then;

/// Create a copy of ProgressPoint
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? value = null,}) {
  return _then(_self.copyWith(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,value: null == value ? _self.value : value // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [ProgressPoint].
extension ProgressPointPatterns on ProgressPoint {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProgressPoint value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProgressPoint() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProgressPoint value)  $default,){
final _that = this;
switch (_that) {
case _ProgressPoint():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProgressPoint value)?  $default,){
final _that = this;
switch (_that) {
case _ProgressPoint() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  int value)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProgressPoint() when $default != null:
return $default(_that.date,_that.value);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  int value)  $default,) {final _that = this;
switch (_that) {
case _ProgressPoint():
return $default(_that.date,_that.value);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  int value)?  $default,) {final _that = this;
switch (_that) {
case _ProgressPoint() when $default != null:
return $default(_that.date,_that.value);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProgressPoint implements ProgressPoint {
  const _ProgressPoint({this.date = '', this.value = 0});
  factory _ProgressPoint.fromJson(Map<String, dynamic> json) => _$ProgressPointFromJson(json);

@override@JsonKey() final  String date;
@override@JsonKey() final  int value;

/// Create a copy of ProgressPoint
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProgressPointCopyWith<_ProgressPoint> get copyWith => __$ProgressPointCopyWithImpl<_ProgressPoint>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProgressPointToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProgressPoint&&(identical(other.date, date) || other.date == date)&&(identical(other.value, value) || other.value == value));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,value);

@override
String toString() {
  return 'ProgressPoint(date: $date, value: $value)';
}


}

/// @nodoc
abstract mixin class _$ProgressPointCopyWith<$Res> implements $ProgressPointCopyWith<$Res> {
  factory _$ProgressPointCopyWith(_ProgressPoint value, $Res Function(_ProgressPoint) _then) = __$ProgressPointCopyWithImpl;
@override @useResult
$Res call({
 String date, int value
});




}
/// @nodoc
class __$ProgressPointCopyWithImpl<$Res>
    implements _$ProgressPointCopyWith<$Res> {
  __$ProgressPointCopyWithImpl(this._self, this._then);

  final _ProgressPoint _self;
  final $Res Function(_ProgressPoint) _then;

/// Create a copy of ProgressPoint
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? value = null,}) {
  return _then(_ProgressPoint(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,value: null == value ? _self.value : value // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$PersonalRecord {

 String get exerciseName; double get bestWeightKg; int get bestReps;@JsonKey(name: 'est1rm') int get est1rm; String get achievedAt;
/// Create a copy of PersonalRecord
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$PersonalRecordCopyWith<PersonalRecord> get copyWith => _$PersonalRecordCopyWithImpl<PersonalRecord>(this as PersonalRecord, _$identity);

  /// Serializes this PersonalRecord to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is PersonalRecord&&(identical(other.exerciseName, exerciseName) || other.exerciseName == exerciseName)&&(identical(other.bestWeightKg, bestWeightKg) || other.bestWeightKg == bestWeightKg)&&(identical(other.bestReps, bestReps) || other.bestReps == bestReps)&&(identical(other.est1rm, est1rm) || other.est1rm == est1rm)&&(identical(other.achievedAt, achievedAt) || other.achievedAt == achievedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,exerciseName,bestWeightKg,bestReps,est1rm,achievedAt);

@override
String toString() {
  return 'PersonalRecord(exerciseName: $exerciseName, bestWeightKg: $bestWeightKg, bestReps: $bestReps, est1rm: $est1rm, achievedAt: $achievedAt)';
}


}

/// @nodoc
abstract mixin class $PersonalRecordCopyWith<$Res>  {
  factory $PersonalRecordCopyWith(PersonalRecord value, $Res Function(PersonalRecord) _then) = _$PersonalRecordCopyWithImpl;
@useResult
$Res call({
 String exerciseName, double bestWeightKg, int bestReps,@JsonKey(name: 'est1rm') int est1rm, String achievedAt
});




}
/// @nodoc
class _$PersonalRecordCopyWithImpl<$Res>
    implements $PersonalRecordCopyWith<$Res> {
  _$PersonalRecordCopyWithImpl(this._self, this._then);

  final PersonalRecord _self;
  final $Res Function(PersonalRecord) _then;

/// Create a copy of PersonalRecord
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? exerciseName = null,Object? bestWeightKg = null,Object? bestReps = null,Object? est1rm = null,Object? achievedAt = null,}) {
  return _then(_self.copyWith(
exerciseName: null == exerciseName ? _self.exerciseName : exerciseName // ignore: cast_nullable_to_non_nullable
as String,bestWeightKg: null == bestWeightKg ? _self.bestWeightKg : bestWeightKg // ignore: cast_nullable_to_non_nullable
as double,bestReps: null == bestReps ? _self.bestReps : bestReps // ignore: cast_nullable_to_non_nullable
as int,est1rm: null == est1rm ? _self.est1rm : est1rm // ignore: cast_nullable_to_non_nullable
as int,achievedAt: null == achievedAt ? _self.achievedAt : achievedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [PersonalRecord].
extension PersonalRecordPatterns on PersonalRecord {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _PersonalRecord value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _PersonalRecord() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _PersonalRecord value)  $default,){
final _that = this;
switch (_that) {
case _PersonalRecord():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _PersonalRecord value)?  $default,){
final _that = this;
switch (_that) {
case _PersonalRecord() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String exerciseName,  double bestWeightKg,  int bestReps, @JsonKey(name: 'est1rm')  int est1rm,  String achievedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _PersonalRecord() when $default != null:
return $default(_that.exerciseName,_that.bestWeightKg,_that.bestReps,_that.est1rm,_that.achievedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String exerciseName,  double bestWeightKg,  int bestReps, @JsonKey(name: 'est1rm')  int est1rm,  String achievedAt)  $default,) {final _that = this;
switch (_that) {
case _PersonalRecord():
return $default(_that.exerciseName,_that.bestWeightKg,_that.bestReps,_that.est1rm,_that.achievedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String exerciseName,  double bestWeightKg,  int bestReps, @JsonKey(name: 'est1rm')  int est1rm,  String achievedAt)?  $default,) {final _that = this;
switch (_that) {
case _PersonalRecord() when $default != null:
return $default(_that.exerciseName,_that.bestWeightKg,_that.bestReps,_that.est1rm,_that.achievedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _PersonalRecord implements PersonalRecord {
  const _PersonalRecord({this.exerciseName = '', this.bestWeightKg = 0, this.bestReps = 0, @JsonKey(name: 'est1rm') this.est1rm = 0, this.achievedAt = ''});
  factory _PersonalRecord.fromJson(Map<String, dynamic> json) => _$PersonalRecordFromJson(json);

@override@JsonKey() final  String exerciseName;
@override@JsonKey() final  double bestWeightKg;
@override@JsonKey() final  int bestReps;
@override@JsonKey(name: 'est1rm') final  int est1rm;
@override@JsonKey() final  String achievedAt;

/// Create a copy of PersonalRecord
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$PersonalRecordCopyWith<_PersonalRecord> get copyWith => __$PersonalRecordCopyWithImpl<_PersonalRecord>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$PersonalRecordToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _PersonalRecord&&(identical(other.exerciseName, exerciseName) || other.exerciseName == exerciseName)&&(identical(other.bestWeightKg, bestWeightKg) || other.bestWeightKg == bestWeightKg)&&(identical(other.bestReps, bestReps) || other.bestReps == bestReps)&&(identical(other.est1rm, est1rm) || other.est1rm == est1rm)&&(identical(other.achievedAt, achievedAt) || other.achievedAt == achievedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,exerciseName,bestWeightKg,bestReps,est1rm,achievedAt);

@override
String toString() {
  return 'PersonalRecord(exerciseName: $exerciseName, bestWeightKg: $bestWeightKg, bestReps: $bestReps, est1rm: $est1rm, achievedAt: $achievedAt)';
}


}

/// @nodoc
abstract mixin class _$PersonalRecordCopyWith<$Res> implements $PersonalRecordCopyWith<$Res> {
  factory _$PersonalRecordCopyWith(_PersonalRecord value, $Res Function(_PersonalRecord) _then) = __$PersonalRecordCopyWithImpl;
@override @useResult
$Res call({
 String exerciseName, double bestWeightKg, int bestReps,@JsonKey(name: 'est1rm') int est1rm, String achievedAt
});




}
/// @nodoc
class __$PersonalRecordCopyWithImpl<$Res>
    implements _$PersonalRecordCopyWith<$Res> {
  __$PersonalRecordCopyWithImpl(this._self, this._then);

  final _PersonalRecord _self;
  final $Res Function(_PersonalRecord) _then;

/// Create a copy of PersonalRecord
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? exerciseName = null,Object? bestWeightKg = null,Object? bestReps = null,Object? est1rm = null,Object? achievedAt = null,}) {
  return _then(_PersonalRecord(
exerciseName: null == exerciseName ? _self.exerciseName : exerciseName // ignore: cast_nullable_to_non_nullable
as String,bestWeightKg: null == bestWeightKg ? _self.bestWeightKg : bestWeightKg // ignore: cast_nullable_to_non_nullable
as double,bestReps: null == bestReps ? _self.bestReps : bestReps // ignore: cast_nullable_to_non_nullable
as int,est1rm: null == est1rm ? _self.est1rm : est1rm // ignore: cast_nullable_to_non_nullable
as int,achievedAt: null == achievedAt ? _self.achievedAt : achievedAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
