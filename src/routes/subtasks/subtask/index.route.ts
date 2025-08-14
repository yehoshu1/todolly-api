import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  insertSubtaskSchema,
  selectSubtaskSchema,
} from "../../../database/zodSchemas";
import db from "../../../database";
import { subtasks } from "../../../database/schema";
import { eq } from "drizzle-orm";

const paramsSchema = z.object({
  id: z
    .string()
});

export const subtaskRoute = new OpenAPIHono();

//GET a single subtask
const getSubtask = createRoute({
  method: "get",
  path: "/",
  description: "Get a subtask by ID",
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
  },
});

subtaskRoute.openapi(getSubtask, async (c) => {
  const { id } = c.req.valid("param");
  const subtask = await db.select().from(subtasks).where(eq(subtasks.subtaskId, id));
  return c.json(subtask[0]);
});

//UPDATE a single subtask
const updateSubtask = createRoute({
  method: "put",
  path: "/{id}",
  description: "Update a subtask by ID",
  request: {
    params: paramsSchema,
    body: {
      content: {
        "application/json": {
          schema: insertSubtaskSchema,
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
  },
});

subtaskRoute.openapi(updateSubtask, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const updatedSubtask = await db
    .update(subtasks)
    .set(data)
    .where(eq(subtasks.subtaskId, id))
    .returning();
  return c.json(updatedSubtask[0]);
});

//DELETE a single subtask
const deleteSubtask = createRoute({
  method: "delete",
  path: "/{id}",
  description: "Delete a subtask by ID",
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

subtaskRoute.openapi(deleteSubtask, async (c) => {
  const { id } = c.req.valid("param");
  await db.delete(subtasks).where(eq(subtasks.subtaskId, id));
  return c.json({ message: "Subtask deleted successfully" });
});
