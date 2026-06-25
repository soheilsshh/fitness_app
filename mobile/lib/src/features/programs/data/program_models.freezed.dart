// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'program_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ProgramSummary {

 int get id; String get title; String get type; String get status; String get startDate; int get durationDays; int get remainingDays; int get price; String get coachName;
/// Create a copy of ProgramSummary
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProgramSummaryCopyWith<ProgramSummary> get copyWith => _$ProgramSummaryCopyWithImpl<ProgramSummary>(this as ProgramSummary, _$identity);

  /// Serializes this ProgramSummary to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProgramSummary&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.type, type) || other.type == type)&&(identical(other.status, status) || other.status == status)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.durationDays, durationDays) || other.durationDays == durationDays)&&(identical(other.remainingDays, remainingDays) || other.remainingDays == remainingDays)&&(identical(other.price, price) || other.price == price)&&(identical(other.coachName, coachName) || other.coachName == coachName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,type,status,startDate,durationDays,remainingDays,price,coachName);

@override
String toString() {
  return 'ProgramSummary(id: $id, title: $title, type: $type, status: $status, startDate: $startDate, durationDays: $durationDays, remainingDays: $remainingDays, price: $price, coachName: $coachName)';
}


}

/// @nodoc
abstract mixin class $ProgramSummaryCopyWith<$Res>  {
  factory $ProgramSummaryCopyWith(ProgramSummary value, $Res Function(ProgramSummary) _then) = _$ProgramSummaryCopyWithImpl;
@useResult
$Res call({
 int id, String title, String type, String status, String startDate, int durationDays, int remainingDays, int price, String coachName
});




}
/// @nodoc
class _$ProgramSummaryCopyWithImpl<$Res>
    implements $ProgramSummaryCopyWith<$Res> {
  _$ProgramSummaryCopyWithImpl(this._self, this._then);

  final ProgramSummary _self;
  final $Res Function(ProgramSummary) _then;

/// Create a copy of ProgramSummary
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? type = null,Object? status = null,Object? startDate = null,Object? durationDays = null,Object? remainingDays = null,Object? price = null,Object? coachName = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as String,durationDays: null == durationDays ? _self.durationDays : durationDays // ignore: cast_nullable_to_non_nullable
as int,remainingDays: null == remainingDays ? _self.remainingDays : remainingDays // ignore: cast_nullable_to_non_nullable
as int,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int,coachName: null == coachName ? _self.coachName : coachName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ProgramSummary].
extension ProgramSummaryPatterns on ProgramSummary {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProgramSummary value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProgramSummary() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProgramSummary value)  $default,){
final _that = this;
switch (_that) {
case _ProgramSummary():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProgramSummary value)?  $default,){
final _that = this;
switch (_that) {
case _ProgramSummary() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String title,  String type,  String status,  String startDate,  int durationDays,  int remainingDays,  int price,  String coachName)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProgramSummary() when $default != null:
return $default(_that.id,_that.title,_that.type,_that.status,_that.startDate,_that.durationDays,_that.remainingDays,_that.price,_that.coachName);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String title,  String type,  String status,  String startDate,  int durationDays,  int remainingDays,  int price,  String coachName)  $default,) {final _that = this;
switch (_that) {
case _ProgramSummary():
return $default(_that.id,_that.title,_that.type,_that.status,_that.startDate,_that.durationDays,_that.remainingDays,_that.price,_that.coachName);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String title,  String type,  String status,  String startDate,  int durationDays,  int remainingDays,  int price,  String coachName)?  $default,) {final _that = this;
switch (_that) {
case _ProgramSummary() when $default != null:
return $default(_that.id,_that.title,_that.type,_that.status,_that.startDate,_that.durationDays,_that.remainingDays,_that.price,_that.coachName);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProgramSummary implements ProgramSummary {
  const _ProgramSummary({required this.id, this.title = '', this.type = '', this.status = '', this.startDate = '', this.durationDays = 0, this.remainingDays = 0, this.price = 0, this.coachName = ''});
  factory _ProgramSummary.fromJson(Map<String, dynamic> json) => _$ProgramSummaryFromJson(json);

@override final  int id;
@override@JsonKey() final  String title;
@override@JsonKey() final  String type;
@override@JsonKey() final  String status;
@override@JsonKey() final  String startDate;
@override@JsonKey() final  int durationDays;
@override@JsonKey() final  int remainingDays;
@override@JsonKey() final  int price;
@override@JsonKey() final  String coachName;

/// Create a copy of ProgramSummary
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProgramSummaryCopyWith<_ProgramSummary> get copyWith => __$ProgramSummaryCopyWithImpl<_ProgramSummary>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProgramSummaryToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProgramSummary&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.type, type) || other.type == type)&&(identical(other.status, status) || other.status == status)&&(identical(other.startDate, startDate) || other.startDate == startDate)&&(identical(other.durationDays, durationDays) || other.durationDays == durationDays)&&(identical(other.remainingDays, remainingDays) || other.remainingDays == remainingDays)&&(identical(other.price, price) || other.price == price)&&(identical(other.coachName, coachName) || other.coachName == coachName));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,type,status,startDate,durationDays,remainingDays,price,coachName);

@override
String toString() {
  return 'ProgramSummary(id: $id, title: $title, type: $type, status: $status, startDate: $startDate, durationDays: $durationDays, remainingDays: $remainingDays, price: $price, coachName: $coachName)';
}


}

