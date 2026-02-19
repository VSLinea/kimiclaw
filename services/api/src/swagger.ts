import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config';

export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: config.API_NAME,
        description: 'API with Clerk Auth, RBAC, and Audit Logging',
        version: config.API_VERSION,
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Clerk JWT token',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      tags: [
        { name: 'System', description: 'System endpoints' },
        { name: 'Hello Entities', description: 'Hello Entity CRUD operations' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Audit', description: 'Audit log endpoints' },
        { name: 'RBAC', description: 'Role-based access control' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });
}
