import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  insertReminderSchema,
  selectReminderSchema,
} from "../../database/zodSchemas";
import { reminderRoute } from "./reminder/index.route";
import db from "../../database";
import { reminders } from "../../database/schema";

export const reminderRoutes = new OpenAPIHono();

//setup routes for getting all reminder list items
const remindersRoute = createRoute({
  method: "get",
  path: "/",
  description: "Get all reminders",
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": { schema: z.array(selectReminderSchema) },
      },
    },
  },
});

reminderRoutes.openapi(remindersRoute, async (c) => {
  const allReminders = await db.select().from(reminders);
  return c.json(allReminders);
});

//setup route for creating a new reminder
const createReminder = createRoute({
  method: "post",
  path: "/",
  description: "Create a new reminder",
  request: {
    body: {
      content: {
        "application/json": {
          schema: insertReminderSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Successful response",
      content: {
        "application/json": { schema: selectReminderSchema },
      },
    },
  },
});

reminderRoutes.openapi(createReminder, async (c) => {
  const data = c.req.valid("body");
  const newReminder = await db.insert(reminders).values(data).returning();
  return c.json(newReminder[0], 201);
});

//routes for single reminder item
reminderRoutes.route("/".concat(":id"), reminderRoute);
