import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFound } from './common/middleware/errorHandler';

import ownerAuthRouter from './modules/owner-auth';
import employeeAuthRouter from './modules/employee-auth';
import { ownerEmployeeRouter, profileRouter } from './modules/employee';
import { ownerTaskRouter, employeeTaskRouter } from './modules/task';
import chatRouter from './modules/chat';

export const createApp = (): express.Application => {
  const app = express();

  app.use(helmet());

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, '');
        const isAllowed = allowedOrigins.some(allowed => {
          const normalizedAllowed = allowed.replace(/\/$/, '');
          return normalizedOrigin === normalizedAllowed;
        });

        if (isAllowed || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked request from origin: ${origin}`);
          callback(null, false);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', generalLimiter);
  app.use('/api/owner/create-new-access-code', otpLimiter);
  app.use('/api/employee/login-email', otpLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Skipli API is running 🚀',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
    });
  });

  app.use('/api/owner', ownerAuthRouter);
  app.use('/api/employee', employeeAuthRouter);
  app.use('/api/owner/employees', ownerEmployeeRouter);
  app.use('/api/employee', profileRouter);
  app.use('/api/owner/tasks', ownerTaskRouter);
  app.use('/api/employee/tasks', employeeTaskRouter);
  app.use('/api/chat', chatRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