/// @nodoc
abstract mixin class _$ProgramSummaryCopyWith<$Res> implements $ProgramSummaryCopyWith<$Res> {
  factory _$ProgramSummaryCopyWith(_ProgramSummary value, $Res Function(_ProgramSummary) _then) = __$ProgramSummaryCopyWithImpl;
@override @useResult
$Res call({
 int id, String title, String type, String status, String startDate, int durationDays, int remainingDays, int price, String coachName
});




}
/// @nodoc
class __$ProgramSummaryCopyWithImpl<$Res>
    implements _$ProgramSummaryCopyWith<$Res> {
  __$ProgramSummaryCopyWithImpl(this._self, this._then);

  final _ProgramSummary _self;
  final $Res Function(_ProgramSummary) _then;

/// Create a copy of ProgramSummary
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? type = null,Object? status = null,Object? startDate = null,Object? durationDays = null,Object? remainingDays = null,Object? price = null,Object? coachName = null,}) {
  return _then(_ProgramSummary(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,startDate: null == startDate ? _self.startDate : startDate // ignore: cast_nullable_to_non_nullable
as String,durationDays: null == durationDays ? _self.durationDays : durationDays // ignore: cast_nullable_to_non_nullable
as int,remainingDays: null == remainingDays ? _self.remainingDays : remainingDays // ignore: cast_nullable_to_non_nullable
as int,price: null == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as int,coachName: null == coachName ? _self.coachName : coachName // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ProgramsResponse {

 List<ProgramSummary> get programs;
/// Create a copy of ProgramsResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProgramsResponseCopyWith<ProgramsResponse> get copyWith => _$ProgramsResponseCopyWithImpl<ProgramsResponse>(this as ProgramsResponse, _$identity);

  /// Serializes this ProgramsResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProgramsResponse&&const DeepCollectionEquality().equals(other.programs, programs));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(programs));

@override
String toString() {
  return 'ProgramsResponse(programs: $programs)';
}


}

/// @nodoc
abstract mixin class $ProgramsResponseCopyWith<$Res>  {
  factory $ProgramsResponseCopyWith(ProgramsResponse value, $Res Function(ProgramsResponse) _then) = _$ProgramsResponseCopyWithImpl;
@useResult
$Res call({
 List<ProgramSummary> programs
});




}
/// @nodoc
class _$ProgramsResponseCopyWithImpl<$Res>
    implements $ProgramsResponseCopyWith<$Res> {
  _$ProgramsResponseCopyWithImpl(this._self, this._then);

  final ProgramsResponse _self;
  final $Res Function(ProgramsResponse) _then;

/// Create a copy of ProgramsResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? programs = null,}) {
  return _then(_self.copyWith(
programs: null == programs ? _self.programs : programs // ignore: cast_nullable_to_non_nullable
as List<ProgramSummary>,
  ));
}

}


/// Adds pattern-matching-related methods to [ProgramsResponse].
extension ProgramsResponsePatterns on ProgramsResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProgramsResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProgramsResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProgramsResponse value)  $default,){
final _that = this;
switch (_that) {
case _ProgramsResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProgramsResponse value)?  $default,){
final _that = this;
switch (_that) {
case _ProgramsResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ProgramSummary> programs)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProgramsResponse() when $default != null:
return $default(_that.programs);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ProgramSummary> programs)  $default,) {final _that = this;
switch (_that) {
case _ProgramsResponse():
return $default(_that.programs);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ProgramSummary> programs)?  $default,) {final _that = this;
switch (_that) {
case _ProgramsResponse() when $default != null:
return $default(_that.programs);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProgramsResponse implements ProgramsResponse {
  const _ProgramsResponse({final  List<ProgramSummary> programs = const <ProgramSummary>[]}): _programs = programs;
  factory _ProgramsResponse.fromJson(Map<String, dynamic> json) => _$ProgramsResponseFromJson(json);

 final  List<ProgramSummary> _programs;
@override@JsonKey() List<ProgramSummary> get programs {
  if (_programs is EqualUnmodifiableListView) return _programs;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_programs);
}


/// Create a copy of ProgramsResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProgramsResponseCopyWith<_ProgramsResponse> get copyWith => __$ProgramsResponseCopyWithImpl<_ProgramsResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProgramsResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProgramsResponse&&const DeepCollectionEquality().equals(other._programs, _programs));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_programs));

@override
String toString() {
  return 'ProgramsResponse(programs: $programs)';
}


}

/// @nodoc
abstract mixin class _$ProgramsResponseCopyWith<$Res> implements $ProgramsResponseCopyWith<$Res> {
  factory _$ProgramsResponseCopyWith(_ProgramsResponse value, $Res Function(_ProgramsResponse) _then) = __$ProgramsResponseCopyWithImpl;
@override @useResult
$Res call({
 List<ProgramSummary> programs
});




}
/// @nodoc
class __$ProgramsResponseCopyWithImpl<$Res>
    implements _$ProgramsResponseCopyWith<$Res> {
  __$ProgramsResponseCopyWithImpl(this._self, this._then);

  final _ProgramsResponse _self;
  final $Res Function(_ProgramsResponse) _then;

/// Create a copy of ProgramsResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? programs = null,}) {
  return _then(_ProgramsResponse(
programs: null == programs ? _self._programs : programs // ignore: cast_nullable_to_non_nullable
as List<ProgramSummary>,
  ));
}


}


/// @nodoc
mixin _$ProgramDetail {

 int get id; String get title; String get type; String get status; int get durationDays; int get remainingDays; String get goal; String get level; String get coach; List<String> get tags; ProgramSchedule? get schedule; Map<String, DayPlan> get planByDay;
/// Create a copy of ProgramDetail
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProgramDetailCopyWith<ProgramDetail> get copyWith => _$ProgramDetailCopyWithImpl<ProgramDetail>(this as ProgramDetail, _$identity);

  /// Serializes this ProgramDetail to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProgramDetail&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.type, type) || other.type == type)&&(identical(other.status, status) || other.status == status)&&(identical(other.durationDays, durationDays) || other.durationDays == durationDays)&&(identical(other.remainingDays, remainingDays) || other.remainingDays == remainingDays)&&(identical(other.goal, goal) || other.goal == goal)&&(identical(other.level, level) || other.level == level)&&(identical(other.coach, coach) || other.coach == coach)&&const DeepCollectionEquality().equals(other.tags, tags)&&(identical(other.schedule, schedule) || other.schedule == schedule)&&const DeepCollectionEquality().equals(other.planByDay, planByDay));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,type,status,durationDays,remainingDays,goal,level,coach,const DeepCollectionEquality().hash(tags),schedule,const DeepCollectionEquality().hash(planByDay));

@override
String toString() {
  return 'ProgramDetail(id: $id, title: $title, type: $type, status: $status, durationDays: $durationDays, remainingDays: $remainingDays, goal: $goal, level: $level, coach: $coach, tags: $tags, schedule: $schedule, planByDay: $planByDay)';
}


}

