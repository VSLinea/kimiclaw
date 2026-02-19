import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../domain/models/hello_entity.dart';

final entityRemoteDataSourceProvider = Provider<EntityRemoteDataSource>((ref) {
  return EntityRemoteDataSource(ref.read(apiClientProvider));
});

class EntityRemoteDataSource {
  final Dio _dio;
  
  EntityRemoteDataSource(this._dio);
  
  Future<List<HelloEntity>> getEntities() async {
    final response = await _dio.get('/hello-entities');
    final List<dynamic> data = response.data['data'] ?? [];
    return data.map((json) => HelloEntity.fromJson(json)).toList();
  }
  
  Future<HelloEntity> getEntity(String id) async {
    final response = await _dio.get('/hello-entities/$id');
    return HelloEntity.fromJson(response.data['data']);
  }
  
  Future<HelloEntity> createEntity(CreateHelloEntityRequest request) async {
    final response = await _dio.post(
      '/hello-entities',
      data: request.toJson(),
    );
    return HelloEntity.fromJson(response.data['data']);
  }
  
  Future<HelloEntity> updateEntity(String id, CreateHelloEntityRequest request) async {
    final response = await _dio.patch(
      '/hello-entities/$id',
      data: request.toJson(),
    );
    return HelloEntity.fromJson(response.data['data']);
  }
  
  Future<void> deleteEntity(String id) async {
    await _dio.delete('/hello-entities/$id');
  }
}
