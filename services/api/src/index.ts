import './config/dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { registerSwagger } from './swagger';
import { registerHealthRoutes } from './health/routes';
import { registerAuthRoutes } from './auth/routes';
import { registerRbacRoutes } from './rbac/routes';
import { registerAuditRoutes } from './audit/routes';
import helloEntityRoutes from './hello-entities/routes';

const app = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  },
});

async function main() {
  // Register CORS
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  // Register Swagger/OpenAPI
  await registerSwagger(app);

  // Register routes
  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerRbacRoutes(app);
  await registerAuditRoutes(app);
  await app.register(helloEntityRoutes, { prefix: '/hello-entities' });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: config.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  });

  // Start server
  try {
    const port = config.PORT;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 Server running on http://localhost:${port}`);
    app.log.info(`📚 API Docs available at http://localhost:${port}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

export default app;