/// @nodoc
abstract mixin class $ProgramDetailCopyWith<$Res>  {
  factory $ProgramDetailCopyWith(ProgramDetail value, $Res Function(ProgramDetail) _then) = _$ProgramDetailCopyWithImpl;
@useResult
$Res call({
 int id, String title, String type, String status, int durationDays, int remainingDays, String goal, String level, String coach, List<String> tags, ProgramSchedule? schedule, Map<String, DayPlan> planByDay
});


$ProgramScheduleCopyWith<$Res>? get schedule;

}
/// @nodoc
class _$ProgramDetailCopyWithImpl<$Res>
    implements $ProgramDetailCopyWith<$Res> {
  _$ProgramDetailCopyWithImpl(this._self, this._then);

  final ProgramDetail _self;
  final $Res Function(ProgramDetail) _then;

/// Create a copy of ProgramDetail
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? type = null,Object? status = null,Object? durationDays = null,Object? remainingDays = null,Object? goal = null,Object? level = null,Object? coach = null,Object? tags = null,Object? schedule = freezed,Object? planByDay = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,durationDays: null == durationDays ? _self.durationDays : durationDays // ignore: cast_nullable_to_non_nullable
as int,remainingDays: null == remainingDays ? _self.remainingDays : remainingDays // ignore: cast_nullable_to_non_nullable
as int,goal: null == goal ? _self.goal : goal // ignore: cast_nullable_to_non_nullable
as String,level: null == level ? _self.level : level // ignore: cast_nullable_to_non_nullable
as String,coach: null == coach ? _self.coach : coach // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self.tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,schedule: freezed == schedule ? _self.schedule : schedule // ignore: cast_nullable_to_non_nullable
as ProgramSchedule?,planByDay: null == planByDay ? _self.planByDay : planByDay // ignore: cast_nullable_to_non_nullable
as Map<String, DayPlan>,
  ));
}
/// Create a copy of ProgramDetail
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProgramScheduleCopyWith<$Res>? get schedule {
    if (_self.schedule == null) {
    return null;
  }

  return $ProgramScheduleCopyWith<$Res>(_self.schedule!, (value) {
    return _then(_self.copyWith(schedule: value));
  });
}
}


/// Adds pattern-matching-related methods to [ProgramDetail].
extension ProgramDetailPatterns on ProgramDetail {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProgramDetail value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProgramDetail() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProgramDetail value)  $default,){
final _that = this;
switch (_that) {
case _ProgramDetail():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProgramDetail value)?  $default,){
final _that = this;
switch (_that) {
case _ProgramDetail() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String title,  String type,  String status,  int durationDays,  int remainingDays,  String goal,  String level,  String coach,  List<String> tags,  ProgramSchedule? schedule,  Map<String, DayPlan> planByDay)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProgramDetail() when $default != null:
return $default(_that.id,_that.title,_that.type,_that.status,_that.durationDays,_that.remainingDays,_that.goal,_that.level,_that.coach,_that.tags,_that.schedule,_that.planByDay);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String title,  String type,  String status,  int durationDays,  int remainingDays,  String goal,  String level,  String coach,  List<String> tags,  ProgramSchedule? schedule,  Map<String, DayPlan> planByDay)  $default,) {final _that = this;
switch (_that) {
case _ProgramDetail():
return $default(_that.id,_that.title,_that.type,_that.status,_that.durationDays,_that.remainingDays,_that.goal,_that.level,_that.coach,_that.tags,_that.schedule,_that.planByDay);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String title,  String type,  String status,  int durationDays,  int remainingDays,  String goal,  String level,  String coach,  List<String> tags,  ProgramSchedule? schedule,  Map<String, DayPlan> planByDay)?  $default,) {final _that = this;
switch (_that) {
case _ProgramDetail() when $default != null:
return $default(_that.id,_that.title,_that.type,_that.status,_that.durationDays,_that.remainingDays,_that.goal,_that.level,_that.coach,_that.tags,_that.schedule,_that.planByDay);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProgramDetail implements ProgramDetail {
  const _ProgramDetail({required this.id, this.title = '', this.type = '', this.status = '', this.durationDays = 0, this.remainingDays = 0, this.goal = '', this.level = '', this.coach = '', final  List<String> tags = const <String>[], this.schedule, final  Map<String, DayPlan> planByDay = const <String, DayPlan>{}}): _tags = tags,_planByDay = planByDay;
  factory _ProgramDetail.fromJson(Map<String, dynamic> json) => _$ProgramDetailFromJson(json);

@override final  int id;
@override@JsonKey() final  String title;
@override@JsonKey() final  String type;
@override@JsonKey() final  String status;
@override@JsonKey() final  int durationDays;
@override@JsonKey() final  int remainingDays;
@override@JsonKey() final  String goal;
@override@JsonKey() final  String level;
@override@JsonKey() final  String coach;
 final  List<String> _tags;
@override@JsonKey() List<String> get tags {
  if (_tags is EqualUnmodifiableListView) return _tags;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_tags);
}

@override final  ProgramSchedule? schedule;
 final  Map<String, DayPlan> _planByDay;
@override@JsonKey() Map<String, DayPlan> get planByDay {
  if (_planByDay is EqualUnmodifiableMapView) return _planByDay;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_planByDay);
}


/// Create a copy of ProgramDetail
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProgramDetailCopyWith<_ProgramDetail> get copyWith => __$ProgramDetailCopyWithImpl<_ProgramDetail>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProgramDetailToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProgramDetail&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.type, type) || other.type == type)&&(identical(other.status, status) || other.status == status)&&(identical(other.durationDays, durationDays) || other.durationDays == durationDays)&&(identical(other.remainingDays, remainingDays) || other.remainingDays == remainingDays)&&(identical(other.goal, goal) || other.goal == goal)&&(identical(other.level, level) || other.level == level)&&(identical(other.coach, coach) || other.coach == coach)&&const DeepCollectionEquality().equals(other._tags, _tags)&&(identical(other.schedule, schedule) || other.schedule == schedule)&&const DeepCollectionEquality().equals(other._planByDay, _planByDay));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,type,status,durationDays,remainingDays,goal,level,coach,const DeepCollectionEquality().hash(_tags),schedule,const DeepCollectionEquality().hash(_planByDay));

@override
String toString() {
  return 'ProgramDetail(id: $id, title: $title, type: $type, status: $status, durationDays: $durationDays, remainingDays: $remainingDays, goal: $goal, level: $level, coach: $coach, tags: $tags, schedule: $schedule, planByDay: $planByDay)';
}


}

/// @nodoc
abstract mixin class _$ProgramDetailCopyWith<$Res> implements $ProgramDetailCopyWith<$Res> {
  factory _$ProgramDetailCopyWith(_ProgramDetail value, $Res Function(_ProgramDetail) _then) = __$ProgramDetailCopyWithImpl;
@override @useResult
$Res call({
 int id, String title, String type, String status, int durationDays, int remainingDays, String goal, String level, String coach, List<String> tags, ProgramSchedule? schedule, Map<String, DayPlan> planByDay
});


@override $ProgramScheduleCopyWith<$Res>? get schedule;

}
/// @nodoc
class __$ProgramDetailCopyWithImpl<$Res>
    implements _$ProgramDetailCopyWith<$Res> {
  __$ProgramDetailCopyWithImpl(this._self, this._then);

  final _ProgramDetail _self;
  final $Res Function(_ProgramDetail) _then;

/// Create a copy of ProgramDetail
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? type = null,Object? status = null,Object? durationDays = null,Object? remainingDays = null,Object? goal = null,Object? level = null,Object? coach = null,Object? tags = null,Object? schedule = freezed,Object? planByDay = null,}) {
  return _then(_ProgramDetail(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,type: null == type ? _self.type : type // ignore: cast_nullable_to_non_nullable
as String,status: null == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String,durationDays: null == durationDays ? _self.durationDays : durationDays // ignore: cast_nullable_to_non_nullable
as int,remainingDays: null == remainingDays ? _self.remainingDays : remainingDays // ignore: cast_nullable_to_non_nullable
as int,goal: null == goal ? _self.goal : goal // ignore: cast_nullable_to_non_nullable
as String,level: null == level ? _self.level : level // ignore: cast_nullable_to_non_nullable
as String,coach: null == coach ? _self.coach : coach // ignore: cast_nullable_to_non_nullable
as String,tags: null == tags ? _self._tags : tags // ignore: cast_nullable_to_non_nullable
as List<String>,schedule: freezed == schedule ? _self.schedule : schedule // ignore: cast_nullable_to_non_nullable
as ProgramSchedule?,planByDay: null == planByDay ? _self._planByDay : planByDay // ignore: cast_nullable_to_non_nullable
as Map<String, DayPlan>,
  ));
}

