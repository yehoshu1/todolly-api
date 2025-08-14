import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
    insertTaskSchema,
    selectTaskSchema,
} from "../../../database/zodSchemas";
import db from "../../../database";
import { tasks } from "../../../database/schema";
import { eq } from "drizzle-orm";

const paramsSchema = z.object({
    id: z
        .string()
});

export const todoRoute = new OpenAPIHono();

//GET a single todo
const getTodo = createRoute({
    method: "get",
    path: "/",
    description: "Get a todo by ID",
    request: {
        params: paramsSchema,
    },
    responses: {
        200: {
            description: "Successful response",
            content: {
                "application/json": { schema: selectTaskSchema },
            },
        },
    },
});

todoRoute.openapi(getTodo, async (c) => {
    const { id } = c.req.valid("param");
    const todo = await db.select().from(tasks).where(eq(tasks.taskId, id));
    return c.json(todo[0]);
});

//CREATE a single todo
const createTodo = createRoute({
    method: "post",
    path: "/",
    description: "Create a new todo",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: insertTaskSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Successful response",
            content: {
                "application/json": { schema: selectTaskSchema },
            },
        },
    },
});

todoRoute.openapi(createTodo, async (c) => {
    const data = c.req.valid("json");
    const newTodo = await db.insert(tasks).values(data).returning();
    return c.json(newTodo[0], 201);
});

//UPDATE a single todo
const updateTodo = createRoute({
    method: "put",
    path: "/",
    description: "Update a todo by ID",
    request: {
        params: paramsSchema,
        body: {
            content: {
                "application/json": {
                    schema: insertTaskSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Task updated successfully",
            content: {
                "application/json": { schema: selectTaskSchema },
            },
        },
    },
});

todoRoute.openapi(updateTodo, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const updatedTodo = await db
        .update(tasks)
        .set(data)
        .where(eq(tasks.taskId, id))
        .returning();
    return c.json(updatedTodo[0]);
});

//DELETE a single todo
const deleteTodo = createRoute({
    method: "delete",
    path: "/",
    description: "Delete a todo by ID",
    request: {
        params: paramsSchema,
    },
    responses: {
        200: {
            description: "Successfully Deleted Item",
            content: {
                "application/json": { schema: z.object({ message: z.string() }) },
            },
        },
    },
});

todoRoute.openapi(deleteTodo, async (c) => {
    const { id } = c.req.valid("param");
    await db.delete(tasks).where(eq(tasks.taskId, id));
    return c.json({ message: "Todo deleted successfully" });
});



