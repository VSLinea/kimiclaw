import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../domain/models/auth_state.dart';
import '../data/auth_repository.dart';

part 'auth_provider.g.dart';

@riverpod
class Auth extends _$Auth {
  @override
  Future<AuthState> build() async {
    // Check for existing session
    final repository = ref.read(authRepositoryProvider);
    return repository.getCurrentUser();
  }
  
  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    
    try {
      final repository = ref.read(authRepositoryProvider);
      final authState = await repository.signIn(email, password);
      state = AsyncValue.data(authState);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }
  
  Future<void> signOut() async {
    state = const AsyncValue.loading();
    
    try {
      final repository = ref.read(authRepositoryProvider);
      await repository.signOut();
      state = const AsyncValue.data(AuthState());
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }
  
  Future<void> checkAuthStatus() async {
    final repository = ref.read(authRepositoryProvider);
    final authState = await repository.getCurrentUser();
    state = AsyncValue.data(authState);
  }
}

// Convenience provider for auth state
final authProvider = authProvider;
