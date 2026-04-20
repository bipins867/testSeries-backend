import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../errors';

/**
 * JWT payload shape encoded in access tokens.
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Extends Express Request with authenticated user data.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Middleware that verifies the JWT access token from the Authorization header.
 * Attaches `req.user` on success.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired token'));
      return;
    }
    next(err);
  }
}

/**
 * Optional authentication — attaches user if token exists, but doesn't block.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    // Token invalid — proceed as unauthenticated
    next();
  }
}
