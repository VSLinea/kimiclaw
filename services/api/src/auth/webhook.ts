import { FastifyRequest, FastifyReply } from 'fastify';
import { createClerkClient } from '@clerk/fastify';
import { config } from '../config';
import { prisma } from '../prisma/client';

const clerkClient = createClerkClient({
  secretKey: config.CLERK_SECRET_KEY,
  publishableKey: config.CLERK_PUBLISHABLE_KEY,
});

export interface WebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    primary_email_address_id?: string;
  };
}

export async function handleClerkWebhook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const payload = request.body as WebhookPayload;
    const { type, data } = payload;

    request.log.info(`Processing Clerk webhook: ${type}`);

    switch (type) {
      case 'user.created':
        await syncUserCreated(data);
        break;
      case 'user.updated':
        await syncUserUpdated(data);
        break;
      case 'user.deleted':
        await syncUserDeleted(data);
        break;
      default:
        request.log.warn(`Unhandled webhook type: ${type}`);
    }

    reply.status(200).send({ success: true });
  } catch (error) {
    request.log.error('Webhook processing failed:', error);
    reply.status(500).send({ error: 'Webhook processing failed' });
  }
}

async function syncUserCreated(data: WebhookPayload['data']): Promise<void> {
  const email = data.email_addresses?.find(
    (e) => data.primary_email_address_id && e.email_address
  )?.email_address;

  if (!email) {
    throw new Error('User created without email');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: data.id },
  });

  if (existingUser) {
    return; // Already synced
  }

  // Create user with default 'user' role
  const userRole = await prisma.role.findUnique({
    where: { name: 'user' },
  });

  await prisma.user.create({
    data: {
      clerkId: data.id,
      email,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      avatarUrl: data.image_url || null,
      roles: userRole
        ? {
            create: {
              roleId: userRole.id,
            },
          }
        : undefined,
    },
  });
}

async function syncUserUpdated(data: WebhookPayload['data']): Promise<void> {
  const email = data.email_addresses?.find(
    (e) => data.primary_email_address_id && e.email_address
  )?.email_address;

  await prisma.user.update({
    where: { clerkId: data.id },
    data: {
      email: email || undefined,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      avatarUrl: data.image_url || null,
    },
  });
}

async function syncUserDeleted(data: WebhookPayload['data']): Promise<void> {
  await prisma.user.delete({
    where: { clerkId: data.id },
  });
}

export { clerkClient };
