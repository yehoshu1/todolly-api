import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { reminders, subtasks, tasks, userTable } from "./schema";

//user Schemas
export const userSelectSchema = createSelectSchema(userTable);
export const userInsertSchema = createInsertSchema(userTable);

//task schemas
export const taskSelectSchema = createSelectSchema(tasks);
export const taskInsertSchema = createInsertSchema(tasks);

//subtask schemas
export const subtaskSelectSchema = createSelectSchema(subtasks);
export const subtaskInsertSchema = createInsertSchema(subtasks);

//reminder schemas
export const reminderSelectSchema = createSelectSchema(reminders);
export const reminderInsertSchema = createInsertSchema(reminders);

