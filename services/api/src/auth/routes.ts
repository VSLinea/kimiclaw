import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../auth/middleware';
import { handleClerkWebhook } from '../auth/webhook';
import { requirePermission } from '../rbac/middleware';
import { prisma } from '../prisma/client';

export async function registerAuthRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /webhooks/clerk - Clerk webhook handler
  fastify.post(
    '/webhooks/clerk',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Clerk Webhook',
        description: 'Handle Clerk webhooks for user sync.',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    handleClerkWebhook
  );

  // GET /me - Get current user
  fastify.get(
    '/me',
    {
      preHandler: [authMiddleware],
      schema: {
        tags: ['Auth'],
        summary: 'Get Current User',
        description: 'Get the current authenticated user profile.',
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              clerkId: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string', nullable: true },
              lastName: { type: 'string', nullable: true },
              avatarUrl: { type: 'string', nullable: true },
              roles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    permissions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              permissions: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: request.user.clerkId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Aggregate all permissions
      const allPermissions = user.roles.flatMap((ur) => ur.role.permissions);
      const uniquePermissions = [...new Set(allPermissions)];

      return {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        roles: user.roles.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description,
          permissions: ur.role.permissions,
        })),
        permissions: uniquePermissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }
  );
}
