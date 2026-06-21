import { Request } from 'express';

export interface JwtOwnerPayload {
  phoneNumber: string;
  role: 'owner';
  iat?: number;
  exp?: number;
}

export interface JwtEmployeePayload {
  employeeId: string;
  email: string;
  role: 'employee';
  iat?: number;
  exp?: number;
}

export type JwtPayload = JwtOwnerPayload | JwtEmployeePayload;

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}

export type {
  PageableResponse,
  PaginationQueryParams,
} from "./pagination";
export {
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from "./pagination";
