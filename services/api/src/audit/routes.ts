import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../auth/middleware';
import { requirePermission } from '../rbac/middleware';
import { getAuditLogs, getEntityAuditLogs, getAuditLogById } from './service';

export async function registerAuditRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /audit-logs - List audit logs (admin only)
  fastify.get(
    '/audit-logs',
    {
      preHandler: [authMiddleware, requirePermission('audit:read')],
      schema: {
        tags: ['Audit'],
        summary: 'List Audit Logs',
        description: 'Get a paginated list of audit logs. Requires audit:read permission.',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 50 },
            userId: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            action: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string', nullable: true },
                    action: { type: 'string' },
                    entityType: { type: 'string' },
                    entityId: { type: 'string', nullable: true },
                    oldData: { type: 'object', nullable: true },
                    newData: { type: 'object', nullable: true },
                    ipAddress: { type: 'string', nullable: true },
                    userAgent: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    user: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        firstName: { type: 'string', nullable: true },
                        lastName: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{
      Querystring: {
        page?: string;
        limit?: string;
        userId?: string;
        entityType?: string;
        entityId?: string;
        action?: string;
      };
    }>, reply: FastifyReply) => {
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
      const offset = (page - 1) * limit;

      const { logs, total } = await getAuditLogs({
        userId: request.query.userId,
        entityType: request.query.entityType,
        entityId: request.query.entityId,
        action: request.query.action,
        limit,
        offset,
      });

      return {
        data: logs,
        pagination: {
          total,
        },
      };
    }
  );

  // GET /audit-logs/:id - Get single audit log
  fastify.get(
    '/audit-logs/:id',
    {
      preHandler: [authMiddleware, requirePermission('audit:read')],
      schema: {
        tags: ['Audit'],
        summary: 'Get Audit Log',
        description: 'Get a single audit log by ID. Requires audit:read permission.',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string', nullable: true },
              action: { type: 'string' },
              entityType: { type: 'string' },
              entityId: { type: 'string', nullable: true },
              oldData: { type: 'object', nullable: true },
              newData: { type: 'object', nullable: true },
              ipAddress: { type: 'string', nullable: true },
              userAgent: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string', nullable: true },
                  lastName: { type: 'string', nullable: true },
                },
              },
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const log = await getAuditLogById(request.params.id);

      if (!log) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Audit log not found',
        });
      }

      return log;
    }
  );

  // GET /audit-logs/entity/:type/:id - Get entity audit history
  fastify.get(
    '/audit-logs/entity/:type/:id',
    {
      preHandler: [authMiddleware, requirePermission('audit:read')],
      schema: {
        tags: ['Audit'],
        summary: 'Get Entity Audit History',
        description: 'Get audit history for a specific entity. Requires audit:read permission.',
        params: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            id: { type: 'string' },
          },
          required: ['type', 'id'],
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string', nullable: true },
                action: { type: 'string' },
                entityType: { type: 'string' },
                entityId: { type: 'string', nullable: true },
                oldData: { type: 'object', nullable: true },
                newData: { type: 'object', nullable: true },
                ipAddress: { type: 'string', nullable: true },
                userAgent: { type: 'string', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                user: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string', nullable: true },
                    lastName: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { type: string; id: string } }>, reply: FastifyReply) => {
      const { type, id } = request.params;
      const logs = await getEntityAuditLogs(type, id);
      return logs;
    }
  );
}
