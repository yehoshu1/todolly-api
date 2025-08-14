import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import router from './routes/routes'

const app = new OpenAPIHono()

app.route('/', router)

app.notFound((c) => {
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

export default app
