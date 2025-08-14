import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  insertReminderSchema,
  selectReminderSchema,
} from "../../../database/zodSchemas";
import db from "../../../database";
import { reminders } from "../../../database/schema";
import { eq } from "drizzle-orm";

const paramsSchema = z.object({
  id: z
    .string()
    .refine((val) => !isNaN(parseInt(val, 10)), { message: "Id must be a number" })
    .transform((val) => parseInt(val, 10)),
});

export const reminderRoute = new OpenAPIHono();

//GET a single reminder
const getReminder = createRoute({
  method: "get",
  path: "/{id}",
  description: "Get a reminder by ID",
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
  },
});

reminderRoute.openapi(getReminder, async (c) => {
  const { id } = c.req.valid("param");
  const reminder = await db.select().from(reminders).where(eq(reminders.reminderId, id));
  return c.json(reminder[0]);
});

//UPDATE a single reminder
const updateReminder = createRoute({
  method: "put",
  path: "/{id}",
  description: "Update a reminder by ID",
  request: {
    params: paramsSchema,
    body: {
      content: {
        "application/json": {
          schema: insertReminderSchema,
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
  },
});

reminderRoute.openapi(updateReminder, async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("body");
  const updatedReminder = await db
    .update(reminders)
    .set(data)
    .where(eq(reminders.reminderId, id))
    .returning();
  return c.json(updatedReminder[0]);
});

//DELETE a single reminder
const deleteReminder = createRoute({
  method: "delete",
  path: "/{id}",
  description: "Delete a reminder by ID",
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

reminderRoute.openapi(deleteReminder, async (c) => {
  const { id } = c.req.valid("param");
  await db.delete(reminders).where(eq(reminders.reminderId, id));
  return c.json({ message: "Reminder deleted successfully" });
});
