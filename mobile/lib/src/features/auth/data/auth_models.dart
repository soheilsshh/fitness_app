import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_models.freezed.dart';
part 'auth_models.g.dart';

/// User object returned inside auth responses (`authUserResponse` in the Go API).
@freezed
abstract class AuthUser with _$AuthUser {
  const factory AuthUser({
    required int id,
    @Default('') String name,
    @Default('') String email,
    @Default('') String phone,
    @Default('') String role,
    @JsonKey(name: 'isProfileComplete') @Default(false) bool isProfileComplete,
  }) = _AuthUser;

  factory AuthUser.fromJson(Map<String, dynamic> json) =>
      _$AuthUserFromJson(json);
}

/// Response of register / login / otp-verify (`authResponse`).
@freezed
abstract class AuthResponse with _$AuthResponse {
  const factory AuthResponse({
    required AuthUser user,
    @JsonKey(name: 'access_token') required String accessToken,
    @JsonKey(name: 'refresh_token') @Default('') String refreshToken,
  }) = _AuthResponse;

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
}
