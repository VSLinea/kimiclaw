import 'package:freezed_annotation/freezed_annotation.dart';

part 'hello_entity.freezed.dart';
part 'hello_entity.g.dart';

@freezed
class HelloEntity with _$HelloEntity {
  const factory HelloEntity({
    required String id,
    required String name,
    required DateTime createdAt,
    String? createdBy,
    DateTime? updatedAt,
  }) = _HelloEntity;
  
  factory HelloEntity.fromJson(Map<String, dynamic> json) =>
      _$HelloEntityFromJson(json);
}

@freezed
class CreateHelloEntityRequest with _$CreateHelloEntityRequest {
  const factory CreateHelloEntityRequest({
    required String name,
  }) = _CreateHelloEntityRequest;
  
  factory CreateHelloEntityRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateHelloEntityRequestFromJson(json);
}
