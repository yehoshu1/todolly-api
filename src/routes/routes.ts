import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { index } from "./index.route";
import { Scalar } from "@scalar/hono-api-reference";
import { url } from "zod";

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

//register notfound
router.notFound((c) => {
    return c.json({
        message: "Route not found"
    }, 404)
})

//register onerror
router.onError((err, c) => {
    console.log(err);
    return c.json({
        message: "Internal server error"
    }, 500)
})

export default router;