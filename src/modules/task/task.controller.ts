import { Response, NextFunction } from "express";
import { AuthRequest, JwtEmployeePayload } from "../../common/types";
import {
  getValidationMessage,
  handleControllerError,
} from "../../common/utils/controller.util";
import { validateCreateTask, validateUpdateTask } from "./task.validator";
import * as taskService from "./task.service";

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
    res.status(201).json({ success: true, taskId, task });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const listAllTasks = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tasks = await taskService.listAllTasks();
    res.json({ success: true, tasks });
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
    const user = req.user as JwtEmployeePayload;
    const tasks = await taskService.listMyTasks(user.employeeId);
    res.json({ success: true, tasks });
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

    await taskService.markTaskInProgress(taskId, user.employeeId);
    res.json({ success: true, message: "Task marked as in progress" });
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

    await taskService.markTaskDone(taskId, user.employeeId);
    res.json({ success: true, message: "Task marked as done" });
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

    await taskService.deleteTask(taskId);
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