/// Create a copy of ProgramDetail
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProgramScheduleCopyWith<$Res>? get schedule {
    if (_self.schedule == null) {
    return null;
  }

  return $ProgramScheduleCopyWith<$Res>(_self.schedule!, (value) {
    return _then(_self.copyWith(schedule: value));
  });
}
}


/// @nodoc
mixin _$ProgramSchedule {

 List<String> get weekly; List<String> get restDays;
/// Create a copy of ProgramSchedule
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProgramScheduleCopyWith<ProgramSchedule> get copyWith => _$ProgramScheduleCopyWithImpl<ProgramSchedule>(this as ProgramSchedule, _$identity);

  /// Serializes this ProgramSchedule to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProgramSchedule&&const DeepCollectionEquality().equals(other.weekly, weekly)&&const DeepCollectionEquality().equals(other.restDays, restDays));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(weekly),const DeepCollectionEquality().hash(restDays));

@override
String toString() {
  return 'ProgramSchedule(weekly: $weekly, restDays: $restDays)';
}


}

/// @nodoc
abstract mixin class $ProgramScheduleCopyWith<$Res>  {
  factory $ProgramScheduleCopyWith(ProgramSchedule value, $Res Function(ProgramSchedule) _then) = _$ProgramScheduleCopyWithImpl;
@useResult
$Res call({
 List<String> weekly, List<String> restDays
});




}
/// @nodoc
class _$ProgramScheduleCopyWithImpl<$Res>
    implements $ProgramScheduleCopyWith<$Res> {
  _$ProgramScheduleCopyWithImpl(this._self, this._then);

  final ProgramSchedule _self;
  final $Res Function(ProgramSchedule) _then;

/// Create a copy of ProgramSchedule
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? weekly = null,Object? restDays = null,}) {
  return _then(_self.copyWith(
weekly: null == weekly ? _self.weekly : weekly // ignore: cast_nullable_to_non_nullable
as List<String>,restDays: null == restDays ? _self.restDays : restDays // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [ProgramSchedule].
extension ProgramSchedulePatterns on ProgramSchedule {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProgramSchedule value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProgramSchedule() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProgramSchedule value)  $default,){
final _that = this;
switch (_that) {
case _ProgramSchedule():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProgramSchedule value)?  $default,){
final _that = this;
switch (_that) {
case _ProgramSchedule() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<String> weekly,  List<String> restDays)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProgramSchedule() when $default != null:
return $default(_that.weekly,_that.restDays);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<String> weekly,  List<String> restDays)  $default,) {final _that = this;
switch (_that) {
case _ProgramSchedule():
return $default(_that.weekly,_that.restDays);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<String> weekly,  List<String> restDays)?  $default,) {final _that = this;
switch (_that) {
case _ProgramSchedule() when $default != null:
return $default(_that.weekly,_that.restDays);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProgramSchedule implements ProgramSchedule {
  const _ProgramSchedule({final  List<String> weekly = const <String>[], final  List<String> restDays = const <String>[]}): _weekly = weekly,_restDays = restDays;
  factory _ProgramSchedule.fromJson(Map<String, dynamic> json) => _$ProgramScheduleFromJson(json);

 final  List<String> _weekly;
@override@JsonKey() List<String> get weekly {
  if (_weekly is EqualUnmodifiableListView) return _weekly;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_weekly);
}

 final  List<String> _restDays;
@override@JsonKey() List<String> get restDays {
  if (_restDays is EqualUnmodifiableListView) return _restDays;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_restDays);
}


/// Create a copy of ProgramSchedule
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProgramScheduleCopyWith<_ProgramSchedule> get copyWith => __$ProgramScheduleCopyWithImpl<_ProgramSchedule>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProgramScheduleToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProgramSchedule&&const DeepCollectionEquality().equals(other._weekly, _weekly)&&const DeepCollectionEquality().equals(other._restDays, _restDays));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_weekly),const DeepCollectionEquality().hash(_restDays));

@override
String toString() {
  return 'ProgramSchedule(weekly: $weekly, restDays: $restDays)';
}


}

