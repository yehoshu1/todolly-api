import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("users", {
    id: text("id").primaryKey().unique(),
    email: text("email").unique().notNull(),
    name: text("name").notNull(),
    password: text("password").notNull(),
});


export const tasks = sqliteTable("tasks", {
  taskId: text("task_id").primaryKey().unique(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"), // Store DATE as ISO string (YYYY-MM-DD)
  dueTime: text("due_time"), // Store TIME as HH:MM:SS
  location: text("location"),
  status: int("status", {mode: "boolean"}).notNull().default(false),
  priority: text("priority"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});


export const subtasks = sqliteTable("subtasks", {
  subtaskId: text("subtask_id").primaryKey().unique(),
  taskId: int("task_id")
    .notNull()
    .references(() => tasks.taskId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: int("status", {mode: "boolean"}).notNull().default(false),
  priority: text("priority"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});


export const reminders = sqliteTable("reminders", {
  reminderId: text("reminder_id").primaryKey().unique(),
  taskId: int("task_id")
    .notNull()
    .references(() => tasks.taskId, { onDelete: "cascade" }),
  remindAt: text("remind_at").notNull(), // Store DATETIME as ISO 8601 string
  message: text("message"),
});

