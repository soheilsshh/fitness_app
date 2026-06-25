// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'food_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Food {

 int get id; String get name; String get unit; double get amount; double get calories; double get fat; double get protein; double get carbs;
/// Create a copy of Food
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FoodCopyWith<Food> get copyWith => _$FoodCopyWithImpl<Food>(this as Food, _$identity);

  /// Serializes this Food to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Food&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.unit, unit) || other.unit == unit)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.fat, fat) || other.fat == fat)&&(identical(other.protein, protein) || other.protein == protein)&&(identical(other.carbs, carbs) || other.carbs == carbs));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,unit,amount,calories,fat,protein,carbs);

@override
String toString() {
  return 'Food(id: $id, name: $name, unit: $unit, amount: $amount, calories: $calories, fat: $fat, protein: $protein, carbs: $carbs)';
}


}

/// @nodoc
abstract mixin class $FoodCopyWith<$Res>  {
  factory $FoodCopyWith(Food value, $Res Function(Food) _then) = _$FoodCopyWithImpl;
@useResult
$Res call({
 int id, String name, String unit, double amount, double calories, double fat, double protein, double carbs
});




}
/// @nodoc
class _$FoodCopyWithImpl<$Res>
    implements $FoodCopyWith<$Res> {
  _$FoodCopyWithImpl(this._self, this._then);

  final Food _self;
  final $Res Function(Food) _then;

/// Create a copy of Food
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? unit = null,Object? amount = null,Object? calories = null,Object? fat = null,Object? protein = null,Object? carbs = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,unit: null == unit ? _self.unit : unit // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as double,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,fat: null == fat ? _self.fat : fat // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,carbs: null == carbs ? _self.carbs : carbs // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [Food].
extension FoodPatterns on Food {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Food value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Food() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Food value)  $default,){
final _that = this;
switch (_that) {
case _Food():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Food value)?  $default,){
final _that = this;
switch (_that) {
case _Food() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String name,  String unit,  double amount,  double calories,  double fat,  double protein,  double carbs)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Food() when $default != null:
return $default(_that.id,_that.name,_that.unit,_that.amount,_that.calories,_that.fat,_that.protein,_that.carbs);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String name,  String unit,  double amount,  double calories,  double fat,  double protein,  double carbs)  $default,) {final _that = this;
switch (_that) {
case _Food():
return $default(_that.id,_that.name,_that.unit,_that.amount,_that.calories,_that.fat,_that.protein,_that.carbs);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String name,  String unit,  double amount,  double calories,  double fat,  double protein,  double carbs)?  $default,) {final _that = this;
switch (_that) {
case _Food() when $default != null:
return $default(_that.id,_that.name,_that.unit,_that.amount,_that.calories,_that.fat,_that.protein,_that.carbs);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Food implements Food {
  const _Food({required this.id, this.name = '', this.unit = '', this.amount = 0, this.calories = 0, this.fat = 0, this.protein = 0, this.carbs = 0});
  factory _Food.fromJson(Map<String, dynamic> json) => _$FoodFromJson(json);

@override final  int id;
@override@JsonKey() final  String name;
@override@JsonKey() final  String unit;
@override@JsonKey() final  double amount;
@override@JsonKey() final  double calories;
@override@JsonKey() final  double fat;
@override@JsonKey() final  double protein;
@override@JsonKey() final  double carbs;

/// Create a copy of Food
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FoodCopyWith<_Food> get copyWith => __$FoodCopyWithImpl<_Food>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FoodToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Food&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.unit, unit) || other.unit == unit)&&(identical(other.amount, amount) || other.amount == amount)&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.fat, fat) || other.fat == fat)&&(identical(other.protein, protein) || other.protein == protein)&&(identical(other.carbs, carbs) || other.carbs == carbs));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,unit,amount,calories,fat,protein,carbs);

@override
String toString() {
  return 'Food(id: $id, name: $name, unit: $unit, amount: $amount, calories: $calories, fat: $fat, protein: $protein, carbs: $carbs)';
}


}

