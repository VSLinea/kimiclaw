import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/entity_repository.dart';
import '../../domain/models/hello_entity.dart';

part 'entity_list_provider.g.dart';

@riverpod
class EntityList extends _$EntityList {
  @override
  Future<List<HelloEntity>> build() async {
    final repository = ref.read(entityRepositoryProvider);
    return repository.getEntities();
  }
  
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(entityRepositoryProvider);
      return repository.getEntities();
    });
  }
  
  Future<void> deleteEntity(String id) async {
    state = const AsyncValue.loading();
    
    try {
      final repository = ref.read(entityRepositoryProvider);
      await repository.deleteEntity(id);
      
      // Refresh the list
      final entities = await repository.getEntities();
      state = AsyncValue.data(entities);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }
}
