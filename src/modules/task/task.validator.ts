import Joi from "joi";
import type { CreateTaskRequest } from "./task.model";

export const createTaskSchema = Joi.object<CreateTaskRequest>({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().optional().allow(""),
  assignedTo: Joi.string().trim().required(),
  dueDate: Joi.string().isoDate().optional().allow(null, ""),
  priority: Joi.string().valid("low", "medium", "high").default("medium").optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().trim().optional(),
  description: Joi.string().trim().optional().allow(""),
  assignedTo: Joi.string().trim().optional(),
  dueDate: Joi.string().isoDate().optional().allow(null, ""),
  priority: Joi.string().valid("low", "medium", "high").optional(),
  status: Joi.string().valid("pending", "in_progress", "done").optional(),
});

export const validateCreateTask = (body: unknown) =>
  createTaskSchema.validate(body, { abortEarly: false, stripUnknown: true });

export const validateUpdateTask = (body: unknown) =>
  updateTaskSchema.validate(body, { abortEarly: false, stripUnknown: true });