/// @nodoc
abstract mixin class _$FoodCopyWith<$Res> implements $FoodCopyWith<$Res> {
  factory _$FoodCopyWith(_Food value, $Res Function(_Food) _then) = __$FoodCopyWithImpl;
@override @useResult
$Res call({
 int id, String name, String unit, double amount, double calories, double fat, double protein, double carbs
});




}
/// @nodoc
class __$FoodCopyWithImpl<$Res>
    implements _$FoodCopyWith<$Res> {
  __$FoodCopyWithImpl(this._self, this._then);

  final _Food _self;
  final $Res Function(_Food) _then;

/// Create a copy of Food
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? unit = null,Object? amount = null,Object? calories = null,Object? fat = null,Object? protein = null,Object? carbs = null,}) {
  return _then(_Food(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,unit: null == unit ? _self.unit : unit // ignore: cast_nullable_to_non_nullable
as String,amount: null == amount ? _self.amount : amount // ignore: cast_nullable_to_non_nullable
as double,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,fat: null == fat ? _self.fat : fat // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,carbs: null == carbs ? _self.carbs : carbs // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$FoodListResponse {

 List<Food> get items; int get total;
/// Create a copy of FoodListResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FoodListResponseCopyWith<FoodListResponse> get copyWith => _$FoodListResponseCopyWithImpl<FoodListResponse>(this as FoodListResponse, _$identity);

  /// Serializes this FoodListResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FoodListResponse&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.total, total) || other.total == total));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(items),total);

@override
String toString() {
  return 'FoodListResponse(items: $items, total: $total)';
}


}

/// @nodoc
abstract mixin class $FoodListResponseCopyWith<$Res>  {
  factory $FoodListResponseCopyWith(FoodListResponse value, $Res Function(FoodListResponse) _then) = _$FoodListResponseCopyWithImpl;
@useResult
$Res call({
 List<Food> items, int total
});




}
/// @nodoc
class _$FoodListResponseCopyWithImpl<$Res>
    implements $FoodListResponseCopyWith<$Res> {
  _$FoodListResponseCopyWithImpl(this._self, this._then);

  final FoodListResponse _self;
  final $Res Function(FoodListResponse) _then;

/// Create a copy of FoodListResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? items = null,Object? total = null,}) {
  return _then(_self.copyWith(
items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<Food>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [FoodListResponse].
extension FoodListResponsePatterns on FoodListResponse {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FoodListResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FoodListResponse() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FoodListResponse value)  $default,){
final _that = this;
switch (_that) {
case _FoodListResponse():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FoodListResponse value)?  $default,){
final _that = this;
switch (_that) {
case _FoodListResponse() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<Food> items,  int total)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FoodListResponse() when $default != null:
return $default(_that.items,_that.total);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<Food> items,  int total)  $default,) {final _that = this;
switch (_that) {
case _FoodListResponse():
return $default(_that.items,_that.total);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<Food> items,  int total)?  $default,) {final _that = this;
switch (_that) {
case _FoodListResponse() when $default != null:
return $default(_that.items,_that.total);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FoodListResponse implements FoodListResponse {
  const _FoodListResponse({final  List<Food> items = const <Food>[], this.total = 0}): _items = items;
  factory _FoodListResponse.fromJson(Map<String, dynamic> json) => _$FoodListResponseFromJson(json);

 final  List<Food> _items;
@override@JsonKey() List<Food> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

@override@JsonKey() final  int total;

/// Create a copy of FoodListResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FoodListResponseCopyWith<_FoodListResponse> get copyWith => __$FoodListResponseCopyWithImpl<_FoodListResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FoodListResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FoodListResponse&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.total, total) || other.total == total));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_items),total);

@override
String toString() {
  return 'FoodListResponse(items: $items, total: $total)';
}


}

/// @nodoc
abstract mixin class _$FoodListResponseCopyWith<$Res> implements $FoodListResponseCopyWith<$Res> {
  factory _$FoodListResponseCopyWith(_FoodListResponse value, $Res Function(_FoodListResponse) _then) = __$FoodListResponseCopyWithImpl;
@override @useResult
$Res call({
 List<Food> items, int total
});




}
/// @nodoc
class __$FoodListResponseCopyWithImpl<$Res>
    implements _$FoodListResponseCopyWith<$Res> {
  __$FoodListResponseCopyWithImpl(this._self, this._then);

  final _FoodListResponse _self;
  final $Res Function(_FoodListResponse) _then;

/// Create a copy of FoodListResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? items = null,Object? total = null,}) {
  return _then(_FoodListResponse(
items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<Food>,total: null == total ? _self.total : total // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$FoodLog {

 int get id; String get logDate; int? get foodId; String get foodName; String get quantity; double get calories; double get protein; double get carbs; double get fat;
/// Create a copy of FoodLog
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FoodLogCopyWith<FoodLog> get copyWith => _$FoodLogCopyWithImpl<FoodLog>(this as FoodLog, _$identity);

  /// Serializes this FoodLog to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FoodLog&&(identical(other.id, id) || other.id == id)&&(identical(other.logDate, logDate) || other.logDate == logDate)&&(identical(other.foodId, foodId) || other.foodId == foodId)&&(identical(other.foodName, foodName) || other.foodName == foodName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.protein, protein) || other.protein == protein)&&(identical(other.carbs, carbs) || other.carbs == carbs)&&(identical(other.fat, fat) || other.fat == fat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,logDate,foodId,foodName,quantity,calories,protein,carbs,fat);

@override
String toString() {
  return 'FoodLog(id: $id, logDate: $logDate, foodId: $foodId, foodName: $foodName, quantity: $quantity, calories: $calories, protein: $protein, carbs: $carbs, fat: $fat)';
}


}

/// @nodoc
abstract mixin class $FoodLogCopyWith<$Res>  {
  factory $FoodLogCopyWith(FoodLog value, $Res Function(FoodLog) _then) = _$FoodLogCopyWithImpl;
@useResult
$Res call({
 int id, String logDate, int? foodId, String foodName, String quantity, double calories, double protein, double carbs, double fat
});




}
/// @nodoc
class _$FoodLogCopyWithImpl<$Res>
    implements $FoodLogCopyWith<$Res> {
  _$FoodLogCopyWithImpl(this._self, this._then);

  final FoodLog _self;
  final $Res Function(FoodLog) _then;

/// Create a copy of FoodLog
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? logDate = null,Object? foodId = freezed,Object? foodName = null,Object? quantity = null,Object? calories = null,Object? protein = null,Object? carbs = null,Object? fat = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,logDate: null == logDate ? _self.logDate : logDate // ignore: cast_nullable_to_non_nullable
as String,foodId: freezed == foodId ? _self.foodId : foodId // ignore: cast_nullable_to_non_nullable
as int?,foodName: null == foodName ? _self.foodName : foodName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as String,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,carbs: null == carbs ? _self.carbs : carbs // ignore: cast_nullable_to_non_nullable
as double,fat: null == fat ? _self.fat : fat // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [FoodLog].
extension FoodLogPatterns on FoodLog {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FoodLog value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FoodLog() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FoodLog value)  $default,){
final _that = this;
switch (_that) {
case _FoodLog():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FoodLog value)?  $default,){
final _that = this;
switch (_that) {
case _FoodLog() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int id,  String logDate,  int? foodId,  String foodName,  String quantity,  double calories,  double protein,  double carbs,  double fat)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FoodLog() when $default != null:
return $default(_that.id,_that.logDate,_that.foodId,_that.foodName,_that.quantity,_that.calories,_that.protein,_that.carbs,_that.fat);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int id,  String logDate,  int? foodId,  String foodName,  String quantity,  double calories,  double protein,  double carbs,  double fat)  $default,) {final _that = this;
switch (_that) {
case _FoodLog():
return $default(_that.id,_that.logDate,_that.foodId,_that.foodName,_that.quantity,_that.calories,_that.protein,_that.carbs,_that.fat);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int id,  String logDate,  int? foodId,  String foodName,  String quantity,  double calories,  double protein,  double carbs,  double fat)?  $default,) {final _that = this;
switch (_that) {
case _FoodLog() when $default != null:
return $default(_that.id,_that.logDate,_that.foodId,_that.foodName,_that.quantity,_that.calories,_that.protein,_that.carbs,_that.fat);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FoodLog implements FoodLog {
  const _FoodLog({required this.id, this.logDate = '', this.foodId, this.foodName = '', this.quantity = '', this.calories = 0, this.protein = 0, this.carbs = 0, this.fat = 0});
  factory _FoodLog.fromJson(Map<String, dynamic> json) => _$FoodLogFromJson(json);

@override final  int id;
@override@JsonKey() final  String logDate;
@override final  int? foodId;
@override@JsonKey() final  String foodName;
@override@JsonKey() final  String quantity;
@override@JsonKey() final  double calories;
@override@JsonKey() final  double protein;
@override@JsonKey() final  double carbs;
@override@JsonKey() final  double fat;

/// Create a copy of FoodLog
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FoodLogCopyWith<_FoodLog> get copyWith => __$FoodLogCopyWithImpl<_FoodLog>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FoodLogToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FoodLog&&(identical(other.id, id) || other.id == id)&&(identical(other.logDate, logDate) || other.logDate == logDate)&&(identical(other.foodId, foodId) || other.foodId == foodId)&&(identical(other.foodName, foodName) || other.foodName == foodName)&&(identical(other.quantity, quantity) || other.quantity == quantity)&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.protein, protein) || other.protein == protein)&&(identical(other.carbs, carbs) || other.carbs == carbs)&&(identical(other.fat, fat) || other.fat == fat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,logDate,foodId,foodName,quantity,calories,protein,carbs,fat);

@override
String toString() {
  return 'FoodLog(id: $id, logDate: $logDate, foodId: $foodId, foodName: $foodName, quantity: $quantity, calories: $calories, protein: $protein, carbs: $carbs, fat: $fat)';
}


}

/// @nodoc
abstract mixin class _$FoodLogCopyWith<$Res> implements $FoodLogCopyWith<$Res> {
  factory _$FoodLogCopyWith(_FoodLog value, $Res Function(_FoodLog) _then) = __$FoodLogCopyWithImpl;
@override @useResult
$Res call({
 int id, String logDate, int? foodId, String foodName, String quantity, double calories, double protein, double carbs, double fat
});




}
/// @nodoc
class __$FoodLogCopyWithImpl<$Res>
    implements _$FoodLogCopyWith<$Res> {
  __$FoodLogCopyWithImpl(this._self, this._then);

  final _FoodLog _self;
  final $Res Function(_FoodLog) _then;

/// Create a copy of FoodLog
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? logDate = null,Object? foodId = freezed,Object? foodName = null,Object? quantity = null,Object? calories = null,Object? protein = null,Object? carbs = null,Object? fat = null,}) {
  return _then(_FoodLog(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,logDate: null == logDate ? _self.logDate : logDate // ignore: cast_nullable_to_non_nullable
as String,foodId: freezed == foodId ? _self.foodId : foodId // ignore: cast_nullable_to_non_nullable
as int?,foodName: null == foodName ? _self.foodName : foodName // ignore: cast_nullable_to_non_nullable
as String,quantity: null == quantity ? _self.quantity : quantity // ignore: cast_nullable_to_non_nullable
as String,calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,carbs: null == carbs ? _self.carbs : carbs // ignore: cast_nullable_to_non_nullable
as double,fat: null == fat ? _self.fat : fat // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$MacroTotals {

 double get calories; double get protein; double get carbs; double get fat;
/// Create a copy of MacroTotals
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MacroTotalsCopyWith<MacroTotals> get copyWith => _$MacroTotalsCopyWithImpl<MacroTotals>(this as MacroTotals, _$identity);

  /// Serializes this MacroTotals to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MacroTotals&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.protein, protein) || other.protein == protein)&&(identical(other.carbs, carbs) || other.carbs == carbs)&&(identical(other.fat, fat) || other.fat == fat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,calories,protein,carbs,fat);

@override
String toString() {
  return 'MacroTotals(calories: $calories, protein: $protein, carbs: $carbs, fat: $fat)';
}


}

/// @nodoc
abstract mixin class $MacroTotalsCopyWith<$Res>  {
  factory $MacroTotalsCopyWith(MacroTotals value, $Res Function(MacroTotals) _then) = _$MacroTotalsCopyWithImpl;
@useResult
$Res call({
 double calories, double protein, double carbs, double fat
});




}
/// @nodoc
class _$MacroTotalsCopyWithImpl<$Res>
    implements $MacroTotalsCopyWith<$Res> {
  _$MacroTotalsCopyWithImpl(this._self, this._then);

  final MacroTotals _self;
  final $Res Function(MacroTotals) _then;

/// Create a copy of MacroTotals
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? calories = null,Object? protein = null,Object? carbs = null,Object? fat = null,}) {
  return _then(_self.copyWith(
calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,carbs: null == carbs ? _self.carbs : carbs // ignore: cast_nullable_to_non_nullable
as double,fat: null == fat ? _self.fat : fat // ignore: cast_nullable_to_non_nullable
as double,
  ));
}

}


/// Adds pattern-matching-related methods to [MacroTotals].
extension MacroTotalsPatterns on MacroTotals {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MacroTotals value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MacroTotals() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MacroTotals value)  $default,){
final _that = this;
switch (_that) {
case _MacroTotals():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MacroTotals value)?  $default,){
final _that = this;
switch (_that) {
case _MacroTotals() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double calories,  double protein,  double carbs,  double fat)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MacroTotals() when $default != null:
return $default(_that.calories,_that.protein,_that.carbs,_that.fat);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double calories,  double protein,  double carbs,  double fat)  $default,) {final _that = this;
switch (_that) {
case _MacroTotals():
return $default(_that.calories,_that.protein,_that.carbs,_that.fat);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double calories,  double protein,  double carbs,  double fat)?  $default,) {final _that = this;
switch (_that) {
case _MacroTotals() when $default != null:
return $default(_that.calories,_that.protein,_that.carbs,_that.fat);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MacroTotals implements MacroTotals {
  const _MacroTotals({this.calories = 0, this.protein = 0, this.carbs = 0, this.fat = 0});
  factory _MacroTotals.fromJson(Map<String, dynamic> json) => _$MacroTotalsFromJson(json);

@override@JsonKey() final  double calories;
@override@JsonKey() final  double protein;
@override@JsonKey() final  double carbs;
@override@JsonKey() final  double fat;

/// Create a copy of MacroTotals
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MacroTotalsCopyWith<_MacroTotals> get copyWith => __$MacroTotalsCopyWithImpl<_MacroTotals>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MacroTotalsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MacroTotals&&(identical(other.calories, calories) || other.calories == calories)&&(identical(other.protein, protein) || other.protein == protein)&&(identical(other.carbs, carbs) || other.carbs == carbs)&&(identical(other.fat, fat) || other.fat == fat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,calories,protein,carbs,fat);

@override
String toString() {
  return 'MacroTotals(calories: $calories, protein: $protein, carbs: $carbs, fat: $fat)';
}


}

/// @nodoc
abstract mixin class _$MacroTotalsCopyWith<$Res> implements $MacroTotalsCopyWith<$Res> {
  factory _$MacroTotalsCopyWith(_MacroTotals value, $Res Function(_MacroTotals) _then) = __$MacroTotalsCopyWithImpl;
@override @useResult
$Res call({
 double calories, double protein, double carbs, double fat
});




}
/// @nodoc
class __$MacroTotalsCopyWithImpl<$Res>
    implements _$MacroTotalsCopyWith<$Res> {
  __$MacroTotalsCopyWithImpl(this._self, this._then);

  final _MacroTotals _self;
  final $Res Function(_MacroTotals) _then;

/// Create a copy of MacroTotals
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? calories = null,Object? protein = null,Object? carbs = null,Object? fat = null,}) {
  return _then(_MacroTotals(
calories: null == calories ? _self.calories : calories // ignore: cast_nullable_to_non_nullable
as double,protein: null == protein ? _self.protein : protein // ignore: cast_nullable_to_non_nullable
as double,carbs: null == carbs ? _self.carbs : carbs // ignore: cast_nullable_to_non_nullable
as double,fat: null == fat ? _self.fat : fat // ignore: cast_nullable_to_non_nullable
as double,
  ));
}


}


/// @nodoc
mixin _$DailyFoodLog {

 String get date; List<FoodLog> get items; MacroTotals get totals;
/// Create a copy of DailyFoodLog
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DailyFoodLogCopyWith<DailyFoodLog> get copyWith => _$DailyFoodLogCopyWithImpl<DailyFoodLog>(this as DailyFoodLog, _$identity);

  /// Serializes this DailyFoodLog to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DailyFoodLog&&(identical(other.date, date) || other.date == date)&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.totals, totals) || other.totals == totals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,const DeepCollectionEquality().hash(items),totals);

@override
String toString() {
  return 'DailyFoodLog(date: $date, items: $items, totals: $totals)';
}


}

/// @nodoc
abstract mixin class $DailyFoodLogCopyWith<$Res>  {
  factory $DailyFoodLogCopyWith(DailyFoodLog value, $Res Function(DailyFoodLog) _then) = _$DailyFoodLogCopyWithImpl;
@useResult
$Res call({
 String date, List<FoodLog> items, MacroTotals totals
});


$MacroTotalsCopyWith<$Res> get totals;

}
/// @nodoc
class _$DailyFoodLogCopyWithImpl<$Res>
    implements $DailyFoodLogCopyWith<$Res> {
  _$DailyFoodLogCopyWithImpl(this._self, this._then);

  final DailyFoodLog _self;
  final $Res Function(DailyFoodLog) _then;

/// Create a copy of DailyFoodLog
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? date = null,Object? items = null,Object? totals = null,}) {
  return _then(_self.copyWith(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<FoodLog>,totals: null == totals ? _self.totals : totals // ignore: cast_nullable_to_non_nullable
as MacroTotals,
  ));
}
/// Create a copy of DailyFoodLog
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MacroTotalsCopyWith<$Res> get totals {
  
  return $MacroTotalsCopyWith<$Res>(_self.totals, (value) {
    return _then(_self.copyWith(totals: value));
  });
}
}


/// Adds pattern-matching-related methods to [DailyFoodLog].
extension DailyFoodLogPatterns on DailyFoodLog {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _DailyFoodLog value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _DailyFoodLog() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _DailyFoodLog value)  $default,){
final _that = this;
switch (_that) {
case _DailyFoodLog():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _DailyFoodLog value)?  $default,){
final _that = this;
switch (_that) {
case _DailyFoodLog() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String date,  List<FoodLog> items,  MacroTotals totals)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _DailyFoodLog() when $default != null:
return $default(_that.date,_that.items,_that.totals);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String date,  List<FoodLog> items,  MacroTotals totals)  $default,) {final _that = this;
switch (_that) {
case _DailyFoodLog():
return $default(_that.date,_that.items,_that.totals);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String date,  List<FoodLog> items,  MacroTotals totals)?  $default,) {final _that = this;
switch (_that) {
case _DailyFoodLog() when $default != null:
return $default(_that.date,_that.items,_that.totals);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _DailyFoodLog implements DailyFoodLog {
  const _DailyFoodLog({this.date = '', final  List<FoodLog> items = const <FoodLog>[], this.totals = const MacroTotals()}): _items = items;
  factory _DailyFoodLog.fromJson(Map<String, dynamic> json) => _$DailyFoodLogFromJson(json);

@override@JsonKey() final  String date;
 final  List<FoodLog> _items;
@override@JsonKey() List<FoodLog> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

@override@JsonKey() final  MacroTotals totals;

/// Create a copy of DailyFoodLog
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DailyFoodLogCopyWith<_DailyFoodLog> get copyWith => __$DailyFoodLogCopyWithImpl<_DailyFoodLog>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DailyFoodLogToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _DailyFoodLog&&(identical(other.date, date) || other.date == date)&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.totals, totals) || other.totals == totals));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,date,const DeepCollectionEquality().hash(_items),totals);

