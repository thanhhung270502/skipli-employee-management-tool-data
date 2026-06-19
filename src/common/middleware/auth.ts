import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, JwtOwnerPayload, JwtEmployeePayload, AuthRequest } from '../types';

export const generateToken = (
  payload: Omit<JwtOwnerPayload, 'iat' | 'exp'> | Omit<JwtEmployeePayload, 'iat' | 'exp'>
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireOwner = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'owner') {
    res.status(403).json({ success: false, message: 'Owner access required' });
    return;
  }
  next();
};

export const requireEmployee = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'employee') {
    res.status(403).json({ success: false, message: 'Employee access required' });
    return;
  }
  next();
};
