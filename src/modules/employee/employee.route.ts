import { Router } from "express";
import {
  authenticateToken,
  requireEmployee,
  requireOwner,
} from "../../common/middleware/auth";
import * as employeeController from "./employee.controller";

export const ownerEmployeeRouter = Router();

ownerEmployeeRouter.get(
  "/",
  authenticateToken,
  requireOwner,
  employeeController.listEmployees
);
ownerEmployeeRouter.post(
  "/",
  authenticateToken,
  requireOwner,
  employeeController.createEmployee
);
ownerEmployeeRouter.get(
  "/:employeeId",
  authenticateToken,
  requireOwner,
  employeeController.getEmployee
);
ownerEmployeeRouter.put(
  "/:employeeId",
  authenticateToken,
  requireOwner,
  employeeController.updateEmployee
);
ownerEmployeeRouter.delete(
  "/:employeeId",
  authenticateToken,
  requireOwner,
  employeeController.deleteEmployee
);

export const profileRouter = Router();

profileRouter.get(
  "/profile",
  authenticateToken,
  requireEmployee,
  employeeController.getProfile
);
profileRouter.put(
  "/profile",
  authenticateToken,
  requireEmployee,
  employeeController.updateProfile
);