/// @nodoc
abstract mixin class _$ProgramScheduleCopyWith<$Res> implements $ProgramScheduleCopyWith<$Res> {
  factory _$ProgramScheduleCopyWith(_ProgramSchedule value, $Res Function(_ProgramSchedule) _then) = __$ProgramScheduleCopyWithImpl;
@override @useResult
$Res call({
 List<String> weekly, List<String> restDays
});




}
/// @nodoc
class __$ProgramScheduleCopyWithImpl<$Res>
    implements _$ProgramScheduleCopyWith<$Res> {
  __$ProgramScheduleCopyWithImpl(this._self, this._then);

  final _ProgramSchedule _self;
  final $Res Function(_ProgramSchedule) _then;

/// Create a copy of ProgramSchedule
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? weekly = null,Object? restDays = null,}) {
  return _then(_ProgramSchedule(
weekly: null == weekly ? _self._weekly : weekly // ignore: cast_nullable_to_non_nullable
as List<String>,restDays: null == restDays ? _self._restDays : restDays // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}


/// @nodoc
mixin _$DayPlan {

 WorkoutPlan? get workout; NutritionPlan? get nutrition;
/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DayPlanCopyWith<DayPlan> get copyWith => _$DayPlanCopyWithImpl<DayPlan>(this as DayPlan, _$identity);

  /// Serializes this DayPlan to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DayPlan&&(identical(other.workout, workout) || other.workout == workout)&&(identical(other.nutrition, nutrition) || other.nutrition == nutrition));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,workout,nutrition);

@override
String toString() {
  return 'DayPlan(workout: $workout, nutrition: $nutrition)';
}


}

/// @nodoc
abstract mixin class $DayPlanCopyWith<$Res>  {
  factory $DayPlanCopyWith(DayPlan value, $Res Function(DayPlan) _then) = _$DayPlanCopyWithImpl;
@useResult
$Res call({
 WorkoutPlan? workout, NutritionPlan? nutrition
});


$WorkoutPlanCopyWith<$Res>? get workout;$NutritionPlanCopyWith<$Res>? get nutrition;

}
/// @nodoc
class _$DayPlanCopyWithImpl<$Res>
    implements $DayPlanCopyWith<$Res> {
  _$DayPlanCopyWithImpl(this._self, this._then);

  final DayPlan _self;
  final $Res Function(DayPlan) _then;

/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? workout = freezed,Object? nutrition = freezed,}) {
  return _then(_self.copyWith(
workout: freezed == workout ? _self.workout : workout // ignore: cast_nullable_to_non_nullable
as WorkoutPlan?,nutrition: freezed == nutrition ? _self.nutrition : nutrition // ignore: cast_nullable_to_non_nullable
as NutritionPlan?,
  ));
}
/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WorkoutPlanCopyWith<$Res>? get workout {
    if (_self.workout == null) {
    return null;
  }

  return $WorkoutPlanCopyWith<$Res>(_self.workout!, (value) {
    return _then(_self.copyWith(workout: value));
  });
}/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$NutritionPlanCopyWith<$Res>? get nutrition {
    if (_self.nutrition == null) {
    return null;
  }

  return $NutritionPlanCopyWith<$Res>(_self.nutrition!, (value) {
    return _then(_self.copyWith(nutrition: value));
  });
}
}


/// Adds pattern-matching-related methods to [DayPlan].
extension DayPlanPatterns on DayPlan {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DayPlan value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DayPlan() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DayPlan value)  $default,){
final _that = this;
switch (_that) {
case _DayPlan():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DayPlan value)?  $default,){
final _that = this;
switch (_that) {
case _DayPlan() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( WorkoutPlan? workout,  NutritionPlan? nutrition)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DayPlan() when $default != null:
return $default(_that.workout,_that.nutrition);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( WorkoutPlan? workout,  NutritionPlan? nutrition)  $default,) {final _that = this;
switch (_that) {
case _DayPlan():
return $default(_that.workout,_that.nutrition);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( WorkoutPlan? workout,  NutritionPlan? nutrition)?  $default,) {final _that = this;
switch (_that) {
case _DayPlan() when $default != null:
return $default(_that.workout,_that.nutrition);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DayPlan implements DayPlan {
  const _DayPlan({this.workout, this.nutrition});
  factory _DayPlan.fromJson(Map<String, dynamic> json) => _$DayPlanFromJson(json);

@override final  WorkoutPlan? workout;
@override final  NutritionPlan? nutrition;

/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DayPlanCopyWith<_DayPlan> get copyWith => __$DayPlanCopyWithImpl<_DayPlan>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DayPlanToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DayPlan&&(identical(other.workout, workout) || other.workout == workout)&&(identical(other.nutrition, nutrition) || other.nutrition == nutrition));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,workout,nutrition);

@override
String toString() {
  return 'DayPlan(workout: $workout, nutrition: $nutrition)';
}


}

/// @nodoc
abstract mixin class _$DayPlanCopyWith<$Res> implements $DayPlanCopyWith<$Res> {
  factory _$DayPlanCopyWith(_DayPlan value, $Res Function(_DayPlan) _then) = __$DayPlanCopyWithImpl;
@override @useResult
$Res call({
 WorkoutPlan? workout, NutritionPlan? nutrition
});


@override $WorkoutPlanCopyWith<$Res>? get workout;@override $NutritionPlanCopyWith<$Res>? get nutrition;

}
/// @nodoc
class __$DayPlanCopyWithImpl<$Res>
    implements _$DayPlanCopyWith<$Res> {
  __$DayPlanCopyWithImpl(this._self, this._then);

  final _DayPlan _self;
  final $Res Function(_DayPlan) _then;

/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? workout = freezed,Object? nutrition = freezed,}) {
  return _then(_DayPlan(
workout: freezed == workout ? _self.workout : workout // ignore: cast_nullable_to_non_nullable
as WorkoutPlan?,nutrition: freezed == nutrition ? _self.nutrition : nutrition // ignore: cast_nullable_to_non_nullable
as NutritionPlan?,
  ));
}

/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$WorkoutPlanCopyWith<$Res>? get workout {
    if (_self.workout == null) {
    return null;
  }

  return $WorkoutPlanCopyWith<$Res>(_self.workout!, (value) {
    return _then(_self.copyWith(workout: value));
  });
}/// Create a copy of DayPlan
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$NutritionPlanCopyWith<$Res>? get nutrition {
    if (_self.nutrition == null) {
    return null;
  }

  return $NutritionPlanCopyWith<$Res>(_self.nutrition!, (value) {
    return _then(_self.copyWith(nutrition: value));
  });
}
}


/// @nodoc
mixin _$WorkoutPlan {

 String get title; int get durationMin; int get calories; List<String> get steps; List<WorkoutExercise> get exercises;
/// Create a copy of WorkoutPlan
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WorkoutPlanCopyWith<WorkoutPlan> get copyWith => _$WorkoutPlanCopyWithImpl<WorkoutPlan>(this as WorkoutPlan, _$identity);

  /// Serializes this WorkoutPlan to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WorkoutPlan&&(identical(other.title, title) || other.title == title)&&(identical(other.durationMin, durationMin) || other.durationMin == durationMin)&&(identical(other.calories, calories) || other.calories == calories)&&const DeepCollectionEquality().equals(other.steps, steps)&&const DeepCollectionEquality().equals(other.exercises, exercises));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,title,durationMin,calories,const DeepCollectionEquality().hash(steps),const DeepCollectionEquality().hash(exercises));

@override
String toString() {
  return 'WorkoutPlan(title: $title, durationMin: $durationMin, calories: $calories, steps: $steps, exercises: $exercises)';
}


}

/// @nodoc
abstract mixin class $WorkoutPlanCopyWith<$Res>  {
  factory $WorkoutPlanCopyWith(WorkoutPlan value, $Res Function(WorkoutPlan) _then) = _$WorkoutPlanCopyWithImpl;
@useResult
$Res call({
 String title, int durationMin, int calories, List<String> steps, List<WorkoutExercise> exercises
});




}
/// @nodoc
class _$WorkoutPlanCopyWithImpl<$Res>
    implements $WorkoutPlanCopyWith<$Res> {
  _$WorkoutPlanCopyWithImpl(this._self, this._then);

  final WorkoutPlan _self;
  final $Res Function(WorkoutPlan) _then;

/// Create a copy of WorkoutPlan
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? durationMin = null,Object? calories = null,Object? steps = null,Object? exercises = null,}) {
  return _then(_self.copyWith(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,durationMin: null == durationMin ? _self.durationMin : durationMin // ignore: cast_nullable_to_non_nullable
as int,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as int,steps: null == steps ? _self.steps : steps // ignore: cast_nullable_to_non_nullable
as List<String>,exercises: null == exercises ? _self.exercises : exercises // ignore: cast_nullable_to_non_nullable
as List<WorkoutExercise>,
  ));
}

}


