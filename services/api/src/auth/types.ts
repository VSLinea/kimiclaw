export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface JWTPayload {
  sub: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  [key: string]: unknown;
}

export interface WebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
}
