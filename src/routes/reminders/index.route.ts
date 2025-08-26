import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from 'hono/http-exception';
import {
  insertReminderSchema,
  selectReminderSchema,
  errorResponseSchema,
} from "../../database/zodSchemas";
import { reminderRoute } from "./reminder/index.route";
import db from "../../database";
import { reminders, tasks, userTable } from "../../database/schema";
import { eq, inArray } from "drizzle-orm";
import { verifyToken } from "../../database/lib/jwt";
import { nanoid } from "nanoid";

export const reminderRoutes = new OpenAPIHono();

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

//setup routes for getting all reminder list items
const remindersRoute = createRoute({
  method: "get",
  path: "/",
  description: "Get all reminders for the authenticated user's tasks",
  tags: ["Reminders"],
  security: [
    {
      Bearer: [],
    },
  ],
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: z.array(selectReminderSchema) },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

reminderRoutes.openapi(remindersRoute, async (c) => {
  try {
    const user = await authenticateUser(c);
    
    // Get all user's task IDs first
    const userTasks = await db
      .select({ taskId: tasks.taskId })
      .from(tasks)
      .where(eq(tasks.userId, user.id));
    
    const taskIds = userTasks.map(task => task.taskId);
    
    if (taskIds.length === 0) {
      return c.json([], 200);
    }
    
    // Get reminders only for user's tasks
    const userReminders = await db
      .select()
      .from(reminders)
      .where(inArray(reminders.taskId, taskIds));
    
    return c.json(userReminders, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//setup route for creating a new reminder
const createReminder = createRoute({
  method: "post",
  path: "/",
  description: "Create a new reminder for a user's task",
  tags: ["Reminders"],
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertReminderSchema.omit({ reminderId: true }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Reminder created successfully",
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
    403: {
      description: "Forbidden - cannot create reminder for task not owned by user",
      content: {
        "application/json": { schema: errorResponseSchema },
      },
    },
  },
});

reminderRoutes.openapi(createReminder, async (c) => {
  try {
    const user = await authenticateUser(c);
    const data = c.req.valid("json");
    
    // Verify that the task belongs to the user
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.taskId, data.taskId))
      .limit(1);
    
    if (!task.length) {
      return c.json({ success: false, message: 'Task not found' }, 404);
    }
    
    if (task[0].userId !== user.id) {
      return c.json({ success: false, message: 'Cannot create reminder for task not owned by you' }, 403);
    }
    
    const reminderData = {
      ...data,
      reminderId: nanoid(),
    };
    
    const newReminder = await db.insert(reminders).values(reminderData).returning();
    return c.json(newReminder[0], 201);
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ success: false, message: error.message }, error.status as any);
    }
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
});

//routes for single reminder item
reminderRoutes.route("/".concat(":id"), reminderRoute);