/// Adds pattern-matching-related methods to [WorkoutPlan].
extension WorkoutPlanPatterns on WorkoutPlan {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WorkoutPlan value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WorkoutPlan() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WorkoutPlan value)  $default,){
final _that = this;
switch (_that) {
case _WorkoutPlan():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WorkoutPlan value)?  $default,){
final _that = this;
switch (_that) {
case _WorkoutPlan() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  int durationMin,  int calories,  List<String> steps,  List<WorkoutExercise> exercises)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WorkoutPlan() when $default != null:
return $default(_that.title,_that.durationMin,_that.calories,_that.steps,_that.exercises);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  int durationMin,  int calories,  List<String> steps,  List<WorkoutExercise> exercises)  $default,) {final _that = this;
switch (_that) {
case _WorkoutPlan():
return $default(_that.title,_that.durationMin,_that.calories,_that.steps,_that.exercises);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  int durationMin,  int calories,  List<String> steps,  List<WorkoutExercise> exercises)?  $default,) {final _that = this;
switch (_that) {
case _WorkoutPlan() when $default != null:
return $default(_that.title,_that.durationMin,_that.calories,_that.steps,_that.exercises);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _WorkoutPlan implements WorkoutPlan {
  const _WorkoutPlan({this.title = '', this.durationMin = 0, this.calories = 0, final  List<String> steps = const <String>[], final  List<WorkoutExercise> exercises = const <WorkoutExercise>[]}): _steps = steps,_exercises = exercises;
  factory _WorkoutPlan.fromJson(Map<String, dynamic> json) => _$WorkoutPlanFromJson(json);

@override@JsonKey() final  String title;
@override@JsonKey() final  int durationMin;
@override@JsonKey() final  int calories;
 final  List<String> _steps;
@override@JsonKey() List<String> get steps {
  if (_steps is EqualUnmodifiableListView) return _steps;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_steps);
}

 final  List<WorkoutExercise> _exercises;
@override@JsonKey() List<WorkoutExercise> get exercises {
  if (_exercises is EqualUnmodifiableListView) return _exercises;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_exercises);
}


/// Create a copy of WorkoutPlan
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WorkoutPlanCopyWith<_WorkoutPlan> get copyWith => __$WorkoutPlanCopyWithImpl<_WorkoutPlan>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$WorkoutPlanToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _WorkoutPlan&&(identical(other.title, title) || other.title == title)&&(identical(other.durationMin, durationMin) || other.durationMin == durationMin)&&(identical(other.calories, calories) || other.calories == calories)&&const DeepCollectionEquality().equals(other._steps, _steps)&&const DeepCollectionEquality().equals(other._exercises, _exercises));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,title,durationMin,calories,const DeepCollectionEquality().hash(_steps),const DeepCollectionEquality().hash(_exercises));

@override
String toString() {
  return 'WorkoutPlan(title: $title, durationMin: $durationMin, calories: $calories, steps: $steps, exercises: $exercises)';
}


}

/// @nodoc
abstract mixin class _$WorkoutPlanCopyWith<$Res> implements $WorkoutPlanCopyWith<$Res> {
  factory _$WorkoutPlanCopyWith(_WorkoutPlan value, $Res Function(_WorkoutPlan) _then) = __$WorkoutPlanCopyWithImpl;
@override @useResult
$Res call({
 String title, int durationMin, int calories, List<String> steps, List<WorkoutExercise> exercises
});




}
/// @nodoc
class __$WorkoutPlanCopyWithImpl<$Res>
    implements _$WorkoutPlanCopyWith<$Res> {
  __$WorkoutPlanCopyWithImpl(this._self, this._then);

  final _WorkoutPlan _self;
  final $Res Function(_WorkoutPlan) _then;

/// Create a copy of WorkoutPlan
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? durationMin = null,Object? calories = null,Object? steps = null,Object? exercises = null,}) {
  return _then(_WorkoutPlan(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,durationMin: null == durationMin ? _self.durationMin : durationMin // ignore: cast_nullable_to_non_nullable
as int,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as int,steps: null == steps ? _self._steps : steps // ignore: cast_nullable_to_non_nullable
as List<String>,exercises: null == exercises ? _self._exercises : exercises // ignore: cast_nullable_to_non_nullable
as List<WorkoutExercise>,
  ));
}


}


/// @nodoc
mixin _$WorkoutExercise {

 String get name; int get sets; String get reps; String get imageUrl; String get target;
/// Create a copy of WorkoutExercise
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WorkoutExerciseCopyWith<WorkoutExercise> get copyWith => _$WorkoutExerciseCopyWithImpl<WorkoutExercise>(this as WorkoutExercise, _$identity);

  /// Serializes this WorkoutExercise to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WorkoutExercise&&(identical(other.name, name) || other.name == name)&&(identical(other.sets, sets) || other.sets == sets)&&(identical(other.reps, reps) || other.reps == reps)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&(identical(other.target, target) || other.target == target));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,sets,reps,imageUrl,target);

@override
String toString() {
  return 'WorkoutExercise(name: $name, sets: $sets, reps: $reps, imageUrl: $imageUrl, target: $target)';
}


}

