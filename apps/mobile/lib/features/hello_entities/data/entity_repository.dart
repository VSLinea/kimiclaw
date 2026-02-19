import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/models/hello_entity.dart';
import '../datasources/entity_remote_datasource.dart';

final entityRepositoryProvider = Provider<EntityRepository>((ref) {
  return EntityRepository(
    ref.read(entityRemoteDataSourceProvider),
  );
});

class EntityRepository {
  final EntityRemoteDataSource _remoteDataSource;
  
  EntityRepository(this._remoteDataSource);
  
  Future<List<HelloEntity>> getEntities() async {
    return _remoteDataSource.getEntities();
  }
  
  Future<HelloEntity> getEntity(String id) async {
    return _remoteDataSource.getEntity(id);
  }
  
  Future<HelloEntity> createEntity(CreateHelloEntityRequest request) async {
    return _remoteDataSource.createEntity(request);
  }
  
  Future<HelloEntity> updateEntity(String id, CreateHelloEntityRequest request) async {
    return _remoteDataSource.updateEntity(id, request);
  }
  
  Future<void> deleteEntity(String id) async {
    return _remoteDataSource.deleteEntity(id);
  }
}
