import { Response, NextFunction } from "express";
import { AuthRequest, JwtEmployeePayload } from "../../common/types";
import {
  getValidationMessage,
  handleControllerError,
} from "../../common/utils/controller.util";
import { resolvePaginationParams } from "../../common/validators/pagination.validator";
import { validateCreateTask, validateUpdateTask, validateListTasksQuery } from "./task.validator";
import * as taskService from "./task.service";
import { emitTaskUpdated } from "./task.socket";
import type { ETaskStatus } from "./task.model";

const buildListTasksOptions = (query: Record<string, unknown>) => {
  const { error, value } = validateListTasksQuery(query);
  if (error) {
    return { error: getValidationMessage(error) };
  }

  return {
    options: {
      pagination: resolvePaginationParams(value),
      status: value.status as ETaskStatus | undefined,
    },
  };
};

const buildTasksResponse = (
  result: Awaited<ReturnType<typeof taskService.listAllTasks>>,
  pagination: ReturnType<typeof resolvePaginationParams>
) => ({
  success: true,
  tasks: result.data,
  total_record: result.total_record,
  ...(pagination ? { limit: pagination.limit, offset: pagination.offset } : {}),
});

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateCreateTask(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    const { taskId, task } = await taskService.createTask(value);

    const io = req.app.get("io");
    if (io) {
      emitTaskUpdated(io, task);
    }

    res.status(201).json({ success: true, taskId, task });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const listAllTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = buildListTasksOptions(req.query as Record<string, unknown>);
    if ("error" in parsed) {
      res.status(400).json({ success: false, message: parsed.error });
      return;
    }

    const result = await taskService.listAllTasks(parsed.options);
    res.json(buildTasksResponse(result, parsed.options.pagination));
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const listMyTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = buildListTasksOptions(req.query as Record<string, unknown>);
    if ("error" in parsed) {
      res.status(400).json({ success: false, message: parsed.error });
      return;
    }

    const user = req.user as JwtEmployeePayload;
    const result = await taskService.listMyTasks(user.employeeId, parsed.options);
    res.json(buildTasksResponse(result, parsed.options.pagination));
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const markTaskInProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as JwtEmployeePayload;
    const { taskId } = req.params;

    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }

    const updatedTask = await taskService.markTaskInProgress(taskId, user.employeeId);

    const io = req.app.get("io");
    if (io) {
      emitTaskUpdated(io, updatedTask);
    }

    res.json({ success: true, message: "Task marked as in progress", task: updatedTask });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const markTaskDone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as JwtEmployeePayload;
    const { taskId } = req.params;

    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }

    const updatedTask = await taskService.markTaskDone(taskId, user.employeeId);

    const io = req.app.get("io");
    if (io) {
      emitTaskUpdated(io, updatedTask);
    }

    res.json({ success: true, message: "Task marked as done", task: updatedTask });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const markTaskPending = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as JwtEmployeePayload;
    const { taskId } = req.params;

    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }

    const updatedTask = await taskService.markTaskPending(taskId, user.employeeId);

    const io = req.app.get("io");
    if (io) {
      emitTaskUpdated(io, updatedTask);
    }

    res.json({ success: true, message: "Task marked as pending", task: updatedTask });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }

    const { error, value } = validateUpdateTask(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    const updatedTask = await taskService.updateTask(taskId, value);

    const io = req.app.get("io");
    if (io) {
      emitTaskUpdated(io, updatedTask);
    }

    res.json({ success: true, task: updatedTask });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }

    const deletedTask = await taskService.deleteTask(taskId);

    const io = req.app.get("io");
    if (io) {
      emitTaskUpdated(io, deletedTask, true);
    }

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};
