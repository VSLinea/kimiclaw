# Foundation System - API Contract Document

## Document Information
- **Version:** 1.0.0
- **Status:** Draft
- **Last Updated:** 2026-02-19
- **OpenAPI Version:** 3.1.0

---

## 1. Overview

This document defines the API contract for the Foundation System. It specifies all endpoints, request/response formats, authentication mechanisms, error handling, and versioning strategy.

---

## 2. API Strategy

### 2.1 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **RESTful** | Resource-oriented URLs, standard HTTP methods |
| **Stateless** | No server-side session state |
| **Consistent** | Uniform response format across all endpoints |
| **Versioned** | URL-based versioning (`/v1/...`) |
| **Documented** | OpenAPI 3.1.0 specification |
| **Secure** | JWT authentication, HTTPS only |

### 2.2 Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.example.com/v1` |
| Staging | `https://api-staging.example.com/v1` |
| Development | `http://localhost:3000/v1` |

### 2.3 Versioning Strategy

**URL Path Versioning:**
- Current: `/v1/`
- Future breaking changes: `/v2/`

**Version Lifecycle:**
1. New features added to current version
2. Breaking changes trigger new version
3. Old versions supported for 6 months after deprecation
4. Deprecation notice in `Deprecation` header

---

## 3. Authentication

### 3.1 JWT Bearer Token

All endpoints (except health check) require authentication via JWT Bearer token.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

**Token Source:**
- Tokens are issued by Clerk authentication service
- Mobile app obtains token during sign-in
- Token must be included in all API requests

### 3.2 Token Validation

The API validates tokens by:
1. Verifying signature against Clerk JWKS
2. Checking `exp` claim (expiration)
3. Checking `nbf` claim (not before)
4. Extracting `sub` (user ID) claim

### 3.3 Token Refresh

- Tokens expire after 24 hours
- Refresh handled by Clerk SDK on mobile
- API returns `401` for expired tokens

---

## 4. Common Patterns

### 4.1 Request Format

**Content-Type:** `application/json`

**Example Request:**
```http
POST /v1/hello-entities HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "name": "My Entity"
}
```

### 4.2 Response Format

All responses follow a consistent envelope structure:

**Success Response (200-299):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid"
  }
}
```

**List Response with Pagination:**
```json
{
  "success": true,
  "data": [
    { ... },
    { ... }
  ],
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid",
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4.3 Pagination

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `perPage` | integer | 20 | Items per page (max 100) |

**Cursor-Based (Alternative):**
| Parameter | Type | Description |
|-----------|------|-------------|
| `cursor` | string | Opaque cursor from previous response |
| `limit` | integer | Items to return (max 100) |

### 4.4 Filtering

**Query Parameters:**
```
GET /v1/audit-logs?action=CREATE&entityType=hello_entity&startDate=2026-01-01
```

**Operators:**
- Equality: `?status=active`
- Range: `?createdAt[gte]=2026-01-01&createdAt[lte]=2026-12-31`
- Array: `?status[in]=active,pending`

### 4.5 Sorting

**Query Parameter:**
```
GET /v1/hello-entities?sort=-createdAt,name
```

- Prefix `-` for descending order
- Multiple fields comma-separated

### 4.6 Field Selection

**Query Parameter:**
```
GET /v1/hello-entities?fields=id,name,createdAt
```

---

## 5. Error Model

### 5.1 Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required",
        "code": "REQUIRED"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid"
  }
}
```

### 5.2 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Business logic errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Maintenance/overload |

### 5.3 Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `TOKEN_INVALID` | 401 | JWT token is malformed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### 5.4 Validation Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "FORMAT_INVALID",
        "value": "not-an-email"
      },
      {
        "field": "name",
        "message": "Name must be between 1 and 255 characters",
        "code": "LENGTH_INVALID",
        "value": ""
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid"
  }
}
```

### 5.5 Rate Limiting

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708342200
```

**Error Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "window": "60s",
      "retryAfter": 60
    }
  },
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid"
  }
}
```

---

## 6. Endpoint Reference

### 6.1 Health Check

**GET** `/health`

Public endpoint for health monitoring.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-02-19T10:30:00.000Z",
    "checks": {
      "database": "ok",
      "cache": "ok"
    }
  },
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid"
  }
}
```

---

### 6.2 Authentication

#### Get Current User

**GET** `/me`

Returns the currently authenticated user's profile.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "clerkId": "user_2abcdef123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": {
      "id": "role-uuid",
      "name": "user"
    },
    "createdAt": "2026-01-15T08:30:00.000Z",
    "updatedAt": "2026-02-19T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid"
  }
}
```