@override
String toString() {
  return 'DailyFoodLog(date: $date, items: $items, totals: $totals)';
}


}

/// @nodoc
abstract mixin class _$DailyFoodLogCopyWith<$Res> implements $DailyFoodLogCopyWith<$Res> {
  factory _$DailyFoodLogCopyWith(_DailyFoodLog value, $Res Function(_DailyFoodLog) _then) = __$DailyFoodLogCopyWithImpl;
@override @useResult
$Res call({
 String date, List<FoodLog> items, MacroTotals totals
});


@override $MacroTotalsCopyWith<$Res> get totals;

}
/// @nodoc
class __$DailyFoodLogCopyWithImpl<$Res>
    implements _$DailyFoodLogCopyWith<$Res> {
  __$DailyFoodLogCopyWithImpl(this._self, this._then);

  final _DailyFoodLog _self;
  final $Res Function(_DailyFoodLog) _then;

/// Create a copy of DailyFoodLog
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? date = null,Object? items = null,Object? totals = null,}) {
  return _then(_DailyFoodLog(
date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<FoodLog>,totals: null == totals ? _self.totals : totals // ignore: cast_nullable_to_non_nullable
as MacroTotals,
  ));
}

/// Create a copy of DailyFoodLog
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$MacroTotalsCopyWith<$Res> get totals {
  
  return $MacroTotalsCopyWith<$Res>(_self.totals, (value) {
    return _then(_self.copyWith(totals: value));
  });
}
}

// dart format on
