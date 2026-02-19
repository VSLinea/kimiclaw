import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../prisma/client';

export type Permission = string;

export interface RoleWithPermissions {
  id: string;
  name: string;
  permissions: string[];
}

export async function getUserRoles(userId: string): Promise<RoleWithPermissions[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  return userRoles.map((ur) => ({
    id: ur.role.id,
    name: ur.role.name,
    permissions: ur.role.permissions,
  }));
}

export function hasPermission(
  roles: RoleWithPermissions[],
  requiredPermission: Permission
): boolean {
  // Admin with '*' permission has all permissions
  if (roles.some((r) => r.permissions.includes('*'))) {
    return true;
  }

  // Check for specific permission
  return roles.some((r) => r.permissions.includes(requiredPermission));
}

export function hasAnyPermission(
  roles: RoleWithPermissions[],
  requiredPermissions: Permission[]
): boolean {
  if (roles.some((r) => r.permissions.includes('*'))) {
    return true;
  }

  return requiredPermissions.some((perm) =>
    roles.some((r) => r.permissions.includes(perm))
  );
}

export function hasAllPermissions(
  roles: RoleWithPermissions[],
  requiredPermissions: Permission[]
): boolean {
  if (roles.some((r) => r.permissions.includes('*'))) {
    return true;
  }

  return requiredPermissions.every((perm) =>
    roles.some((r) => r.permissions.includes(perm))
  );
}

// Middleware factory for permission checking
export function requirePermission(permission: Permission) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const roles = await getUserRoles(request.user.id);

    if (!hasPermission(roles, permission)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: `Missing required permission: ${permission}`,
      });
      return;
    }

    // Attach roles to request for later use
    (request as FastifyRequest & { roles: RoleWithPermissions[] }).roles = roles;
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const roles = await getUserRoles(request.user.id);

    if (!hasAnyPermission(roles, permissions)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: `Missing required permissions: ${permissions.join(', ')}`,
      });
      return;
    }

    (request as FastifyRequest & { roles: RoleWithPermissions[] }).roles = roles;
  };
}

export function requireAllPermissions(...permissions: Permission[]) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const roles = await getUserRoles(request.user.id);

    if (!hasAllPermissions(roles, permissions)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: `Missing required permissions: ${permissions.join(', ')}`,
      });
      return;
    }

    (request as FastifyRequest & { roles: RoleWithPermissions[] }).roles = roles;
  };
}

// Role-based middleware
export function requireRole(roleName: string) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const roles = await getUserRoles(request.user.id);

    if (!roles.some((r) => r.name === roleName)) {
      reply.status(403).send({
        error: 'Forbidden',
        message: `Required role: ${roleName}`,
      });
      return;
    }

    (request as FastifyRequest & { roles: RoleWithPermissions[] }).roles = roles;
  };
}
