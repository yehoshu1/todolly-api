# 📋 Todolly - Task Management API

A modern, production-ready task management API built with TypeScript, featuring complete JWT authentication, OpenAPI documentation, and real-time data validation.

## 🚀 Features

- **🔐 Complete Authentication System**: JWT-based user registration, login, and session management
- **📝 Task Management**: Create, read, update, and delete tasks with user isolation
- **📋 Subtasks**: Organize work with hierarchical subtask support
- **⏰ Reminders**: Time-based notifications linked to tasks
- **🔒 Secure by Default**: All endpoints protected with JWT authentication
- **📖 Auto-Generated Documentation**: Interactive OpenAPI/Swagger UI
- **✅ Type-Safe**: Full TypeScript implementation with runtime validation
- **🏃 Fast**: Built on Bun runtime for optimal performance

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Framework**: [Hono](https://hono.dev/) - Lightweight web framework
- **Database**: SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: [Zod](https://zod.dev/) schemas with OpenAPI integration
- **Documentation**: Automated OpenAPI 3.0 with Scalar UI

## 📚 API Endpoints

### 🔐 Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (protected)
- `POST /auth/logout` - User logout (protected)

### 📝 Tasks (All Protected)

- `GET /tasks` - Get user's tasks
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get specific task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### 📋 Subtasks (All Protected)

- `GET /subtasks` - Get user's subtasks
- `POST /subtasks` - Create new subtask
- `GET /subtasks/:id` - Get specific subtask
- `PUT /subtasks/:id` - Update subtask
- `DELETE /subtasks/:id` - Delete subtask

### ⏰ Reminders (All Protected)

- `GET /reminders` - Get user's reminders
- `POST /reminders` - Create new reminder
- `GET /reminders/:id` - Get specific reminder
- `PUT /reminders/:id` - Update reminder
- `DELETE /reminders/:id` - Delete reminder

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd todolly

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the development server
bun run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
DB_FILE_NAME=file:dev.db
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3000
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
```

## 📖 API Documentation

Once the server is running, access the interactive API documentation:

- **Scalar UI**: http://localhost:3000/scalar
- **OpenAPI Spec**: http://localhost:3000/doc

## 🔐 Authentication Flow

### 1. Register a New User

```bash
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securepassword123"
  }'
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### 3. Use Protected Endpoints

Include the JWT token in the Authorization header:

```bash
curl -X GET "http://localhost:3000/tasks" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📝 Example Usage

### Create a Task

```bash
curl -X POST "http://localhost:3000/tasks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "priority": "high",
    "status": false,
    "dueDate": "2025-08-30",
    "dueTime": "17:00:00"
  }'
```

### Create a Subtask

```bash
curl -X POST "http://localhost:3000/subtasks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "your-task-id",
    "title": "Write installation instructions",
    "description": "Detail the setup process",
    "priority": "medium",
    "status": false
  }'
```

## 🏗️ Database Schema

### Users

- `id` (PRIMARY KEY)
- `email` (UNIQUE)
- `name`
- `password` (bcrypt hashed)

### Tasks

- `taskId` (PRIMARY KEY)
- `userId` (FOREIGN KEY)
- `title`, `description`
- `dueDate`, `dueTime`, `location`
- `status` (boolean), `priority`
- `createdAt`, `updatedAt`

### Subtasks

- `subtaskId` (PRIMARY KEY)
- `taskId` (FOREIGN KEY, CASCADE DELETE)
- `title`, `description`
- `status` (boolean), `priority`
- `createdAt`, `updatedAt`

### Reminders

- `reminderId` (PRIMARY KEY)
- `taskId` (FOREIGN KEY, CASCADE DELETE)
- `remindAt` (ISO datetime)
- `message`

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **User Data Isolation**: Users can only access their own data
- **Protected Routes**: All data endpoints require authentication
- **Input Validation**: Comprehensive Zod schema validation
- **Type Safety**: Full TypeScript implementation

## 🧪 Testing

The API is covered by **77 integration tests** across 16 test files using Vitest with the `@vitest/coverage-v8` provider. Coverage focuses on:

- User registration, login, and profile flows
- JWT token validation (valid, invalid, missing, malformed)
- Protected endpoint access and auth middleware
- Data isolation between users (cross-user access denied)
- CRUD operations for tasks, subtasks, and reminders
- Error/edge cases: 401/403/404/400/500 responses
- Database failure simulation (500 paths via mocked DB)

### Running Tests Locally

The project uses Vitest for tests and the built-in `@vitest/coverage-v8` provider for coverage. Tests bootstrap an isolated SQLite file `test.sqlite` in the repository root.

Install dependencies and run tests:

```bash
npm ci
npm run test
```

Run coverage report:

```bash
npm run test:coverage
```

CI: A GitHub Actions workflow runs tests and uploads the coverage report on push and PRs.

## 📁 Project Structure

```
src/
├── index.ts                 # Application entry point
├── database/
│   ├── index.ts            # Database connection
│   ├── schema.ts           # Drizzle schema definitions
│   ├── zodSchemas.ts       # Zod validation schemas
│   └── lib/
│       ├── hash.ts         # Password hashing utilities
│       └── jwt.ts          # JWT token utilities
└── routes/
    ├── auth/
    │   └── auth.ts         # Authentication endpoints
    ├── tasks/
    │   ├── index.route.ts  # Task collection endpoints
    │   └── task/
    │       └── index.route.ts  # Individual task endpoints
    ├── subtasks/
    │   ├── index.route.ts  # Subtask collection endpoints
    │   └── subtask/
    │       └── index.route.ts  # Individual subtask endpoints
    └── reminders/
        ├── index.route.ts  # Reminder collection endpoints
        └── reminder/
            └── index.route.ts  # Individual reminder endpoints
```

## 🚧 Development

### Available Scripts

```bash
# Start development server with hot reload
bun run dev

# Build for production (if configured)
bun run build

# Run database migrations
bun run drizzle-kit migrate
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using modern TypeScript technologies**
