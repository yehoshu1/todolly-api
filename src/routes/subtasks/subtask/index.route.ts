import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from 'hono/http-exception';
import {
  insertSubtaskSchema,
  selectSubtaskSchema,
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

export const subtaskRoute = new OpenAPIHono();

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

// Helper function to check if user owns the subtask through the parent task
const checkSubtaskOwnership = async (subtaskId: string, userId: string) => {
  const result = await db
    .select({ taskUserId: tasks.userId })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.taskId))
    .where(eq(subtasks.subtaskId, subtaskId))
    .limit(1);
  
  return result.length > 0 && result[0].taskUserId === userId;
};

//GET a single subtask
const getSubtask = createRoute({
  method: "get",
  path: "/",
  description: "Get a subtask by ID (user must own the parent task)",
  tags: ["Subtasks"],
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
        "application/json": { schema: selectSubtaskSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Subtask not found or access denied",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

subtaskRoute.openapi(getSubtask, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    
    const hasAccess = await checkSubtaskOwnership(id, user.id);
    
    if (!hasAccess) {
      return c.json({ success: false, message: 'Subtask not found or access denied' }, 404);
    }
    
    const subtask = await db.select().from(subtasks).where(eq(subtasks.subtaskId, id)).limit(1);
    
    if (!subtask.length) {
      return c.json({ success: false, message: 'Subtask not found' }, 404);
    }
    
    return c.json(subtask[0], 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//UPDATE a single subtask
const updateSubtask = createRoute({
  method: "put",
  path: "/",
  description: "Update a subtask by ID (user must own the parent task)",
  tags: ["Subtasks"],
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
          schema: insertSubtaskSchema.omit({ subtaskId: true, taskId: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: selectSubtaskSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Subtask not found or access denied",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

subtaskRoute.openapi(updateSubtask, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    
    const hasAccess = await checkSubtaskOwnership(id, user.id);
    
    if (!hasAccess) {
      return c.json({ success: false, message: 'Subtask not found or access denied' }, 404);
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    const updatedSubtask = await db
      .update(subtasks)
      .set(updatedData)
      .where(eq(subtasks.subtaskId, id))
      .returning();
    
    if (!updatedSubtask.length) {
      return c.json({ success: false, message: 'Subtask not found' }, 404);
    }
    
    return c.json(updatedSubtask[0], 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//DELETE a single subtask
const deleteSubtask = createRoute({
  method: "delete",
  path: "/",
  description: "Delete a subtask by ID (user must own the parent task)",
  tags: ["Subtasks"],
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
      description: "Subtask not found or access denied",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

subtaskRoute.openapi(deleteSubtask, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    
    const hasAccess = await checkSubtaskOwnership(id, user.id);
    
    if (!hasAccess) {
      return c.json({ success: false, message: 'Subtask not found or access denied' }, 404);
    }
    
    const deleteResult = await db.delete(subtasks).where(eq(subtasks.subtaskId, id)).returning();
    
    if (!deleteResult.length) {
      return c.json({ success: false, message: 'Subtask not found' }, 404);
    }
    
    return c.json({ success: true, message: "Subtask deleted successfully" }, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});
