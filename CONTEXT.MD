# Todolly - Task Management API

## Project Overview

**Todolly** is a comprehensive task management API built with modern TypeScript technologies. The application provides a RESTful API for managing tasks, subtasks, and reminders with full JWT-based authentication, OpenAPI documentation, and schema validation. The system is production-ready with complete user authentication and authorization.

## Technologies Stack

### Runtime & Framework

- **Bun**: Modern JavaScript runtime and package manager
- **Hono**: Lightweight, fast web framework for building APIs
- **TypeScript**: Strongly typed JavaScript for better development experience

### Database & ORM

- **SQLite**: Lightweight, file-based database (using `better-sqlite3` and `@libsql/client`)
- **Drizzle ORM**: TypeScript-first ORM for database operations
- **Drizzle Kit**: Database migration and schema management tools

### API Documentation & Validation

- **OpenAPI 3.0**: API specification standard
- **Zod**: TypeScript-first schema validation library
- **@hono/zod-openapi**: OpenAPI integration for Hono with Zod
- **@scalar/hono-api-reference**: Beautiful API documentation UI

### Authentication & Security

- **bcrypt**: Password hashing library (10 salt rounds)
- **jsonwebtoken**: JWT token generation and verification
- **nanoid**: Secure unique ID generation for users and entities
- **dotenv**: Environment variable management

## Project Architecture

### Directory Structure

```text
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── database/
│   │   ├── index.ts            # Database connection setup
│   │   ├── schema.ts           # Drizzle database schema definitions
│   │   ├── zodSchemas.ts       # Zod schemas for validation
│   │   └── lib/
│   │       ├── hash.ts         # Password hashing utilities
│   │       └── jwt.ts          # JWT token utilities
│   └── routes/
│       ├── auth/
│       │   └── auth.ts         # Complete authentication routes (register, login, profile, logout)
│       ├── tasks/
│       │   ├── index.route.ts  # Tasks collection endpoints
│       │   └── task/
│       │       └── index.route.ts  # Individual task endpoints
│       ├── subtasks/
│       │   ├── index.route.ts  # Subtasks collection endpoints
│       │   └── subtask/
│       │       └── index.route.ts  # Individual subtask endpoints
│       └── reminders/
│           ├── index.route.ts  # Reminders collection endpoints
│           └── reminder/
│               └── index.route.ts  # Individual reminder endpoints
├── drizzle/                     # Database migrations
├── drizzle.config.ts           # Drizzle configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── bun.lock                    # Bun lockfile
```

### Core Components

#### 1. Application Entry Point (`src/index.ts`)

- Sets up OpenAPIHono instance with strict mode disabled
- Configures OpenAPI documentation at `/doc`
- Integrates Scalar UI for API documentation at `/scalar`
- Mounts feature routes with proper prefixes
- Implements global error handling and 404 responses

#### 2. Database Layer (`src/database/`)

- **Connection**: Configured to use SQLite via LibSQL client
- **Schema**: Defines four main entities:
  - `users`: User accounts with authentication
  - `tasks`: Main task entities with comprehensive fields
  - `subtasks`: Sub-items linked to tasks with cascade deletion
  - `reminders`: Time-based notifications linked to tasks

#### 3. API Routes

The API follows RESTful conventions with OpenAPI specification and JWT-based authentication:

##### Authentication API (`/auth`)

- `POST /auth/register` - User registration with email and password
- `POST /auth/login` - User authentication and JWT token issuance
- `GET /auth/profile` - Get current user profile (protected)
- `POST /auth/logout` - User logout (token invalidation)

##### Tasks API (`/tasks`) - **Protected Routes**

- `GET /tasks` - Retrieve user's tasks (requires authentication)
- `POST /tasks` - Create a new task (requires authentication)
- `GET /tasks/:id` - Get specific user task (requires authentication)
- `PUT /tasks/:id` - Update user task (requires authentication)
- `DELETE /tasks/:id` - Delete user task (requires authentication)
- `GET /tasks/:id/subtasks` - Get task's subtasks (requires authentication)

##### Subtasks API (`/subtasks`) - **Protected Routes**

- `GET /subtasks` - Retrieve user's subtasks (requires authentication)
- `POST /subtasks` - Create a new subtask (requires authentication)
- `GET /subtasks/:id` - Get specific user subtask (requires authentication)
- `PUT /subtasks/:id` - Update user subtask (requires authentication)
- `DELETE /subtasks/:id` - Delete user subtask (requires authentication)

##### Reminders API (`/reminders`) - **Protected Routes**

- `GET /reminders` - Retrieve user's reminders (requires authentication)
- `POST /reminders` - Create a new reminder (requires authentication)
- `GET /reminders/:id` - Get specific user reminder (requires authentication)
- `PUT /reminders/:id` - Update user reminder (requires authentication)
- `DELETE /reminders/:id` - Delete user reminder (requires authentication)