---

### 6.3 Users

#### List Users

**GET** `/users`

Returns a paginated list of all users. Admin only.

**Auth:** Required (Admin)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `perPage` | integer | Items per page |
| `role` | string | Filter by role name |
| `search` | string | Search by name/email |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": {
        "id": "role-uuid",
        "name": "user"
      },
      "createdAt": "2026-01-15T08:30:00.000Z",
      "updatedAt": "2026-02-19T10:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid",
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Update User Role

**PATCH** `/users/:id/role`

Updates a user's role. Admin only.

**Auth:** Required (Admin)

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": {
      "id": "role-uuid",
      "name": "admin"
    },
    "updatedAt": "2026-02-19T10:35:00.000Z"
  },
  "meta": {
    "timestamp": "2026-02-19T10:35:00.000Z",
    "requestId": "req-uuid"
  }
}
```

**Errors:**
- `403` - Non-admin attempting to change role
- `404` - User not found
- `400` - Invalid role name

---

### 6.4 Audit Logs

#### Query Audit Logs

**GET** `/audit-logs`

Returns audit logs with filtering. Admin only.

**Auth:** Required (Admin)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `perPage` | integer | Items per page |
| `action` | string | Filter by action (CREATE, UPDATE, DELETE) |
| `entityType` | string | Filter by entity type |
| `entityId` | string | Filter by entity ID |
| `userId` | string | Filter by user ID |
| `startDate` | date | Filter from date (ISO 8601) |
| `endDate` | date | Filter to date (ISO 8601) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid-1",
      "action": "HELLO_ENTITY_CREATE",
      "entityType": "hello_entity",
      "entityId": "entity-uuid",
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "timestamp": "2026-02-19T10:30:00.000Z",
      "metadata": {
        "name": "My Entity"
      }
    }
  ],
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid",
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 5000,
      "totalPages": 250,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 6.5 Hello Entities

#### List Hello Entities

**GET** `/hello-entities`

Returns hello entities accessible to the current user.
- Regular users: only their own entities
- Admins: all entities

**Auth:** Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number |
| `perPage` | integer | Items per page |
| `search` | string | Search by name |
| `sort` | string | Sort field(s) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "My First Entity",
      "createdBy": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "createdAt": "2026-02-19T10:00:00.000Z",
      "updatedAt": "2026-02-19T10:30:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid",
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### Create Hello Entity

**POST** `/hello-entities`

Creates a new hello entity.

**Auth:** Required

**Request Body:**
```json
{
  "name": "My New Entity"
}
```

**Validation Rules:**
- `name`: Required, string, 1-255 characters

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "My New Entity",
    "createdBy": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "createdAt": "2026-02-19T10:35:00.000Z",
    "updatedAt": "2026-02-19T10:35:00.000Z"
  },
  "meta": {
    "timestamp": "2026-02-19T10:35:00.000Z",
    "requestId": "req-uuid"
  }
}
```

#### Get Hello Entity

**GET** `/hello-entities/:id`

Returns a single hello entity by ID.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "My First Entity",
    "createdBy": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "createdAt": "2026-02-19T10:00:00.000Z",
    "updatedAt": "2026-02-19T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-02-19T10:30:00.000Z",
    "requestId": "req-uuid"
  }
}
```

**Errors:**
- `404` - Entity not found or not accessible

#### Update Hello Entity

**PATCH** `/hello-entities/:id`

Updates a hello entity. Only the creator or admin can update.

**Auth:** Required

**Request Body:**
```json
{
  "name": "Updated Entity Name"
}
```

**Validation Rules:**
- `name`: Optional, string, 1-255 characters

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Updated Entity Name",
    "createdBy": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "createdAt": "2026-02-19T10:00:00.000Z",
    "updatedAt": "2026-02-19T10:40:00.000Z"
  },
  "meta": {
    "timestamp": "2026-02-19T10:40:00.000Z",
    "requestId": "req-uuid"
  }
}
```

**Errors:**
- `403` - Not authorized to update this entity
- `404` - Entity not found

#### Delete Hello Entity

**DELETE** `/hello-entities/:id`

Deletes a hello entity. Only the creator or admin can delete.

**Auth:** Required

**Response (204):**
```
(No body)
```

**Errors:**
- `403` - Not authorized to delete this entity
- `404` - Entity not found

---

