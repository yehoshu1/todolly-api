import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verifyToken } from '../database/lib/jwt';
import db from '../database';
import { userTable } from '../database/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedContext extends Context {
    user: {
        id: string;
        email: string;
        name: string;
    };
}

export const authMiddleware = async (c: Context, next: Next) => {
    try {
        const authHeader = c.req.header('Authorization');
        
        if (!authHeader) {
            throw new HTTPException(401, {
                message: 'Authorization header is required'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            throw new HTTPException(401, {
                message: 'Token is required'
            });
        }

        // Verify the token
        const decoded = verifyToken(token);
        
        if (typeof decoded === 'string' || !decoded.id) {
            throw new HTTPException(401, {
                message: 'Invalid token format'
            });
        }

        // Get user from database
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
            throw new HTTPException(401, {
                message: 'User not found'
            });
        }

        // Add user to context
        c.set('user', user[0]);
        
        await next();
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }
        
        throw new HTTPException(401, {
            message: 'Invalid or expired token'
        });
    }
};

// Helper function to get authenticated user from context
export const getAuthenticatedUser = (c: Context) => {
    const user = c.get('user');
    if (!user) {
        throw new HTTPException(401, {
            message: 'User not authenticated'
        });
    }
    return user;
};
