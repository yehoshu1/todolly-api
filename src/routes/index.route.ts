import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

export const homeRoutes = new OpenAPIHono();

export const index = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: "Todolly Index Route",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string()
          })
        }
      }
    }
  }
});

homeRoutes.openapi(index, (c) => {
  return c.json({
    "message": 'Welcome to the Todolly Task Management Application!'
  })
})