## 7. OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: Foundation API
  description: Production-grade foundation system API
  version: 1.0.0
  contact:
    name: API Support
    email: api@example.com

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://api-staging.example.com/v1
    description: Staging

security:
  - bearerAuth: []

paths:
  /health:
    get:
      summary: Health check
      description: Returns API health status
      security: []
      responses:
        '200':
          description: API is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

  /me:
    get:
      summary: Get current user
      description: Returns the authenticated user's profile
      tags:
        - Authentication
      responses:
        '200':
          description: User profile retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /users:
    get:
      summary: List users
      description: Returns paginated list of users (Admin only)
      tags:
        - Users
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PerPageParam'
        - name: role
          in: query
          schema:
            type: string
            enum: [user, admin]
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedUsersResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /users/{id}/role:
    patch:
      summary: Update user role
      description: Updates a user's role (Admin only)
      tags:
        - Users
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateRoleRequest'
      responses:
        '200':
          description: Role updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /audit-logs:
    get:
      summary: Query audit logs
      description: Returns audit logs with filtering (Admin only)
      tags:
        - Audit Logs
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PerPageParam'
        - name: action
          in: query
          schema:
            type: string
        - name: entityType
          in: query
          schema:
            type: string
        - name: entityId
          in: query
          schema:
            type: string
            format: uuid
        - name: userId
          in: query
          schema:
            type: string
            format: uuid
        - name: startDate
          in: query
          schema:
            type: string
            format: date-time
        - name: endDate
          in: query
          schema:
            type: string
            format: date-time
      responses:
        '200':
          description: List of audit logs
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedAuditLogsResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /hello-entities:
    get:
      summary: List hello entities
      description: Returns hello entities accessible to current user
      tags:
        - Hello Entities
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PerPageParam'
        - name: search
          in: query
          schema:
            type: string
        - name: sort
          in: query
          schema:
            type: string
            default: '-createdAt'
      responses:
        '200':
          description: List of hello entities
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedHelloEntitiesResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

    post:
      summary: Create hello entity
      description: Creates a new hello entity
      tags:
        - Hello Entities
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateHelloEntityRequest'
      responses:
        '201':
          description: Entity created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HelloEntityResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /hello-entities/{id}:
    get:
      summary: Get hello entity
      description: Returns a single hello entity
      tags:
        - Hello Entities
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Entity retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HelloEntityResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

    patch:
      summary: Update hello entity
      description: Updates a hello entity
      tags:
        - Hello Entities
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateHelloEntityRequest'
      responses:
        '200':
          description: Entity updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HelloEntityResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '404':
          $ref: '#/components/responses/NotFoundError'

    delete:
      summary: Delete hello entity
      description: Deletes a hello entity
      tags:
        - Hello Entities
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Entity deleted
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
        '404':
          $ref: '#/components/responses/NotFoundError'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        default: 1
        minimum: 1

    PerPageParam:
      name: perPage
      in: query
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100

  schemas:
    # Request Schemas
    CreateHelloEntityRequest:
      type: object
      required:
        - name
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: "My Entity"

    UpdateHelloEntityRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: "Updated Entity"

    UpdateRoleRequest:
      type: object
      required:
        - role
      properties:
        role:
          type: string
          enum: [user, admin]
          example: "admin"

    # Response Schemas
    Meta:
      type: object
      required:
        - timestamp
        - requestId
      properties:
        timestamp:
          type: string
          format: date-time
        requestId:
          type: string
          format: uuid
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        page:
          type: integer
        perPage:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer
        hasNext:
          type: boolean
        hasPrev:
          type: boolean

    Role:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          enum: [user, admin]

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          $ref: '#/components/schemas/Role'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    HelloEntity:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        createdBy:
          $ref: '#/components/schemas/User'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    AuditLog:
      type: object
      properties:
        id:
          type: string
          format: uuid
        action:
          type: string
        entityType:
          type: string
        entityId:
          type: string
        user:
          $ref: '#/components/schemas/User'
        timestamp:
          type: string
          format: date-time
        metadata:
          type: object

    HealthCheck:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, unhealthy]
        version:
          type: string
        timestamp:
          type: string
          format: date-time
        checks:
          type: object
          properties:
            database:
              type: string
              enum: [ok, error]
            cache:
              type: string
              enum: [ok, error]

    # Wrapper Responses
    SuccessResponse:
      type: object
      required:
        - success
        - data
        - meta
      properties:
        success:
          type: boolean
          example: true
        data: {}
        meta:
          $ref: '#/components/schemas/Meta'

    ErrorDetail:
      type: object
      properties:
        field:
          type: string
        message:
          type: string
        code:
          type: string
        value: {}

    ErrorResponse:
      type: object
      required:
        - success
        - error
        - meta
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          required:
            - code
            - message
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                $ref: '#/components/schemas/ErrorDetail'
        meta:
          $ref: '#/components/schemas/Meta'

    # Specific Responses
    HealthResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - properties:
            data:
              $ref: '#/components/schemas/HealthCheck'

    UserResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - properties:
            data:
              $ref: '#/components/schemas/User'

    PaginatedUsersResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/User'

    HelloEntityResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - properties:
            data:
              $ref: '#/components/schemas/HelloEntity'

    PaginatedHelloEntitiesResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/HelloEntity'

    PaginatedAuditLogsResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/AuditLog'

  responses:
    UnauthorizedError:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: UNAUTHORIZED
              message: Authentication required
            meta:
              timestamp: "2026-02-19T10:30:00.000Z"
              requestId: "req-uuid"

    ForbiddenError:
      description: Insufficient permissions
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: FORBIDDEN
              message: Insufficient permissions
            meta:
              timestamp: "2026-02-19T10:30:00.000Z"
              requestId: "req-uuid"

    NotFoundError:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: RESOURCE_NOT_FOUND
              message: Resource not found
            meta:
              timestamp: "2026-02-19T10:30:00.000Z"
              requestId: "req-uuid"

    ValidationError:
      description: Validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: VALIDATION_ERROR
              message: Request validation failed
              details:
                - field: name
                  message: Name is required
                  code: REQUIRED
            meta:
              timestamp: "2026-02-19T10:30:00.000Z"
              requestId: "req-uuid"
