import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import router from './routes/routes'

const app = new OpenAPIHono()

app.route('/', router)

export default app
