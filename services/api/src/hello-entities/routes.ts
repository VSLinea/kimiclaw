import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authMiddleware } from '../auth/middleware';
import { requirePermission, requireAnyPermission } from '../rbac/middleware';
import { logCreate, logUpdate, logDelete, logRead } from '../audit/logging';

// Validation schemas
const createHelloEntitySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

const updateHelloEntitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  isActive: z.string().optional().transform((v) => v === 'true'),
  search: z.string().optional(),
});

type CreateHelloEntityInput = z.infer<typeof createHelloEntitySchema>;
type UpdateHelloEntityInput = z.infer<typeof updateHelloEntitySchema>;
type QueryParams = z.infer<typeof querySchema>;

export default async function helloEntityRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // GET /hello-entities - List all (users can read)
  fastify.get(
    '/',
    {
      preHandler: [authMiddleware, requireAnyPermission('hello:read', '*')],
      schema: {
        tags: ['Hello Entities'],
        summary: 'List Hello Entities',
        description: 'Get a paginated list of Hello Entities. Requires hello:read permission.',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 10 },
            isActive: { type: 'boolean' },
            search: { type: 'string' },
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
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    isActive: { type: 'boolean' },
                    metadata: { type: 'object', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    createdBy: { type: 'string', nullable: true },
                    updatedBy: { type: 'string', nullable: true },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
      const { page, limit, isActive, search } = querySchema.parse(request.query);

      const where: Record<string, unknown> = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [entities, total] = await Promise.all([
        prisma.helloEntity.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.helloEntity.count({ where }),
      ]);

      // Audit log for listing
      await logRead(request, 'HelloEntity');

      return {
        data: entities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  );

  // GET /hello-entities/:id - Get one (users can read)
  fastify.get(
    '/:id',
    {
      preHandler: [authMiddleware, requireAnyPermission('hello:read', '*')],
      schema: {
        tags: ['Hello Entities'],
        summary: 'Get Hello Entity',
        description: 'Get a single Hello Entity by ID. Requires hello:read permission.',
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
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isActive: { type: 'boolean' },
              metadata: { type: 'object', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              createdBy: { type: 'string', nullable: true },
              updatedBy: { type: 'string', nullable: true },
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
      const { id } = request.params;

      const entity = await prisma.helloEntity.findUnique({
        where: { id },
      });

      if (!entity) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'HelloEntity not found',
        });
      }

      // Audit log for reading
      await logRead(request, 'HelloEntity', id);

      return entity;
    }
  );

  // POST /hello-entities - Create (admins can write)
  fastify.post(
    '/',
    {
      preHandler: [authMiddleware, requirePermission('hello:write')],
      schema: {
        tags: ['Hello Entities'],
        summary: 'Create Hello Entity',
        description: 'Create a new Hello Entity. Requires hello:write permission.',
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string' },
            isActive: { type: 'boolean', default: true },
            metadata: { type: 'object' },
          },
          required: ['name'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isActive: { type: 'boolean' },
              metadata: { type: 'object', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              createdBy: { type: 'string', nullable: true },
              updatedBy: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateHelloEntityInput }>, reply: FastifyReply) => {
      const data = createHelloEntitySchema.parse(request.body);

      const entity = await prisma.helloEntity.create({
        data: {
          ...data,
          createdBy: request.user?.id,
          updatedBy: request.user?.id,
        },
      });

      // Audit log for creation
      await logCreate(request, 'HelloEntity', entity.id, entity as Record<string, unknown>);

      return reply.status(201).send(entity);
    }
  );

  // PATCH /hello-entities/:id - Update (admins can write)
  fastify.patch(
    '/:id',
    {
      preHandler: [authMiddleware, requirePermission('hello:write')],
      schema: {
        tags: ['Hello Entities'],
        summary: 'Update Hello Entity',
        description: 'Update an existing Hello Entity. Requires hello:write permission.',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
            metadata: { type: 'object' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string', nullable: true },
              isActive: { type: 'boolean' },
              metadata: { type: 'object', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              createdBy: { type: 'string', nullable: true },
              updatedBy: { type: 'string', nullable: true },
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
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateHelloEntityInput }>, reply: FastifyReply) => {
      const { id } = request.params;
      const data = updateHelloEntitySchema.parse(request.body);

      // Get old data for audit
      const oldEntity = await prisma.helloEntity.findUnique({
        where: { id },
      });

      if (!oldEntity) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'HelloEntity not found',
        });
      }

      const entity = await prisma.helloEntity.update({
        where: { id },
        data: {
          ...data,
          updatedBy: request.user?.id,
        },
      });

      // Audit log for update
      await logUpdate(
        request,
        'HelloEntity',
        id,
        oldEntity as Record<string, unknown>,
        entity as Record<string, unknown>
      );

      return entity;
    }
  );

  // DELETE /hello-entities/:id - Delete (admins can write)
  fastify.delete(
    '/:id',
    {
      preHandler: [authMiddleware, requirePermission('hello:write')],
      schema: {
        tags: ['Hello Entities'],
        summary: 'Delete Hello Entity',
        description: 'Delete a Hello Entity. Requires hello:write permission.',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          204: { type: 'null' },
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
      const { id } = request.params;

      // Get old data for audit
      const oldEntity = await prisma.helloEntity.findUnique({
        where: { id },
      });

      if (!oldEntity) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'HelloEntity not found',
        });
      }

      await prisma.helloEntity.delete({
        where: { id },
      });

      // Audit log for deletion
      await logDelete(request, 'HelloEntity', id, oldEntity as Record<string, unknown>);

      return reply.status(204).send();
    }
  );
}
