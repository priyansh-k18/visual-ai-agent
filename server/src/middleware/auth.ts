import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-for-jwt') as { sessionId: string };
    
    // Attach the sessionId to the request
    (req as any).sessionId = decoded.sessionId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' });
  }
};
