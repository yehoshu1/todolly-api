import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import db from "../../database";
import { userTable } from "../../database/schema";
import { 
    registerSchema, 
    loginSchema, 
    authResponseSchema, 
    errorResponseSchema 
} from "../../database/zodSchemas";
import { hashPassword, comparePasswords } from "../../database/lib/hash";
import { generateToken, verifyToken } from "../../database/lib/jwt";
import { nanoid } from 'nanoid';

export const authRoutes = new OpenAPIHono();

// Helper function to authenticate user (inline for better type safety)
const authenticateUser = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    throw new HTTPException(401, { message: 'Authorization header is required' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new HTTPException(401, { message: 'Token is required' });
  }

  const decoded = verifyToken(token);
  
  if (typeof decoded === 'string' || !decoded.id) {
    throw new HTTPException(401, { message: 'Invalid token format' });
  }

  const user = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name
    })
    .from(userTable)
    .where(eq(userTable.id, decoded.id))
    .limit(1);

  if (!user.length) {
    throw new HTTPException(401, { message: 'User not found' });
  }

  return user[0];
};

// Register route
const register = createRoute({
    method: "post",
    path: "/register",
    description: "Register a new user account",
    tags: ["Authentication"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: registerSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "User registered successfully",
            content: {
                "application/json": { 
                    schema: authResponseSchema 
                },
            },
        },
        400: {
            description: "Registration failed - validation error or user already exists",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
    },
});

authRoutes.openapi(register, async (c) => {
    try {
        const { email, name, password } = c.req.valid('json');

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return c.json({
                success: false,
                message: 'User with this email already exists'
            }, 400);
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const userId = nanoid();
        const newUser = await db
            .insert(userTable)
            .values({
                id: userId,
                email,
                name,
                password: hashedPassword,
            })
            .returning({
                id: userTable.id,
                email: userTable.email,
                name: userTable.name,
            });

        // Generate JWT token
        const token = generateToken(userId);

        return c.json({
            success: true,
            message: 'User registered successfully',
            token,
            user: newUser[0]
        }, 201);

    } catch (error) {
        console.error('Registration error:', error);
        return c.json({
            success: false,
            message: 'Internal server error during registration'
        }, 500);
    }
});

// Login route
const login = createRoute({
    method: "post",
    path: "/login",
    description: "Login with email and password",
    tags: ["Authentication"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: loginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Login successful",
            content: {
                "application/json": { 
                    schema: authResponseSchema 
                },
            },
        },
        401: {
            description: "Login failed - invalid credentials",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
    },
});

authRoutes.openapi(login, async (c) => {
    try {
        const { email, password } = c.req.valid('json');

        // Find user by email
        const user = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        if (!user.length) {
            return c.json({
                success: false,
                message: 'Invalid email or password'
            }, 401);
        }

        // Verify password
        const isValidPassword = await comparePasswords(password, user[0].password);
        
        if (!isValidPassword) {
            return c.json({
                success: false,
                message: 'Invalid email or password'
            }, 401);
        }

        // Generate JWT token
        const token = generateToken(user[0].id);

        return c.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user[0].id,
                email: user[0].email,
                name: user[0].name
            }
        }, 200);

    } catch (error) {
        console.error('Login error:', error);
        return c.json({
            success: false,
            message: 'Internal server error during login'
        }, 500);
    }
});

// Get current user profile (protected route)
const profile = createRoute({
    method: "get",
    path: "/profile",
    description: "Get current user profile (requires authentication)",
    tags: ["Authentication"],
    security: [
        {
            Bearer: [],
        },
    ],
    responses: {
        200: {
            description: "User profile retrieved successfully",
            content: {
                "application/json": { 
                    schema: z.object({
                        success: z.literal(true),
                        user: z.object({
                            id: z.string(),
                            email: z.string(),
                            name: z.string()
                        })
                    })
                },
            },
        },
        401: {
            description: "Unauthorized - invalid or missing token",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
    },
});

authRoutes.get('/profile', async (c) => {
    try {
        const user = await authenticateUser(c);
        
        return c.json({
            success: true,
            user
        });
    } catch (error) {
        if (error instanceof HTTPException) {
            return c.json({
                success: false,
                message: error.message
            }, error.status);
        }

        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
});

// Logout route (mainly for documentation, JWT is stateless)
const logout = createRoute({
    method: "post",
    path: "/logout",
    description: "Logout user (for JWT, this is mainly informational - client should discard the token)",
    tags: ["Authentication"],
    security: [
        {
            Bearer: [],
        },
    ],
    responses: {
        200: {
            description: "Logout successful",
            content: {
                "application/json": { 
                    schema: z.object({
                        success: z.boolean(),
                        message: z.string()
                    })
                },
            },
        },
        401: {
            description: "Unauthorized - invalid or missing token",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { 
                    schema: errorResponseSchema 
                },
            },
        },
    },
});

authRoutes.post('/logout', async (c) => {
    try {
        await authenticateUser(c); // Verify the user is authenticated
        
        return c.json({
            success: true,
            message: 'Logout successful. Please discard your token on the client side.'
        });
    } catch (error) {
        if (error instanceof HTTPException) {
            return c.json({
                success: false,
                message: error.message
            }, error.status);
        }

        return c.json({
            success: false,
            message: 'Internal server error'
        }, 500);
    }
});