import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { taskRoutes } from './routes/tasks/index.route';
import { subtaskRoutes } from './routes/subtasks/index.route';
import { reminderRoutes } from './routes/reminders/index.route';
import { authRoutes } from './routes/auth/auth';

const app = new OpenAPIHono({ strict: false });

// Index route definition
const index = createRoute({
    method: 'get',
    path: '/',
    responses: {
        200: {
            description: 'Todolly Index Route',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
});

// Welcome route
app.openapi(index, (c) => {
    return c.json({
        message: 'Welcome to the Todolly Task Management Application!',
    });
});

// Docs route
app.doc('/doc', {
    openapi: '3.0.0',
    info: {
        title: 'Todolly API',
        description: 'API documentation for the Todolly Task Management Application with JWT Authentication',
        version: '1.0.0',
    },
});

// Scalar UI
app.get('/scalar', Scalar({ url: '/doc', pageTitle: 'Todolly API Documentation' }));

// Mount authentication routes (public)
app.route('/auth', authRoutes);

// Mount feature routes (these will be secured individually)
app.route('/tasks', taskRoutes);
app.route('/subtasks', subtaskRoutes);
app.route('/reminders', reminderRoutes);

// Not found handler
app.notFound((c) => {
    return c.json({
        message: 'Route not found',
    }, 404);
});

// For Bun runtime
export default {
    port: process.env.PORT || 3000,
    hostname: '0.0.0.0',
    fetch: app.fetch,
};