```

---

## 8. Client Integration Guide

### 8.1 Mobile (Flutter + Dio)

```dart
import 'package:dio/dio.dart';

class ApiClient {
  late final Dio _dio;
  String? _authToken;

  ApiClient({String baseUrl = 'https://api.example.com/v1'}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Handle token expiration
        }
        return handler.next(error);
      },
    ));
  }

  void setAuthToken(String token) {
    _authToken = token;
  }

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic) parser,
  }) async {
    final response = await _dio.get(path, queryParameters: queryParameters);
    return ApiResponse.fromJson(response.data, parser);
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic) parser,
  }) async {
    final response = await _dio.post(path, data: data);
    return ApiResponse.fromJson(response.data, parser);
  }

  // ... patch, delete methods
}

class ApiResponse<T> {
  final bool success;
  final T data;
  final Meta meta;

  ApiResponse({
    required this.success,
    required this.data,
    required this.meta,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) parser,
  ) {
    return ApiResponse(
      success: json['success'],
      data: parser(json['data']),
      meta: Meta.fromJson(json['meta']),
    );
  }
}
```

### 8.2 Error Handling

```dart
class ApiException implements Exception {
  final String code;
  final String message;
  final List<ErrorDetail>? details;

  ApiException({
    required this.code,
    required this.message,
    this.details,
  });

  factory ApiException.fromJson(Map<String, dynamic> json) {
    return ApiException(
      code: json['code'],
      message: json['message'],
      details: (json['details'] as List?)
          ?.map((d) => ErrorDetail.fromJson(d))
          .toList(),
    );
  }
}

// Usage
try {
  final response = await apiClient.post(
    '/hello-entities',
    data: {'name': entityName},
    parser: HelloEntity.fromJson,
  );
} on DioException catch (e) {
  if (e.response?.data != null) {
    final error = ApiException.fromJson(e.response!.data['error']);
    // Handle specific error codes
    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Show validation errors
        break;
      case 'UNAUTHORIZED':
        // Redirect to login
        break;
      default:
        // Show generic error
    }
  }
}
```

---

## 9. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-19 | Initial API contract |

---

## 10. Appendix

### A. HTTP Headers

**Request Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes* | Bearer token |
| `Content-Type` | Yes (POST/PATCH) | `application/json` |
| `Accept` | No | `application/json` |
| `X-Request-ID` | No | Client-generated request ID |

**Response Headers:**
| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `X-Request-ID` | Server-generated request ID |
| `X-RateLimit-Limit` | Rate limit ceiling |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Reset timestamp |

### B. Date/Time Format

All dates are ISO 8601 format with timezone:
```
2026-02-19T10:30:00.000Z
```

### C. UUID Format

All IDs are UUID v4:
```
550e8400-e29b-41d4-a716-446655440000
```
