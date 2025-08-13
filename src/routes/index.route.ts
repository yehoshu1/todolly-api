import { createRoute, z } from "@hono/zod-openapi";

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