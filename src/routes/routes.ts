import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { index, homeRoutes } from "./index.route";
import { Scalar } from "@scalar/hono-api-reference";
import { url } from "zod";
import { taskRoutes } from "./tasks/index.route";
import { subtaskRoutes } from "./subtasks/index.route";
import { reminderRoutes } from "./reminders/index.route";

const router = new OpenAPIHono()

//register index route
router.openapi(index, (c) => {
  return c.json({
    "message": 'Welcome to the Todolly Task Management Application!'
  })
})

//register docs route
router.doc('/doc', {
    openapi: "3.0.0",
    info:{
        title: "Todolly API",
        description: "API documentation for the Todolly Task Management Application",
        version: "1.0.0"
    }
})

//register scalar route
router.get('scalar', Scalar({url: "/doc", pageTitle:"Todolly API Documentation"}))

//register tasks routes
router.route('/tasks', taskRoutes)

//register subtasks routes
router.route('subtasks', subtaskRoutes)

//register reminders routes
router.route('reminders', reminderRoutes)

export default router;