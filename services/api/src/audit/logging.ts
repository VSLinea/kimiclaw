import { FastifyRequest } from 'fastify';
import { createAuditLog, AuditLogInput } from './service';

export interface AuditContext {
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export async function logAuditEvent(
  request: FastifyRequest,
  context: AuditContext
): Promise<void> {
  const input: AuditLogInput = {
    userId: request.user?.id,
    action: context.action,
    entityType: context.entityType,
    entityId: context.entityId,
    oldData: context.oldData,
    newData: context.newData,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };

  try {
    await createAuditLog(input);
  } catch (error) {
    // Log error but don't fail the request
    request.log.error('Failed to create audit log:', error);
  }
}

// Helper for CRUD operations
export async function logCreate(
  request: FastifyRequest,
  entityType: string,
  entityId: string,
  newData: Record<string, unknown>
): Promise<void> {
  await logAuditEvent(request, {
    action: 'CREATE',
    entityType,
    entityId,
    newData,
  });
}

export async function logUpdate(
  request: FastifyRequest,
  entityType: string,
  entityId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>
): Promise<void> {
  await logAuditEvent(request, {
    action: 'UPDATE',
    entityType,
    entityId,
    oldData,
    newData,
  });
}

export async function logDelete(
  request: FastifyRequest,
  entityType: string,
  entityId: string,
  oldData: Record<string, unknown> | null
): Promise<void> {
  await logAuditEvent(request, {
    action: 'DELETE',
    entityType,
    entityId,
    oldData,
  });
}

export async function logRead(
  request: FastifyRequest,
  entityType: string,
  entityId?: string
): Promise<void> {
  await logAuditEvent(request, {
    action: 'READ',
    entityType,
    entityId,
  });
}
