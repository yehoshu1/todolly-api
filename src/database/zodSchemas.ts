import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { reminders, subtasks, tasks, userTable } from "./schema";
import z from 'zod';

//user Schemas
export const selectUserSchema = createSelectSchema(userTable);
export const insertUserSchema = createInsertSchema(userTable);

// Authentication schemas
export const registerSchema = z.object({
    email: z.string().email("Invalid email format").openapi({
        description: "User's email address",
        example: "user@example.com"
    }),
    name: z.string().min(1, "Name is required").openapi({
        description: "User's full name",
        example: "John Doe"
    }),
    password: z.string().min(6, "Password must be at least 6 characters").openapi({
        description: "User's password",
        example: "password123"
    })
}).openapi("RegisterRequest");

export const loginSchema = z.object({
    email: z.string().email("Invalid email format").openapi({
        description: "User's email address",
        example: "user@example.com"
    }),
    password: z.string().min(1, "Password is required").openapi({
        description: "User's password",
        example: "password123"
    })
}).openapi("LoginRequest");

export const authResponseSchema = z.object({
    success: z.boolean().openapi({
        description: "Authentication success status"
    }),
    message: z.string().openapi({
        description: "Response message"
    }),
    token: z.string().optional().openapi({
        description: "JWT token (only provided on successful login)"
    }),
    user: z.object({
        id: z.string(),
        email: z.string(),
        name: z.string()
    }).optional().openapi({
        description: "User information (only provided on successful authentication)"
    })
}).openapi("AuthResponse");

export const errorResponseSchema = z.object({
    success: z.boolean().default(false).openapi({
        description: "Operation success status"
    }),
    message: z.string().openapi({
        description: "Error message"
    })
}).openapi("ErrorResponse");

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