## Database Schema

### Users Table

```typescript
{
  id: string (PRIMARY KEY)
  email: string (UNIQUE, NOT NULL)
  name: string (NOT NULL)
  password: string (NOT NULL) // bcrypt hashed
}
```

### Tasks Table

```typescript
{
  taskId: string (PRIMARY KEY)
  userId: string (FOREIGN KEY → users.id, NOT NULL) // Links tasks to users
  title: string (NOT NULL)
  description: string (OPTIONAL)
  dueDate: string (ISO date format)
  dueTime: string (HH:MM:SS format)
  location: string (OPTIONAL)
  status: boolean (DEFAULT: false)
  priority: string (OPTIONAL)
  createdAt: string (TIMESTAMP)
  updatedAt: string (TIMESTAMP)
}
```

### Subtasks Table

```typescript
{
  subtaskId: string (PRIMARY KEY)
  taskId: string (FOREIGN KEY → tasks.taskId, CASCADE DELETE)
  title: string (NOT NULL)
  description: string (OPTIONAL)
  status: boolean (DEFAULT: false)
  priority: string (OPTIONAL)
  createdAt: string (TIMESTAMP)
  updatedAt: string (TIMESTAMP)
}
```

### Reminders Table

```typescript
{
  reminderId: string (PRIMARY KEY)
  taskId: string (FOREIGN KEY → tasks.taskId, CASCADE DELETE)
  remindAt: string (ISO 8601 datetime)
  message: string (OPTIONAL)
}
```

## Development Setup

### Prerequisites

- Bun runtime installed

### Installation & Running

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Access application
# API: http://localhost:3000
# Documentation: http://localhost:3000/scalar
```

### Environment Variables

Create a `.env` file with:

```env
DB_FILE_NAME=file:dev.db
JWT_SECRET=your-secret-key-here
PORT=3000
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

## API Documentation

The application automatically generates comprehensive API documentation using OpenAPI 3.0 specification. Access the interactive documentation at:

- **OpenAPI Spec**: `http://localhost:3000/doc`
- **Scalar UI**: `http://localhost:3000/scalar`

## Security Features

### JWT-Based Authentication

- Complete user registration and login system
- JWT tokens with configurable expiration (1-hour default)
- Bearer token authentication for all protected routes
- User-scoped data access (users can only access their own data)

### Password Security

- Passwords are hashed using bcrypt with 10 salt rounds
- Utilities in `src/database/lib/hash.ts` handle password hashing and verification
- No plaintext passwords stored in database

### Route Protection

- All task, subtask, and reminder endpoints require authentication
- Inline authentication helpers for each protected route
- Automatic user ID extraction from JWT tokens
- Database queries automatically filtered by authenticated user

## Current Development Status

### ✅ Completed Features

- ✅ Complete database schema with user relationships
- ✅ RESTful API endpoints for all entities
- ✅ OpenAPI documentation generation
- ✅ Request/response validation with Zod
- ✅ Database migrations with Drizzle
- ✅ **Complete JWT-based authentication system**
- ✅ **User registration and login endpoints**
- ✅ **Password hashing and verification**
- ✅ **Protected route authentication**
- ✅ **User-scoped data access**
- ✅ **Authentication middleware integration**
- ✅ **Profile management endpoints**
- ✅ **Token-based authorization**

### 🔄 Future Enhancements

- 🔄 Password reset functionality
- 🔄 Email verification system
- 🔄 Refresh token implementation
- 🔄 Rate limiting and security headers
- 🔄 Reminder notification system
- 🔄 Advanced error handling and logging
- 🔄 User preference settings
- 🔄 Task sharing between users

## Architecture Patterns

### JWT-Based Security Architecture

All protected endpoints use JWT Bearer token authentication with inline authentication helpers that:

- Extract and verify JWT tokens from Authorization headers
- Validate token signatures and expiration
- Extract user information for database queries
- Automatically scope all data operations to the authenticated user

### Modular Route Organization

Routes are organized hierarchically with separate files for collection and individual resource operations, promoting maintainability and clear separation of concerns. All routes are properly secured with authentication.

### Schema-First Development

All API endpoints use Zod schemas for validation, ensuring type safety and automatic OpenAPI documentation generation.

### Database-First Design

Drizzle ORM provides type-safe database operations with automatic TypeScript type generation from the schema. All tables include proper foreign key relationships for user data isolation.

### Configuration Management

Centralized configuration using environment variables and dedicated config files for different aspects (database, TypeScript, etc.).

This project represents a well-structured, modern API built with TypeScript best practices and production-ready technologies. The authentication system is complete and fully functional, providing secure user management and data isolation.
