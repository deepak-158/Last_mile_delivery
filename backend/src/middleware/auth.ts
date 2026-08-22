import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { Role } from '../types/enums';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

    prisma.user
      .findUnique({ where: { id: decoded.userId } })
      .then((user) => {
        if (!user) {
          res.status(401).json({ error: 'User not found.' });
          return;
        }

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };

        next();
      })
      .catch((err) => {
        console.error('Auth middleware DB error:', err);
        res.status(500).json({ error: 'Internal server error.' });
      });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
