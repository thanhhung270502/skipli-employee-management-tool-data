import { Router } from "express";
import {
  authenticateToken,
  requireEmployee,
  requireOwner,
} from "../../common/middleware/auth";
import * as taskController from "./task.controller";

export const ownerTaskRouter = Router();

ownerTaskRouter.post(
  "/",
  authenticateToken,
  requireOwner,
  taskController.createTask
);
ownerTaskRouter.get(
  "/",
  authenticateToken,
  requireOwner,
  taskController.listAllTasks
);
ownerTaskRouter.put(
  "/:taskId",
  authenticateToken,
  requireOwner,
  taskController.updateTask
);
ownerTaskRouter.delete(
  "/:taskId",
  authenticateToken,
  requireOwner,
  taskController.deleteTask
);

export const employeeTaskRouter = Router();

employeeTaskRouter.get(
  "/",
  authenticateToken,
  requireEmployee,
  taskController.listMyTasks
);
employeeTaskRouter.put(
  "/:taskId/in-progress",
  authenticateToken,
  requireEmployee,
  taskController.markTaskInProgress
);
employeeTaskRouter.put(
  "/:taskId/done",
  authenticateToken,
  requireEmployee,
  taskController.markTaskDone
);