/// @nodoc
abstract mixin class $WorkoutExerciseCopyWith<$Res>  {
  factory $WorkoutExerciseCopyWith(WorkoutExercise value, $Res Function(WorkoutExercise) _then) = _$WorkoutExerciseCopyWithImpl;
@useResult
$Res call({
 String name, int sets, String reps, String imageUrl, String target
});




}
/// @nodoc
class _$WorkoutExerciseCopyWithImpl<$Res>
    implements $WorkoutExerciseCopyWith<$Res> {
  _$WorkoutExerciseCopyWithImpl(this._self, this._then);

  final WorkoutExercise _self;
  final $Res Function(WorkoutExercise) _then;

/// Create a copy of WorkoutExercise
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? sets = null,Object? reps = null,Object? imageUrl = null,Object? target = null,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,sets: null == sets ? _self.sets : sets // ignore: cast_nullable_to_non_nullable
as int,reps: null == reps ? _self.reps : reps // ignore: cast_nullable_to_non_nullable
as String,imageUrl: null == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String,target: null == target ? _self.target : target // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [WorkoutExercise].
extension WorkoutExercisePatterns on WorkoutExercise {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WorkoutExercise value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WorkoutExercise() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WorkoutExercise value)  $default,){
final _that = this;
switch (_that) {
case _WorkoutExercise():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WorkoutExercise value)?  $default,){
final _that = this;
switch (_that) {
case _WorkoutExercise() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name,  int sets,  String reps,  String imageUrl,  String target)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WorkoutExercise() when $default != null:
return $default(_that.name,_that.sets,_that.reps,_that.imageUrl,_that.target);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name,  int sets,  String reps,  String imageUrl,  String target)  $default,) {final _that = this;
switch (_that) {
case _WorkoutExercise():
return $default(_that.name,_that.sets,_that.reps,_that.imageUrl,_that.target);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name,  int sets,  String reps,  String imageUrl,  String target)?  $default,) {final _that = this;
switch (_that) {
case _WorkoutExercise() when $default != null:
return $default(_that.name,_that.sets,_that.reps,_that.imageUrl,_that.target);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _WorkoutExercise implements WorkoutExercise {
  const _WorkoutExercise({this.name = '', this.sets = 0, this.reps = '', this.imageUrl = '', this.target = ''});
  factory _WorkoutExercise.fromJson(Map<String, dynamic> json) => _$WorkoutExerciseFromJson(json);

@override@JsonKey() final  String name;
@override@JsonKey() final  int sets;
@override@JsonKey() final  String reps;
@override@JsonKey() final  String imageUrl;
@override@JsonKey() final  String target;

/// Create a copy of WorkoutExercise
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WorkoutExerciseCopyWith<_WorkoutExercise> get copyWith => __$WorkoutExerciseCopyWithImpl<_WorkoutExercise>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$WorkoutExerciseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _WorkoutExercise&&(identical(other.name, name) || other.name == name)&&(identical(other.sets, sets) || other.sets == sets)&&(identical(other.reps, reps) || other.reps == reps)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&(identical(other.target, target) || other.target == target));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,sets,reps,imageUrl,target);

@override
String toString() {
  return 'WorkoutExercise(name: $name, sets: $sets, reps: $reps, imageUrl: $imageUrl, target: $target)';
}


}

/// @nodoc
abstract mixin class _$WorkoutExerciseCopyWith<$Res> implements $WorkoutExerciseCopyWith<$Res> {
  factory _$WorkoutExerciseCopyWith(_WorkoutExercise value, $Res Function(_WorkoutExercise) _then) = __$WorkoutExerciseCopyWithImpl;
@override @useResult
$Res call({
 String name, int sets, String reps, String imageUrl, String target
});




}
/// @nodoc
class __$WorkoutExerciseCopyWithImpl<$Res>
    implements _$WorkoutExerciseCopyWith<$Res> {
  __$WorkoutExerciseCopyWithImpl(this._self, this._then);

  final _WorkoutExercise _self;
  final $Res Function(_WorkoutExercise) _then;

/// Create a copy of WorkoutExercise
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? sets = null,Object? reps = null,Object? imageUrl = null,Object? target = null,}) {
  return _then(_WorkoutExercise(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,sets: null == sets ? _self.sets : sets // ignore: cast_nullable_to_non_nullable
as int,reps: null == reps ? _self.reps : reps // ignore: cast_nullable_to_non_nullable
as String,imageUrl: null == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String,target: null == target ? _self.target : target // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$NutritionPlan {

 int get caloriesTarget; String get proteinTarget; List<NutritionMeal> get meals;
/// Create a copy of NutritionPlan
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NutritionPlanCopyWith<NutritionPlan> get copyWith => _$NutritionPlanCopyWithImpl<NutritionPlan>(this as NutritionPlan, _$identity);

  /// Serializes this NutritionPlan to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is NutritionPlan&&(identical(other.caloriesTarget, caloriesTarget) || other.caloriesTarget == caloriesTarget)&&(identical(other.proteinTarget, proteinTarget) || other.proteinTarget == proteinTarget)&&const DeepCollectionEquality().equals(other.meals, meals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,caloriesTarget,proteinTarget,const DeepCollectionEquality().hash(meals));

@override
String toString() {
  return 'NutritionPlan(caloriesTarget: $caloriesTarget, proteinTarget: $proteinTarget, meals: $meals)';
}


}

/// @nodoc
abstract mixin class $NutritionPlanCopyWith<$Res>  {
  factory $NutritionPlanCopyWith(NutritionPlan value, $Res Function(NutritionPlan) _then) = _$NutritionPlanCopyWithImpl;
@useResult
$Res call({
 int caloriesTarget, String proteinTarget, List<NutritionMeal> meals
});




}
/// @nodoc
class _$NutritionPlanCopyWithImpl<$Res>
    implements $NutritionPlanCopyWith<$Res> {
  _$NutritionPlanCopyWithImpl(this._self, this._then);

  final NutritionPlan _self;
  final $Res Function(NutritionPlan) _then;

/// Create a copy of NutritionPlan
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? caloriesTarget = null,Object? proteinTarget = null,Object? meals = null,}) {
  return _then(_self.copyWith(
caloriesTarget: null == caloriesTarget ? _self.caloriesTarget : caloriesTarget // ignore: cast_nullable_to_non_nullable
as int,proteinTarget: null == proteinTarget ? _self.proteinTarget : proteinTarget // ignore: cast_nullable_to_non_nullable
as String,meals: null == meals ? _self.meals : meals // ignore: cast_nullable_to_non_nullable
as List<NutritionMeal>,
  ));
}

}


