import { FastifyRequest, FastifyReply } from 'fastify';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { config } from '../config';

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

// JWKS client for Clerk
let jwks: ReturnType<typeof createRemoteJWKSet>;

function getJwks() {
  if (!jwks) {
    const jwksUrl = new URL(
      `${config.CLERK_JWT_ISSUER || 'https://clerk.openclaw.dev'}/.well-known/jwks.json`
    );
    jwks = createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

export async function verifyClerkToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: config.CLERK_JWT_ISSUER,
    audience: config.CLERK_JWT_AUDIENCE || undefined,
  });
  return payload;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    const payload = await verifyClerkToken(token);

    // Extract user info from Clerk JWT payload
    const user: AuthUser = {
      id: payload.sub as string,
      clerkId: payload.sub as string,
      email: (payload.email as string) || '',
      firstName: payload.first_name as string | undefined,
      lastName: payload.last_name as string | undefined,
      avatarUrl: payload.image_url as string | undefined,
    };

    request.user = user;
  } catch (error) {
    request.log.error('Auth verification failed:', error);
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return; // No auth, continue without user
    }

    const token = authHeader.slice(7);
    const payload = await verifyClerkToken(token);

    request.user = {
      id: payload.sub as string,
      clerkId: payload.sub as string,
      email: (payload.email as string) || '',
      firstName: payload.first_name as string | undefined,
      lastName: payload.last_name as string | undefined,
      avatarUrl: payload.image_url as string | undefined,
    };
  } catch (error) {
    // Invalid token, but optional so continue without user
    request.log.warn('Optional auth failed:', error);
  }
}
