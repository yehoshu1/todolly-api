import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  insertSubtaskSchema,
  selectSubtaskSchema,
} from "../../database/zodSchemas";
import { subtaskRoute } from "./subtask/index.route";
import db from "../../database";
import { subtasks } from "../../database/schema";

export const subtaskRoutes = new OpenAPIHono();



//setup route for creating a new subtask
const createSubtask = createRoute({
  method: "post",
  path: "/",
  description: "Create a new subtask",
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertSubtaskSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successful response",
      content: {
        "application/json": { schema: selectSubtaskSchema },
      },
    },
  },
});

subtaskRoutes.openapi(createSubtask, async (c) => {
  const data = c.req.valid("json");
  const newSubtask = await db.insert(subtasks).values(data).returning();
  return c.json(newSubtask[0], 201);
});

