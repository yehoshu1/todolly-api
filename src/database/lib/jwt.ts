import * as jwt from 'jsonwebtoken';
import { HTTPException } from 'hono/http-exception';

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const generateToken = (userId: string): string => {
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
  return token;
};

export const verifyToken = (token: string): string | jwt.JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid token format' });
  }
};
