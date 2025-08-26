import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from 'hono/http-exception';
import {
  insertReminderSchema,
  selectReminderSchema,
  errorResponseSchema,
} from "../../../database/zodSchemas";
import db from "../../../database";
import { reminders, tasks, userTable } from "../../../database/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "../../../database/lib/jwt";

const paramsSchema = z.object({
  id: z.string()
});

export const reminderRoute = new OpenAPIHono();

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

// Helper function to check if user owns the reminder through the parent task
const checkReminderOwnership = async (reminderId: string, userId: string) => {
  const result = await db
    .select({ taskUserId: tasks.userId })
    .from(reminders)
    .innerJoin(tasks, eq(reminders.taskId, tasks.taskId))
    .where(eq(reminders.reminderId, reminderId))
    .limit(1);
  
  return result.length > 0 && result[0].taskUserId === userId;
};

//GET a single reminder
const getReminder = createRoute({
  method: "get",
  path: "/",
  description: "Get a reminder by ID (user must own the parent task)",
  tags: ["Reminders"],
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
        "application/json": { schema: selectReminderSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Reminder not found or access denied",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

reminderRoute.openapi(getReminder, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    
    const hasAccess = await checkReminderOwnership(id, user.id);
    
    if (!hasAccess) {
      return c.json({ success: false, message: 'Reminder not found or access denied' }, 404);
    }
    
    const reminder = await db.select().from(reminders).where(eq(reminders.reminderId, id)).limit(1);
    
    if (!reminder.length) {
      return c.json({ success: false, message: 'Reminder not found' }, 404);
    }
    
    return c.json(reminder[0], 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//UPDATE a single reminder
const updateReminder = createRoute({
  method: "put",
  path: "/",
  description: "Update a reminder by ID (user must own the parent task)",
  tags: ["Reminders"],
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
          schema: insertReminderSchema.omit({ reminderId: true, taskId: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: selectReminderSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
    404: {
      description: "Reminder not found or access denied",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

reminderRoute.openapi(updateReminder, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    
    const hasAccess = await checkReminderOwnership(id, user.id);
    
    if (!hasAccess) {
      return c.json({ success: false, message: 'Reminder not found or access denied' }, 404);
    }
    
    const updatedReminder = await db
      .update(reminders)
      .set(data)
      .where(eq(reminders.reminderId, id))
      .returning();
    
    if (!updatedReminder.length) {
      return c.json({ success: false, message: 'Reminder not found' }, 404);
    }
    
    return c.json(updatedReminder[0], 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//DELETE a single reminder
const deleteReminder = createRoute({
  method: "delete",
  path: "/",
  description: "Delete a reminder by ID (user must own the parent task)",
  tags: ["Reminders"],
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
      description: "Reminder not found or access denied",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

reminderRoute.openapi(deleteReminder, async (c) => {
  try {
    const user = await authenticateUser(c);
    const { id } = c.req.valid("param");
    
    const hasAccess = await checkReminderOwnership(id, user.id);
    
    if (!hasAccess) {
      return c.json({ success: false, message: 'Reminder not found or access denied' }, 404);
    }
    
    const deleteResult = await db.delete(reminders).where(eq(reminders.reminderId, id)).returning();
    
    if (!deleteResult.length) {
      return c.json({ success: false, message: 'Reminder not found' }, 404);
    }
    
    return c.json({ success: true, message: "Reminder deleted successfully" }, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});
