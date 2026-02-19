import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from './config';
import './config/dotenv';

export async function registerHealthRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /health - Health check
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health Check',
        description: 'Check if the API is running and healthy.',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
      };
    }
  );

  // GET /version - API version
  fastify.get(
    '/version',
    {
      schema: {
        tags: ['System'],
        summary: 'API Version',
        description: 'Get the current API version information.',
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              node: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return {
        name: config.API_NAME,
        version: config.API_VERSION,
        node: process.version,
        timestamp: new Date().toISOString(),
      };
    }
  );
}
