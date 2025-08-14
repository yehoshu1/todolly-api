import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  insertTaskSchema,
  selectTaskSchema,
} from "../../database/zodSchemas";
import { todoRoute } from "./todo/index.route";
import db from "../../database";
import { tasks } from "../../database/schema";

export const todoRoutes = new OpenAPIHono();

//setup routes for getting all todo list items
const todos = createRoute({
  method: "get",
  path: "/",
  description: "Get all todos",
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: z.array(selectTaskSchema) },
      },
    },
  },
});

todoRoutes.openapi(todos, async (c) => {
  const allTasks = await db.select().from(tasks);
  return c.json(allTasks);
});

//routes for single todo item
todoRoutes.route("/".concat(":id"), todoRoute);
