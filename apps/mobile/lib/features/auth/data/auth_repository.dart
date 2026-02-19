import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../domain/models/auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    const FlutterSecureStorage(),
  );
});

class AuthRepository {
  final FlutterSecureStorage _secureStorage;
  
  static const _tokenKey = 'auth_token';
  static const _userIdKey = 'user_id';
  static const _emailKey = 'email';
  static const _roleKey = 'role';
  
  AuthRepository(this._secureStorage);
  
  Future<AuthState> getCurrentUser() async {
    final token = await _secureStorage.read(key: _tokenKey);
    
    if (token == null) {
      return const AuthState();
    }
    
    final userId = await _secureStorage.read(key: _userIdKey);
    final email = await _secureStorage.read(key: _emailKey);
    final role = await _secureStorage.read(key: _roleKey);
    
    return AuthState(
      isAuthenticated: true,
      userId: userId,
      email: email,
      token: token,
      role: role ?? 'user',
    );
  }
  
  Future<AuthState> signIn(String email, String password) async {
    // TODO: Integrate with Clerk authentication
    // For now, simulate a successful login
    final mockToken = 'mock_jwt_token_${DateTime.now().millisecondsSinceEpoch}';
    final mockUserId = 'user_${DateTime.now().millisecondsSinceEpoch}';
    
    await _secureStorage.write(key: _tokenKey, value: mockToken);
    await _secureStorage.write(key: _userIdKey, value: mockUserId);
    await _secureStorage.write(key: _emailKey, value: email);
    await _secureStorage.write(key: _roleKey, value: 'user');
    
    return AuthState(
      isAuthenticated: true,
      userId: mockUserId,
      email: email,
      token: mockToken,
      role: 'user',
    );
  }
  
  Future<void> signOut() async {
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _userIdKey);
    await _secureStorage.delete(key: _emailKey);
    await _secureStorage.delete(key: _roleKey);
  }
  
  Future<String?> getToken() async {
    return _secureStorage.read(key: _tokenKey);
  }
}
