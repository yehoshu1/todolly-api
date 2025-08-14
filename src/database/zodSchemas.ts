import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { reminders, subtasks, tasks, userTable } from "./schema";

//user Schemas
export const selectUserSchema = createSelectSchema(userTable);
export const insertUserSchema = createInsertSchema(userTable);

//task schemas
export const selectTaskSchema = createSelectSchema(tasks);
export const insertTaskSchema = createInsertSchema(tasks);

//subtask schemas
export const selectSubtaskSchema = createSelectSchema(subtasks);
export const insertSubtaskSchema = createInsertSchema(subtasks);

//reminder schemas
export const selectReminderSchema = createSelectSchema(reminders);
export const insertReminderSchema = createInsertSchema(reminders);

