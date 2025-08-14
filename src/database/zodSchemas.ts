import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { reminders, subtasks, tasks, userTable } from "./schema";
import z from 'zod';

//user Schemas
export const selectUserSchema = createSelectSchema(userTable);
export const insertUserSchema = createInsertSchema(userTable);

//task schemas
const baseSelectTaskSchema = createSelectSchema(tasks);
export const selectTaskSchema = z.object({
    ...baseSelectTaskSchema.shape
}).openapi("tasks");

const baseInsertTaskSchema = createInsertSchema(tasks);
export const insertTaskSchema = z.object({
    ...baseInsertTaskSchema.shape
}).openapi("tasks");

//subtask schemas
const baseSelectSubtaskSchema = createSelectSchema(subtasks);
export const selectSubtaskSchema = z.object({
    ...baseSelectSubtaskSchema.shape
}).openapi("subtasks");

const baseInsertSubtaskSchema = createInsertSchema(subtasks);
export const insertSubtaskSchema = z.object({
    ...baseInsertSubtaskSchema.shape
}).openapi("subtasks");

//reminder schemas
const baseSelectReminderSchema = createSelectSchema(reminders);
export const selectReminderSchema = z.object({
    ...baseSelectReminderSchema.shape
}).openapi("reminders");

const baseInsertReminderSchema = createInsertSchema(reminders);
export const insertReminderSchema = z.object({
    ...baseInsertReminderSchema.shape
}).openapi("reminders");
