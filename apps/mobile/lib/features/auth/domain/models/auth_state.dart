import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_state.freezed.dart';

@freezed
class AuthState with _$AuthState {
  const factory AuthState({
    @Default(false) bool isAuthenticated,
    String? userId,
    String? email,
    String? displayName,
    String? token,
    String? role,
  }) = _AuthState;
  
  const AuthState._();
  
  bool get isAdmin => role == 'admin';
}
