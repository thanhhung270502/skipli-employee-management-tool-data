import Joi from "joi";
import type { CreateTaskRequest } from "./task.model";

export const createTaskSchema = Joi.object<CreateTaskRequest>({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().optional().allow(""),
  assignedTo: Joi.string().trim().required(),
  dueDate: Joi.string().isoDate().optional(),
});

export const validateCreateTask = (body: unknown) =>
  createTaskSchema.validate(body, { abortEarly: false, stripUnknown: true });
