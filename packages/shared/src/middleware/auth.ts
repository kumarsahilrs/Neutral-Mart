import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole, errorResponse } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// HS256 with INTERNAL_SERVICE_SECRET — works on Railway without RSA key format issues
function getJwtSecret(): string {
  return (process.env.INTERNAL_SERVICE_SECRET || 'nm-jwt-secret-2026').replace(/['"]/g, '');
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json(errorResponse('Authentication required', 'AUTH_REQUIRED'));
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json(errorResponse('Invalid or expired token', 'TOKEN_INVALID'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(errorResponse('Authentication required', 'AUTH_REQUIRED'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json(errorResponse('Insufficient permissions', 'FORBIDDEN'));
      return;
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      req.user = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;
    } catch {
      // ignore — optional auth
    }
  }
  next();
}
