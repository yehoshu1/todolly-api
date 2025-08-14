import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  insertTaskSchema,
  selectSubtaskSchema,
  selectTaskSchema,
} from "../../../database/zodSchemas";
import db from "../../../database";
import { subtasks, tasks } from "../../../database/schema";
import { eq } from "drizzle-orm";

const paramsSchema = z.object({
  id: z
    .string()
});

export const taskRoute = new OpenAPIHono();

//GET a single task
const getTask = createRoute({
  method: "get",
  path: "/:id",
  description: "Get a task by ID",
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
  },
});

taskRoute.openapi(getTask, async (c) => {
  const { id } = c.req.valid("param");
  console.log("Fetching task with ID:", id);
  const task = await db.select().from(tasks).where(eq(tasks.taskId, id));
  return c.json(task[0]);
});

//UPDATE a single task
const updateTask = createRoute({
  method: "put",
  path: "/{id}",
  description: "Update a task by ID",
  request: {
    params: paramsSchema,
    body: {
      content: {
        "application/json": {
          schema: insertTaskSchema,
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
  },
});

taskRoute.openapi(updateTask, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const updatedTask = await db
    .update(tasks)
    .set(data)
    .where(eq(tasks.taskId, id))
    .returning();
  return c.json(updatedTask[0]);
});

//DELETE a single task
const deleteTask = createRoute({
  method: "delete",
  path: "/{id}",
  description: "Delete a task by ID",
  request: {
    params: paramsSchema,
  },
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: z.object({ message: z.string() }) },
      },
    },
  },
});

taskRoute.openapi(deleteTask, async (c) => {
  const { id } = c.req.valid("param");
  await db.delete(tasks).where(eq(tasks.taskId, id));
  return c.json({ message: "Task deleted successfully" });
});

//GET all subtasks for a task
const getSubtasksForTask = createRoute({
    method: "get",
    path: "/{id}/subtasks",
    description: "Get all subtasks for a task",
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
    },
});

taskRoute.openapi(getSubtasksForTask, async (c) => {
    const { id } = c.req.valid("param");
    const taskSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, id));
    return c.json(taskSubtasks);
});
