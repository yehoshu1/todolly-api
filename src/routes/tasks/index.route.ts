import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from 'hono/http-exception';
import {
  insertTaskSchema,
  selectTaskSchema,
  errorResponseSchema,
} from "../../database/zodSchemas";
import db from "../../database";
import { tasks } from "../../database/schema";
import { taskRoute } from "./task/index.route";
import { verifyToken } from "../../database/lib/jwt";
import { userTable } from "../../database/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const taskRoutes = new OpenAPIHono();

// Helper function to authenticate user
const authenticateUser = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    throw new HTTPException(401, { message: 'Authorization header is required' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new HTTPException(401, { message: 'Token is required' });
  }

  const decoded = verifyToken(token);
  
  if (typeof decoded === 'string' || !decoded.id) {
    throw new HTTPException(401, { message: 'Invalid token format' });
  }

  const user = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name
    })
    .from(userTable)
    .where(eq(userTable.id, decoded.id))
    .limit(1);

  if (!user.length) {
    throw new HTTPException(401, { message: 'User not found' });
  }

  return user[0];
};

//setup routes for getting all task list items
const getTasks = createRoute({
  method: "get",
  path: "/",
  description: "Get all tasks for the authenticated user",
  tags: ["Tasks"],
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: z.array(selectTaskSchema) },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

taskRoutes.openapi(getTasks, async (c) => {
  try {
    const user = await authenticateUser(c);
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
    return c.json(userTasks, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//setup route for creating a new task
const createTask = createRoute({
  method: "post",
  path: "/",
  description: "Create a new task for the authenticated user",
  tags: ["Tasks"],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertTaskSchema.omit({ taskId: true, userId: true }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Task created successfully",
      content: {
        "application/json": { schema: selectTaskSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

taskRoutes.openapi(createTask, async (c) => {
  try {
    const user = await authenticateUser(c);
    const data = c.req.valid("json");
    
    const taskData = {
      ...data,
      taskId: nanoid(),
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };
    
    const newTask = await db.insert(tasks).values(taskData).returning();
    return c.json(newTask[0], 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//routes for single task item
taskRoutes.route(`/:id`, taskRoute);