/// Adds pattern-matching-related methods to [NutritionPlan].
extension NutritionPlanPatterns on NutritionPlan {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _NutritionPlan value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _NutritionPlan() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _NutritionPlan value)  $default,){
final _that = this;
switch (_that) {
case _NutritionPlan():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _NutritionPlan value)?  $default,){
final _that = this;
switch (_that) {
case _NutritionPlan() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int caloriesTarget,  String proteinTarget,  List<NutritionMeal> meals)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _NutritionPlan() when $default != null:
return $default(_that.caloriesTarget,_that.proteinTarget,_that.meals);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int caloriesTarget,  String proteinTarget,  List<NutritionMeal> meals)  $default,) {final _that = this;
switch (_that) {
case _NutritionPlan():
return $default(_that.caloriesTarget,_that.proteinTarget,_that.meals);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int caloriesTarget,  String proteinTarget,  List<NutritionMeal> meals)?  $default,) {final _that = this;
switch (_that) {
case _NutritionPlan() when $default != null:
return $default(_that.caloriesTarget,_that.proteinTarget,_that.meals);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _NutritionPlan implements NutritionPlan {
  const _NutritionPlan({this.caloriesTarget = 0, this.proteinTarget = '', final  List<NutritionMeal> meals = const <NutritionMeal>[]}): _meals = meals;
  factory _NutritionPlan.fromJson(Map<String, dynamic> json) => _$NutritionPlanFromJson(json);

@override@JsonKey() final  int caloriesTarget;
@override@JsonKey() final  String proteinTarget;
 final  List<NutritionMeal> _meals;
@override@JsonKey() List<NutritionMeal> get meals {
  if (_meals is EqualUnmodifiableListView) return _meals;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_meals);
}


/// Create a copy of NutritionPlan
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NutritionPlanCopyWith<_NutritionPlan> get copyWith => __$NutritionPlanCopyWithImpl<_NutritionPlan>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NutritionPlanToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _NutritionPlan&&(identical(other.caloriesTarget, caloriesTarget) || other.caloriesTarget == caloriesTarget)&&(identical(other.proteinTarget, proteinTarget) || other.proteinTarget == proteinTarget)&&const DeepCollectionEquality().equals(other._meals, _meals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,caloriesTarget,proteinTarget,const DeepCollectionEquality().hash(_meals));

@override
String toString() {
  return 'NutritionPlan(caloriesTarget: $caloriesTarget, proteinTarget: $proteinTarget, meals: $meals)';
}


}

/// @nodoc
abstract mixin class _$NutritionPlanCopyWith<$Res> implements $NutritionPlanCopyWith<$Res> {
  factory _$NutritionPlanCopyWith(_NutritionPlan value, $Res Function(_NutritionPlan) _then) = __$NutritionPlanCopyWithImpl;
@override @useResult
$Res call({
 int caloriesTarget, String proteinTarget, List<NutritionMeal> meals
});




}
/// @nodoc
class __$NutritionPlanCopyWithImpl<$Res>
    implements _$NutritionPlanCopyWith<$Res> {
  __$NutritionPlanCopyWithImpl(this._self, this._then);

  final _NutritionPlan _self;
  final $Res Function(_NutritionPlan) _then;

/// Create a copy of NutritionPlan
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? caloriesTarget = null,Object? proteinTarget = null,Object? meals = null,}) {
  return _then(_NutritionPlan(
caloriesTarget: null == caloriesTarget ? _self.caloriesTarget : caloriesTarget // ignore: cast_nullable_to_non_nullable
as int,proteinTarget: null == proteinTarget ? _self.proteinTarget : proteinTarget // ignore: cast_nullable_to_non_nullable
as String,meals: null == meals ? _self._meals : meals // ignore: cast_nullable_to_non_nullable
as List<NutritionMeal>,
  ));
}


}


/// @nodoc
mixin _$NutritionMeal {

 String get title; String get detail; double get calories; double get protein;
/// Create a copy of NutritionMeal
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NutritionMealCopyWith<NutritionMeal> get copyWith => _$NutritionMealCopyWithImpl<NutritionMeal>(this as NutritionMeal, _$identity);

  /// Serializes this NutritionMeal to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is NutritionMeal&&(identical(other.title, title) || other.title == title)&&(identical(other.detail, detail) || other.detail == detail)&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.protein, protein) || other.protein == protein));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,title,detail,calories,protein);

@override
String toString() {
  return 'NutritionMeal(title: $title, detail: $detail, calories: $calories, protein: $protein)';
}


}

/// @nodoc
abstract mixin class $NutritionMealCopyWith<$Res>  {
  factory $NutritionMealCopyWith(NutritionMeal value, $Res Function(NutritionMeal) _then) = _$NutritionMealCopyWithImpl;
@useResult
$Res call({
 String title, String detail, double calories, double protein
});




}
/// @nodoc
class _$NutritionMealCopyWithImpl<$Res>
    implements $NutritionMealCopyWith<$Res> {
  _$NutritionMealCopyWithImpl(this._self, this._then);

  final NutritionMeal _self;
  final $Res Function(NutritionMeal) _then;

/// Create a copy of NutritionMeal
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? detail = null,Object? calories = null,Object? protein = null,}) {
  return _then(_self.copyWith(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,detail: null == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [NutritionMeal].
extension NutritionMealPatterns on NutritionMeal {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _NutritionMeal value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _NutritionMeal() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _NutritionMeal value)  $default,){
final _that = this;
switch (_that) {
case _NutritionMeal():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _NutritionMeal value)?  $default,){
final _that = this;
switch (_that) {
case _NutritionMeal() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  String detail,  double calories,  double protein)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _NutritionMeal() when $default != null:
return $default(_that.title,_that.detail,_that.calories,_that.protein);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  String detail,  double calories,  double protein)  $default,) {final _that = this;
switch (_that) {
case _NutritionMeal():
return $default(_that.title,_that.detail,_that.calories,_that.protein);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  String detail,  double calories,  double protein)?  $default,) {final _that = this;
switch (_that) {
case _NutritionMeal() when $default != null:
return $default(_that.title,_that.detail,_that.calories,_that.protein);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _NutritionMeal implements NutritionMeal {
  const _NutritionMeal({this.title = '', this.detail = '', this.calories = 0, this.protein = 0});
  factory _NutritionMeal.fromJson(Map<String, dynamic> json) => _$NutritionMealFromJson(json);

@override@JsonKey() final  String title;
@override@JsonKey() final  String detail;
@override@JsonKey() final  double calories;
@override@JsonKey() final  double protein;

/// Create a copy of NutritionMeal
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NutritionMealCopyWith<_NutritionMeal> get copyWith => __$NutritionMealCopyWithImpl<_NutritionMeal>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NutritionMealToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _NutritionMeal&&(identical(other.title, title) || other.title == title)&&(identical(other.detail, detail) || other.detail == detail)&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.protein, protein) || other.protein == protein));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,title,detail,calories,protein);

@override
String toString() {
  return 'NutritionMeal(title: $title, detail: $detail, calories: $calories, protein: $protein)';
}


}

/// @nodoc
abstract mixin class _$NutritionMealCopyWith<$Res> implements $NutritionMealCopyWith<$Res> {
  factory _$NutritionMealCopyWith(_NutritionMeal value, $Res Function(_NutritionMeal) _then) = __$NutritionMealCopyWithImpl;
@override @useResult
$Res call({
 String title, String detail, double calories, double protein
});




}
/// @nodoc
class __$NutritionMealCopyWithImpl<$Res>
    implements _$NutritionMealCopyWith<$Res> {
  __$NutritionMealCopyWithImpl(this._self, this._then);

  final _NutritionMeal _self;
  final $Res Function(_NutritionMeal) _then;

/// Create a copy of NutritionMeal
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? detail = null,Object? calories = null,Object? protein = null,}) {
  return _then(_NutritionMeal(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,detail: null == detail ? _self.detail : detail // ignore: cast_nullable_to_non_nullable
as String,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}

// dart format on
