import { FastifyInstance, FastifyRequest } from 'fastify';
import { authMiddleware } from '../auth/middleware';
import { requirePermission } from './middleware';
import { assignRoleToUser, removeRoleFromUser, getUserRoles, setUserRoles } from './roles';
import { prisma } from '../prisma/client';

export async function registerRbacRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /roles - List all roles
  fastify.get(
    '/roles',
    {
      preHandler: [authMiddleware, requirePermission('rbac:read')],
      schema: {
        tags: ['RBAC'],
        summary: 'List Roles',
        description: 'Get all available roles. Requires rbac:read permission.',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                permissions: { type: 'array', items: { type: 'string' } },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async () => {
      return prisma.role.findMany();
    }
  );

  // GET /users/:userId/roles - Get user roles
  fastify.get(
    '/users/:userId/roles',
    {
      preHandler: [authMiddleware, requirePermission('rbac:read')],
      schema: {
        tags: ['RBAC'],
        summary: 'Get User Roles',
        description: 'Get roles assigned to a user. Requires rbac:read permission.',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    permissions: { type: 'array', items: { type: 'string' } },
                  },
                },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { userId: string } }>) => {
      return getUserRoles(request.params.userId);
    }
  );

  // POST /users/:userId/roles - Assign role to user
  fastify.post(
    '/users/:userId/roles',
    {
      preHandler: [authMiddleware, requirePermission('rbac:write')],
      schema: {
        tags: ['RBAC'],
        summary: 'Assign Role to User',
        description: 'Assign a role to a user. Requires rbac:write permission.',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        body: {
          type: 'object',
          properties: {
            roleId: { type: 'string' },
          },
          required: ['roleId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              role: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  permissions: { type: 'array', items: { type: 'string' } },
                },
              },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string', nullable: true },
                  lastName: { type: 'string', nullable: true },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{
      Params: { userId: string };
      Body: { roleId: string };
    }>) => {
      return assignRoleToUser({
        userId: request.params.userId,
        roleId: request.body.roleId,
      });
    }
  );

  // DELETE /users/:userId/roles/:roleId - Remove role from user
  fastify.delete(
    '/users/:userId/roles/:roleId',
    {
      preHandler: [authMiddleware, requirePermission('rbac:write')],
      schema: {
        tags: ['RBAC'],
        summary: 'Remove Role from User',
        description: 'Remove a role from a user. Requires rbac:write permission.',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            roleId: { type: 'string' },
          },
          required: ['userId', 'roleId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              role: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  permissions: { type: 'array', items: { type: 'string' } },
                },
              },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string', nullable: true },
                  lastName: { type: 'string', nullable: true },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{
      Params: { userId: string; roleId: string };
    }>, reply: FastifyReply) => {
      const result = await removeRoleFromUser({
        userId: request.params.userId,
        roleId: request.params.roleId,
      });

      if (!result) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Role assignment not found',
        });
      }

      return result;
    }
  );

  // PUT /users/:userId/roles - Set user roles (replace all)
  fastify.put(
    '/users/:userId/roles',
    {
      preHandler: [authMiddleware, requirePermission('rbac:write')],
      schema: {
        tags: ['RBAC'],
        summary: 'Set User Roles',
        description: 'Replace all roles for a user. Requires rbac:write permission.',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        body: {
          type: 'object',
          properties: {
            roleIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['roleIds'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    permissions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{
      Params: { userId: string };
      Body: { roleIds: string[] };
    }>) => {
      return setUserRoles(request.params.userId, request.body.roleIds);
    }
  );
}
