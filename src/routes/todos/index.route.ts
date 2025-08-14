import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { selectTaskSchema } from "../../database/zodSchemas";


const todoroutes = new OpenAPIHono()

const paramsSchema = z.object({
    id: z.string(),
})

const todo = createRoute({
    method: 'get',
    path: '/todos/:id',
    description: 'Get a todo by ID',
    request: {
        params: paramsSchema,
    },
    responses: {
        200: {
            description: 'Successful response',
            content: {
                'application/json': { schema: z.object(selectTaskSchema) },
            },
        },
    },
})
