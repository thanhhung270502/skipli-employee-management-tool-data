import Joi from "joi";
import type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  UpdateProfileRequest,
} from "./employee.model";

export const createEmployeeSchema = Joi.object<CreateEmployeeRequest>({
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  department: Joi.string().trim().required(),
  phone: Joi.string().trim().optional().allow(""),
  role: Joi.string().trim().optional(),
  workSchedule: Joi.object({
    days: Joi.array().items(Joi.string()).required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
  })
    .optional()
    .allow(null),
});

export const updateEmployeeSchema = Joi.object<UpdateEmployeeRequest>({
  name: Joi.string().trim().optional(),
  email: Joi.string().trim().email().optional(),
  phone: Joi.string().trim().optional(),
  department: Joi.string().trim().optional(),
  role: Joi.string().trim().optional(),
  workSchedule: Joi.object({
    days: Joi.array().items(Joi.string()).required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
  })
    .optional()
    .allow(null),
});

export const updateProfileSchema = Joi.object<UpdateProfileRequest>({
  name: Joi.string().trim().optional(),
  phone: Joi.string().trim().optional(),
  email: Joi.string().trim().email().optional(),
});

export const validateCreateEmployee = (body: unknown) =>
  createEmployeeSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

export const validateUpdateEmployee = (body: unknown) =>
  updateEmployeeSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

export const validateUpdateProfile = (body: unknown) =>
  updateProfileSchema.validate(body, { abortEarly: false, stripUnknown: true });
