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

export const employeeTaskRouter = Router();

employeeTaskRouter.get(
  "/",
  authenticateToken,
  requireEmployee,
  taskController.listMyTasks
);
employeeTaskRouter.put(
  "/:taskId/done",
  authenticateToken,
  requireEmployee,
  taskController.markTaskDone
);
