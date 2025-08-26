import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from 'hono/http-exception';
import {
  insertTaskSchema,
  selectSubtaskSchema,
  selectTaskSchema,
  errorResponseSchema,
} from "../../../database/zodSchemas";
import db from "../../../database";
import { subtasks, tasks, userTable } from "../../../database/schema";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../../../database/lib/jwt";

const paramsSchema = z.object({
  id: z
    .string()
});

export const taskRoute = new OpenAPIHono();

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

//GET a single task
const getTask = createRoute({
  method: "get",
  path: "/",
  description: "Get a task by ID (user must own the task)",
  tags: ["Tasks"],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: paramsSchema,
  },
  responses: {
    200: {
      description: "Successful response",
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
    404: {
      description: "Task not found or not owned by user",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

taskRoute.openapi(getTask, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskId, id), eq(tasks.userId, user.id)))
      .limit(1);
    
    if (!task.length) {
      return c.json({ success: false, message: 'Task not found or access denied' }, 404);
    }
    
    return c.json(task[0], 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//UPDATE a single task
const updateTask = createRoute({
  method: "put",
  path: "/",
  description: "Update a task by ID (user must own the task)",
  tags: ["Tasks"],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: paramsSchema,
    body: {
      content: {
        "application/json": {
          schema: insertTaskSchema.omit({ taskId: true, userId: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response",
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
    404: {
      description: "Task not found or not owned by user",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

taskRoute.openapi(updateTask, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    
    // Ensure the task exists and belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskId, id), eq(tasks.userId, user.id)))
      .limit(1);
    
    if (!existingTask.length) {
      return c.json({ success: false, message: 'Task not found or access denied' }, 404);
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    const updatedTask = await db
      .update(tasks)
      .set(updatedData)
      .where(and(eq(tasks.taskId, id), eq(tasks.userId, user.id)))
      .returning();
    
    return c.json(updatedTask[0], 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//DELETE a single task
const deleteTask = createRoute({
  method: "delete",
  path: "/",
  description: "Delete a task by ID (user must own the task)",
  tags: ["Tasks"],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: paramsSchema,
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: z.object({ success: z.boolean(), message: z.string() }) },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Task not found or not owned by user",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

taskRoute.openapi(deleteTask, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    
    // Ensure the task exists and belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.taskId, id), eq(tasks.userId, user.id)))
      .limit(1);
    
    if (!existingTask.length) {
      return c.json({ success: false, message: 'Task not found or access denied' }, 404);
    }
    
    await db.delete(tasks).where(and(eq(tasks.taskId, id), eq(tasks.userId, user.id)));
    return c.json({ success: true, message: "Task deleted successfully" }, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//GET all subtasks for a task
const getSubtasksForTask = createRoute({
    method: "get",
    path: "/subtasks",
    description: "Get all subtasks for a task (user must own the task)",
    tags: ["Tasks"],
    security: [
      {
        Bearer: [],
      },
    ],
    request: {
        params: paramsSchema,
    },
    responses: {
        200: {
            description: "Successful response",
            content: {
                "application/json": { schema: z.array(selectSubtaskSchema) },
            },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": { schema: errorResponseSchema },
          },
        },
        404: {
          description: "Task not found or not owned by user",
          content: {
            "application/json": { schema: errorResponseSchema },
          },
        },
    },
});

taskRoute.openapi(getSubtasksForTask, async (c) => {
    try {
      const user = await authenticateUser(c);
      const { id } = c.req.valid("param");
      
      // Ensure the task exists and belongs to the user
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.taskId, id), eq(tasks.userId, user.id)))
        .limit(1);
      
      if (!existingTask.length) {
        return c.json({ success: false, message: 'Task not found or access denied' }, 404);
      }
      
      const taskSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, id));
      return c.json(taskSubtasks, 200);
    } catch (error) {
      if (error instanceof HTTPException) {
        return c.json({ success: false, message: error.message }, error.status as any);
      }
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
});
