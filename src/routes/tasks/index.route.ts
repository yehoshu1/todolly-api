import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  insertTaskSchema,
  selectTaskSchema,
} from "../../database/zodSchemas";
import db from "../../database";
import { tasks } from "../../database/schema";

export const taskRoutes = new OpenAPIHono();

//setup routes for getting all task list items
const getTasks = createRoute({
  method: "get",
  path: "/",
  description: "Get all tasks",
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: z.array(selectTaskSchema) },
      },
    },
  },
});

taskRoutes.openapi(getTasks, async (c) => {
  const allTasks = await db.select().from(tasks);
  return c.json(allTasks);
});

//setup route for creating a new task
const createTask = createRoute({
  method: "post",
  path: "/",
  description: "Create a new task",
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertTaskSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successful response",
      content: {
        "application/json": { schema: selectTaskSchema },
      },
    },
  },
});

taskRoutes.openapi(createTask, async (c) => {
  const data = c.req.valid("json");
  const newTask = await db.insert(tasks).values(data).returning();
  return c.json(newTask[0], 201);
});

